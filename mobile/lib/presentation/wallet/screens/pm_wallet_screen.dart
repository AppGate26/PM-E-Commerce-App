import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/models/wallet_models.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/wallet_provider.dart';
import 'package:pm_e_commerce_app/presentation/widgets/login_required_screen.dart';

class PMWalletScreen extends ConsumerStatefulWidget {
  const PMWalletScreen({super.key});

  @override
  ConsumerState<PMWalletScreen> createState() => _PMWalletScreenState();
}

class _PMWalletScreenState extends ConsumerState<PMWalletScreen> {
  bool _isBalanceVisible = true;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(walletStateProvider.notifier).loadBalance();
      ref.read(walletTransactionsProvider.notifier).loadTransactions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isAuthenticated = authState.whenOrNull(
      data: (user) => user != null && user.token != null && user.token!.isNotEmpty,
    ) ?? false;

    if (!isAuthenticated) {
      return const LoginRequiredScreen(title: 'PM Wallet');
    }

    final balanceState = ref.watch(walletStateProvider);
    final txState = ref.watch(walletTransactionsProvider);

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.textBlue,
        centerTitle: true,
        title: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'PM WALLET',
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
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Secondary App Bar
            Container(
              height: 60,
              width: double.infinity,
              color: Colors.grey[200],
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.blueBackground,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      // Handle wallet details tap
                    },
                    child: const Text(
                      'WALLET DETAILS',
                      style: TextStyle(
                        color: AppColors.blueBackground,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  await ref.read(walletStateProvider.notifier).loadBalance();
                  await ref
                      .read(walletTransactionsProvider.notifier)
                      .loadTransactions();
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Available Balance Card
                      balanceState.when(
                        data: (balance) => _balanceCard(context, balance),
                        loading: () => _balanceSkeleton(),
                        error: (e, st) => _errorCard(
                          label: 'Unable to load balance',
                          message: e.toString(),
                          onRetry: () => ref
                              .read(walletStateProvider.notifier)
                              .loadBalance(),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'TRANSACTION HISTORY',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF666666),
                        ),
                      ),
                      const SizedBox(height: 12),
                      txState.when(
                        data: (txs) => txs.isEmpty
                            ? _emptyTransactions()
                            : Column(
                                children: txs
                                    .map(
                                      (tx) => _transactionTile(
                                        tx: tx,
                                      ),
                                    )
                                    .toList(),
                              ),
                        loading: () => Column(
                          children: List.generate(3, (_) => _txSkeleton()),
                        ),
                        error: (e, st) => _errorCard(
                          label: 'Unable to load transactions',
                          message: e.toString(),
                          onRetry: () => ref
                              .read(walletTransactionsProvider.notifier)
                              .loadTransactions(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _balanceCard(BuildContext context, WalletBalance balance) {
    final amount = balance.availableBalance;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'AVAILABLE BAL',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF666666),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isBalanceVisible ? '₦${_formatCurrency(amount)}' : '₦****',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppColors.blueBackground,
                ),
              ),
              IconButton(
                onPressed: () =>
                    setState(() => _isBalanceVisible = !_isBalanceVisible),
                icon: Icon(
                  _isBalanceVisible ? Icons.visibility_off : Icons.visibility,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    context.push(AppRoutes.addMoney);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    foregroundColor: AppColors.textLight,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('ADD MONEY'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: amount <= 0
                      ? null
                      : () => context.push(AppRoutes.verifyingScreen, extra: {
                            'availableBalance': amount,
                          }),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.lightBlueBackground,
                    foregroundColor: AppColors.blueBackground,
                    disabledBackgroundColor: Colors.grey.shade300,
                    disabledForegroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('TRANSFER CASH'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _balanceSkeleton() => Container(
        width: double.infinity,
        height: 160,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
        ),
      );

  String _formatNarration(String narration) {
    // Shorten "Wallet funded via Paystack - Ref: PM-XXXX" to "Paystack - PM-XXXX"
    if (narration.contains('Wallet funded via Paystack')) {
      final refMatch = RegExp(r'Ref:\s*(PM-\w+)').firstMatch(narration);
      if (refMatch != null) {
        return 'Paystack - ${refMatch.group(1)}';
      }
      return 'Paystack Payment';
    }
    return narration;
  }

  Widget _transactionTile({required WalletTransaction tx}) {
    final isCredit = tx.isCredit;
    final color = isCredit ? AppColors.blueBackground : Colors.red;
    final shortNarration = _formatNarration(tx.narration);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCredit
            ? AppColors.lightBlueBackground
            : AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.formattedDate,
                  style: TextStyle(
                      fontSize: 12, color: color, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  shortNarration,
                  style: TextStyle(
                      fontSize: 14, color: color, fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${isCredit ? '+' : '-'}₦${_formatCurrency(tx.amount)}',
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _txSkeleton() => Container(
        height: 70,
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
        ),
      );

  Widget _emptyTransactions() => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.whiteBackground,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: const [
            Icon(Icons.receipt_long, color: AppColors.textBlue, size: 36),
            SizedBox(height: 12),
            Text('No transactions yet',
                style: TextStyle(color: Colors.black54)),
          ],
        ),
      );

  Widget _errorCard(
          {required String label,
          required String message,
          required VoidCallback onRetry}) =>
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    color: Colors.red.shade700, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: Colors.black87)),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]},',
        );
  }
}
