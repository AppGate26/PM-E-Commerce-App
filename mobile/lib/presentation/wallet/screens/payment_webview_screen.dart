import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/providers/order_provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/repositories/wallet_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';
import 'package:pm_e_commerce_app/data/providers/wallet_provider.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/cart_provider.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:dio/dio.dart';

// The order already exists by the time this screen opens (order-first —
// see MOBILE_CHECKOUT_REVERSAL_PLAN.md section 3): checkout() ran before
// the payment call that produced paymentUrl/paymentReference. This screen
// only verifies the payment; it never creates or confirms an order itself.
enum PaymentVerificationType {
  walletFunding,
  cardPurchase,
}

class PaymentWebViewScreen extends ConsumerStatefulWidget {
  final String paymentUrl;
  final String paymentReference;
  final PaymentVerificationType verificationType;
  final int? orderId;

  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    required this.paymentReference,
    this.verificationType = PaymentVerificationType.walletFunding,
    this.orderId,
  });

  @override
  ConsumerState<PaymentWebViewScreen> createState() =>
      _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends ConsumerState<PaymentWebViewScreen> {
  late final WebViewController _webViewController;
  final WalletRepository _walletRepository = WalletRepository();
  final PaymentRepository _paymentRepository = PaymentRepository();
  final ApiClient _apiClient = ApiClient();

  bool _isLoading = true;
  bool _isVerifying = false;
  bool _isVerificationComplete = false;
  String? _errorMessage;
  bool _pageLoaded = false;
  Timer? _progressTimer;
  int _progress = 0;
  bool _isDialogShowing = false;
  int _retryCount = 0;
  static const int _maxRetries = 3;
  Timer? _retryTimer;

  @override
  void initState() {
    super.initState();
    print('=' * 80);
    print('🔵 [PaymentWebView] ===== INITIALIZING =====');
    print('🔵 [PaymentWebView] Payment URL: ${widget.paymentUrl}');
    print('🔵 [PaymentWebView] Payment Reference: ${widget.paymentReference}');
    print('🔵 [PaymentWebView] Verification Type: ${widget.verificationType}');
    print('🔵 [PaymentWebView] Order ID: ${widget.orderId}');
    print('=' * 80);

    _initializeWebView();

    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (_isLoading && _progress < 95) {
        setState(() {
          _progress += 5;
        });
      } else if (!_isLoading) {
        setState(() {
          _progress = 100;
        });
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    _retryTimer?.cancel();
    print('🔵 [PaymentWebView] Disposed');
    super.dispose();
  }

  void _initializeWebView() {
    print('🔵 [PaymentWebView] Setting up WebViewController...');

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      ..enableZoom(true)
      ..addJavaScriptChannel(
        'PaymentChannel',
        onMessageReceived: (JavaScriptMessage message) {
          print('📨 [PaymentWebView] JS Message: ${message.message}');
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            print('=' * 80);
            print('🔵 [PaymentWebView] ===== PAGE STARTED =====');
            print('🔵 [PaymentWebView] URL: $url');
            print('=' * 80);
            setState(() {
              _isLoading = true;
              _errorMessage = null;
              _pageLoaded = false;
            });
          },
          onPageFinished: (String url) {
            print('=' * 80);
            print('✅ [PaymentWebView] ===== PAGE FINISHED =====');
            print('✅ [PaymentWebView] URL: $url');
            print('=' * 80);
            setState(() {
              _isLoading = false;
              _pageLoaded = true;
              _progress = 100;
            });

            _checkPaymentStatus(url);
            _handleCloudflareChallenge();
          },
          onWebResourceError: (WebResourceError error) {
            print('=' * 80);
            print('❌ [PaymentWebView] ===== RESOURCE ERROR =====');
            print('❌ [PaymentWebView] Error: ${error.description}');
            print('❌ [PaymentWebView] Error Code: ${error.errorCode}');
            print('❌ [PaymentWebView] Error Type: ${error.errorType}');
            print('❌ [PaymentWebView] Retry Count: $_retryCount');
            print('=' * 80);

            // Auto-retry for connection errors
            if (_shouldAutoRetry(error)) {
              _retryWithBackoff();
            } else {
              setState(() {
                _isLoading = false;
                _errorMessage = _getUserFriendlyErrorMessage(error);
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            print('=' * 80);
            print('🔵 [PaymentWebView] ===== NAVIGATION REQUEST =====');
            print('🔵 [PaymentWebView] URL: ${request.url}');
            print('=' * 80);
            _checkPaymentStatus(request.url);
            return NavigationDecision.navigate;
          },
          onUrlChange: (UrlChange change) {
            print('=' * 80);
            print('🔵 [PaymentWebView] ===== URL CHANGE =====');
            print('🔵 [PaymentWebView] Current URL: ${change.url}');
            print('=' * 80);
            if (change.url != null) {
              _checkPaymentStatus(change.url!);
            }
          },
        ),
      );

    print('🔵 [PaymentWebView] Loading URL: ${widget.paymentUrl}');
    _webViewController.loadRequest(Uri.parse(widget.paymentUrl));
  }

  bool _shouldAutoRetry(WebResourceError error) {
    // Retry for connection-related errors
    final shouldRetry = error.errorCode == -6 || // ERR_CONNECTION_REFUSED
        error.errorCode == -109 || // ERR_ADDRESS_UNREACHABLE
        error.errorCode == -2 || // ERR_FAILED
        error.description.contains('net::ERR_CONNECTION') == true ||
        error.description.contains('net::ERR_NETWORK') == true ||
        error.description.contains('timeout') == true;

    return shouldRetry && _retryCount < _maxRetries;
  }

  void _retryWithBackoff() {
    _retryTimer?.cancel();
    _retryCount++;
    final delaySeconds =
        (2 * _retryCount).toInt(); // Exponential backoff: 2, 4, 6

    print(
        '🔄 [PaymentWebView] Auto-retry #$_retryCount in ${delaySeconds}s...');

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _pageLoaded = false;
      _progress = 0;
    });

    _retryTimer = Timer(Duration(seconds: delaySeconds), () {
      if (mounted) {
        print('🔄 [PaymentWebView] Executing auto-retry #$_retryCount');
        _webViewController.reload();
      }
    });
  }

  String _getUserFriendlyErrorMessage(WebResourceError error) {
    if (error.errorCode == -6) {
      return 'Connection refused. Please check your internet connection and try again.';
    } else if (error.errorCode == -109) {
      return 'Cannot reach the payment server. Please check your connection.';
    } else if (error.description.contains('timeout') == true) {
      return 'Connection timeout. Please check your internet and try again.';
    } else if (error.description.contains('ERR_NAME_NOT_RESOLVED') == true) {
      return 'Cannot reach payment server. Check your internet connection.';
    }
    return error.description ??
        'Failed to load payment page. Please try again.';
  }

  Future<void> _handleCloudflareChallenge() async {
    try {
      print('🔵 [PaymentWebView] Attempting to handle Cloudflare challenge...');

      final result = await _webViewController.runJavaScriptReturningResult('''
        (function() {
          const buttons = document.querySelectorAll('button, input[type="submit"], a.button');
          let clicked = false;
          
          buttons.forEach(function(button) {
            const text = button.textContent.toLowerCase();
            if (text.includes('verify') || 
                text.includes('continue') || 
                text.includes('submit') ||
                text.includes('proceed')) {
              button.click();
              clicked = true;
              console.log('✅ Auto-clicked: ' + button.textContent);
            }
          });
          
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach(function(iframe) {
            try {
              const doc = iframe.contentDocument || iframe.contentWindow.document;
              const cfButton = doc.querySelector('button, input[type="submit"]');
              if (cfButton) {
                cfButton.click();
                clicked = true;
                console.log('✅ Auto-clicked Cloudflare iframe button');
              }
            } catch(e) {
              // Cross-origin iframe, skip
            }
          });
          
          return clicked ? 'clicked' : 'no_button_found';
        })();
      ''');

      print('🔵 [PaymentWebView] Cloudflare handling result: $result');
    } catch (e) {
      print('⚠️ [PaymentWebView] Cloudflare handling error: $e');
    }
  }

  // ============================================================
  // ✅ SHOW VERIFYING POPUP - IMMEDIATELY AFTER PAYSTACK SUCCESS
  // ============================================================
  void _showVerifyingDialog() {
    if (_isDialogShowing) return;
    _isDialogShowing = true;

    print('🔵 [PaymentWebView] Showing "Verifying payment..." dialog');

    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      builder: (context) => WillPopScope(
        onWillPop: () async => false,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 50,
                height: 50,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.blueBackground,
                  ),
                  strokeWidth: 4,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Verifying Payment...',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please wait while we confirm your payment',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.lightBlueBackground,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Ref: ${widget.paymentReference}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.blueBackground,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================
  // ✅ CLOSE VERIFYING DIALOG
  // ============================================================
  void _closeVerifyingDialog() {
    print('🔵 [PaymentWebView] Closing verifying dialog...');
    if (_isDialogShowing) {
      try {
        Navigator.pop(context);
        _isDialogShowing = false;
        print('✅ [PaymentWebView] Verifying dialog closed');
      } catch (e) {
        print('⚠️ [PaymentWebView] Could not close dialog: $e');
        _isDialogShowing = false;
      }
    }
  }

  // ============================================================
  // ✅ PURCHASE PAYMENT VERIFIED — the order already exists (order-first);
  // this just clears the cart, refreshes orders, and shows success. The
  // backend confirms payment/order status itself (via the same verify
  // call, or its webhook) — this screen never asserts it.
  // ============================================================
  Future<void> _onPurchasePaymentVerified() async {
    print('✅ [PaymentWebView] Payment verified for order ${widget.orderId}');

    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;

    if (user != null) {
      final clearSuccess = await _clearCart(user.id);
      if (clearSuccess) {
        print('✅ [PaymentWebView] Cart cleared successfully');
        await ref.read(cartProvider.notifier).fetchCartItems();
      } else {
        print('⚠️ [PaymentWebView] Failed to clear cart');
      }
    }

    await ref.read(ordersProvider.notifier).fetchUserOrders();

    _closeVerifyingDialog();

    if (mounted) {
      setState(() {
        _isVerifying = false;
        _isVerificationComplete = true;
      });
      _showProductPurchaseSuccessDialog();
    }
  }

  Future<bool> _clearCart(int userId) async {
    try {
      print('🗑️ [PaymentWebView] Clearing cart for user: $userId');
      final url = ApiConstants.clearCart(userId);

      final response = await _apiClient.dio.delete(
        url,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      print('✅ [PaymentWebView] Cart cleared: ${response.statusCode}');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('❌ [PaymentWebView] Failed to clear cart: $e');
      return false;
    }
  }

  Future<void> _checkPaymentStatus(String url) async {
    print('=' * 80);
    print('🔵 [PaymentWebView] ===== CHECKING PAYMENT STATUS =====');
    print('🔵 [PaymentWebView] URL: $url');
    print('🔵 [PaymentWebView] Is Verifying: $_isVerifying');
    print(
        '🔵 [PaymentWebView] Is Verification Complete: $_isVerificationComplete');
    print('🔵 [PaymentWebView] Is Dialog Showing: $_isDialogShowing');
    print('=' * 80);

    // ✅ Skip if already processing or complete
    if (_isVerifying || _isVerificationComplete || _isDialogShowing) {
      print('ℹ️ [PaymentWebView] Skipping - already processing or complete');
      return;
    }

    // ✅ Check for success indicators
    final isSuccess = url.contains('callback') ||
        url.contains('trxref') ||
        url.contains('reference') ||
        url.contains('paid') ||
        url.contains('success') ||
        url.contains('completed') ||
        url.contains('charge.success') ||
        url.contains('transaction=success');

    final isError = url.contains('error') ||
        url.contains('failed') ||
        url.contains('cancel') ||
        url.contains('cancelled') ||
        url.contains('charge.error') ||
        url.contains('status=failed') ||
        url.contains('transaction=failed');

    if (isSuccess) {
      print('=' * 80);
      print('✅ [PaymentWebView] ===== SUCCESS DETECTED! =====');
      print('✅ [PaymentWebView] Reference: ${widget.paymentReference}');
      print('=' * 80);

      // ✅ IMMEDIATELY show verifying dialog
      if (mounted) {
        _showVerifyingDialog();
      }

      setState(() {
        _isVerifying = true;
      });

      try {
        print('🔵 [PaymentWebView] Starting verification...');

        if (widget.verificationType == PaymentVerificationType.cardPurchase) {
          // ✅ CARD PURCHASE FLOW — order already exists (order-first)
          print('🔵 [PaymentWebView] Verifying card purchase...');
          await _paymentRepository.verifyCardPayment(widget.paymentReference);
          print('✅ [PaymentWebView] Payment verified!');
          await _onPurchasePaymentVerified();
        } else {
          // ✅ WALLET FUNDING FLOW
          print('🔵 [PaymentWebView] Verifying wallet funding...');
          await _walletRepository.verifyFunding(widget.paymentReference);
          await ref.read(walletStateProvider.notifier).loadBalance();
          print('✅ [PaymentWebView] Wallet funded!');
          _closeVerifyingDialog();
          if (mounted) {
            setState(() {
              _isVerifying = false;
              _isVerificationComplete = true;
            });
            _showWalletFundingSuccessDialog();
          }
        }
      } catch (e) {
        print('=' * 80);
        print('❌ [PaymentWebView] ===== VERIFICATION FAILED =====');
        print('❌ [PaymentWebView] Error: $e');
        print('=' * 80);

        // ✅ Close verifying dialog
        _closeVerifyingDialog();

        if (mounted) {
          setState(() {
            _isVerifying = false;
          });
          _showErrorDialog('Verification failed: ${e.toString()}');
        }
      }
    } else if (isError) {
      print('=' * 80);
      print('⚠️ [PaymentWebView] ===== ERROR/CANCEL DETECTED =====');
      print('⚠️ [PaymentWebView] URL: $url');
      print('=' * 80);

      if (!_isVerifying && !_isDialogShowing) {
        _showErrorDialog('Payment was cancelled or failed');
      }
    } else {
      print('ℹ️ [PaymentWebView] No status change detected');
    }
  }

  // ============================================================
  // ✅ PRODUCT PURCHASE SUCCESS DIALOG
  // ============================================================
  void _showProductPurchaseSuccessDialog() {
    if (_isDialogShowing) return;
    _isDialogShowing = true;

    print('✅ [PaymentWebView] Showing product purchase success dialog');
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Column(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 64),
            SizedBox(height: 12),
            Text(
              'Payment Successful!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Your payment was successful.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Your order has been placed successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.lightBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Text(
                    'Reference: ${widget.paymentReference}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.blueBackground,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Check your order history for details.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              context.go(AppRoutes.history);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'View Orders',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
          TextButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              context.go(AppRoutes.home);
            },
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    ).then((_) {
      _isDialogShowing = false;
    });
  }

  // ============================================================
  // ✅ WALLET FUNDING SUCCESS DIALOG
  // ============================================================
  void _showWalletFundingSuccessDialog() {
    if (_isDialogShowing) return;
    _isDialogShowing = true;

    print('✅ [PaymentWebView] Showing wallet funding success dialog');
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Column(
          children: [
            Icon(Icons.account_balance_wallet, color: Colors.green, size: 64),
            SizedBox(height: 12),
            Text(
              'Wallet Funded!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Your wallet has been funded successfully.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.lightBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Reference: ${widget.paymentReference}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.blueBackground,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              context.go(AppRoutes.pmWallet);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Go to Wallet',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    ).then((_) {
      _isDialogShowing = false;
    });
  }

  // ============================================================
  // ✅ ERROR DIALOG
  // ============================================================
  void _showErrorDialog(String message) {
    if (_isDialogShowing) return;
    _isDialogShowing = true;

    print('❌ [PaymentWebView] Showing error dialog: $message');
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Column(
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 64),
            SizedBox(height: 12),
            Text(
              'Payment Failed',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              setState(() {
                _errorMessage = null;
                _isLoading = true;
                _pageLoaded = false;
                _progress = 0;
                _isVerifying = false;
                _isVerificationComplete = false;
                _retryCount = 0; // Reset retry count for manual retry
              });
              _webViewController.reload();
            },
            child: const Text('Try Again'),
          ),
          TextButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              context.pop({'success': false, 'error': _errorMessage});
            },
            child: const Text('Close'),
          ),
        ],
      ),
    ).then((_) {
      _isDialogShowing = false;
    });
  }

  // ============================================================
  // ✅ CANCEL DIALOG
  // ============================================================
  void _showCancelDialog() {
    if (_isDialogShowing) return;

    print('🔵 [PaymentWebView] Showing cancel dialog');
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Cancel Payment?'),
          content: const Text(
            'Are you sure you want to cancel this payment? Your funds will not be deducted.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Continue Payment'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                print('🔵 [PaymentWebView] Payment cancelled by user');
                context.pop(
                    {'success': false, 'error': 'Payment cancelled by user'});
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
              ),
              child: const Text('Yes, Cancel'),
            ),
          ],
        );
      },
    );
  }

  // ============================================================
  // ✅ BUILD
  // ============================================================
  @override
  Widget build(BuildContext context) {
    print('🔵 [PaymentWebView] ===== BUILDING =====');
    print('🔵 [PaymentWebView] isLoading: $_isLoading');
    print('🔵 [PaymentWebView] isVerifying: $_isVerifying');
    print(
        '🔵 [PaymentWebView] isVerificationComplete: $_isVerificationComplete');
    print('🔵 [PaymentWebView] pageLoaded: $_pageLoaded');
    print('🔵 [PaymentWebView] errorMessage: $_errorMessage');
    print('🔵 [PaymentWebView] progress: $_progress');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.textBlue,
        centerTitle: true,
        title: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'PAYMENT',
            style: TextStyle(
              color: AppColors.textLight,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        leading: Padding(
          padding: const EdgeInsets.only(left: 12),
          child: Image.asset(
            'assets/images/logo.png',
            height: 24,
            width: 24,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _isVerifying || _isVerificationComplete
                ? null
                : () {
                    print('🔄 [PaymentWebView] Manual refresh');
                    setState(() {
                      _errorMessage = null;
                      _pageLoaded = false;
                      _isLoading = true;
                      _progress = 0;
                      _isVerifying = false;
                      _isVerificationComplete = false;
                      _retryCount = 0; // Reset retry count for manual refresh
                    });
                    _retryTimer?.cancel();
                    _webViewController.reload();
                  },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ✅ Top Bar
            Container(
              height: 56,
              width: double.infinity,
              color: Colors.grey[100],
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.blueBackground,
                    ),
                    onPressed: _isVerifying || _isVerificationComplete
                        ? null
                        : () {
                            _showCancelDialog();
                          },
                  ),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.blueBackground.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Ref: ${widget.paymentReference}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.blueBackground,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // ✅ Status indicator
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isVerificationComplete
                          ? Colors.green
                          : _isVerifying
                              ? Colors.orange
                              : _errorMessage != null
                                  ? Colors.red
                                  : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            // ✅ WebView
            Expanded(
              child: Stack(
                children: [
                  if (_errorMessage != null)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.error_outline,
                              size: 64,
                              color: Colors.red,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Payment Error',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _errorMessage!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ElevatedButton(
                                  onPressed: () {
                                    print('🔄 [PaymentWebView] Retry');
                                    setState(() {
                                      _errorMessage = null;
                                      _isLoading = true;
                                      _pageLoaded = false;
                                      _progress = 0;
                                      _isVerifying = false;
                                      _isVerificationComplete = false;
                                    });
                                    _webViewController.reload();
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.blueBackground,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 32,
                                      vertical: 12,
                                    ),
                                  ),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    WebViewWidget(controller: _webViewController),
                  // ✅ Loading Overlay
                  if (_isLoading && _errorMessage == null)
                    Container(
                      color: Colors.white,
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 60,
                              height: 60,
                              child: CircularProgressIndicator(
                                value: _progress / 100,
                                strokeWidth: 4,
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  AppColors.blueBackground,
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              _isVerifying
                                  ? 'Verifying payment...'
                                  : _isVerificationComplete
                                      ? 'Payment complete!'
                                      : 'Loading payment page...',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${(_progress / 100 * 100).toInt()}%',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            if (!_isVerifying && !_isVerificationComplete)
                              const Text(
                                'Please wait while we connect to Paystack',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
