import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/order_model.dart';
import 'package:pm_e_commerce_app/data/providers/order_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:intl/intl.dart';
import 'package:pm_e_commerce_app/presentation/history/screens/installment_payment_screen.dart';

class ItemPurchaseScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> extraData;

  const ItemPurchaseScreen({super.key, required this.extraData});

  @override
  ConsumerState<ItemPurchaseScreen> createState() => _ItemPurchaseScreenState();
}

class _ItemPurchaseScreenState extends ConsumerState<ItemPurchaseScreen> {
  bool _showCancelDialog = false;
  bool _isCancelling = false;

  // ✅ The order passed via navigation `extra` (from the history list) may
  // be stale/incomplete - always refetch /api/orders/{id} for the true
  // installment schedule, keeping this as an instant-paint fallback.
  OrderModel? _fetchedOrder;
  bool _isLoadingDetails = false;
  String? _detailsError;

  OrderModel? get _navOrder {
    if (widget.extraData['order'] != null) {
      return widget.extraData['order'] as OrderModel;
    }
    return null;
  }

  OrderModel? get _order => _fetchedOrder ?? _navOrder;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchOrderDetails());
  }

  Future<void> _fetchOrderDetails() async {
    final orderId = _navOrder?.id ?? widget.extraData['orderId'] as int?;
    if (orderId == null) return;

    setState(() {
      _isLoadingDetails = true;
      _detailsError = null;
    });

    try {
      final order =
          await ref.read(orderRepositoryProvider).getOrderById(orderId);
      if (!mounted) return;
      setState(() {
        _fetchedOrder = order;
        _isLoadingDetails = false;
      });
    } catch (e) {
      print('❌ [ItemPurchaseScreen] Error fetching order $orderId details: $e');
      if (!mounted) return;
      setState(() {
        _detailsError = e.toString();
        _isLoadingDetails = false;
      });
    }
  }

  String _formatCurrency(double amount) {
    return NumberFormat('#,###').format(amount);
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;

    print('📱 [ItemPurchaseScreen] Building screen for order: ${order?.id}');
    print('📱 [ItemPurchaseScreen] isInstallment: ${order?.isInstallment}');
    print('📱 [ItemPurchaseScreen] paymentType: ${order?.paymentType}');

    if (order == null) {
      return Scaffold(
        backgroundColor: AppColors.lightBackground,
        appBar: _appBar(),
        body: _isLoadingDetails
            ? const Center(child: CircularProgressIndicator())
            : Center(
                child: Text(_detailsError != null
                    ? 'Failed to load order: $_detailsError'
                    : 'Order not found'),
              ),
      );
    }

    final isInstallment = order.isInstallment;
    final firstItem = order.items.isNotEmpty ? order.items.first : null;
    final productImage =
        firstItem?.productImage ?? 'assets/images/product1.png';
    final productName = firstItem?.productName ?? 'Order #${order.orderNumber}';

    print('📱 [ItemPurchaseScreen] Product: $productName');
    print('📱 [ItemPurchaseScreen] Total: ₦${order.grandTotal}');
    print('📱 [ItemPurchaseScreen] Status: ${order.status}');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: _appBar(),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ✅ Cached (list-screen) data is already showing above -
                // this just signals fresher installment data is on its way.
                if (_isLoadingDetails && _fetchedOrder == null)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: LinearProgressIndicator(minHeight: 2),
                  ),
                _buildProductCard(productImage, productName, order),
                const SizedBox(height: 18),
                _buildStatusSection(order),
                const SizedBox(height: 18),
                _buildPaymentInfo(order),
                const SizedBox(height: 18),
                if (isInstallment)
                  _buildInstallmentDetails(order)
                else
                  _buildBuyOnceDetails(order),
                const SizedBox(height: 28),
                // A settled plan leaves the order at PAYMENT_CONFIRMED, so status alone
                // kept both repayment buttons live on a fully paid plan - tapping one
                // just surfaced a raw backend 400.
                if (order.status != 'CANCELLED' &&
                    order.status != 'COMPLETED' &&
                    !(isInstallment && _isPlanSettled(order))) ...[
                  if (isInstallment) ...[
                    _actionButton(
                      'Make Next Installment Payment',
                      icon: Icons.payments_rounded,
                      isPrimary: true,
                      onTap: () => _handleNextInstallment(order),
                    ),
                    const SizedBox(height: 10),
                    _actionButton(
                      'Make Full Payment',
                      icon: Icons.account_balance_wallet_rounded,
                      isPrimary: false,
                      onTap: () => _handleFullPayment(order),
                    ),
                  ] else
                    _actionButton(
                      'Pay Now',
                      icon: Icons.payment_rounded,
                      isPrimary: true,
                      onTap: () => _handlePayNow(order),
                    ),
                ],
                if (order.status == 'COMPLETED') ...[
                  _actionButton(
                    'Request Refund',
                    icon: Icons.replay_rounded,
                    isPrimary: false,
                    accentColor: Colors.orange.shade700,
                    onTap: () => _handleRefundRequest(order),
                  ),
                ],
                if (order.status != 'CANCELLED' &&
                    order.status != 'COMPLETED') ...[
                  const SizedBox(height: 10),
                  _actionButton(
                    'Cancel Order',
                    icon: Icons.close_rounded,
                    isPrimary: false,
                    accentColor: Colors.red.shade400,
                    onTap: () => setState(() => _showCancelDialog = true),
                  ),
                ],
                const SizedBox(height: 60),
              ],
            ),
          ),
          if (_showCancelDialog) _cancelDialog(order),
        ],
      ),
    );
  }

  PreferredSizeWidget _appBar() {
    return AppBar(
      backgroundColor: AppColors.blueBackground,
      elevation: 0,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back_rounded,
              color: Colors.white, size: 20),
        ),
        onPressed: () => context.pop(),
      ),
      title: const Text(
        'Order Details',
        style: TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
        ),
      ),
      centerTitle: true,
    );
  }

  // ============================================================
  // PRODUCT CARD
  // ============================================================
  Widget _buildProductCard(
      String imagePath, String productName, OrderModel order) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
            spreadRadius: -6,
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            height: 190,
            width: double.infinity,
            child: _buildProductImage(imagePath),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.blueBackground,
                  AppColors.blueBackground.withOpacity(0.85),
                ],
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  productName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Order #${order.orderNumber}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.75),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // STATUS
  // ============================================================
  Widget _buildStatusSection(OrderModel order) {
    final statusColor = order.statusColor;
    final statusText = order.statusDisplay.toUpperCase();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: statusColor.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          const Text(
            'Order Status',
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: Colors.black54,
            ),
          ),
          const Spacer(),
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: statusColor,
              shape: BoxShape.circle,
            ),
          ),
          Flexible(
            child: Text(
              statusText,
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: statusColor,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // PAYMENT INFO
  // ============================================================
  Widget _buildPaymentInfo(OrderModel order) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader('ORDER INFORMATION'),
          const SizedBox(height: 14),
          _infoRow('Order Number', order.orderNumber),
          _divider(),
          _infoRow('Order Date', _formatDate(order.createdAt ?? '')),
          _divider(),
          _infoRow('Total Amount', '₦${_formatCurrency(order.grandTotal)}',
              valueColor: AppColors.blueBackground, valueBold: true),
          if (order.paidAmount > 0) ...[
            _divider(),
            _infoRow('Paid Amount', '₦${_formatCurrency(order.paidAmount)}'),
            _divider(),
            _infoRow(
              'Remaining',
              '₦${_formatCurrency(order.remainingBalance)}',
            ),
          ],
          _divider(),
          _infoRow(
            'Payment Type',
            order.isInstallment ? 'Installment' : 'Full Payment',
          ),
        ],
      ),
    );
  }

  /// ✅ FIX: label is fixed-width via Expanded(flex), value is Expanded/Flexible
  /// with right-alignment and wraps to multiple lines instead of
  /// overflowing off-screen — this is what was causing the RenderFlex
  /// overflow crashes on long values like delivery addresses.
  Widget _infoRow(String label, String value,
      {Color? valueColor, bool valueBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13.5,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
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
                fontSize: 13.5,
                fontWeight: valueBold ? FontWeight.w700 : FontWeight.w600,
                color: valueColor ?? Colors.black87,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Divider(height: 1, color: Colors.grey.shade100),
      );

  // ============================================================
  // BUY ONCE DETAILS
  // ============================================================
  Widget _buildBuyOnceDetails(OrderModel order) {
    final firstItem = order.items.isNotEmpty ? order.items.first : null;
    final itemPrice = firstItem?.price ?? 0.0;

    print('📱 [ItemPurchaseScreen] Building Buy Once details');
    print('📱 [ItemPurchaseScreen] Item Price: ₦$itemPrice');

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _cardHeader('PAYMENT BREAKDOWN'),
          const SizedBox(height: 14),
          _breakdownRow('Item Price', '₦${_formatCurrency(itemPrice)}'),
          const SizedBox(height: 10),
          _breakdownRow(
              'Delivery Fee', '₦${_formatCurrency(order.deliveryFee ?? 0)}'),
          const SizedBox(height: 14),
          Divider(height: 1, color: Colors.grey.shade200),
          const SizedBox(height: 14),
          _breakdownRow(
            'Total',
            '₦${_formatCurrency(order.grandTotal)}',
            isTotal: true,
          ),
          if (order.paymentStatus.isNotEmpty) ...[
            const SizedBox(height: 14),
            Divider(height: 1, color: Colors.grey.shade100),
            const SizedBox(height: 14),
            _breakdownRow('Payment Status', order.paymentStatus),
          ],
          if (order.deliveryAddress != null &&
              order.deliveryAddress!.isNotEmpty) ...[
            const SizedBox(height: 14),
            Divider(height: 1, color: Colors.grey.shade100),
            const SizedBox(height: 14),
            _breakdownRow('Delivery Address', order.deliveryAddress!),
          ],
        ],
      ),
    );
  }

  // ============================================================
  // INSTALLMENT DETAILS
  // ============================================================
  Widget _buildInstallmentDetails(OrderModel order) {
    print('📱 [ItemPurchaseScreen] Building Installment details');

    final paidPercentage = order.paymentProgress * 100;
    final paidAmount = order.paidAmount;
    final remaining = order.remainingBalance;
    // ✅ Real schedule from the backend's installments[] - the amount/date
    // per row here is what was actually agreed, not a guessed 4-way split.
    final installments = order.installments;
    final totalFinanced = paidAmount + remaining;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _cardHeader('PAYMENT PROGRESS'),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${paidPercentage.toInt()}% paid',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Flexible(
                    child: Text(
                      'Remaining: ₦${_formatCurrency(remaining)}',
                      textAlign: TextAlign.right,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
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
              const SizedBox(height: 16),
              _breakdownRow(
                  'Total Amount', '₦${_formatCurrency(totalFinanced)}'),
              const SizedBox(height: 10),
              _breakdownRow('Paid Amount', '₦${_formatCurrency(paidAmount)}'),
              const SizedBox(height: 10),
              _breakdownRow(
                  'Remaining Balance', '₦${_formatCurrency(remaining)}'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _card(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _cardHeader('INSTALLMENT SCHEDULE'),
              const SizedBox(height: 14),
              if (installments.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'Installment schedule not available for this order.',
                    style: TextStyle(fontSize: 12.5, color: Colors.grey[600]),
                  ),
                )
              else ...[
                _tableHeader(),
                ...installments.map(_installmentRow),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // ============================================================
  // SHARED CARD / HEADER / BREAKDOWN ROW
  // ============================================================
  Widget _card({required Widget child, EdgeInsets? padding}) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(18),
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
  }

  Widget _cardHeader(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12.5,
        fontWeight: FontWeight.w700,
        color: AppColors.textBlue,
        letterSpacing: 0.4,
      ),
    );
  }

  /// ✅ FIX: same wrapping/overflow-safe pattern as _infoRow, used for
  /// breakdown rows (this is where the second overflow — line 514 —
  /// originated, from a long delivery address value).
  Widget _breakdownRow(String label, String value, {bool isTotal = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 4,
          child: Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 15 : 13.5,
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
              fontSize: isTotal ? 15 : 13.5,
              fontWeight: isTotal ? FontWeight.w800 : FontWeight.w600,
              color: isTotal ? AppColors.blueBackground : Colors.black87,
              height: 1.3,
            ),
          ),
        ),
      ],
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
              child: Text(
                '#',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Text(
                'DATE DUE',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
            ),
            Expanded(
              flex: 3,
              child: Text(
                'AMOUNT',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Text(
                'STATUS',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ],
        ),
      );

  Widget _installmentRow(OrderInstallment inst) {
    final isPaid = inst.isPaid;
    final isOverdue = !isPaid && inst.daysOverdue > 0;
    final statusLabel = isPaid ? 'Paid' : (isOverdue ? 'Overdue' : 'Pending');
    final statusColor = isPaid
        ? Colors.green
        : (isOverdue ? Colors.red : Colors.orange);
    final dateText = inst.dueDate != null
        ? _formatDate(inst.dueDate!)
        : '-';

    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: isOverdue
            ? Colors.red.withOpacity(0.04)
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
              style:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              dateText,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11.5),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              '₦${_formatCurrency(inst.amountDue)}',
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
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
                  color: statusColor.shade800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // ACTION BUTTON
  // ============================================================
  Widget _actionButton(
    String text, {
    required IconData icon,
    required bool isPrimary,
    Color? accentColor,
    VoidCallback? onTap,
  }) {
    final Color baseColor = accentColor ?? AppColors.blueBackground;

    return SizedBox(
      width: double.infinity,
      height: 52,
      child: isPrimary
          ? ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: baseColor,
                elevation: 2,
                shadowColor: baseColor.withOpacity(0.35),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 18, color: Colors.white),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      text,
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
            )
          : OutlinedButton(
              onPressed: onTap,
              style: OutlinedButton.styleFrom(
                foregroundColor: baseColor,
                side: BorderSide(color: baseColor.withOpacity(0.4), width: 1.3),
                backgroundColor: baseColor.withOpacity(0.05),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 18, color: baseColor),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      text,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: baseColor,
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

  // ============================================================
  // PRODUCT IMAGE
  // ============================================================
  Widget _buildProductImage(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return Image.asset('assets/images/product1.png', fit: BoxFit.contain);
    }

    if (imagePath.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: imagePath,
        fit: BoxFit.contain,
        errorWidget: (_, __, ___) =>
            Image.asset('assets/images/product1.png', fit: BoxFit.contain),
        placeholder: (_, __) =>
            const Center(child: CircularProgressIndicator()),
      );
    } else if (imagePath.startsWith('assets/')) {
      return Image.asset(
        imagePath,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) =>
            Image.asset('assets/images/product1.png', fit: BoxFit.contain),
      );
    } else {
      final imageUrl = ApiConstants.productImages(imagePath);
      return CachedNetworkImage(
        imageUrl: imageUrl,
        fit: BoxFit.contain,
        errorWidget: (_, __, ___) =>
            Image.asset('assets/images/product1.png', fit: BoxFit.contain),
        placeholder: (_, __) =>
            const Center(child: CircularProgressIndicator()),
      );
    }
  }

  // ============================================================
  // CANCEL DIALOG
  // ============================================================
  Widget _cancelDialog(OrderModel order) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 32),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.warning_rounded,
                    color: Colors.red.shade400, size: 28),
              ),
              const SizedBox(height: 16),
              const Text(
                'Cancel this order?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'This action cannot be undone.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isCancelling
                          ? null
                          : () => setState(() => _showCancelDialog = false),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        side: BorderSide(color: Colors.grey.shade300),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Keep Order',
                        style: TextStyle(
                            color: Colors.black87, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isCancelling
                          ? null
                          : () => _handleCancelOrder(order),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade400,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isCancelling
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Cancel Order',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================
  // HANDLERS (unchanged logic)
  // ============================================================

  Future<void> _handleCancelOrder(OrderModel order) async {
    print('🚫 [ItemPurchaseScreen] Cancelling order ${order.id}');
    setState(() {
      _isCancelling = true;
    });

    try {
      final success =
          await ref.read(ordersProvider.notifier).cancelOrder(order.id);

      if (success) {
        print('✅ [ItemPurchaseScreen] Order cancelled successfully');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Order cancelled successfully'),
              backgroundColor: AppColors.blueBackground,
            ),
          );
          context.pop();
        }
      } else {
        print('❌ [ItemPurchaseScreen] Failed to cancel order');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to cancel order. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('❌ [ItemPurchaseScreen] Error cancelling order: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCancelling = false;
          _showCancelDialog = false;
        });
      }
    }
  }

  /// A plan with nothing left to pay. The order is PAYMENT_CONFIRMED rather than
  /// COMPLETED at that point, so the remaining balance is what actually tells us.
  bool _isPlanSettled(OrderModel order) =>
      order.isPaid || order.remainingBalance <= 0.01;

  Future<void> _handleNextInstallment(OrderModel order) async {
    print(
        '💳 [ItemPurchaseScreen] Make next installment payment for order ${order.id}');
    await _goToInstallmentPayment(order, InstallmentPaymentMode.next);
  }

  Future<void> _handleFullPayment(OrderModel order) async {
    print('💳 [ItemPurchaseScreen] Make full payment for order ${order.id}');
    await _goToInstallmentPayment(order, InstallmentPaymentMode.full);
  }

  Future<void> _goToInstallmentPayment(
      OrderModel order, InstallmentPaymentMode mode) async {
    if (order.installmentPlanId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No installment plan linked to this order.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final result = await context.push<bool>(
      AppRoutes.installmentPayment,
      extra: {'order': order, 'mode': mode},
    );

    // ✅ Payment succeeded — refresh so paid/remaining and the schedule
    // reflect the just-completed installment.
    if (result == true) {
      await _fetchOrderDetails();
    }
  }

  void _handlePayNow(OrderModel order) {
    print('💳 [ItemPurchaseScreen] Pay now for order ${order.id}');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment feature coming soon'),
        backgroundColor: AppColors.blueBackground,
      ),
    );
  }

  void _handleRefundRequest(OrderModel order) {
    print('💰 [ItemPurchaseScreen] Request refund for order ${order.id}');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Refund request feature coming soon'),
        backgroundColor: AppColors.blueBackground,
      ),
    );
  }
}
