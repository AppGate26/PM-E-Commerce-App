import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/location_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/data/models/location_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_fee_provider.dart';
import 'package:pm_e_commerce_app/data/providers/location_provider.dart';

class PaymentFreqDeliveryScreen extends ConsumerStatefulWidget {
  const PaymentFreqDeliveryScreen({super.key});

  @override
  ConsumerState<PaymentFreqDeliveryScreen> createState() =>
      _PaymentFreqDeliveryScreenState();
}

class _PaymentFreqDeliveryScreenState
    extends ConsumerState<PaymentFreqDeliveryScreen> {
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  String? _selectedStateId;
  String? _selectedStateName;
  String? _selectedLgaId;
  String? _selectedLgaName;

  double? _latitude;
  double? _longitude;

  InstallmentPlan? _plan;
  bool _extraRead = false;
  bool _isSubmitting = false;
  bool _isGettingLocation = false;
  bool _isCalculatingFee = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_extraRead) {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      print('🟦 [PaymentFreqDelivery] Raw extra received: $extra');

      _plan = extra?['plan'] as InstallmentPlan?;
      _extraRead = true;

      if (_plan == null) {
        print('🔴 [PaymentFreqDelivery] ⚠️ NO PLAN found in extra!');
      } else {
        print('🟩 [PaymentFreqDelivery] ✅ Plan received:');
        print('🟩   planId       = ${_plan!.planId}');
        print('🟩   userId       = ${_plan!.userId}');
        print('🟩   productId    = ${_plan!.productId}');
        print('🟩   productName  = ${_plan!.productName}');
        print('🟩   productPrice = ${_plan!.productPrice}');
        print('🟩   insurance    = ${_plan!.insurance}');
        print('🟩   deliveryFee  = ${_plan!.deliveryFee}');
        print('🟩   totalAmount  = ${_plan!.totalAmount}');
      }
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _plan != null &&
      _addressController.text.trim().isNotEmpty &&
      _selectedStateId != null &&
      _selectedLgaId != null &&
      !_isSubmitting &&
      !_isCalculatingFee;

  Future<void> _useCurrentLocation() async {
    setState(() => _isGettingLocation = true);
    print('📍 [PaymentFreqDelivery] ===== USE CURRENT LOCATION =====');

    try {
      final position = await LocationService.getCurrentPosition();
      if (position == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Unable to get location. Please enable GPS and grant permission.'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      _latitude = position.latitude;
      _longitude = position.longitude;

      final address = await LocationService.getAddressFromLatLng(
        position.latitude,
        position.longitude,
      );

      if (address != null && address.isNotEmpty) {
        _addressController.text = address;
        print('✅ [PaymentFreqDelivery] Address filled: $address');
      } else {
        _addressController.text =
            '${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
      }

      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location captured successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ [PaymentFreqDelivery] Location error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error getting location: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isGettingLocation = false);
    }
  }

  Future<void> _handleSubmit() async {
    final plan = _plan;
    if (plan == null) return;

    final address = _addressController.text.trim();
    if (address.isEmpty || _selectedStateId == null || _selectedLgaId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill address, State and LGA'),
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

    final stateId = int.tryParse(_selectedStateId!) ?? 0;
    final lgaId = int.tryParse(_selectedLgaId!) ?? 0;

    setState(() {
      _isSubmitting = true;
      _isCalculatingFee = true;
    });

    print('🚚 [PaymentFreqDelivery] Calculating delivery fee...');

    double deliveryFee;
    try {
      final repo = ref.read(deliveryFeeRepositoryProvider);
      deliveryFee = await repo.calculateDeliveryFee(
        userId: user.id,
        deliveryAddress: address,
        deliveryStateId: stateId,
        deliveryLgaId: lgaId,
        deliveryWardId: null,
        deliveryCountry: 'Nigeria',
      );
      print('✅ [PaymentFreqDelivery] Delivery fee calculated: ₦$deliveryFee');
    } catch (e) {
      print('🔴 [PaymentFreqDelivery] Fee calculation failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not calculate delivery fee: $e'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() {
          _isSubmitting = false;
          _isCalculatingFee = false;
        });
      }
      return;
    }

    if (!mounted) return;

    setState(() {
      _isCalculatingFee = false;
    });

    final phoneNumber = _phoneController.text.trim().isNotEmpty
        ? _phoneController.text.trim()
        : '08012345678';

    // ✅ Recover product price if it was 0
    final double safeProductPrice = plan.productPrice > 0
        ? plan.productPrice
        : (plan.totalAmount - plan.insurance).clamp(0.0, double.infinity);

    final double newTotalAmount =
        safeProductPrice + plan.insurance + deliveryFee;

// ✅ Rebuild schedule so installments add up to the new total
    final int count = plan.durationInMonths > 0 ? plan.durationInMonths : 1;
    final double perInstallment = newTotalAmount / count;

    final List<InstallmentSchedule> newSchedule = [];
    double cumulative = 0;
    final DateTime start = plan.createdAt ?? DateTime.now();

    for (int i = 0; i < count; i++) {
      cumulative += perInstallment;

      DateTime dueDate;
      switch (plan.frequency.toUpperCase()) {
        case 'DAILY':
          dueDate = start.add(Duration(days: i + 1));
          break;
        case 'WEEKLY':
          dueDate = start.add(Duration(days: (i + 1) * 7));
          break;
        case 'MONTHLY':
        default:
          dueDate = DateTime(start.year, start.month + i + 1, start.day);
      }

      newSchedule.add(InstallmentSchedule(
        installmentId: i + 1,
        dateDue: dueDate,
        amountToPay: perInstallment,
        cumulative: cumulative,
        isPaid: false,
        paidAt: null,
      ));
    }

    print('📦 [PaymentFreqDelivery] safeProductPrice = $safeProductPrice');
    print('📦 [PaymentFreqDelivery] newTotalAmount   = $newTotalAmount');
    print('📦 [PaymentFreqDelivery] perInstallment   = $perInstallment');

    final updatedPlan = InstallmentPlan(
      planId: plan.planId,
      orderId: plan.orderId,
      userId: plan.userId,
      productId: plan.productId,
      productName: plan.productName,
      productPrice: safeProductPrice,
      insurance: plan.insurance,
      deliveryFee: deliveryFee,
      totalAmount: newTotalAmount,
      frequency: plan.frequency,
      durationInMonths: plan.durationInMonths,
      schedule: newSchedule, // ← rebuilt schedule
      createdAt: plan.createdAt,
      selectedMonths: plan.selectedMonths,
      includeInsurance: plan.includeInsurance,
    );
    final checkoutData = {
      'plan': updatedPlan,
      'isDelivery': true,
      'deliveryMethod': 'DELIVERY',
      'paymentMethod': 'CARD',
      'deliveryAddress': address,
      'deliveryState': _selectedStateName,
      'deliveryLga': _selectedLgaName,
      'deliveryPhone': phoneNumber,
      'deliveryStateId': stateId,
      'deliveryLgaId': lgaId,
      'deliveryFee': deliveryFee,
      'latitude': _latitude,
      'longitude': _longitude,
      'address': address,
      'city': _selectedLgaName ?? '',
      'state': _selectedStateName ?? '',
    };

    print('📦 [PaymentFreqDelivery] Final data: $checkoutData');
    print('📦 [PaymentFreqDelivery] Real deliveryFee = ₦$deliveryFee');

    context.push(
      AppRoutes.installmentBreakdownDelivery,
      extra: checkoutData,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _plan;

    if (plan == null) {
      return _buildMissingPlanState();
    }

    final statesAsync = ref.watch(statesProvider);
    final AsyncValue<List<LocationModel>> lgasAsync = _selectedStateId != null
        ? ref.watch(lgasByStateProvider(_selectedStateId!))
        : const AsyncValue<List<LocationModel>>.data(<LocationModel>[]);

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
        title: const Text(
          'Delivery',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),

                      // Info card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.blueBackground,
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: const Column(
                          children: [
                            Text(
                              'Delivery Information',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textLight,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Your item will be delivered to your provided address.\nDelivery fee is calculated from your location.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textLight,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Phone
                      const Text(
                        'Phone Number',
                        style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          hintText: 'Enter your phone number',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          prefixIcon: const Icon(Icons.phone, size: 20),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),

                      const SizedBox(height: 20),

                      // Address form
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Delivery Address',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Use Current Location
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: _isGettingLocation
                                    ? null
                                    : _useCurrentLocation,
                                icon: _isGettingLocation
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2),
                                      )
                                    : const Icon(Icons.my_location, size: 20),
                                label: Text(
                                  _isGettingLocation
                                      ? 'Getting location...'
                                      : 'Use Current Location',
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.blueBackground,
                                  side: BorderSide(
                                      color: AppColors.blueBackground),
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Address field
                            TextFormField(
                              controller: _addressController,
                              maxLines: 3,
                              decoration: InputDecoration(
                                hintText: 'Enter your delivery address',
                                filled: true,
                                fillColor: AppColors.lightBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                prefixIcon: const Icon(
                                    Icons.location_on_outlined,
                                    size: 20),
                              ),
                              onChanged: (_) => setState(() {}),
                            ),
                            const SizedBox(height: 16),

                            // State
                            statesAsync.when(
                              data: (states) {
                                return DropdownButtonFormField<String>(
                                  value: _selectedStateId,
                                  decoration: InputDecoration(
                                    hintText: 'Select State',
                                    filled: true,
                                    fillColor: AppColors.lightBackground,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide.none,
                                    ),
                                    prefixIcon: const Icon(Icons.location_city,
                                        size: 20),
                                  ),
                                  items: states
                                      .map((s) => DropdownMenuItem(
                                            value: s.id.toString(),
                                            child: Text(s.name),
                                          ))
                                      .toList(),
                                  onChanged: (value) {
                                    if (value == null) return;
                                    final selected = states.firstWhere(
                                        (s) => s.id.toString() == value);
                                    setState(() {
                                      _selectedStateId = value;
                                      _selectedStateName = selected.name;
                                      _selectedLgaId = null;
                                      _selectedLgaName = null;
                                    });
                                  },
                                );
                              },
                              loading: () => DropdownButtonFormField<String>(
                                decoration: InputDecoration(
                                  hintText: 'Loading states...',
                                  filled: true,
                                  fillColor: AppColors.lightBackground,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide.none,
                                  ),
                                ),
                                items: const [],
                                onChanged: null,
                              ),
                              error: (_, __) => DropdownButtonFormField<String>(
                                decoration: InputDecoration(
                                  hintText: 'Error loading states',
                                  filled: true,
                                  fillColor: Colors.red.shade50,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide.none,
                                  ),
                                ),
                                items: const [],
                                onChanged: null,
                              ),
                            ),
                            const SizedBox(height: 12),

                            // LGA
                            if (_selectedStateId != null)
                              lgasAsync.when(
                                data: (lgas) {
                                  return DropdownButtonFormField<String>(
                                    value: _selectedLgaId,
                                    decoration: InputDecoration(
                                      hintText: 'Select LGA',
                                      filled: true,
                                      fillColor: AppColors.lightBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide.none,
                                      ),
                                      prefixIcon: const Icon(Icons.location_on,
                                          size: 20),
                                    ),
                                    items: lgas
                                        .map((l) => DropdownMenuItem(
                                              value: l.id.toString(),
                                              child: Text(l.name),
                                            ))
                                        .toList(),
                                    onChanged: (value) {
                                      if (value == null) return;
                                      final selected = lgas.firstWhere(
                                          (l) => l.id.toString() == value);
                                      setState(() {
                                        _selectedLgaId = value;
                                        _selectedLgaName = selected.name;
                                      });
                                    },
                                  );
                                },
                                loading: () => DropdownButtonFormField<String>(
                                  decoration: InputDecoration(
                                    hintText: 'Loading LGAs...',
                                    filled: true,
                                    fillColor: AppColors.lightBackground,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide.none,
                                    ),
                                  ),
                                  items: const [],
                                  onChanged: null,
                                ),
                                error: (_, __) =>
                                    DropdownButtonFormField<String>(
                                  decoration: InputDecoration(
                                    hintText: 'Error loading LGAs',
                                    filled: true,
                                    fillColor: Colors.red.shade50,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide.none,
                                    ),
                                  ),
                                  items: const [],
                                  onChanged: null,
                                ),
                              ),

                            const SizedBox(height: 24),

                            // Continue button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _canSubmit ? _handleSubmit : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.blueBackground,
                                  disabledBackgroundColor:
                                      AppColors.blueBackground.withOpacity(0.4),
                                  foregroundColor: Colors.white,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: _isSubmitting || _isCalculatingFee
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor:
                                              AlwaysStoppedAnimation<Color>(
                                                  Colors.white),
                                        ),
                                      )
                                    : const Text(
                                        'Continue',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Loading overlay
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
                          color: AppColors.blueBackground),
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

  Widget _buildMissingPlanState() {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline,
                  size: 48, color: AppColors.blueBackground),
              const SizedBox(height: 16),
              const Text(
                'No installment plan was found. Please go back and try again.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => context.pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                ),
                child: const Text('Go Back',
                    style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
