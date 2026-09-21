import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/order_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/wallet_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_repository.dart';

enum InstallmentPaymentMode { next, full }

/// ✅ Confirms and executes a wallet payment against an EXISTING order's
/// installment plan — /api/installments/{planId}/pay-next/wallet or
/// /api/installments/{planId}/pay-full/wallet. This is distinct from
/// InstallmentBreakDownScreen, which previews a brand-new plan during cart
/// checkout (before any order/plan even exists).
class InstallmentPaymentScreen extends ConsumerStatefulWidget {
  final OrderModel order;
  final InstallmentPaymentMode mode;

  const InstallmentPaymentScreen({
    super.key,
    required this.order,
    required this.mode,
  });

  @override
  ConsumerState<InstallmentPaymentScreen> createState() =>
      _InstallmentPaymentScreenState();
}

class _InstallmentPaymentScreenState
    extends ConsumerState<InstallmentPaymentScreen> {
  final PaymentRepository _paymentRepository = PaymentRepository();
  bool _isProcessing = false;

  bool get _isFull => widget.mode == InstallmentPaymentMode.full;

  OrderInstallment? get _nextInstallment {
    final pending = widget.order.installments.where((i) => !i.isPaid).toList()
      ..sort((a, b) => a.installmentNumber.compareTo(b.installmentNumber));
    return pending.isNotEmpty ? pending.first : null;
  }

  double get _amountToPay {
    if (_isFull) return widget.order.remainingBalance;
    return _nextInstallment?.amountDue ?? widget.order.remainingBalance;
  }

  String _formatCurrency(double amount) => NumberFormat('#,###').format(amount);

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final planId = order.installmentPlanId;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          _isFull ? 'Pay Off Plan' : 'Pay Next Installment',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: planId == null
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No installment plan linked to this order.'),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSummaryCard(order),
                  const SizedBox(height: 18),
                  _buildScheduleCard(order),
                  const SizedBox(height: 28),
                  _buildPayButton(planId),
                ],
              ),
            ),
    );
  }

  // ============================================================
  // SHARED CARD / ROW WIDGETS
  // ============================================================
  Widget _card({required Widget child}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 18,
              offset: const Offset(0, 6),
              spreadRadius: -4,
            ),
          ],
        ),
        child: child,
      );

  Widget _cardHeader(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w700,
          color: AppColors.textBlue,
          letterSpacing: 0.4,
        ),
      );

  Widget _row(String label, String value, {bool isTotal = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Expanded(
              flex: 4,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: isTotal ? 14.5 : 13.5,
                  fontWeight: isTotal ? FontWeight.w700 : FontWeight.w500,
                  color: isTotal ? Colors.black87 : Colors.grey[700],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 6,
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontSize: isTotal ? 14.5 : 13.5,
                  fontWeight: isTotal ? FontWeight.w800 : FontWeight.w600,
                  color: isTotal ? AppColors.blueBackground : Colors.black87,
                ),
              ),
            ),
          ],
        ),
      );

  // ============================================================
  // SUMMARY CARD
  // ============================================================
  Widget _buildSummaryCard(OrderModel order) {
    final next = _nextInstallment;
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader(_isFull ? 'PAY OFF FULL PLAN' : 'NEXT INSTALLMENT DUE'),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: order.paymentProgress,
              backgroundColor: Colors.grey[200],
              valueColor:
                  const AlwaysStoppedAnimation(AppColors.blueBackground),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${(order.paymentProgress * 100).toInt()}% already paid',
            style: TextStyle(fontSize: 11.5, color: Colors.grey[600]),
          ),
          const SizedBox(height: 16),
          _row('Paid So Far', '₦${_formatCurrency(order.paidAmount)}'),
          _row('Remaining Balance',
              '₦${_formatCurrency(order.remainingBalance)}'),
          if (!_isFull && next != null)
            _row('Next Due Date', _formatDate(next.dueDate)),
          const Divider(height: 24),
          _row(
            _isFull ? 'Amount To Pay Now' : 'Installment Amount',
            '₦${_formatCurrency(_amountToPay)}',
            isTotal: true,
          ),
        ],
      ),
    );
  }

  // ============================================================
  // SCHEDULE CARD — the real backend installments[], not a guess
  // ============================================================
  Widget _buildScheduleCard(OrderModel order) {
    final installments = order.installments;
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader('INSTALLMENT SCHEDULE'),
          const SizedBox(height: 14),
          if (installments.isEmpty)
            Text(
              'No schedule available for this order.',
              style: TextStyle(fontSize: 12.5, color: Colors.grey[600]),
            )
          else ...[
            _tableHeader(),
            ...installments.map(_scheduleRow),
          ],
        ],
      ),
    );
  }

  Widget _tableHeader() => Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.blueBackground,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Row(
          children: [
            Expanded(
              flex: 1,
              child: Text('#',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white)),
            ),
            Expanded(
              flex: 2,
              child: Text('DATE DUE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white)),
            ),
            Expanded(
              flex: 3,
              child: Text('AMOUNT',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white)),
            ),
            Expanded(
              flex: 2,
              child: Text('STATUS',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white)),
            ),
          ],
        ),
      );

  Widget _scheduleRow(OrderInstallment inst) {
    final isNext = !_isFull && _nextInstallment?.id == inst.id;
    final isPaid = inst.isPaid;
    final isOverdue = !isPaid && inst.daysOverdue > 0;
    final statusLabel = isPaid
        ? 'Paid'
        : (isOverdue ? 'Overdue' : (isNext ? 'Next' : 'Pending'));
    final statusColor = isPaid
        ? Colors.green
        : (isOverdue
            ? Colors.red
            : (isNext ? AppColors.blueBackground : Colors.orange));

    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: isNext
            ? AppColors.blueBackground.withOpacity(0.06)
            : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: Text(
              inst.installmentNumber.toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              _formatDate(inst.dueDate),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11.5),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              '₦${_formatCurrency(inst.amountDue)}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                statusLabel,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // PAY BUTTON + WALLET FLOW
  // ============================================================
  Widget _buildPayButton(int planId) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _isProcessing || _amountToPay <= 0
            ? null
            : () => _payWithWallet(planId),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.blueBackground,
          elevation: 2,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: _isProcessing
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(Colors.white),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.account_balance_wallet_rounded,
                      size: 18, color: Colors.white),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Pay ₦${_formatCurrency(_amountToPay)} via Wallet',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _payWithWallet(int planId) async {
    if (_isProcessing) return;

    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to continue'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final balanceResponse =
          await _paymentRepository.getWalletBalance(user.id);
      final balanceData = balanceResponse['data'] ?? balanceResponse;
      final availableBalance =
          ((balanceData is Map ? balanceData['balance'] : null) ?? 0.0)
              .toDouble();

      if (availableBalance < _amountToPay) {
        setState(() => _isProcessing = false);
        if (mounted) {
          _showInsufficientBalanceDialog(availableBalance, _amountToPay);
        }
        return;
      }

      if (!mounted) return;
      final confirmed =
          await _showConfirmationDialog(_amountToPay, availableBalance);
      if (!confirmed) {
        setState(() => _isProcessing = false);
        return;
      }

      // ✅ pay-next resolves whichever installment is next due; pay-full
      // clears the whole remaining balance — same "planId only" shape.
      final response = _isFull
          ? await _paymentRepository.payFullPlanByWallet(planId: planId)
          : await _paymentRepository.payNextInstallmentByWallet(
              planId: planId, userId: user.id);

      if (!mounted) return;

      final statusCode = response['status'];
      final message = response['message']?.toString() ?? '';
      final isSuccess = statusCode == 200 || statusCode == 201;

      setState(() => _isProcessing = false);

      await ref.read(walletStateProvider.notifier).loadBalance();

      if (isSuccess) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Payment successful!'),
              backgroundColor: Colors.green,
            ),
          );
          context.pop(true);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Payment failed: '
                  '${message.isNotEmpty ? message : "Unknown error"}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Payment error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<bool> _showConfirmationDialog(double amount, double balance) async {
    return await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Column(
              children: [
                Icon(Icons.account_balance_wallet,
                    color: AppColors.blueBackground, size: 48),
                SizedBox(height: 12),
                Text('Confirm Wallet Payment',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
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
                      _dialogRow(
                          'Amount to Pay', '₦${_formatCurrency(amount)}'),
                      const Divider(),
                      _dialogRow(
                          'Wallet Balance', '₦${_formatCurrency(balance)}'),
                      const Divider(),
                      _dialogRow(
                        'Balance After Payment',
                        '₦${_formatCurrency(balance - amount)}',
                        isTotal: true,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Column(
          children: [
            Icon(Icons.warning_amber, color: Colors.orange, size: 48),
            SizedBox(height: 12),
            Text(
              'Insufficient Balance',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _dialogRow('Wallet Balance', '₦${_formatCurrency(balance)}'),
            const Divider(),
            _dialogRow('Amount Required', '₦${_formatCurrency(amount)}'),
            const Divider(),
            _dialogRow(
              'Shortfall',
              '₦${_formatCurrency(amount - balance)}',
              isTotal: true,
            ),
            const SizedBox(height: 12),
            const Text(
              'Please add money to your wallet to continue.',
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
            style:
                TextButton.styleFrom(foregroundColor: AppColors.blueBackground),
            child: const Text('Add Money'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              foregroundColor: Colors.white,
            ),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _dialogRow(String label, String value, {bool isTotal = false}) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: isTotal ? 13 : 12,
                fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: isTotal ? 13 : 12,
                fontWeight: FontWeight.bold,
                color: isTotal ? AppColors.blueBackground : Colors.black87,
              ),
            ),
          ],
        ),
      );
}
