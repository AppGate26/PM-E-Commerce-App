// lib/presentation/payment/screens/bank_transfer_confirmation_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For Clipboard
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/extensions/go_router_extension.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class BankTransferConfirmationScreen extends StatelessWidget {
  const BankTransferConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data = context.getArgs<Map<String, dynamic>>();

    final String amount = data['amount'] ?? '0';
    final String bankName = data['bank'] ?? '';
    final String accountNumber = data['accountNumber'] ?? '';
    final String accountName = data['accountName'] ?? '';
    final String narration = data['narration'] ?? 'Payment';

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Bank Transfer',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),

            // === LOGO + EMAIL + AMOUNT (Figma: spaceBetween) ===
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Image.asset(
                  'assets/images/logo-blue.png',
                  width: 32,
                  height: 32,
                  errorBuilder: (_, __, ___) => const Icon(Icons.shopping_cart, size: 32),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ayode@gmail.com',
                        style: TextStyle(fontSize: 14, color: Colors.black54),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₦$amount',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 60),

            // === TRANSFER INFO ===
            Text(
              'Transfer ₦$amount to Paystack checkout',
              style: const TextStyle(fontSize: 14, color: AppColors.textBlue),
            ),
            const SizedBox(height: 24),

            // === BANK INFO (COLUMN LAYOUT) ===
            _buildBankInfo(context, 'BANK NAME:', bankName),
            _buildBankInfo(context, 'PAYSTACK-TITANS', ''),
            _buildBankInfo(context, 'ACCOUNT NUMBER:', accountNumber, isCopyable: true),
            const SizedBox(height: 5),
            _buildBankInfo(context, 'Amount', '₦$amount'),

            const SizedBox(height: 20),

            // === EXPIRY NOTE ===
            const Center(
              child: Text(
                'This account is for this transaction only\nand expires in 29:59',
                style: TextStyle(fontSize: 14,),
                textAlign: TextAlign.center,
              ),
            ),

            const SizedBox(height: 40),

            // === CONFIRM BUTTON ===
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final isSuccess = DateTime.now().millisecond % 10 < 7;
                  final route = isSuccess
                      ? AppRoutes.bankTransferSuccess
                      : AppRoutes.bankTransferError;
                  context.push(route, extra: data);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Confirm Payment',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // === FOOTER LINKS ===
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text(
                    'Change payment method',
                  ),
                ),
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Cancel', ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // === COLUMN LAYOUT: Label above value + Copy Icon ===
  static Widget _buildBankInfo(
    BuildContext context,
    String label,
    String value, {
    bool isCopyable = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textBlue,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                ),
              ),
              if (isCopyable)
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: value));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Account number copied!'),
                        duration: Duration(seconds: 1),
                        backgroundColor: AppColors.blueBackground,
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.copy,
                      size: 16,
                      color: AppColors.blueBackground,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}