import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/user_profile_model.dart';
import 'package:pm_e_commerce_app/data/providers/profile_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/profile_repository.dart' show LocationModel;

class DeliveryAddressForm extends ConsumerStatefulWidget {
  final Function(String address, String? stateName, String? lgaName, String? wardName)? onSubmit;

  const DeliveryAddressForm({
    super.key,
    this.onSubmit,
  });

  @override
  ConsumerState<DeliveryAddressForm> createState() => _DeliveryAddressFormState();
}

class _DeliveryAddressFormState extends ConsumerState<DeliveryAddressForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _addressController;
  late TextEditingController _stateController;
  late TextEditingController _lgaController;
  late TextEditingController _wardController;

  String? _stateName;
  String? _lgaName;
  String? _wardName;
  bool _isLoading = true;
  bool _profileIncomplete = false;

  @override
  void initState() {
    super.initState();
    _addressController = TextEditingController();
    _stateController = TextEditingController();
    _lgaController = TextEditingController();
    _wardController = TextEditingController();
    _loadProfileData();
  }

  @override
  void dispose() {
    _addressController.dispose();
    _stateController.dispose();
    _lgaController.dispose();
    _wardController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData() async {
    print('📦 [DeliveryAddressForm] Loading profile data...');
    setState(() {
      _isLoading = true;
    });

    try {
      final profileState = ref.read(profileProvider);
      UserProfileModel? profile;

      if (profileState.value != null) {
        profile = profileState.value;
        print('✅ [DeliveryAddressForm] Profile loaded from cache');
      } else {
        // Fetch fresh profile
        await ref.read(profileProvider.notifier).fetchUserProfile();
        final updatedState = ref.read(profileProvider);
        profile = updatedState.value;
        print('✅ [DeliveryAddressForm] Profile fetched from API');
      }

      if (profile == null) {
        print('⚠️ [DeliveryAddressForm] Profile is null');
        setState(() {
          _profileIncomplete = true;
          _isLoading = false;
        });
        return;
      }

      print('📋 [DeliveryAddressForm] Profile data - address: ${profile.address}, stateId: ${profile.stateId}, lgaId: ${profile.lgaId}, wardId: ${profile.wardId}');

      // Check if profile has required fields
      if (profile.address == null || profile.address!.isEmpty ||
          profile.stateId == null || profile.lgaId == null) {
        print('⚠️ [DeliveryAddressForm] Profile incomplete - missing address, state, or LGA');
        setState(() {
          _profileIncomplete = true;
          _isLoading = false;
        });
        return;
      }

      // Populate address
      _addressController.text = profile.address ?? '';
      print('✅ [DeliveryAddressForm] Address populated: ${_addressController.text}');

      // Load location names
      if (profile.stateId != null) {
        await _loadLocationNames(profile);
      }

      setState(() {
        _isLoading = false;
        _profileIncomplete = false;
      });
    } catch (e) {
      print('❌ [DeliveryAddressForm] Error loading profile: $e');
      setState(() {
        _isLoading = false;
        _profileIncomplete = true;
      });
    }
  }

  Future<void> _loadLocationNames(UserProfileModel profile) async {
    try {
      // Load state name
      if (profile.stateId != null) {
        final states = await ref.read(profileProvider.notifier).fetchStates();
        final state = states.firstWhere(
          (s) => s.id == profile.stateId,
          orElse: () => states.isNotEmpty ? states.first : LocationModel(id: 0, name: ''),
        );
        _stateName = state.name;
        _stateController.text = state.name;
        print('✅ [DeliveryAddressForm] State loaded: $_stateName');
      }

      // Load LGA name
      if (profile.lgaId != null && profile.stateId != null) {
        final lgas = await ref.read(profileProvider.notifier).fetchLgas(profile.stateId!);
        final lga = lgas.firstWhere(
          (l) => l.id == profile.lgaId,
          orElse: () => lgas.isNotEmpty ? lgas.first : LocationModel(id: 0, name: ''),
        );
        _lgaName = lga.name;
        _lgaController.text = lga.name;
        print('✅ [DeliveryAddressForm] LGA loaded: $_lgaName');
      }

      // Load ward name
      if (profile.wardId != null && profile.lgaId != null) {
        final wards = await ref.read(profileProvider.notifier).fetchWards(profile.lgaId!);
        final ward = wards.firstWhere(
          (w) => w.id == profile.wardId,
          orElse: () => wards.isNotEmpty ? wards.first : LocationModel(id: 0, name: ''),
        );
        _wardName = ward.name;
        _wardController.text = ward.name;
        print('✅ [DeliveryAddressForm] Ward loaded: $_wardName');
      }
    } catch (e) {
      print('❌ [DeliveryAddressForm] Error loading location names: $e');
    }
  }

  void _handleSubmit() {
    // Validate that we have required fields
    if (_addressController.text.trim().isEmpty) {
      print('⚠️ [DeliveryAddressForm] Address is empty');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete your profile address'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_stateName == null || _stateName!.isEmpty) {
      print('⚠️ [DeliveryAddressForm] State is missing');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete your profile state'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (_lgaName == null || _lgaName!.isEmpty) {
      print('⚠️ [DeliveryAddressForm] LGA is missing');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete your profile LGA/City'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    print('📤 [DeliveryAddressForm] Submitting delivery address');
    print('📍 [DeliveryAddressForm] Address: ${_addressController.text}');
    print('📍 [DeliveryAddressForm] State: $_stateName, LGA: $_lgaName, Ward: $_wardName');
    
    if (widget.onSubmit != null) {
      widget.onSubmit!(
        _addressController.text,
        _stateName,
        _lgaName,
        _wardName,
      );
    }
  }

  void _navigateToProfile() {
    print('🔄 [DeliveryAddressForm] Navigating to profile screen');
    context.push(AppRoutes.profile).then((_) {
      // Reload profile data after returning from profile
      _loadProfileData();
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        padding: const EdgeInsets.all(24),
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
        child: const Center(
          child: CircularProgressIndicator(
            color: Colors.white,
          ),
        ),
      );
    }

    if (_profileIncomplete) {
      return Container(
        padding: const EdgeInsets.all(24),
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
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.info_outline,
              color: AppColors.textLight,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              'Profile Setup Required',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textLight,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Please complete your profile with your address, state, and city information to proceed with delivery.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textLight,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _navigateToProfile,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.lightBackground,
                foregroundColor: AppColors.blueBackground,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'Go to Profile',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
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
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.location_on,
                  color: AppColors.textLight,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Delivery Address',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Address Field
            _buildReadOnlyField(
              label: 'Address',
              controller: _addressController,
              icon: Icons.home,
            ),
            const SizedBox(height: 16),

            // State Field
            _buildReadOnlyField(
              label: 'State',
              controller: _stateController,
              icon: Icons.map,
            ),
            const SizedBox(height: 16),

            // LGA/City Field
            _buildReadOnlyField(
              label: 'LGA / City',
              controller: _lgaController,
              icon: Icons.location_city,
            ),
            const SizedBox(height: 16),

            // Ward Field
            if (_wardController.text.isNotEmpty)
              _buildReadOnlyField(
                label: 'Ward',
                controller: _wardController,
                icon: Icons.place,
              ),
            if (_wardController.text.isNotEmpty) const SizedBox(height: 16),

            // Info Message
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: AppColors.textLight,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This information is from your profile. Update your profile to change delivery address.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textLight,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.lightBackground,
                  foregroundColor: AppColors.blueBackground,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 2,
                ),
                child: const Text(
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
    );
  }

  Widget _buildReadOnlyField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: AppColors.textLight,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            enabled: false,
            decoration: InputDecoration(
              hintText: 'Loading...',
              hintStyle: TextStyle(
                color: Colors.grey[400],
                fontSize: 14,
              ),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              filled: true,
              fillColor: Colors.grey[100],
            ),
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }
}

