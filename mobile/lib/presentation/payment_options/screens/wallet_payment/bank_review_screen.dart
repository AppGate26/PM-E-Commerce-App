import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/extensions/go_router_extension.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/wallet_models.dart';
import 'package:pm_e_commerce_app/data/providers/wallet_provider.dart';

class BankReviewScreen extends ConsumerWidget {
  const BankReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = context.getArgs<Map<String, dynamic>>();
    final transferState = ref.watch(walletTransferProvider);

    Future<void> submit() async {
      final balance = data['availableBalance'] as double;
      final request = WalletTransferRequest(
        fromUserId: data['fromUserId'],
        toUserId: data['toUserId'],
        amount: double.parse(data['amount']),
        senderName: data['fromName'],
        recipientName: data['toName'],
        narration: data['narration'],
      );

      final success =
          await ref.read(walletTransferProvider.notifier).transfer(request, balance);
      if (!context.mounted) return;

      if (success) {
        context.push(AppRoutes.paymentSuccess);
      } else {
        final error = transferState.whenOrNull(error: (e, _) => e.toString()) ??
            'Transfer failed';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: Colors.red),
        );
      }
    }

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Review',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => context.pop(),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 32),

            // From
            const Text('from', style: TextStyle(color: Colors.black54, fontSize: 14, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Text(data['fromAccount'] as String, style: TextStyle(color: AppColors.blueBackground, fontSize: 16, fontWeight: FontWeight.bold)),
            Text(data['fromName'] as String, style: const TextStyle(color: Colors.black87, fontSize: 16)),
            const SizedBox(height: 24),

            // Amount
            Text('₦${data['amount']}', style: TextStyle(color: AppColors.blueBackground, fontSize: 32, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),

            // To
            const Text('to', style: TextStyle(color: Colors.black54, fontSize: 14, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Text(data['toAccount'] as String, style: TextStyle(color: AppColors.blueBackground, fontSize: 16, fontWeight: FontWeight.bold)),
            Text(data['toName'] as String, style: const TextStyle(color: Colors.black87, fontSize: 16)),
            const SizedBox(height: 32),

            // Bank Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                child: Text('Bank: ${data['bank']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ),
            ),

            const Spacer(),

            // PAY Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: transferState.isLoading ? null : submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 3,
                ),
                child: transferState.isLoading
                    ? const CircularProgressIndicator()
                    : const Text('PAY', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}