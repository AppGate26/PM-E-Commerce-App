import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/product_provider.dart';

class PaymentBreakdownPickupScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? product;
  final double totalAmount;

  const PaymentBreakdownPickupScreen({
    super.key,
    this.product,
    this.totalAmount = 0.0,
  });

  @override
  ConsumerState<PaymentBreakdownPickupScreen> createState() =>
      _PaymentBreakdownPickupScreenState();
}

class _PaymentBreakdownPickupScreenState
    extends ConsumerState<PaymentBreakdownPickupScreen> {
  bool isChecked = false;

  @override
  Widget build(BuildContext context) {
    final extra =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final double totalAmount = extra?['totalAmount'] ?? widget.totalAmount;
    final product = extra?['product'] ??
        widget.product ??
        ref.watch(paymentFlowProductProvider);

    final deliveryMethod = extra?['deliveryMethod'] ?? 'PICKUP';
    final deliveryPhone = extra?['deliveryPhone'] ?? '08012345678';

    // ✅ Carry the resolved location IDs forward instead of dropping them
    final deliveryStateId = extra?['deliveryStateId'];
    final deliveryLgaId = extra?['deliveryLgaId'];
    final deliveryWardId = extra?['deliveryWardId'];

    print('📦 [PaymentBreakdownPickup] ===== PICKUP BREAKDOWN =====');
    print('📦 [PaymentBreakdownPickup] Total Amount: $totalAmount');
    print('📦 [PaymentBreakdownPickup] Delivery Phone: $deliveryPhone');
    print('📦 [PaymentBreakdownPickup] Delivery Method: $deliveryMethod');
    print(
        '📍 [PaymentBreakdownPickup] Location IDs - State: $deliveryStateId, LGA: $deliveryLgaId, Ward: $deliveryWardId');

    final productName = product?['name']?.toString() ?? 'Product';
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
                  Text(
                    'You will be paying the sum of ₦${totalAmount.toStringAsFixed(0)} now!',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 30),
                  const Center(
                    child: Text(
                      'Your item will be ready for pickup at the store.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 120),
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
                  const SizedBox(
                    height: 20,
                  ),
                  SizedBox(
                    width: 300,
                    child: ElevatedButton(
                      onPressed: isChecked
                          ? () {
                              final Map<String, dynamic> checkoutData = {
                                'totalAmount': totalAmount,
                                'deliveryMethod': 'PICKUP',
                                'paymentType': 'FULL_PAYMENT',
                                'paymentMethod': 'CARD',
                                'deliveryAddress': 'Store Pickup',
                                'deliveryPhone': deliveryPhone,
                                'deliveryStateId':
                                    deliveryStateId, // ✅ forwarded
                                'deliveryLgaId': deliveryLgaId, // ✅ forwarded
                                'deliveryWardId': deliveryWardId, // ✅ forwarded
                                'deliveryFee': 0,
                              };
                              print(
                                  '📦 [PaymentBreakdownPickup] Sending to PaymentOption: $checkoutData');
                              print(
                                  '📍 [PaymentBreakdownPickup] Location IDs forwarded - State: $deliveryStateId, LGA: $deliveryLgaId, Ward: $deliveryWardId');
                              context.push(
                                AppRoutes.paymentOption,
                                extra: checkoutData,
                              );
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isChecked
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
