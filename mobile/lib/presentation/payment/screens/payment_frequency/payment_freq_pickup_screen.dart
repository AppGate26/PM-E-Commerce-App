import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/data/repositories/location_repository.dart';

class PaymentFreqPickupScreen extends ConsumerStatefulWidget {
  const PaymentFreqPickupScreen({super.key});

  @override
  ConsumerState<PaymentFreqPickupScreen> createState() =>
      _PaymentFreqPickupScreenState();
}

class _PaymentFreqPickupScreenState
    extends ConsumerState<PaymentFreqPickupScreen> {
  String _phoneNumber = '';
  final LocationRepository _locationRepository = LocationRepository();

  bool _isFetchingLocation = true;
  bool _locationFetchFailed = false;
  int? _stateId;
  int? _lgaId;

  InstallmentPlan? _plan;
  bool _extraRead = false;

  @override
  void initState() {
    super.initState();
    print('🟦 [PaymentFreqPickup] initState() called');
    _fetchValidLocation();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_extraRead) {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      print('🟦 [PaymentFreqPickup] Raw extra received: $extra');

      _plan = extra?['plan'] as InstallmentPlan?;
      _extraRead = true;

      if (_plan == null) {
        print('🔴 [PaymentFreqPickup] ⚠️ NO PLAN found in extra! '
            'Navigation source did not pass "plan".');
      } else {
        print('🟩 [PaymentFreqPickup] ✅ Plan received successfully:');
        print('🟩 [PaymentFreqPickup]   planId       = ${_plan!.planId}');
        print('🟩 [PaymentFreqPickup]   productName  = ${_plan!.productName}');
        print('🟩 [PaymentFreqPickup]   productPrice = ${_plan!.productPrice}');
        print('🟩 [PaymentFreqPickup]   insurance    = ${_plan!.insurance}');
        print('🟩 [PaymentFreqPickup]   totalAmount  = ${_plan!.totalAmount}');
        print('🟩 [PaymentFreqPickup]   frequency    = ${_plan!.frequency}');
        print('🟩 [PaymentFreqPickup]   duration     = ${_plan!.durationInMonths}');
        print('🟩 [PaymentFreqPickup]   schedule len = ${_plan!.schedule.length}');
      }
    }
  }

  Future<void> _fetchValidLocation() async {
    print('📍 [PaymentFreqPickup] ===== FETCHING VALID LOCATION =====');
    setState(() {
      _isFetchingLocation = true;
      _locationFetchFailed = false;
    });

    try {
      final location = await _locationRepository.getFirstValidLocation();
      if (!mounted) return;

      print('📍 [PaymentFreqPickup] getFirstValidLocation() returned: $location');

      setState(() {
        _isFetchingLocation = false;

        if (location != null &&
            location['stateId'] != null &&
            location['lgaId'] != null) {
          _stateId = location['stateId'];
          _lgaId = location['lgaId'];
          _locationFetchFailed = false;
          print('✅ [PaymentFreqPickup] Location resolved: '
              'stateId=$_stateId lgaId=$_lgaId');
        } else {
          _locationFetchFailed = true;
          print('❌ [PaymentFreqPickup] Location resolution FAILED: $location');
        }
      });
    } catch (e, st) {
      print('❌ [PaymentFreqPickup] Exception fetching location: $e');
      print('❌ [PaymentFreqPickup] Stack: $st');
      if (!mounted) return;
      setState(() {
        _isFetchingLocation = false;
        _locationFetchFailed = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _plan;

    if (plan == null) {
      print('🔴 [PaymentFreqPickup] build() -> showing MISSING PLAN state');
      return _buildMissingPlanState();
    }

    final bool canProceed = !_isFetchingLocation &&
        !_locationFetchFailed &&
        _stateId != null &&
        _lgaId != null;

    print('📍 [PaymentFreqPickup] build() -> canProceed=$canProceed '
        '(fetching=$_isFetchingLocation failed=$_locationFetchFailed '
        'state=$_stateId lga=$_lgaId)');

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
          'Store Pickup',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 40),

                  // Phone Number Field
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Phone Number',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
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
                          onChanged: (value) {
                            setState(() {
                              _phoneNumber = value;
                            });
                            print('📱 [PaymentFreqPickup] Phone number changed: "$_phoneNumber"');
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Store Pickup Info Card
                  Center(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.blueBackground,
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.textLight,
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Text(
                            'Store Pickup',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textLight,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Your item will be ready for pickup at our store.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textLight,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 16),
                          if (_isFetchingLocation)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 8),
                              child: CircularProgressIndicator(
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          else if (_locationFetchFailed)
                            Column(
                              children: [
                                const Text(
                                  'Could not load pickup location details.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.textLight,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () {
                                    print('🔄 [PaymentFreqPickup] Retry button tapped');
                                    _fetchValidLocation();
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.lightBackground,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 20,
                                      vertical: 10,
                                    ),
                                  ),
                                  child: const Text('Retry'),
                                ),
                              ],
                            )
                          else
                            ElevatedButton(
                              onPressed: !canProceed ? null : () => _proceed(plan),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.lightBackground,
                                disabledBackgroundColor:
                                    AppColors.lightBackground.withOpacity(0.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ),
                              ),
                              child: const Text('Proceed to pay'),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
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
        surfaceTintColor: Colors.transparent,
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
              Text(
                'No installment plan was found. Please go back and try again.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textBlue,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => context.pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child:
                    const Text('Go Back', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _proceed(InstallmentPlan plan) {
    final phoneNumber =
        _phoneNumber.trim().isNotEmpty ? _phoneNumber.trim() : null;

    print('🟢 [PaymentFreqPickup] "Proceed to pay" TAPPED');
    print('🟢 [PaymentFreqPickup] Confirming plan before navigation:');
    print('🟢 [PaymentFreqPickup]   planId       = ${plan.planId}');
    print('🟢 [PaymentFreqPickup]   productName  = ${plan.productName}');
    print('🟢 [PaymentFreqPickup]   totalAmount  = ${plan.totalAmount}');
    print('🟢 [PaymentFreqPickup]   phoneNumber  = $phoneNumber');
    print('🟢 [PaymentFreqPickup]   stateId/lgaId = $_stateId / $_lgaId');

    final checkoutData = {
      'plan': plan,
      'isDelivery': false,
      'deliveryMethod': 'PICKUP',
      'paymentMethod': 'CARD',
      'deliveryAddress': 'Store Pickup',
      'deliveryPhone': phoneNumber,
      'deliveryStateId': _stateId,
      'deliveryLgaId': _lgaId,
      'deliveryFee': 0,
    };

    print('📦 [PaymentFreqPickup] Final checkout data being pushed: $checkoutData');
    print('📦 [PaymentFreqPickup] plan.totalAmount inside pushed data = '
        '${(checkoutData['plan'] as InstallmentPlan).totalAmount}');

    context.push(
      AppRoutes.installmentBreakdown,
      extra: checkoutData,
    );

    print('🟢 [PaymentFreqPickup] Navigation to installmentBreakdown fired.');
  }
}