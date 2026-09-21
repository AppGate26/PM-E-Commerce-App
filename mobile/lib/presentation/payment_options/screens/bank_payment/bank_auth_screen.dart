import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';

class BankAuthScreen extends ConsumerStatefulWidget {
  const BankAuthScreen({super.key});

  @override
  ConsumerState<BankAuthScreen> createState() => _BankAuthScreenState();
}

class _BankAuthScreenState extends ConsumerState<BankAuthScreen> {
  final PaymentRepository _paymentRepository = PaymentRepository();
  bool _isProcessing = false;
  String? _errorMessage;

  @override
  Widget build(BuildContext context) {
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    final bankName = extra?['bankName'] as String? ?? 'Bank';
    final double amount = extra?['amount'] ?? 0.0;
    final String email = extra?['email'] ?? '';
    final int userId = extra?['userId'] ?? 0;

    final authState = ref.watch(authProvider);
    final user = authState.hasValue ? authState.value : null;

    print('🏦 [BankAuthScreen] Bank: $bankName');
    print('🏦 [BankAuthScreen] Amount: $amount');
    print('🏦 [BankAuthScreen] Email: $email');
    print('🏦 [BankAuthScreen] UserId: $userId');

    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Bank Transfer',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // User Info Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Image.asset('assets/images/logo-blue.png', height: 40),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      user?.email ?? email,
                      style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                    ),
                    Text(
                      '₦${amount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 50),

            // Bank Logo
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.blueBackground.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.account_balance,
                size: 40,
                color: AppColors.blueBackground,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              bankName,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.blueBackground,
              ),
            ),

            const SizedBox(height: 200),

            // Instruction Text
            Text(
              'You will be redirected to Paystack to\ncomplete your payment with $bankName',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, height: 1.5),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(color: Colors.red.shade700, fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),
            ],

            const Spacer(),

            // Authenticate Button - Opens Paystack
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isProcessing
                    ? null
                    : () => _proceedToPaystack(context, userId, amount, email),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isProcessing
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Continue to Paystack',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 20),

            // Bottom Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () {
                    print('🏦 [BankAuthScreen] Change payment method');
                    context.pop();
                  },
                  child: const Text(
                    'Change payment method',
                    style: TextStyle(color: Colors.black),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    print('🏦 [BankAuthScreen] Cancel');
                    context.pop();
                  },
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.black),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _proceedToPaystack(
    BuildContext context,
    int userId,
    double amount,
    String email,
  ) async {
    print('🏦 [BankAuthScreen] ===== PROCEEDING TO PAYSTACK =====');

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      const callbackUrl = 'https://pm-app.com/payment/callback';

      final response = await _paymentRepository.initializeCardPayment(
        userId: userId,
        amount: amount,
        email: email,
        callbackUrl: callbackUrl,
      );

      print('🏦 [BankAuthScreen] Response: $response');

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

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        throw 'No payment URL received from server';
      }

      if (paymentReference == null || paymentReference.isEmpty) {
        throw 'No payment reference received from server';
      }

      if (mounted) {
        setState(() {
          _isProcessing = false;
        });

        // ✅ Open Paystack WebView
        final result = await context.push<Map<String, dynamic>?>(
          AppRoutes.paymentWebView,
          extra: {
            'paymentUrl': authorizationUrl,
            'paymentReference': paymentReference,
            'verificationType': 'cardPurchase',
            'checkoutData': {
              'totalAmount': amount,
            },
          },
        );

        if (mounted && result != null && result['success'] == true) {
          context.go(AppRoutes.history);
        }
      }
    } catch (e) {
      print('🔴 [BankAuthScreen] Error: $e');
      setState(() {
        _isProcessing = false;
        _errorMessage = e.toString();
      });
    }
  }
}