import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/repositories/location_repository.dart';

class PickupScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? product;
  final double totalAmount;

  const PickupScreen({
    super.key,
    this.product,
    this.totalAmount = 0.0,
  });

  @override
  ConsumerState<PickupScreen> createState() => _PickupScreenState();
}

class _PickupScreenState extends ConsumerState<PickupScreen> {
  String _phoneNumber = '';
  final LocationRepository _locationRepository = LocationRepository();

  bool _isFetchingLocation = true;
  bool _locationFetchFailed = false;
  int? _stateId;
  int? _lgaId;
  int? _wardId; // ✅ intentionally nullable — ward is now OPTIONAL

  @override
  void initState() {
    super.initState();
    _fetchValidLocation();
  }

  Future<void> _fetchValidLocation() async {
    print('📍 [PickupScreen] ===== FETCHING VALID LOCATION =====');
    setState(() {
      _isFetchingLocation = true;
      _locationFetchFailed = false;
    });

    try {
      final location = await _locationRepository.getFirstValidLocation();

      if (!mounted) return;

      print('📍 [PickupScreen] getFirstValidLocation() returned: $location');

      setState(() {
        _isFetchingLocation = false;

        // ✅ ONLY require stateId + lgaId. wardId is OPTIONAL and can be null.
        if (location != null &&
            location['stateId'] != null &&
            location['lgaId'] != null) {
          _stateId = location['stateId'];
          _lgaId = location['lgaId'];
          _wardId = location['wardId']; // may legitimately be null
          _locationFetchFailed = false;

          print('✅ [PickupScreen] Location resolved successfully');
          print('✅ [PickupScreen]   stateId=$_stateId');
          print('✅ [PickupScreen]   lgaId=$_lgaId');
          print('✅ [PickupScreen]   wardId=$_wardId (null is OK - optional)');
        } else {
          _locationFetchFailed = true;
          print(
              '❌ [PickupScreen] Location resolution FAILED — location was null or missing state/lga: $location');
        }
      });
    } catch (e, st) {
      print('❌ [PickupScreen] Exception while fetching location: $e');
      print('❌ [PickupScreen] Stack trace: $st');
      if (!mounted) return;
      setState(() {
        _isFetchingLocation = false;
        _locationFetchFailed = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // ✅ Compute the button-enabled state ONCE, up front, and log exactly why
    // it is or isn't enabled. This makes debugging "button not clicking"
    // issues trivial from the console.
    final bool canProceed = !_isFetchingLocation &&
        !_locationFetchFailed &&
        _stateId != null &&
        _lgaId != null; // ✅ wardId is NOT required anymore

    print('📍 [PickupScreen] Product: ${widget.product}');
    print('📍 [PickupScreen] Total Amount: ${widget.totalAmount}');
    print('📍 [PickupScreen] ----- BUTTON STATE CHECK -----');
    print('📍 [PickupScreen] isFetchingLocation=$_isFetchingLocation');
    print('📍 [PickupScreen] locationFetchFailed=$_locationFetchFailed');
    print('📍 [PickupScreen] stateId=$_stateId (null? ${_stateId == null})');
    print('📍 [PickupScreen] lgaId=$_lgaId (null? ${_lgaId == null})');
    print('📍 [PickupScreen] wardId=$_wardId (optional, not required)');
    print('📍 [PickupScreen] canProceed=$canProceed');
    print('📍 [PickupScreen] --------------------------------');

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
                            print(
                                '📱 [PickupScreen] Phone number changed: "$_phoneNumber"');
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
                                    print(
                                        '🔄 [PickupScreen] Retry button tapped');
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
                              // ✅ FIXED: only blocks on missing stateId/lgaId.
                              // wardId is intentionally excluded — it's optional.
                              // ✅ FIXED: onPressed is `null` (truly disabled)
                              // when canProceed is false, and a real callback
                              // only when stateId + lgaId are present.
                              // wardId is intentionally NOT part of this check.
                              onPressed: !canProceed
                                  ? null
                                  : () {
                                      print(
                                          '🟢 [PickupScreen] "Proceed to pay" TAPPED');

                                      final phoneNumber =
                                          _phoneNumber.isNotEmpty
                                              ? _phoneNumber
                                              : '08012345678';

                                      final checkoutData = {
                                        'product': widget.product,
                                        'totalAmount': widget.totalAmount,
                                        'deliveryMethod': 'PICKUP',
                                        'paymentType': 'FULL_PAYMENT',
                                        'paymentMethod': 'CARD',
                                        'deliveryAddress': 'Store Pickup',
                                        'deliveryPhone': phoneNumber,
                                        'deliveryStateId': _stateId,
                                        'deliveryLgaId': _lgaId,
                                        'deliveryWardId':
                                            _wardId, // ✅ null is fine, backend accepts it
                                        'deliveryFee': 0,
                                      };
                                      print(
                                          '📦 [PickupScreen] Checkout data built: $checkoutData');
                                      print(
                                          '📦 [PickupScreen] Navigating to paymentBreakdownPickup...');
                                      context.push(
                                        AppRoutes.paymentBreakdownPickup,
                                        extra: checkoutData,
                                      );
                                    },
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
}