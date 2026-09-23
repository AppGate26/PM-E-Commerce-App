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
  String? _lastFailureMessage;
  bool _pageLoaded = false;
  Timer? _progressTimer;
  int _progress = 0;
  bool _isDialogShowing = false;
  int _retryCount = 0;
  static const int _maxRetries = 3;
  Timer? _retryTimer;

  // Paystack's return trip to the app cannot be trusted on its own: the callback
  // is a custom scheme the WebView cannot load, 3-D-Secure adds hops of its own,
  // and the customer often just stays on Paystack's "Payment Successful" page.
  // So we also ask OUR backend what the payment's state is, every few seconds,
  // until it settles. GET /payments/verify is read-only and idempotent, so this
  // is safe to repeat. Wallet funding deliberately does NOT poll — its verify
  // endpoint credits the wallet as a side effect.
  Timer? _statusPollTimer;
  bool _pollInFlight = false;
  int _statusPollCount = 0;
  static const Duration _statusPollInterval = Duration(seconds: 5);
  static const int _maxStatusPolls = 120; // ~10 minutes

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

    if (widget.verificationType == PaymentVerificationType.cardPurchase) {
      _startStatusPolling();
    }

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
    _statusPollTimer?.cancel();
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
            // The callback is a custom scheme (pomstores://payment-callback) the
            // WebView cannot load — letting it through only produces a resource
            // error page. Handling it above is enough.
            if (Uri.tryParse(request.url)?.scheme == 'pomstores') {
              return NavigationDecision.prevent;
            }
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

  // ============================================================
  // ✅ BACKGROUND STATUS POLLING (card purchases)
  // ============================================================
  void _startStatusPolling() {
    _statusPollTimer?.cancel();
    _statusPollTimer = Timer.periodic(_statusPollInterval, (timer) {
      _pollPaymentStatus();
    });
  }

  Future<void> _pollPaymentStatus() async {
    // _pollInFlight matters because Timer.periodic keeps firing while a request
    // is still awaiting — without it two ticks could both verify and both
    // complete the purchase.
    if (!mounted || _isVerificationComplete || _isVerifying || _pollInFlight) {
      return;
    }
    _pollInFlight = true;

    _statusPollCount++;
    if (_statusPollCount > _maxStatusPolls) {
      print('ℹ️ [PaymentWebView] Status polling gave up after $_statusPollCount tries');
      _statusPollTimer?.cancel();
      _pollInFlight = false;
      return;
    }

    try {
      final status = await _fetchPaymentStatus();
      print('🔵 [PaymentWebView] Poll #$_statusPollCount status: $status');
      if (status == 'COMPLETED' && mounted && !_isVerificationComplete) {
        _statusPollTimer?.cancel();
        setState(() {
          _isVerifying = true;
        });
        await _onPurchasePaymentVerified();
      }
    } catch (e) {
      // A settled failure or a transient network error. Either way, keep the
      // customer on Paystack's page rather than interrupting them; they can
      // still finish or retry the charge there.
      print('ℹ️ [PaymentWebView] Poll #$_statusPollCount could not verify: $e');
    } finally {
      _pollInFlight = false;
    }
  }

  /// The payment's status according to our backend. Anything other than
  /// COMPLETED means "not settled yet" — the charge may still be in flight.
  Future<String> _fetchPaymentStatus() async {
    final result =
        await _paymentRepository.verifyCardPayment(widget.paymentReference);
    final status = (result['status'] ?? '').toString().toUpperCase();
    // A backend error envelope ({status: 500, ...}) unwraps to the envelope itself, so
    // `status` comes back as an HTTP code. Treating that as a payment state would have
    // us report "not settled yet" for ten minutes while the real problem went unseen.
    if (RegExp(r'^\d+$').hasMatch(status)) {
      throw Exception('Payment status could not be read (server returned $status)');
    }
    return status;
  }

  /// Verifies a few times before giving up, because Paystack can still report a
  /// charge as in-flight for a moment after the customer sees "Successful".
  Future<bool> _verifyCardUntilSettled({int attempts = 4}) async {
    for (var attempt = 0; attempt < attempts; attempt++) {
      final status = await _fetchPaymentStatus();
      if (status == 'COMPLETED') return true;
      print('⏳ [PaymentWebView] Not settled yet (status: $status), attempt ${attempt + 1}/$attempts');
      if (attempt < attempts - 1) {
        await Future.delayed(const Duration(seconds: 3));
      }
    }
    return false;
  }

  /// True only for the trip back to the app, not for Paystack's own pages. The
  /// old check matched any URL containing "reference"/"trxref"/"callback", so a
  /// 3-D-Secure hop fired verification while the charge was still in flight.
  bool _looksLikeFinalCallback(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    // Our own callback deep link (pomstores://payment-callback).
    if (uri.scheme == 'pomstores') return true;

    final host = uri.host.toLowerCase();
    final isGatewayPage = host.contains('paystack');
    final params = uri.queryParameters;
    final carriesReference =
        params.containsKey('trxref') || params.containsKey('reference');

    return carriesReference && !isGatewayPage;
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

    // ✅ Skip if already processing or complete. A dialog being on screen must
    // NOT skip: doing that used to latch the screen shut — one premature error
    // dialog and the real success callback that followed was ignored forever.
    if (_isVerifying || _isVerificationComplete) {
      print('ℹ️ [PaymentWebView] Skipping - already processing or complete');
      return;
    }

    // ✅ Only the trip back to the app counts as "done" (see _looksLikeFinalCallback)
    final isSuccess = _looksLikeFinalCallback(url);

    final isError = url.contains('status=failed') ||
        url.contains('transaction=failed') ||
        url.contains('charge.error');

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
          final settled = await _verifyCardUntilSettled();
          if (settled) {
            print('✅ [PaymentWebView] Payment verified!');
            await _onPurchasePaymentVerified();
          } else {
            // Not a failure — the charge just hasn't settled yet. Keep polling
            // in the background and tell the customer the truth.
            _closeVerifyingDialog();
            if (mounted) {
              setState(() {
                _isVerifying = false;
              });
              _showPendingDialog();
            }
          }
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
  // ============================================================
  // ✅ PENDING DIALOG — the charge hasn't settled yet, which is NOT a failure.
  // Background polling continues while this is up, so a payment that lands a
  // moment later still takes the customer to the success screen on its own.
  // ============================================================
  void _showPendingDialog() {
    if (_isDialogShowing) return;
    _isDialogShowing = true;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Column(
          children: [
            Icon(Icons.hourglass_top, color: Colors.orange, size: 64),
            SizedBox(height: 12),
            Text(
              'Confirming Payment',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          'We have not received confirmation for this payment yet. If you have '
          'already paid, it will confirm shortly — keep this screen open, or '
          'check again.',
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              _pollPaymentStatus();
            },
            child: const Text('Check Again'),
          ),
          TextButton(
            onPressed: () {
              _isDialogShowing = false;
              Navigator.pop(context);
              context.pop({
                'success': false,
                'error': 'Payment not confirmed yet. Check your orders before paying again.',
              });
            },
            child: const Text('Close'),
          ),
        ],
      ),
    ).then((_) {
      _isDialogShowing = false;
    });
  }

  void _showErrorDialog(String message) {
    if (_isDialogShowing) return;
    _isDialogShowing = true;
    // Carried out to the caller on Close — Close used to pop with a null error
    // (_errorMessage is only ever set by a WebView resource error), so the
    // payment-options screen showed nothing at all and the customer was left
    // staring at an unchanged screen. Kept separate from _errorMessage so it
    // does not also raise the full-screen error panel behind the dialog.
    _lastFailureMessage = message;

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
              context.pop({'success': false, 'error': _lastFailureMessage});
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
