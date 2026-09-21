import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_fee_provider.dart';
import 'package:pm_e_commerce_app/presentation/payment/screens/buy%20once/delivery_address_form.dart';

class DeliveryScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? product;
  final double totalAmount;

  const DeliveryScreen({
    super.key,
    this.product,
    this.totalAmount = 0.0,
  });

  @override
  ConsumerState<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends ConsumerState<DeliveryScreen> {
  String _phoneNumber = '';
  String? _selectedStateId;
  String? _selectedLgaId;

  bool _isCalculatingFee = false;

  Future<void> _handleSubmit(
    String address,
    String? stateName,
    String? lgaName,
    double? latitude,
    double? longitude,
  ) async {
    debugPrint('📍 [DeliveryScreen] ===== SUBMIT PRESSED =====');
    debugPrint('📍 [DeliveryScreen] Address     : $address');
    debugPrint('📍 [DeliveryScreen] Latitude    : $latitude');
    debugPrint('📍 [DeliveryScreen] Longitude   : $longitude');
    debugPrint(
        '📍 [DeliveryScreen] State       : $stateName ($_selectedStateId)');
    debugPrint('📍 [DeliveryScreen] LGA         : $lgaName ($_selectedLgaId)');
    debugPrint('📍 [DeliveryScreen] Phone       : $_phoneNumber');

    final deliveryAddress = address.trim().isEmpty
        ? 'No address provided - Please update your delivery address'
        : address.trim();

    // ✅ Require a real state + LGA before we can even try to calculate a fee.
    // Ward is intentionally NOT checked — it has been removed from the
    // backend entirely and is no longer part of the delivery flow.
    if (_selectedStateId == null || _selectedLgaId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a State and LGA to continue'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

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

    final int stateId = int.tryParse(_selectedStateId!) ?? 0;
    final int lgaId = int.tryParse(_selectedLgaId!) ?? 0;

    setState(() {
      _isCalculatingFee = true;
    });

    double deliveryFee;
    try {
      final repo = ref.read(deliveryFeeRepositoryProvider);
      deliveryFee = await repo.calculateDeliveryFee(
        userId: user.id,
        deliveryAddress: deliveryAddress,
        deliveryStateId: stateId,
        deliveryLgaId: lgaId,
        deliveryWardId: null, // ✅ Backend removed Ward globally — always null
        deliveryCountry: 'Nigeria',
      );
    } catch (e) {
      debugPrint('🔴 [DeliveryScreen] Delivery fee calculation failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not calculate delivery fee: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() {
          _isCalculatingFee = false;
        });
      }
      return;
    }

    if (!mounted) return;

    setState(() {
      _isCalculatingFee = false;
    });

    debugPrint('✅ [DeliveryScreen] Delivery fee resolved: ₦$deliveryFee');

    final checkoutData = {
      'product': widget.product,
      'totalAmount': widget.totalAmount,
      'deliveryAddress': deliveryAddress,
      'deliveryState': stateName ?? 'Unknown',
      'deliveryLga': lgaName ?? 'Unknown',
      'deliveryPhone': _phoneNumber.isNotEmpty ? _phoneNumber : '08012345678',
      'deliveryStateId': _selectedStateId ?? '1',
      'deliveryLgaId': _selectedLgaId ?? '1',
      'deliveryWardId': null, // ✅ never populated anymore
      'deliveryMethod': 'DELIVERY',
      'paymentType': 'FULL_PAYMENT',
      'paymentMethod': 'CARD',
      'deliveryFee': deliveryFee,
      'latitude': latitude,
      'longitude': longitude,
    };

    debugPrint('📦 [DeliveryScreen] Final checkout data:');
    checkoutData.forEach((key, value) {
      debugPrint('   → $key : $value');
    });

    debugPrint('📦 [DeliveryScreen] Navigating to PaymentBreakdownDelivery...');

    context.push(
      AppRoutes.PaymentBreakdownDelivery,
      extra: checkoutData,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded,
                color: Colors.black87, size: 15),
          ),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Delivery',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    children: [
                      const SizedBox(height: 24),

                      Row(
                        children: [
                          _StepDot(active: true, label: 'Delivery'),
                          _StepConnector(),
                          _StepDot(active: false, label: 'Payment'),
                          _StepConnector(),
                          _StepDot(active: false, label: 'Confirm'),
                        ],
                      ),

                      const SizedBox(height: 28),

                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.blueBackground,
                              AppColors.blueBackground.withOpacity(0.85),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.blueBackground.withOpacity(0.28),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                              spreadRadius: -6,
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: AppColors.textLight.withOpacity(0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.local_shipping_rounded,
                                color: AppColors.textLight,
                                size: 22,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Delivery Information',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textLight,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Your item will be delivered to your provided address.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13.5,
                                color: AppColors.textLight,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 18),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColors.textLight.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(30),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('📦',
                                      style: TextStyle(fontSize: 14)),
                                  const SizedBox(width: 8),
                                  Flexible(
                                    child: Text(
                                      'Delivery Fee is calculated based on your exact location',
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textLight,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(22),
                          border:
                              Border.all(color: Colors.black.withOpacity(0.04)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                              spreadRadius: -6,
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: AppColors.blueBackground
                                        .withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    Icons.phone_rounded,
                                    color: AppColors.blueBackground,
                                    size: 19,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  'Phone Number',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            TextFormField(
                              keyboardType: TextInputType.phone,
                              style: const TextStyle(
                                  fontSize: 14.5, fontWeight: FontWeight.w500),
                              decoration: InputDecoration(
                                hintText: 'Enter your phone number',
                                hintStyle: const TextStyle(
                                  color: Colors.black38,
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w400,
                                ),
                                filled: true,
                                fillColor: AppColors.lightBackground,
                                contentPadding: const EdgeInsets.symmetric(
                                    vertical: 16, horizontal: 4),
                                prefixIcon: Padding(
                                  padding:
                                      const EdgeInsets.only(left: 4, right: 4),
                                  child: Icon(Icons.phone_iphone_rounded,
                                      size: 20,
                                      color: AppColors.blueBackground),
                                ),
                                prefixIconConstraints: const BoxConstraints(
                                    minWidth: 44, minHeight: 44),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide.none,
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: Colors.black.withOpacity(0.05),
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide(
                                    color: AppColors.blueBackground,
                                    width: 1.4,
                                  ),
                                ),
                              ),
                              onChanged: (value) {
                                setState(() => _phoneNumber = value);
                              },
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // ✅ Ward-related params removed from constructor call
                      DeliveryAddressForm(
                        onSubmit: _handleSubmit,
                        onStateSelected: (stateId, stateName) {
                          setState(() => _selectedStateId = stateId);
                          debugPrint(
                              '📍 [DeliveryScreen] State selected → $stateId ($stateName)');
                        },
                        onLgaSelected: (lgaId, lgaName) {
                          setState(() => _selectedLgaId = lgaId);
                          debugPrint(
                              '📍 [DeliveryScreen] LGA selected → $lgaId ($lgaName)');
                        },
                      ),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (_isCalculatingFee)
            Container(
              color: Colors.black.withOpacity(0.35),
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(
                        color: AppColors.blueBackground,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Calculating delivery fee...',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  final bool active;
  final String label;

  const _StepDot({required this.active, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? AppColors.blueBackground : Colors.black12,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: active ? FontWeight.w700 : FontWeight.w500,
            color: active ? AppColors.blueBackground : Colors.black38,
          ),
        ),
      ],
    );
  }
}

class _StepConnector extends StatelessWidget {
  const _StepConnector();

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 17),
        child: Container(
          height: 2,
          color: Colors.black.withOpacity(0.08),
        ),
      ),
    );
  }
}
