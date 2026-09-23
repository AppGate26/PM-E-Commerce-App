import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/cart_provider.dart';
import 'package:pm_e_commerce_app/data/providers/wallet_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/order_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';
import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/installment_schedule_display_utils.dart';
import 'package:pm_e_commerce_app/presentation/wallet/screens/payment_webview_screen.dart';

class PaymentOptionScreen extends ConsumerStatefulWidget {
  final double amount;

  const PaymentOptionScreen({super.key, this.amount = 0});

  @override
  ConsumerState<PaymentOptionScreen> createState() =>
      PaymentOptionScreenState();
}

class PaymentOptionScreenState extends ConsumerState<PaymentOptionScreen> {
  final PaymentRepository _paymentRepository = PaymentRepository();
  final OrderRepository _orderRepository = OrderRepository();
  int? _selectedOption;
  bool _isProcessing = false;

  // ============================================================
  // RESOLVE AMOUNT + CHECKOUT DATA (shared by all payment methods)
  // ============================================================
  Map<String, dynamic> _resolvePaymentContext() {
    final extra = GoRouterState.of(context).extra;
    double amount = widget.amount;
    Map<String, dynamic> checkoutData = {};
    bool isInstallment = false;
    InstallmentPlan? plan;

    print('📦 [PaymentOption] ===== RESOLVE PAYMENT CONTEXT =====');
    print('📦 [PaymentOption] widget.amount = ${widget.amount}');
    print('📦 [PaymentOption] extra type    = ${extra.runtimeType}');

    if (extra is Map<String, dynamic>) {
      checkoutData = Map<String, dynamic>.from(extra);
      print('📦 [PaymentOption] extra keys = ${checkoutData.keys.toList()}');

      // Prefer explicit totalAmount if present
      if (extra['totalAmount'] != null) {
        amount = (extra['totalAmount'] as num).toDouble();
        print('📦 [PaymentOption] Using extra[totalAmount] = $amount');
      }

      // Detect installment plan
      if (extra['plan'] != null) {
        try {
          plan = extra['plan'] as InstallmentPlan;
          isInstallment = true;
          print('📦 [PaymentOption] Plan found: planId=${plan.planId}');
          print('📦 [PaymentOption] Plan productPrice = ${plan.productPrice}');
          print('📦 [PaymentOption] Plan insurance    = ${plan.insurance}');
          print('📦 [PaymentOption] Plan deliveryFee  = ${plan.deliveryFee}');
          print('📦 [PaymentOption] Plan totalAmount  = ${plan.totalAmount}');
          print(
              '📦 [PaymentOption] Plan schedule len = ${plan.schedule.length}');

          // If no explicit totalAmount, use first installment amount from the
          // same display schedule shown on the breakdown screen (derived from
          // durationInMonths) — the raw plan.schedule from the backend can
          // have a different number of entries and gives the wrong amount.
          final displaySchedule =
              InstallmentDisplayUtils.buildDisplaySchedule(plan);
          if (extra['totalAmount'] == null) {
            if (displaySchedule.isNotEmpty) {
              // First installment PLUS the delivery fee: delivery is never financed
              // across the plan, and the server charges it in full with payment #1.
              // Quoting the installment alone under-stated this charge, which on the
              // wallet path meant confirming one figure and being debited another.
              amount = InstallmentDisplayUtils.firstPaymentAmount(plan);
              print(
                  '📦 [PaymentOption] Using FIRST payment amount (installment + delivery) = $amount');
            } else {
              amount = plan.totalAmount;
              print(
                  '📦 [PaymentOption] Schedule empty — using plan.totalAmount = $amount');
            }
          }
        } catch (e) {
          print('🔴 [PaymentOption] Failed to cast plan: $e');
        }
      } else {
        print('📦 [PaymentOption] No plan in extra → FULL_PAYMENT flow');
      }
    } else {
      print('📦 [PaymentOption] extra is null/not Map → using widget.amount');
    }

    checkoutData['totalAmount'] = amount;

    print('📦 [PaymentOption] FINAL amount        = ₦$amount');
    print('📦 [PaymentOption] FINAL isInstallment = $isInstallment');
    print('📦 [PaymentOption] ==========================================');

    return {
      'amount': amount,
      'checkoutData': checkoutData,
      'isInstallment': isInstallment,
      'plan': plan,
    };
  }

