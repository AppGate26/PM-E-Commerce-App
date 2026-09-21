import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';

class BankPaymentScreen extends ConsumerStatefulWidget {
  const BankPaymentScreen({super.key});

  @override
  ConsumerState<BankPaymentScreen> createState() => _BankPaymentScreenState();
}

class _BankPaymentScreenState extends ConsumerState<BankPaymentScreen> {
  String? _selectedBank;
  final bool _isProcessing = false;

  // ✅ These banks are shown for display only
  // The actual bank selection happens on Paystack's page
  final List<Map<String, dynamic>> _banks = [
    {'name': 'Opay', 'icon': Icons.account_balance, 'color': const Color(0xFF00C853)},
    {'name': 'Palmpay', 'icon': Icons.account_balance, 'color': Colors.orange},
    {'name': 'Pocket App', 'icon': Icons.account_balance, 'color': const Color(0xFF2196F3)},
    {'name': 'Kuda Bank', 'icon': Icons.account_balance, 'color': const Color(0xFF6A1B9A)},
    {'name': 'Carbon', 'icon': Icons.account_balance, 'color': const Color(0xFF00BCD4)},
    {'name': 'Access Bank', 'icon': Icons.account_balance, 'color': const Color(0xFF1A237E)},
    {'name': 'GTBank', 'icon': Icons.account_balance, 'color': const Color(0xFFE65100)},
    {'name': 'Zenith Bank', 'icon': Icons.account_balance, 'color': const Color(0xFF004D40)},
  ];

  @override
  Widget build(BuildContext context) {
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    final double amount = extra?['totalAmount'] ?? 0.0;
    final String email = extra?['email'] ?? '';
    final int userId = extra?['userId'] ?? 0;

    print('🏦 [BankPaymentScreen] Amount: $amount');
    print('🏦 [BankPaymentScreen] Email: $email');

    final authState = ref.watch(authProvider);
    final user = authState.hasValue ? authState.value : null;

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
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
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

            const SizedBox(height: 40),

            const Text(
              'Choose your bank to start the payment',
              style: TextStyle(fontSize: 16, color: Colors.black87),
            ),
            const SizedBox(height: 12),

            // Bank Dropdown
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  hint: const Text('Click here to choose'),
                  value: _selectedBank,
                  isExpanded: true,
                  icon: const Icon(Icons.keyboard_arrow_down),
                  style: const TextStyle(color: Colors.black, fontSize: 16),
                  dropdownColor: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  items: _banks.map((bank) {
                    return DropdownMenuItem<String>(
                      value: bank['name'] as String,
                      child: Row(
                        children: [
                          Icon(
                            bank['icon'] as IconData,
                            color: bank['color'] as Color,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Text(bank['name'] as String),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (bankName) {
                    if (bankName == null) return;
                    print('🏦 [BankPaymentScreen] Selected bank: $bankName');

                    setState(() {
                      _selectedBank = bankName;
                    });

                    // ✅ Navigate to Paystack payment - NOT a separate bank auth
                    // Paystack handles all bank authentication on their page
                    _proceedToPayment(userId, amount, email);
                  },
                ),
              ),
            ),

            const Spacer(),

            // Bottom Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () {
                    print('🏦 [BankPaymentScreen] Change payment method');
                    context.pop();
                  },
                  child: const Text(
                    'Change payment method',
                    style: TextStyle(color: AppColors.blueBackground),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    print('🏦 [BankPaymentScreen] Cancel');
                    context.pop();
                  },
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: AppColors.blueBackground),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _proceedToPayment(int userId, double amount, String email) async {
    print('🏦 [BankPaymentScreen] Proceeding to Paystack payment...');

    try {
      final paymentRepo = PaymentRepository();
      const callbackUrl = 'https://pm-app.com/payment/callback';

      final response = await paymentRepo.initializeCardPayment(
        userId: userId,
        amount: amount,
        email: email,
        callbackUrl: callbackUrl,
      );

      print('🏦 [BankPaymentScreen] Payment initialized: $response');

      // Extract authorization URL
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
        // ✅ Open Paystack WebView - this shows ALL payment options
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
      print('❌ [BankPaymentScreen] Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}