import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/user_profile_model.dart';
import 'package:pm_e_commerce_app/data/providers/profile_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/profile_repository.dart'
    show LocationModel;

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isEditMode = false;
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _addressController;
  late TextEditingController _phoneController;
  List<LocationModel> _states = [];
  List<LocationModel> _lgas = [];
  List<LocationModel> _wards = [];
  int? _selectedStateId;
  int? _selectedLgaId;
  int? _selectedWardId;
  bool _isStatesLoading = false;
  bool _isLgasLoading = false;
  bool _isWardsLoading = false;
  bool _didSyncProfileLocation = false;

  @override
  void initState() {
    super.initState();
    // Initialize with empty values, will be populated when data loads
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _emailController = TextEditingController();
    _addressController = TextEditingController();
    _phoneController = TextEditingController();
    // Kick off states fetch early
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadStates();
    });
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _populateControllers(UserProfileModel userProfile) {
    _firstNameController.text = userProfile.firstName;
    _lastNameController.text = userProfile.lastName;
    _emailController.text = userProfile.email;
    _addressController.text = userProfile.address ?? '';
    _phoneController.text = userProfile.phoneNumber;
    // ignore: avoid_print
    print(
        'ℹ️ [ProfileScreen] Populated controllers. stateId=${userProfile.stateId}, lgaId=${userProfile.lgaId}, wardId=${userProfile.wardId}');
  }

  void _toggleEditMode() {
    setState(() {
      _isEditMode = !_isEditMode;
    });
  }