  Future<void> _handleContinue() async {
    print(
        '💳 [Payment Option] Continue tapped, selectedOption=$_selectedOption');
    switch (_selectedOption) {
      case 0:
        await _payWithCard();
        break;
      case 1:
        await _payWithBank();
        break;
      case 2:
        await _payWithWallet();
        break;
      case 3:
        await _payWithBankTransfer();
        break;
    }
  }

  // ============================================================
  // ORDER-FIRST: find a matching PENDING order or create one via
  // POST /api/orders/checkout. The order must exist before any payment
  // call — see MOBILE_CHECKOUT_REVERSAL_PLAN.md section 3. Throws on
  // failure; callers rely on their own try/catch for the error snackbar.
  // ============================================================
  Future<int> _ensureOrderExists({
    required Map<String, dynamic> checkoutData,
    required bool isInstallment,
    InstallmentPlan? plan,
    required dynamic user,
  }) async {
    final String wantedType = isInstallment ? 'INSTALLMENT' : 'FULL_PAYMENT';

    // Reuse a matching pending order instead of creating a duplicate
    // stock-holding one if the user retries after an abandoned payment.
    //
    // For a one-off order the match must also agree on the amount: reusing "any pending
    // FULL_PAYMENT order" meant a customer who abandoned one basket and shopped again
    // paid the OLD basket's total, and then had the new cart cleared on success. An
    // installment order is identified by its plan instead, which is already exact.
    final double cartTotal =
        ((checkoutData['totalAmount'] as num?) ?? 0).toDouble();
    try {
      final orders = await _orderRepository.getUserOrders(user.id);
      final pendingOrder = orders.firstWhere(
        (order) =>
            order.status == 'PENDING' &&
            order.paymentType == wantedType &&
            (isInstallment
                ? order.installmentPlanId == plan?.planId
                : cartTotal > 0 && (order.grandTotal - cartTotal).abs() < 0.01),
        orElse: () => throw Exception('No matching pending order'),
      );
      print(
          '✅ [PaymentOption] Reusing existing pending order: ${pendingOrder.id}');
      return pendingOrder.id;
    } catch (e) {
      print('ℹ️ [PaymentOption] No matching pending order found: $e');
    }

    final orderPayload = <String, dynamic>{
      'userId': user.id,
      'paymentType': wantedType,
      'fulfillmentType': checkoutData['fulfillmentType'] ??
          checkoutData['deliveryMethod'] ??
          'DELIVERY',
      'deliveryAddress': checkoutData['deliveryAddress'],
      'deliveryStateId': checkoutData['deliveryStateId'],
      'deliveryLgaId': checkoutData['deliveryLgaId'],
      'deliveryWardId': checkoutData['deliveryWardId'],
      'deliveryPhone': checkoutData['deliveryPhone'],
      if (isInstallment && plan != null) 'installmentPlanId': plan.planId,
    };

    print('📦 [PaymentOption] Creating order (order-first): $orderPayload');
    final orderResponse = await _orderRepository.checkout(orderPayload);
    print('📥 [PaymentOption] Checkout response: $orderResponse');

    final orderStatus = orderResponse['status'];
    if (orderStatus != null && orderStatus != 200 && orderStatus != 201) {
      throw orderResponse['message'] ?? 'Failed to create order';
    }

    final responseData = orderResponse['response'] ?? orderResponse['data'] ?? {};
    final orderData = responseData['order'] ?? responseData;
    final int? orderId = orderData['id'];

    if (orderId == null || orderId <= 0) {
      throw 'Order created but no valid order ID was returned';
    }
    print('✅ [PaymentOption] Order created: $orderId');
    return orderId;
  }

  // ============================================================
  // 💳 PAY WITH CARD — order-first: checkout() then pay/card.
  // ============================================================
  Future<void> _payWithCard() async {
    final resolved = _resolvePaymentContext();
    final Map<String, dynamic> checkoutData =
        resolved['checkoutData'] as Map<String, dynamic>;
    final bool isInstallment = resolved['isInstallment'] as bool;
    final InstallmentPlan? plan = resolved['plan'] as InstallmentPlan?;

    print('💳 [Payment Option] _payWithCard called, isInstallment=$isInstallment');
    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final authState = ref.read(authProvider);
      final user = authState.hasValue ? authState.value : null;
      print('💳 [Payment Option] authState=$authState user=$user');

      if (user == null) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please login to continue'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      final orderId = await _ensureOrderExists(
        checkoutData: checkoutData,
        isInstallment: isInstallment,
        plan: plan,
        user: user,
      );

