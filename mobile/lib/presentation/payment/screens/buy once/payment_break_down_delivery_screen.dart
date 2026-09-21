import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/product_provider.dart';

class PaymentBreakdownDeliveryScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? product;
  final double totalAmount;

  const PaymentBreakdownDeliveryScreen({
    super.key,
    this.product,
    this.totalAmount = 0.0,
  });

  @override
  ConsumerState<PaymentBreakdownDeliveryScreen> createState() =>
      _PaymentBreakdownDeliveryScreenState();
}

class _PaymentBreakdownDeliveryScreenState
    extends ConsumerState<PaymentBreakdownDeliveryScreen> {
  bool isChecked = false;

  @override
  Widget build(BuildContext context) {
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;

    print('📦 [PaymentBreakdownDelivery] Raw extra received: $extra');

    final double totalAmount = extra?['totalAmount'] ?? widget.totalAmount;
    final product = extra?['product'] ??
        widget.product ??
        ref.watch(paymentFlowProductProvider);

    final deliveryAddress = extra?['deliveryAddress'] ?? '';
    final deliveryPhone = extra?['deliveryPhone'] ?? '08012345678';

    // ✅ No more hardcoded 1200 fallback. If the fee genuinely wasn't
    // passed (a real bug, not the normal path), we surface that instead
    // of silently charging a made-up amount.
    final rawFee = extra?['deliveryFee'];
    final bool hasValidFee = rawFee != null && (rawFee as num) >= 0;
    final double deliveryFee = hasValidFee ? (rawFee).toDouble() : 0.0;

    final totalWithDelivery = totalAmount + deliveryFee;

    print('📦 [PaymentBreakdownDelivery] ===== DELIVERY BREAKDOWN =====');
    print('📦 [PaymentBreakdownDelivery] Total Amount: $totalAmount');
    if (hasValidFee) {
      print(
          '✅ [PaymentBreakdownDelivery] Delivery Fee (calculated): ₦$deliveryFee');
    } else {
      print('🔴 [PaymentBreakdownDelivery] ⚠️ No delivery fee found in extra! '
          'This screen was reached without a calculated fee — check DeliveryScreen flow.');
    }
    print(
        '📦 [PaymentBreakdownDelivery] Total with Delivery: $totalWithDelivery');
    print('📦 [PaymentBreakdownDelivery] Delivery Address: $deliveryAddress');
    print('📦 [PaymentBreakdownDelivery] Delivery Phone: $deliveryPhone');
    print(
        '📍 [PaymentBreakdownDelivery] Location IDs (raw from extra) - State: ${extra?['deliveryStateId']}, LGA: ${extra?['deliveryLgaId']}, Ward: ${extra?['deliveryWardId']}');

    final productName = (product?['productName'] ?? product?['name'])
                ?.toString()
                .trim()
                .isNotEmpty ==
            true
        ? (product!['productName'] ?? product['name']).toString()
        : 'Your Order';
    final productImage = product?['image']?.toString();
    final isNetworkImage =
        productImage != null && productImage.startsWith('http');

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
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                        bottomLeft: Radius.circular(20),
                        bottomRight: Radius.circular(20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          height: 180,
                          color: AppColors.whiteBackground,
                          child: isNetworkImage
                              ? CachedNetworkImage(
                                  imageUrl: productImage,
                                  fit: BoxFit.contain,
                                  placeholder: (context, url) => const Center(
                                      child: CircularProgressIndicator()),
                                  errorWidget: (context, url, error) =>
                                      Image.asset('assets/images/product1.png',
                                          fit: BoxFit.contain),
                                )
                              : Image.asset(
                                  productImage ?? 'assets/images/product1.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => Image.asset(
                                      'assets/images/product1.png',
                                      fit: BoxFit.contain),
                                ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.blueBackground,
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(20),
                              bottomRight: Radius.circular(20),
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                          height: 48,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Flexible(
                                child: Text(
                                  productName,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      color: AppColors.textLight, fontSize: 20),
                                ),
                              )
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 60),

                  // ✅ Warning banner if fee is missing/invalid — visible
                  // instead of silently charging a wrong amount.
                  if (!hasValidFee)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 20),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline,
                              color: Colors.red.shade400, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Delivery fee could not be determined. Please go back and re-select your address.',
                              style: TextStyle(
                                fontSize: 12.5,
                                color: Colors.red.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  Text(
                    'You will be paying the sum of ₦${totalWithDelivery.toStringAsFixed(0)} now!',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Center(
                    child: Text(
                      'Your item will be delivered to your address.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 40),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.lightBlueBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.blueBackground.withOpacity(0.2),
                      ),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Subtotal',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              '₦${totalAmount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Delivery Fee',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              hasValidFee
                                  ? '₦${deliveryFee.toStringAsFixed(0)}'
                                  : 'Not calculated',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: hasValidFee
                                    ? AppColors.blueBackground
                                    : Colors.red.shade400,
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '₦${totalWithDelivery.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.blueBackground,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppColors.blueBackground,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Checkbox(
                          value: isChecked,
                          onChanged: (bool? value) {
                            setState(() {
                              isChecked = value ?? false;
                            });
                            print(
                                '☑️ [PaymentBreakdownDelivery] Terms checkbox: $isChecked');
                          },
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                          fillColor: WidgetStateProperty.resolveWith<Color>(
                            (Set<WidgetState> states) {
                              if (states.contains(WidgetState.selected)) {
                                return AppColors.blueBackground;
                              }
                              return Colors.transparent;
                            },
                          ),
                          checkColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text("I accept PM's Terms & Conditions"),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: 300,
                    child: ElevatedButton(
                      // ✅ Payment now also requires a valid, calculated fee
                      onPressed: (isChecked && hasValidFee)
                          ? () {
                              print(
                                  '🟢 [PaymentBreakdownDelivery] "Make Payment" TAPPED');

                              final deliveryStateId =
                                  extra?['deliveryStateId'] ?? '1';
                              final deliveryLgaId =
                                  extra?['deliveryLgaId'] ?? '1';
                              final deliveryWardId = extra?['deliveryWardId'];

                              print(
                                  '📍 [PaymentBreakdownDelivery] Forwarding wardId: $deliveryWardId (null is OK - optional)');
                              print(
                                  '✅ [PaymentBreakdownDelivery] Forwarding calculated deliveryFee: ₦$deliveryFee');

                              final Map<String, dynamic> checkoutData = {
                                'totalAmount': totalWithDelivery,
                                'deliveryAddress': deliveryAddress,
                                'deliveryPhone': deliveryPhone,
                                'deliveryStateId': deliveryStateId,
                                'deliveryLgaId': deliveryLgaId,
                                'deliveryWardId': deliveryWardId,
                                'deliveryMethod': 'DELIVERY',
                                'paymentType': 'FULL_PAYMENT',
                                'paymentMethod': 'CARD',
                                'deliveryFee': deliveryFee,
                              };
                              print(
                                  '📦 [PaymentBreakdownDelivery] Sending to PaymentOption: $checkoutData');
                              context.push(
                                AppRoutes.paymentOption,
                                extra: checkoutData,
                              );
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: (isChecked && hasValidFee)
                            ? AppColors.blueBackground
                            : const Color.fromARGB(255, 75, 74, 74),
                        foregroundColor: AppColors.textLight,
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                        shadowColor: Colors.blue.withOpacity(0.3),
                      ),
                      child: const Text(
                        'Make Payment',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