void _cancelEdit() {
  final profileState = ref.read(profileProvider);
  final userProfile = profileState.value;
  
  if (userProfile != null) {
    _populateControllers(userProfile);
    setState(() {
      _selectedStateId = userProfile.stateId;
      _selectedLgaId = userProfile.lgaId;
      _selectedWardId = userProfile.wardId;
    });
  }
  setState(() {
    _isEditMode = false;
  });
}

  Future<void> _saveProfile() async {
    // FIX: Use ref from method parameter
    final currentProfile = ref.read(profileProvider).value;
    if (currentProfile == null) return;

    print('💾 [ProfileScreen] Saving profile with IDs - stateId: $_selectedStateId, lgaId: $_selectedLgaId, wardId: $_selectedWardId');
    
    final updatedProfile = currentProfile.copyWith(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      address: _addressController.text.trim().isEmpty
          ? null
          : _addressController.text.trim(),
      stateId: _selectedStateId,
      lgaId: _selectedLgaId,
      wardId: _selectedWardId,
    );

    try {
      await ref
          .read(profileProvider.notifier)
          .updateUserProfile(updatedProfile);

      print('✅ [ProfileScreen] Profile saved successfully');
      
      setState(() {
        _isEditMode = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: AppColors.blueBackground,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _refreshProfile() {
    ref.read(profileProvider.notifier).fetchUserProfile();
  }

  Future<void> _loadStates() async {
    setState(() {
      _isStatesLoading = true;
    });
    try {
      final states = await ref.read(profileProvider.notifier).fetchStates();
      // ignore: avoid_print
      print('✅ [ProfileScreen] Loaded ${states.length} states');
      if (!mounted) return;
      setState(() {
        _states = states;
        _isStatesLoading = false;
      });
      _maybeSyncProfileLocation();
    } catch (e) {
      // ignore: avoid_print
      print('❌ [ProfileScreen] Failed to load states: $e');
      if (!mounted) return;
      setState(() {
        _isStatesLoading = false;
      });
    }
  }

  Future<void> _loadLgas(int stateId, {bool keepSelected = false}) async {
    final savedLgaId = _selectedLgaId; // Save current selection
    final savedWardId = _selectedWardId; // Save current ward selection
    setState(() {
      _isLgasLoading = true;
      if (!keepSelected) {
        _selectedLgaId = null;
        _selectedWardId = null;
        _wards = [];
      }
    });
    try {
      final lgas = await ref.read(profileProvider.notifier).fetchLgas(stateId);
      // ignore: avoid_print
      print('✅ [ProfileScreen] Loaded ${lgas.length} LGAs for state $stateId');
      if (!mounted) return;
      
      int? lgaToSelect = savedLgaId;
      if (keepSelected && savedLgaId != null) {
        final exists = lgas.any((item) => item.id == savedLgaId);
        if (!exists) {
          print('⚠️ [ProfileScreen] Saved lgaId=$savedLgaId not found in loaded LGAs, clearing selection');
          lgaToSelect = null;
        } else {
          print('✅ [ProfileScreen] Found saved lgaId=$savedLgaId in loaded LGAs');
        }
      }
      
      setState(() {
        _lgas = lgas;
        _isLgasLoading = false;
        if (keepSelected) {
          _selectedLgaId = lgaToSelect;
          if (lgaToSelect != null && savedWardId != null) {
            // Load wards for the saved LGA and preserve ward selection
            _loadWards(lgaToSelect, keepSelected: true);
          } else if (lgaToSelect != null) {
            // Load wards but don't preserve selection
            _loadWards(lgaToSelect, keepSelected: false);
          }
        }
      });
    } catch (e) {
      // ignore: avoid_print
      print('❌ [ProfileScreen] Failed to load LGAs: $e');
      if (!mounted) return;
      setState(() {
        _isLgasLoading = false;
      });
    }
  }

  Future<void> _loadWards(int lgaId, {bool keepSelected = false}) async {
    final savedWardId = _selectedWardId; // Save current selection before clearing
    setState(() {
      _isWardsLoading = true;
      if (!keepSelected) {
        _selectedWardId = null;
      }
    });
    try {
      final wards = await ref.read(profileProvider.notifier).fetchWards(lgaId);
      // ignore: avoid_print
      print('✅ [ProfileScreen] Loaded ${wards.length} wards for lga $lgaId');
      print('🔍 [ProfileScreen] Looking for wardId=$savedWardId in loaded wards');
      if (!mounted) return;
      
      int? wardToSelect = savedWardId;
      if (keepSelected && savedWardId != null) {
        final exists = wards.any((item) => item.id == savedWardId);
        if (!exists) {
          print('⚠️ [ProfileScreen] Saved wardId=$savedWardId not found in loaded wards, clearing selection');
          wardToSelect = null;
        } else {
          print('✅ [ProfileScreen] Found saved wardId=$savedWardId in loaded wards');
        }
      }
      
      setState(() {
        _wards = wards;
        _isWardsLoading = false;
        if (keepSelected) {
          _selectedWardId = wardToSelect;
        }
      });
    } catch (e) {
      // ignore: avoid_print
      print('❌ [ProfileScreen] Failed to load wards: $e');
      if (!mounted) return;
      setState(() {
        _isWardsLoading = false;
      });
    }
  }

  void _onStateChanged(int? value) {
    if (value == null) return;
    print('🔄 [ProfileScreen] State changed to: $value');
    setState(() {
      _selectedStateId = value;
      _selectedLgaId = null;
      _selectedWardId = null;
      _wards = [];
    });
    _loadLgas(value);
  }

  void _onLgaChanged(int? value) {
    if (value == null) return;
    print('🔄 [ProfileScreen] LGA changed to: $value');
    setState(() {
      _selectedLgaId = value;
      _selectedWardId = null;
    });
    _loadWards(value);
  }

  void _maybeSyncProfileLocation() {
    final profile = ref.read(profileProvider).value;
    if (profile == null || _didSyncProfileLocation) return;
    final profileStateId = profile.stateId;
    final profileLgaId = profile.lgaId;
    final profileWardId = profile.wardId;
    // ignore: avoid_print
    print(
        'ℹ️ [ProfileScreen] Syncing profile location stateId=$profileStateId lgaId=$profileLgaId wardId=$profileWardId');
    
    // Set all IDs first
    _selectedStateId = profileStateId;
    _selectedLgaId = profileLgaId;
    _selectedWardId = profileWardId;
    
    if (profileStateId != null) {
      // Load LGAs first, which will handle loading wards if LGA exists
      _loadLgas(profileStateId, keepSelected: true);
    } else if (profileLgaId != null) {
      // If we have LGA but no state, still try to load wards
      _loadWards(profileLgaId, keepSelected: true);
    }
    
    _didSyncProfileLocation = true;
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);

    // FIX: Move ref.read operations that were in lifecycle methods to here
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Populate controllers when profile data is available and not in edit mode
      if (!_isEditMode && profileState.value != null) {
        _populateControllers(profileState.value!);
      }
      _maybeSyncProfileLocation();
    });

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Header Section
            Container(
              height: 60,
              width: double.infinity,
              color: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.textLight,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Text(
                    'Profile',
                    style: TextStyle(
                      color: AppColors.textLight,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  if (!_isEditMode)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.blueBackground,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: GestureDetector(
                        onTap: _toggleEditMode,
                        child: const Text(
                          'Edit Profile',
                          style: TextStyle(
                            color: AppColors.textLight,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  if (_isEditMode) ...[
                    TextButton(
                      onPressed: _cancelEdit,
                      child: const Text(
                        'Cancel',
                        style: TextStyle(
                          color: AppColors.textLight,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: GestureDetector(
                        onTap: _saveProfile,
                        child: const Text(
                          'Save',
                          style: TextStyle(
                            color: AppColors.blueBackground,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Content
            Expanded(
              child: profileState.when(
                data: (userProfile) {
                  if (userProfile != null) {
                    return SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          // Profile Summary Card
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.whiteBackground,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                // Avatar
                                Container(
                                  width: 70,
                                  height: 70,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[300],
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.person,
                                    size: 40,
                                    color: Colors.grey[600],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                // Name and Email
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        userProfile.fullName,
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF333333),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        userProfile.email,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: Color(0xFF666666),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Form Fields Card
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.whiteBackground,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildTextField(
                                  label: 'First Name',
                                  controller: _firstNameController,
                                  enabled: _isEditMode,
                                ),
                                const SizedBox(height: 16),
                                _buildTextField(
                                  label: 'Last Name',
                                  controller: _lastNameController,
                                  enabled: _isEditMode,
                                ),
                                const SizedBox(height: 16),
                                _buildTextField(
                                  label: 'Mail',
                                  controller: _emailController,
                                  enabled:
                                      false, // Email should not be editable
                                  keyboardType: TextInputType.emailAddress,
                                ),
                                const SizedBox(height: 16),
                                _buildTextField(
                                  label: 'Address',
                                  controller: _addressController,
                                  enabled: _isEditMode,
                                ),
                                const SizedBox(height: 16),
                                _buildDropdownField(
                                  label: 'State',
                                  value: _selectedStateId,
                                  items: _states,
                                  isLoading: _isStatesLoading,
                                  enabled: _isEditMode,
                                  onChanged:
                                      _isEditMode ? _onStateChanged : null,
                                ),
                                const SizedBox(height: 16),
                                _buildDropdownField(
                                  label: 'LGA',
                                  value: _selectedLgaId,
                                  items: _lgas,
                                  isLoading: _isLgasLoading,
                                  enabled: _isEditMode &&
                                      _selectedStateId != null,
                                  onChanged: (_isEditMode &&
                                          _selectedStateId != null)
                                      ? _onLgaChanged
                                      : null,
                                ),
                                const SizedBox(height: 16),
                                _buildDropdownField(
                                  label: 'Ward',
                                  value: _selectedWardId,
                                  items: _wards,
                                  isLoading: _isWardsLoading,
                                  enabled: _isEditMode &&
                                      _selectedLgaId != null,
                                  onChanged: (_isEditMode &&
                                          _selectedLgaId != null)
                                      ? (value) {
                                          print('🔄 [ProfileScreen] Ward changed to: $value');
                                          setState(() {
                                            _selectedWardId = value;
                                          });
                                        }
                                      : null,
                                ),
                                const SizedBox(height: 16),
                                _buildTextField(
                                  label: 'Phone Number',
                                  controller: _phoneController,
                                  enabled: _isEditMode,
                                  keyboardType: TextInputType.phone,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  } else {
                    return const Center(
                      child: Text('No profile data available'),
                    );
                  }
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(),
                ),
                error: (error, stackTrace) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Failed to load profile: $error',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _refreshProfile,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required bool enabled,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF999999),
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          style: TextStyle(
            fontSize: 16,
            color: enabled ? const Color(0xFF333333) : const Color(0xFF999999),
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? AppColors.whiteBackground : Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.blueBackground,
                width: 2,
              ),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(
                color: Colors.grey[300]!,
                width: 1,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required int? value,
    required List<LocationModel> items,
    required bool isLoading,
    required bool enabled,
    ValueChanged<int?>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF999999),
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: enabled ? AppColors.whiteBackground : Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!, width: 1),
          ),
          child: isLoading
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: LinearProgressIndicator(),
                )
              : DropdownButton<int>(
                  // Guard: only pass value if it exists in items to avoid assertion
                  value: (value != null && items.any((i) => i.id == value))
                      ? value
                      : null,
                  onChanged: enabled ? onChanged : null,
                  isExpanded: true,
                  underline: const SizedBox.shrink(),
                  hint: Text(
                    'Select $label',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Color(0xFF999999)),
                  ),
                  items: items
                      .map(
                        (item) => DropdownMenuItem<int>(
                          value: item.id,
                          child: Text(
                            item.name,
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                      )
                      .toList(),
                ),
        ),
      ],
    );
  }
}