      const callbackUrl = 'pomstores://payment-callback';
      final response = await _paymentRepository.payOrderByCard(
        orderId: orderId,
        callbackUrl: callbackUrl,
      );

      String? authorizationUrl;
      String? paymentReference;

      if (response['data'] is Map<String, dynamic>) {
        final data = response['data'] as Map<String, dynamic>;
        authorizationUrl = data['authorizationUrl']?.toString() ??
            data['authorization_url']?.toString() ??
            data['url']?.toString();
        paymentReference = data['paymentReference']?.toString() ??
            data['payment_reference']?.toString();
      }

      authorizationUrl ??= response['authorizationUrl']?.toString() ??
          response['authorization_url']?.toString() ??
          response['url']?.toString();
      paymentReference ??= response['paymentReference']?.toString() ??
          response['payment_reference']?.toString();

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        throw 'No payment URL received from server. Response: $response';
      }
      if (paymentReference == null || paymentReference.isEmpty) {
        throw 'No payment reference received from server. Response: $response';
      }

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final result = await context.push<Map<String, dynamic>?>(
        AppRoutes.paymentWebView,
        extra: {
          'paymentUrl': authorizationUrl,
          'paymentReference': paymentReference,
          'verificationType': PaymentVerificationType.cardPurchase,
          'orderId': orderId,
        },
      );

      if (!mounted) return;

      if (result != null && result['success'] == true) {
        print('✅ [PaymentOption] Card payment successful!');
        context.go(AppRoutes.history);
      } else if (result != null && result['success'] == false) {
        final errorMessage = result['error'];
        if (errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e, st) {
      print('🔴 [Payment Option] _payWithCard failed: $e\n$st');
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // ============================================================
  // 🏦 PAY WITH BANK / BANK TRANSFER — order-first, same as card: checkout()
  // first, then initialize with the orderId so the backend charges the order's
  // own amount and links the Payment to it. Paystack opens on the requested
  // channel; the WebView then verifies exactly as it does for a card.
  // ============================================================
  Future<void> _payWithBank() => _payWithGatewayChannel(
        endpoint: ApiConstants.initializeBankPayment,
        label: 'Bank',
      );

  Future<void> _payWithBankTransfer() => _payWithGatewayChannel(
        endpoint: ApiConstants.initializeBankTransferPayment,
        label: 'Bank transfer',
      );

  Future<void> _payWithGatewayChannel({
    required String endpoint,
    required String label,
  }) async {
    final resolved = _resolvePaymentContext();
    final Map<String, dynamic> checkoutData =
        resolved['checkoutData'] as Map<String, dynamic>;
    final bool isInstallment = resolved['isInstallment'] as bool;
    final InstallmentPlan? plan = resolved['plan'] as InstallmentPlan?;
    final double amount = resolved['amount'] as double;

    print('🏦 [Payment Option] $label payment called, isInstallment=$isInstallment');
    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final authState = ref.read(authProvider);
      final user = authState.hasValue ? authState.value : null;

      if (user == null) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please login to continue'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      final orderId = await _ensureOrderExists(
        checkoutData: checkoutData,
        isInstallment: isInstallment,
        plan: plan,
        user: user,
      );

      final response = await _paymentRepository.initializeOrderPaymentByChannel(
        endpoint: endpoint,
        orderId: orderId,
        userId: user.id,
        email: user.email,
        callbackUrl: 'pomstores://payment-callback',
        amount: amount,
      );

      final authorizationUrl = response['authorizationUrl']?.toString();
      final paymentReference = response['paymentReference']?.toString();

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        throw 'No payment URL received from server. Response: $response';
      }
      if (paymentReference == null || paymentReference.isEmpty) {
        throw 'No payment reference received from server. Response: $response';
      }

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final result = await context.push<Map<String, dynamic>?>(
        AppRoutes.paymentWebView,
        extra: {
          'paymentUrl': authorizationUrl,
          'paymentReference': paymentReference,
          'verificationType': PaymentVerificationType.cardPurchase,
          'orderId': orderId,
        },
      );

      if (!mounted) return;

      if (result != null && result['success'] == true) {
        context.go(AppRoutes.history);
      } else if (result != null && result['success'] == false) {
        final errorMessage = result['error'];
        if (errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage.toString()),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e, st) {
      print('🔴 [Payment Option] $label payment failed: $e\n$st');
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // ============================================================
  // 💰 PAY WITH PM WALLET — order-first: checkout() then pay/wallet, for
  // both a one-off purchase and an installment's first (down) payment.
  // Later installments are paid from the orders/history page instead,
  // via payNextInstallmentByWallet/payFullPlanByWallet (plan already has
  // an order by then).
  // ============================================================
  Future<void> _payWithWallet() async {
    print('💰 [PaymentOption] ===== WALLET PAYMENT STARTED =====');
    print('⏱️ ${DateTime.now().toIso8601String()}');

    final resolved = _resolvePaymentContext();
    final double amount = resolved['amount'] as double;
    final Map<String, dynamic> checkoutData =
        resolved['checkoutData'] as Map<String, dynamic>;
    final bool isInstallment = resolved['isInstallment'] as bool;
    final InstallmentPlan? plan = resolved['plan'] as InstallmentPlan?;

    print('💰 amount = ₦${amount.toStringAsFixed(2)}');
    print('💰 isInstallment = $isInstallment');
    if (plan != null) {
      print('💰 planId = ${plan.planId}');
    }

    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      // ---- Auth ----
      final authState = ref.read(authProvider);
      final user = authState.hasValue ? authState.value : null;
      if (user == null) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please login to continue'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }
      print('✅ User ID: ${user.id}');

      // ---- Amount (display/balance-check only — the backend computes
      // the actual amount debited from the order itself) ----
      if (amount <= 0) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Invalid amount. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      // ---- Balance ----
      final balanceResponse =
          await _paymentRepository.getWalletBalance(user.id);
      final balanceData = balanceResponse['data'] ?? balanceResponse;
      final availableBalance = (balanceData['balance'] ?? 0.0).toDouble();
      print(
          '💰 balance=₦${availableBalance.toStringAsFixed(2)} pay=₦${amount.toStringAsFixed(2)}');

      if (availableBalance < amount) {
        setState(() => _isProcessing = false);
        if (mounted) {
          _showInsufficientBalanceDialog(availableBalance, amount);
        }
        return;
      }

      // ---- Confirm ----
      if (mounted) {
        final confirmed =
            await _showWalletConfirmationDialog(amount, availableBalance);
        if (!confirmed) {
          setState(() => _isProcessing = false);
          return;
        }
      }
      print('✅ User confirmed');

      // ---- Order-first: the order must exist before any money moves ----
      final orderId = await _ensureOrderExists(
        checkoutData: checkoutData,
        isInstallment: isInstallment,
        plan: plan,
        user: user,
      );

      print('📡 payOrderByWallet orderId=$orderId');
      final body = await _paymentRepository.payOrderByWallet(orderId: orderId);
      print('📥 Payment response: $body');

      if (!mounted) return;
      setState(() => _isProcessing = false);

      final int? statusCode = (body['status'] as num?)?.toInt();
      final String message = body['message']?.toString() ?? '';
      final data = body['data'];
      final orderData = (data is Map ? data['order'] : null) ?? {};
      final amountPaid = data is Map ? data['amountPaid'] : null;

      print('📊 status=$statusCode message=$message orderData=$orderData');

      final isAlreadyPaid = statusCode == 400 &&
          message.toLowerCase().contains('already been paid');
      final isSuccess =
          statusCode == 200 || statusCode == 201 || isAlreadyPaid;

      if (isSuccess) {
        print('✅ Wallet payment success');
        await _clearCart(user.id);
        await ref.read(walletStateProvider.notifier).loadBalance();

        if (mounted) {
          final paidAmount = amountPaid is num ? amountPaid.toDouble() : amount;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  '✅ Payment successful! ₦${paidAmount.toStringAsFixed(2)} deducted.'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
          context.go(AppRoutes.history);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Payment failed: ${message.isNotEmpty ? message : "Unknown error"}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e, st) {
      print('🔴 [PaymentOption] EXCEPTION: $e');
      print('🔴 $st');
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  // ============================================================
  // CLEAR CART
  // ============================================================
  Future<void> _clearCart(int userId) async {
    print('🗑️ [PaymentOption] ===== CART CLEARING STARTED =====');
    try {
      final currentCart = ref.read(cartProvider);
      final items = currentCart.value ?? [];
      print('🛒 [PaymentOption] Current cart items count: ${items.length}');

      if (items.isEmpty) {
        print('ℹ️ [PaymentOption] Cart already empty, skipping...');
        return;
      }

      final cartRepository = ref.read(cartRepositoryProvider);
      final success = await cartRepository.clearCart(userId);

      if (success) {
        print('✅ [PaymentOption] Cart cleared on backend');
        ref.read(cartProvider.notifier).clearCart();
        await ref.read(cartProvider.notifier).fetchCartItems();
      } else {
        print('⚠️ [PaymentOption] API clear failed — clearing local state');
        ref.read(cartProvider.notifier).clearCart();
      }
    } catch (e) {
      print('❌ [PaymentOption] Cart clearing error: $e');
      try {
        ref.read(cartProvider.notifier).clearCart();
      } catch (_) {}
    }
    print('🗑️ [PaymentOption] ===== CART CLEARING COMPLETED =====');
  }

  // ============================================================
  // DIALOGS
  // ============================================================
  Future<bool> _showWalletConfirmationDialog(
      double amount, double balance) async {
    return await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Column(
              children: [
                Icon(Icons.account_balance_wallet,
                    color: AppColors.blueBackground, size: 48),
                SizedBox(height: 12),
                Text(
                  'Confirm Wallet Payment',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.lightBlueBackground,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      _infoRow(
                          'Amount to Pay', '₦${amount.toStringAsFixed(0)}'),
                      const Divider(),
                      _infoRow(
                          'Wallet Balance', '₦${balance.toStringAsFixed(0)}'),
                      const Divider(),
                      _infoRow(
                        'Balance After Payment',
                        '₦${(balance - amount).toStringAsFixed(0)}',
                        isTotal: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.orange, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'This amount will be deducted from your PM Wallet balance.',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Confirm Payment'),
              ),
            ],
          ),
        ) ??
        false;
  }

  void _showInsufficientBalanceDialog(double balance, double amount) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Column(
          children: [
            Icon(Icons.warning_amber, color: Colors.orange, size: 48),
            SizedBox(height: 12),
            Text(
              'Insufficient Balance',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.orange,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Column(
                children: [
                  _infoRow('Wallet Balance', '₦${balance.toStringAsFixed(0)}'),
                  const Divider(),
                  _infoRow('Amount Required', '₦${amount.toStringAsFixed(0)}'),
                  const Divider(),
                  _infoRow(
                    'Shortfall',
                    '₦${(amount - balance).toStringAsFixed(0)}',
                    isTotal: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Please add money to your wallet or choose another payment method.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.push(AppRoutes.addMoney);
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.blueBackground,
            ),
            child: const Text('Add Money'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              foregroundColor: Colors.white,
            ),
            child: const Text('Choose Another Method'),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 10 : 12,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
              color: isTotal ? AppColors.blueBackground : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // BUILD
  // ============================================================
  @override
  Widget build(BuildContext context) {
    final resolved = _resolvePaymentContext();
    final double displayAmount = resolved['amount'] as double;
    print('💳 [PaymentOption] Build - Display amount: $displayAmount');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Center(
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: AppColors.blueBackground,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      'SELECT PAYMENT OPTION',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                _buildPaymentOption(
                  title: 'PAY WITH CARD',
                  value: 0,
                  icon: Icons.credit_card,
                ),
                const SizedBox(height: 16),
                _buildPaymentOption(
                  title: 'PAY WITH BANK',
                  value: 1,
                  icon: Icons.account_balance,
                ),
                const SizedBox(height: 16),
                _buildPaymentOption(
                  title: 'PAY FROM PM WALLET',
                  value: 2,
                  icon: Icons.account_balance_wallet,
                ),
                const SizedBox(height: 16),
                _buildPaymentOption(
                  title: 'PAY WITH BANK TRANSFER',
                  value: 3,
                  icon: Icons.swap_horiz,
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (_selectedOption != null && !_isProcessing)
                        ? _handleContinue
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selectedOption != null
                          ? AppColors.blueBackground
                          : Colors.grey.shade400,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 3,
                    ),
                    child: const Text(
                      'Continue',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
          if (_isProcessing)
            Container(
              color: Colors.black26,
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppColors.blueBackground),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption({
    required String title,
    required int value,
    required IconData icon,
  }) {
    final bool isSelected = _selectedOption == value;

    return GestureDetector(
      onTap: () => setState(() => _selectedOption = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.blueBackground : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.blueBackground, size: 28),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.rectangle,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: AppColors.blueBackground,
                  width: 2,
                ),
                color: isSelected ? AppColors.blueBackground : Colors.white,
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
