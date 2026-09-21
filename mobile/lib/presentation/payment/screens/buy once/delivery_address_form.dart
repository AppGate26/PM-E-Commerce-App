import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/core/services/location_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/location_model.dart';
import 'package:pm_e_commerce_app/data/providers/location_provider.dart';

class DeliveryAddressForm extends ConsumerStatefulWidget {
  final Future<void> Function(
    String address,
    String? state,
    String? lga,
    double? latitude,
    double? longitude,
  ) onSubmit;

  final void Function(String? stateId, String? stateName)? onStateSelected;
  final void Function(String? lgaId, String? lgaName)? onLgaSelected;

  const DeliveryAddressForm({
    super.key,
    required this.onSubmit,
    this.onStateSelected,
    this.onLgaSelected,
  });

  @override
  ConsumerState<DeliveryAddressForm> createState() =>
      _DeliveryAddressFormState();
}

class _DeliveryAddressFormState extends ConsumerState<DeliveryAddressForm> {
  final TextEditingController _addressController = TextEditingController();

  String? _selectedStateId;
  String? _selectedLgaId;
  String? _selectedStateName;
  String? _selectedLgaName;

  double? _latitude;
  double? _longitude;
  bool _isGettingLocation = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isGettingLocation = true);
    debugPrint('📍 [DeliveryForm] ===== USE CURRENT LOCATION TAPPED =====');

    try {
      final position = await LocationService.getCurrentPosition();

      if (position == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            _buildSnackBar(
              'Unable to get your location. Please enable GPS and grant permission.',
              isError: true,
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
        debugPrint('✅ [DeliveryForm] Address field filled with: $address');
      } else {
        _addressController.text =
            '${position.latitude.toStringAsFixed(6)}, ${position.longitude.toStringAsFixed(6)}';
        debugPrint(
            '⚠️ [DeliveryForm] Could not resolve address, using coordinates');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          _buildSnackBar('Location captured successfully', isError: false),
        );
      }
    } catch (e) {
      debugPrint('❌ [DeliveryForm] Error in _useCurrentLocation: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          _buildSnackBar('Error getting location: $e', isError: true),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGettingLocation = false);
      }
    }
  }

  Future<void> _handleContinuePressed() async {
    if (_isSubmitting) return;

    final address = _addressController.text.trim();

    // ✅ Ward has been removed from the backend entirely — State and LGA
    // are the only required location fields now.
    if (_selectedStateId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        _buildSnackBar('Please select a State', isError: true),
      );
      return;
    }
    if (_selectedLgaId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        _buildSnackBar('Please select an LGA', isError: true),
      );
      return;
    }

    debugPrint('📍 [DeliveryForm] ===== CONTINUE PRESSED =====');
    debugPrint('📍 [DeliveryForm] Address     : $address');
    debugPrint('📍 [DeliveryForm] Latitude    : $_latitude');
    debugPrint('📍 [DeliveryForm] Longitude   : $_longitude');
    debugPrint(
        '📍 [DeliveryForm] State       : $_selectedStateName ($_selectedStateId)');
    debugPrint(
        '📍 [DeliveryForm] LGA         : $_selectedLgaName ($_selectedLgaId)');

    setState(() => _isSubmitting = true);

    try {
      await widget.onSubmit(
        address,
        _selectedStateName,
        _selectedLgaName,
        _latitude,
        _longitude,
      );
      debugPrint('✅ [DeliveryForm] onSubmit completed');
    } catch (e) {
      debugPrint('❌ [DeliveryForm] onSubmit threw: $e');
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  SnackBar _buildSnackBar(String message, {required bool isError}) {
    return SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: isError ? Colors.red.shade600 : Colors.green.shade600,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(12),
      content: Row(
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.check_circle_outline,
            color: Colors.white,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _fieldDecoration({
    required String hint,
    required IconData icon,
    bool isError = false,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        color: Colors.black38,
        fontSize: 14.5,
        fontWeight: FontWeight.w400,
      ),
      filled: true,
      fillColor: isError ? Colors.red.shade50 : AppColors.lightBackground,
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
      prefixIcon: Padding(
        padding: const EdgeInsets.only(left: 4, right: 4),
        child: Icon(
          icon,
          size: 20,
          color: isError ? Colors.red.shade400 : AppColors.blueBackground,
        ),
      ),
      prefixIconConstraints: const BoxConstraints(minWidth: 44, minHeight: 44),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: isError ? Colors.red.shade200 : Colors.black.withOpacity(0.05),
          width: 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(
          color: isError ? Colors.red.shade300 : AppColors.blueBackground,
          width: 1.4,
        ),
      ),
    );
  }

  Widget _sectionLabel(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2),
      child: RichText(
        text: TextSpan(
          text: text,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.black54,
            letterSpacing: 0.1,
          ),
          children: required
              ? const [
                  TextSpan(
                    text: '  *',
                    style: TextStyle(color: Colors.redAccent),
                  ),
                ]
              : null,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final AsyncValue<List<LocationModel>> statesAsync =
        ref.watch(statesProvider);

    final AsyncValue<List<LocationModel>> lgasAsync = _selectedStateId != null
        ? ref.watch(lgasByStateProvider(_selectedStateId!))
        : const AsyncValue<List<LocationModel>>.data(<LocationModel>[]);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.black.withOpacity(0.04)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
            spreadRadius: -6,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
            offset: const Offset(0, 1),
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
                  color: AppColors.blueBackground.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.place_rounded,
                  color: AppColors.blueBackground,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Delivery Address',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                        letterSpacing: -0.2,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Where should we deliver your order?',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: Colors.black45,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton.icon(
              onPressed: _isGettingLocation ? null : _useCurrentLocation,
              icon: _isGettingLocation
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.blueBackground,
                        ),
                      ),
                    )
                  : Icon(Icons.my_location_rounded,
                      size: 19, color: AppColors.blueBackground),
              label: Text(
                _isGettingLocation
                    ? 'Getting your location...'
                    : 'Use Current Location',
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.blueBackground,
                backgroundColor: AppColors.blueBackground.withOpacity(0.05),
                side: BorderSide(
                  color: AppColors.blueBackground.withOpacity(0.35),
                  width: 1.2,
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: Divider(color: Colors.black.withOpacity(0.06))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'OR ENTER MANUALLY',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: Colors.black.withOpacity(0.32),
                  ),
                ),
              ),
              Expanded(child: Divider(color: Colors.black.withOpacity(0.06))),
            ],
          ),
          const SizedBox(height: 18),

          _sectionLabel('Street Address'),
          TextFormField(
            controller: _addressController,
            maxLines: 3,
            style: const TextStyle(fontSize: 14.5, height: 1.4),
            decoration: _fieldDecoration(
              hint: 'Enter your delivery address',
              icon: Icons.location_on_outlined,
            ),
          ),
          const SizedBox(height: 16),

          _sectionLabel('State', required: true),
          statesAsync.when(
            data: (List<LocationModel> states) {
              return DropdownButtonFormField<String>(
                value: _selectedStateId,
                icon: const Icon(Icons.keyboard_arrow_down_rounded),
                dropdownColor: Colors.white,
                borderRadius: BorderRadius.circular(14),
                style: const TextStyle(
                  fontSize: 14.5,
                  color: Colors.black87,
                  fontWeight: FontWeight.w500,
                ),
                decoration: _fieldDecoration(
                  hint: 'Select State',
                  icon: Icons.location_city_rounded,
                ),
                items: states.map((LocationModel state) {
                  return DropdownMenuItem<String>(
                    value: state.id.toString(),
                    child: Text(state.name),
                  );
                }).toList(),
                onChanged: (value) {
                  if (states.isEmpty) return;
                  final LocationModel selectedState = states.firstWhere(
                    (s) => s.id.toString() == value,
                    orElse: () => states.first,
                  );
                  setState(() {
                    _selectedStateId = value;
                    _selectedStateName = selectedState.name;
                    _selectedLgaId = null;
                    _selectedLgaName = null;
                  });
                  widget.onStateSelected
                      ?.call(_selectedStateId, _selectedStateName);
                },
              );
            },
            loading: () => DropdownButtonFormField<String>(
              decoration: _fieldDecoration(
                hint: 'Loading states...',
                icon: Icons.location_city_rounded,
              ),
              items: const [],
              onChanged: null,
            ),
            error: (error, _) => DropdownButtonFormField<String>(
              decoration: _fieldDecoration(
                hint: 'Error loading states',
                icon: Icons.error_outline_rounded,
                isError: true,
              ),
              items: const [],
              onChanged: null,
            ),
          ),

          // ✅ LGA is now the last location field — Ward has been removed
          // entirely since the backend no longer supports it.
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: _selectedStateId != null
                ? Padding(
                    key: const ValueKey('lga'),
                    padding: const EdgeInsets.only(top: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionLabel('LGA', required: true),
                        lgasAsync.when(
                          data: (List<LocationModel> lgas) {
                            return DropdownButtonFormField<String>(
                              value: _selectedLgaId,
                              icon:
                                  const Icon(Icons.keyboard_arrow_down_rounded),
                              dropdownColor: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              style: const TextStyle(
                                fontSize: 14.5,
                                color: Colors.black87,
                                fontWeight: FontWeight.w500,
                              ),
                              decoration: _fieldDecoration(
                                hint: 'Select LGA',
                                icon: Icons.location_on_rounded,
                              ),
                              items: lgas.map((LocationModel lga) {
                                return DropdownMenuItem<String>(
                                  value: lga.id.toString(),
                                  child: Text(lga.name),
                                );
                              }).toList(),
                              onChanged: (value) {
                                if (lgas.isEmpty) return;
                                final LocationModel selectedLga =
                                    lgas.firstWhere(
                                  (l) => l.id.toString() == value,
                                  orElse: () => lgas.first,
                                );
                                setState(() {
                                  _selectedLgaId = value;
                                  _selectedLgaName = selectedLga.name;
                                });
                                widget.onLgaSelected
                                    ?.call(_selectedLgaId, _selectedLgaName);
                              },
                            );
                          },
                          loading: () => DropdownButtonFormField<String>(
                            decoration: _fieldDecoration(
                              hint: 'Loading LGAs...',
                              icon: Icons.location_on_rounded,
                            ),
                            items: const [],
                            onChanged: null,
                          ),
                          error: (error, _) => DropdownButtonFormField<String>(
                            decoration: _fieldDecoration(
                              hint: 'Error loading LGAs',
                              icon: Icons.error_outline_rounded,
                              isError: true,
                            ),
                            items: const [],
                            onChanged: null,
                          ),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('lga-empty')),
          ),

          const SizedBox(height: 28),

          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _handleContinuePressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
                disabledBackgroundColor:
                    AppColors.blueBackground.withOpacity(0.5),
                elevation: 3,
                shadowColor: AppColors.blueBackground.withOpacity(0.4),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Continue',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.2,
                          ),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_rounded, size: 18),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
