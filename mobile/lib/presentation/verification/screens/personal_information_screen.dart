// presentation/verification/personal_information_screen.dart

import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/models/location_model.dart';
import 'package:pm_e_commerce_app/data/providers/location_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/personal_info_repository.dart';

class PersonalInformationScreen extends ConsumerStatefulWidget {
  const PersonalInformationScreen({super.key});

  @override
  ConsumerState<PersonalInformationScreen> createState() =>
      _PersonalInformationScreenState();
}

class _PersonalInformationScreenState
    extends ConsumerState<PersonalInformationScreen> {
  // ============================================================
  // CONTROLLERS
  // ============================================================
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _homeAddressController = TextEditingController();
  final _cityController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();

  // ============================================================
  // STATE VARIABLES
  // ============================================================
  String? _selectedStateId;
  String? _selectedStateName;
  String? _selectedLgaId;
  String? _selectedLgaName;
  String? _selectedStateOfOrigin;
  String? _selectedGender;
  String? _selectedMaritalStatus;
  String? _selectedUtilityBillType;
  DateTime? _selectedDateOfBirth;
  File? _utilityBillPicture;
  String? _existingUtilityBillImageUrl;
  bool _isLoading = false;
  bool _isFetchingData = true;
  bool _hasExistingData = false;

  // ============================================================
  // REPOSITORY
  // ============================================================
  final PersonalInfoRepository _personalInfoRepo = PersonalInfoRepository();
  final ImagePicker _imagePicker = ImagePicker();

  // ============================================================
  // UTILITY BILL TYPE MAPPINGS
  // ============================================================
  final Map<String, String> _utilityBillTypesMap = {
    'Electricity Bill': 'NEPA',
    'Water Bill': 'WATER',
    'Waste Bill': 'LAWMA',
    'Gas Bill': 'GAS',
    'Internet Bill': 'INTERNET',
    'Cable TV Bill': 'CABLE_TV',
    'Rent Receipt': 'RENT_RECEIPT',
    'Bank Statement': 'BANK_STATEMENT',
  };

  List<String> get _utilityBillTypes => _utilityBillTypesMap.keys.toList();

  final Map<String, String> _utilityBillDisplayMap = {
    'NEPA': 'Electricity Bill',
    'WATER': 'Water Bill',
    'LAWMA': 'Waste Bill',
    'GAS': 'Gas Bill',
    'INTERNET': 'Internet Bill',
    'CABLE_TV': 'Cable TV Bill',
    'RENT_RECEIPT': 'Rent Receipt',
    'BANK_STATEMENT': 'Bank Statement',
  };

  // ============================================================
  // LIFECYCLE
  // ============================================================
  @override
  void initState() {
    super.initState();
    print('🟣 [PersonalInformation] Screen initialized');
    _loadExistingData();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _homeAddressController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  // ============================================================
  // LOAD EXISTING DATA
  // ============================================================
  // presentation/verification/personal_information_screen.dart

// Only update the _loadExistingData method:

  Future<void> _loadExistingData() async {
    try {
      print('🟣 [PersonalInformation] ===== LOADING EXISTING DATA =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🟣 [PersonalInformation] No user data found');
        setState(() {
          _isFetchingData = false;
        });
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [PersonalInformation] User ID: $userId');

      if (userId == null) {
        print('🟣 [PersonalInformation] No user ID found');
        setState(() {
          _isFetchingData = false;
        });
        return;
      }

      print(
          '🟣 [PersonalInformation] Fetching personal info using /verification/personal-information/me endpoint...');
      print(
          '🟣 [PersonalInformation] This is the CORRECT endpoint from Swagger');

      final data = await _personalInfoRepo.getMyPersonalInfo();
      print(
          '🟣 [PersonalInformation] Personal info result type: ${data.runtimeType}');
      print('🟣 [PersonalInformation] Personal info result: $data');

      if (data != null && data.isNotEmpty) {
        print('🟣 [PersonalInformation] ✅ Data found! Populating form...');
        print('📊 [PersonalInformation] Data keys: ${data.keys}');
        _populateForm(data);
        setState(() {
          _hasExistingData = true;
          _isFetchingData = false;
        });
        print('✅ [PersonalInformation] Existing data loaded successfully');
      } else {
        print(
            '🟣 [PersonalInformation] ❌ No existing data found (data is null or empty)');
        setState(() {
          _hasExistingData = false;
          _isFetchingData = false;
        });
      }
    } catch (e) {
      print('🔴 [PersonalInformation] Error loading existing data: $e');
      print('🔴 [PersonalInformation] Stack trace: ${StackTrace.current}');
      setState(() {
        _isFetchingData = false;
      });
    }
  }

  void _populateForm(Map<String, dynamic> data) {
    print('🟣 [PersonalInformation] Populating form with data...');
    print('📊 [PersonalInformation] Data keys: ${data.keys}');

    final stateData = data['state'] as Map<String, dynamic>?;
    final lgaData = data['lga'] as Map<String, dynamic>?;

    setState(() {
      _firstNameController.text = data['firstName'] ?? '';
      _lastNameController.text = data['lastName'] ?? '';
      _homeAddressController.text = data['homeAddress'] ?? '';
      _cityController.text = data['city'] ?? '';
      _phoneController.text = data['phoneNumber'] ?? '';
      _emailController.text = data['email'] ?? '';

      if (stateData != null) {
        _selectedStateId = stateData['id']?.toString();
        _selectedStateName = stateData['name'];
      }

      if (lgaData != null) {
        _selectedLgaId = lgaData['id']?.toString();
        _selectedLgaName = lgaData['name'];
      }

      _selectedStateOfOrigin = data['stateOfOrigin'];

      // ✅ Capitalize gender for dropdown matching
      final gender = data['gender']?.toString().toLowerCase() ?? '';
      if (gender == 'male') {
        _selectedGender = 'Male';
      } else if (gender == 'female') {
        _selectedGender = 'Female';
      } else if (gender == 'other') {
        _selectedGender = 'Other';
      } else {
        _selectedGender = gender;
      }

      // ✅ Capitalize marital status for dropdown matching
      final maritalStatus =
          data['maritalStatus']?.toString().toLowerCase() ?? '';
      if (maritalStatus == 'single') {
        _selectedMaritalStatus = 'Single';
      } else if (maritalStatus == 'married') {
        _selectedMaritalStatus = 'Married';
      } else if (maritalStatus == 'divorced') {
        _selectedMaritalStatus = 'Divorced';
      } else if (maritalStatus == 'widowed') {
        _selectedMaritalStatus = 'Widowed';
      } else {
        _selectedMaritalStatus = maritalStatus;
      }

      final utilityBillEnum = data['utilityBillType'];
      if (utilityBillEnum != null) {
        _selectedUtilityBillType =
            _utilityBillDisplayMap[utilityBillEnum] ?? utilityBillEnum;
      }

      if (data['dateOfBirth'] != null) {
        final dobStr = data['dateOfBirth'].toString();
        final parts = dobStr.split('-');
        if (parts.length == 3) {
          _selectedDateOfBirth = DateTime(
            int.parse(parts[2]),
            int.parse(parts[1]),
            int.parse(parts[0]),
          );
        }
      }

      _existingUtilityBillImageUrl = data['utilityBillImageUrl'];
    });
  }

  // ============================================================
  // MAPPING HELPERS
  // ============================================================
  String _mapGenderToEnum(String gender) {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'MALE';
      case 'female':
        return 'FEMALE';
      case 'other':
        return 'OTHER';
      default:
        return gender.toUpperCase();
    }
  }

  String _mapMaritalStatusToEnum(String maritalStatus) {
    switch (maritalStatus.toLowerCase()) {
      case 'single':
        return 'SINGLE';
      case 'married':
        return 'MARRIED';
      case 'divorced':
        return 'DIVORCED';
      case 'widowed':
        return 'WIDOWED';
      default:
        return maritalStatus.toUpperCase();
    }
  }

  // ============================================================
  // UI HELPERS
  // ============================================================
  Future<void> _selectDateOfBirth(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDateOfBirth ??
          DateTime.now().subtract(const Duration(days: 365 * 25)),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.blueBackground,
              onPrimary: AppColors.textLight,
              onSurface: Colors.black87,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedDateOfBirth = picked;
      });
      print('🟣 [PersonalInformation] Date of birth selected: $picked');
    }
  }

  Future<void> _pickUtilityBillImage() async {
    try {
      print('🟣 [PersonalInformation] Picking utility bill image...');
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _utilityBillPicture = File(image.path);
          _existingUtilityBillImageUrl = null;
        });
        print('🟣 [PersonalInformation] Image picked: ${image.path}');
      } else {
        print('🟣 [PersonalInformation] No image selected');
      }
    } catch (e) {
      print('🔴 [PersonalInformation] Error picking image: $e');
      if (mounted) {
        _showError('Error picking image: ${e.toString()}');
      }
    }
  }

  void _showError(String message) {
    print('🔴 [PersonalInformation] Showing error: $message');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showSuccess(String message) {
    print('✅ [PersonalInformation] Showing success: $message');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  // ============================================================
  // SUBMIT
  // ============================================================
  Future<void> _submitPersonalInformation() async {
    print('🟣 [PersonalInformation] ===== SUBMIT STARTED =====');

    // ✅ Validate required fields
    if (_firstNameController.text.trim().isEmpty) {
      _showError('Please enter your first name');
      return;
    }

    if (_lastNameController.text.trim().isEmpty) {
      _showError('Please enter your last name');
      return;
    }

    if (_selectedDateOfBirth == null) {
      _showError('Please select your date of birth');
      return;
    }

    if (_selectedStateOfOrigin == null) {
      _showError('Please select your state of origin');
      return;
    }

    if (_selectedGender == null) {
      _showError('Please select your gender');
      return;
    }

    if (_selectedMaritalStatus == null) {
      _showError('Please select your marital status');
      return;
    }

    if (_selectedUtilityBillType == null) {
      _showError('Please select utility bill type');
      return;
    }

    if (_utilityBillPicture == null && _existingUtilityBillImageUrl == null) {
      _showError('Please upload a utility bill picture');
      return;
    }

    if (_selectedStateId == null) {
      _showError('Please select your state');
      return;
    }

    if (_selectedLgaId == null) {
      _showError('Please select your LGA');
      return;
    }

    // ✅ Get userId
    int userId = 0;
    try {
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        userId = userJson['id'] ?? 0;
        print('🟣 [PersonalInformation] User ID from storage: $userId');
      } else {
        _showError('User not found. Please login again.');
        return;
      }
    } catch (e) {
      _showError('Error getting user data. Please login again.');
      return;
    }

    if (userId == 0) {
      _showError('User not found. Please login again.');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final dateOfBirthStr =
          '${_selectedDateOfBirth!.day.toString().padLeft(2, '0')}-${_selectedDateOfBirth!.month.toString().padLeft(2, '0')}-${_selectedDateOfBirth!.year}';

      final genderEnum = _mapGenderToEnum(_selectedGender!);
      final maritalStatusEnum =
          _mapMaritalStatusToEnum(_selectedMaritalStatus!);
      final utilityBillTypeEnum =
          _utilityBillTypesMap[_selectedUtilityBillType!] ??
              _selectedUtilityBillType!;

      // ✅ Use the PersonalInfoRepository
      final result = await _personalInfoRepo.savePersonalInformation(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim(),
        homeAddress: _homeAddressController.text.trim(),
        city: _cityController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        stateId: int.tryParse(_selectedStateId!) ?? 0,
        lgaId: int.tryParse(_selectedLgaId!) ?? 0,
        stateOfOrigin: _selectedStateOfOrigin!,
        dateOfBirth: dateOfBirthStr,
        gender: genderEnum,
        maritalStatus: maritalStatusEnum,
        utilityBillType: utilityBillTypeEnum,
        utilityBillPicture: _utilityBillPicture,
      );

      print('✅ [PersonalInformation] Submit result: $result');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        _showSuccess(
            result['message'] ?? 'Personal information saved successfully');

        // ✅ Refresh data
        await _loadExistingData();

        // ✅ Navigate back after delay
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          context.pop(true);
        }
      }
    } catch (e) {
      print('🔴 [PersonalInformation] Error submitting: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        _showError(e.toString());
      }
    }
  }

  // ============================================================
  // BUILD
  // ============================================================
  @override
  Widget build(BuildContext context) {
    final statesAsync = ref.watch(statesProvider);

    final lgasAsync = _selectedStateId != null
        ? ref.watch(lgasByStateProvider(_selectedStateId!))
        : const AsyncValue<List<LocationModel>>.loading();

    final wardsAsync = _selectedLgaId != null
        ? ref.watch(wardsByLgaProvider(_selectedLgaId!))
        : const AsyncValue<List<LocationModel>>.loading();

    if (_isFetchingData) {
      return Scaffold(
        backgroundColor: AppColors.whiteBackground,
        body: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        color: AppColors.blueBackground,
                      ),
                      SizedBox(height: 16),
                      Text('Loading your information...'),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_hasExistingData)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.check_circle,
                              color: Colors.green.shade700,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'You have existing information. Edit and update below.',
                                style: TextStyle(
                                  color: Colors.green.shade700,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              _buildTextField(
                                label: 'First Name',
                                controller: _firstNameController,
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Last Name',
                                controller: _lastNameController,
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Home Address',
                                controller: _homeAddressController,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Colors.grey[300]!,
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            Icons.camera_alt_outlined,
                            size: 32,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),
                    _buildTextField(
                      label: 'City',
                      controller: _cityController,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      label: 'Phone Number',
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      label: 'Email Address',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),

                    _buildLocationDropdown(
                      label: 'State',
                      asyncValue: statesAsync,
                      selectedId: _selectedStateId,
                      selectedName: _selectedStateName,
                      onChanged: (id, name) {
                        setState(() {
                          _selectedStateId = id;
                          _selectedStateName = name;
                          _selectedLgaId = null;
                          _selectedLgaName = null;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    if (_selectedStateId != null)
                      _buildLocationDropdown(
                        label: 'LGA',
                        asyncValue: lgasAsync,
                        selectedId: _selectedLgaId,
                        selectedName: _selectedLgaName,
                        onChanged: (id, name) {
                          setState(() {
                            _selectedLgaId = id;
                            _selectedLgaName = name;
                          });
                        },
                      ),

                    const SizedBox(height: 16),

                    _buildDropdownField(
                      label: 'State of Origin',
                      value: _selectedStateOfOrigin,
                      items: [
                        'Lagos',
                        'Abuja',
                        'Kano',
                        'Rivers',
                        'Ogun',
                        'Oyo',
                        'Kaduna',
                        'Enugu',
                        'Delta',
                        'Port Harcourt',
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedStateOfOrigin = value;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    _buildDropdownField(
                      label: 'Gender',
                      value: _selectedGender,
                      items: ['Male', 'Female', 'Other'],
                      onChanged: (value) {
                        setState(() {
                          _selectedGender = value;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    _buildDropdownField(
                      label: 'Marital Status',
                      value: _selectedMaritalStatus,
                      items: ['Single', 'Married', 'Divorced', 'Widowed'],
                      onChanged: (value) {
                        setState(() {
                          _selectedMaritalStatus = value;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Date of Birth Field
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Date of Birth',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: () => _selectDateOfBirth(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.grey[300]!,
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _selectedDateOfBirth != null
                                        ? '${_selectedDateOfBirth!.day}/${_selectedDateOfBirth!.month}/${_selectedDateOfBirth!.year}'
                                        : 'Select date of birth',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: _selectedDateOfBirth != null
                                          ? Colors.black87
                                          : Colors.grey[400],
                                    ),
                                  ),
                                ),
                                Icon(
                                  Icons.calendar_today_outlined,
                                  size: 20,
                                  color: Colors.grey[600],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    _buildDropdownField(
                      label: 'Utility Bill Type',
                      value: _selectedUtilityBillType,
                      items: _utilityBillTypes,
                      onChanged: (value) {
                        setState(() {
                          _selectedUtilityBillType = value;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Upload Utility Bills
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Upload Utility Bill Picture',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: _pickUtilityBillImage,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 14,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.grey[300]!,
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        _utilityBillPicture != null ||
                                                _existingUtilityBillImageUrl !=
                                                    null
                                            ? Icons.check_circle
                                            : Icons.image_outlined,
                                        color: _utilityBillPicture != null ||
                                                _existingUtilityBillImageUrl !=
                                                    null
                                            ? Colors.green
                                            : Colors.grey[600],
                                        size: 24,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _utilityBillPicture != null
                                              ? _utilityBillPicture!.path
                                                  .split('/')
                                                  .last
                                              : _existingUtilityBillImageUrl !=
                                                      null
                                                  ? 'Existing file uploaded'
                                                  : 'Select utility bill picture',
                                          style: TextStyle(
                                            fontSize: 16,
                                            color: _utilityBillPicture !=
                                                        null ||
                                                    _existingUtilityBillImageUrl !=
                                                        null
                                                ? Colors.black87
                                                : Colors.grey[400],
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton.icon(
                              onPressed: _pickUtilityBillImage,
                              icon: const Icon(
                                Icons.cloud_upload_outlined,
                                size: 18,
                              ),
                              label: Text(
                                _existingUtilityBillImageUrl != null
                                    ? 'Change'
                                    : 'Upload',
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.blueBackground,
                                foregroundColor: AppColors.textLight,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (_utilityBillPicture != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            height: 100,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.grey[300]!,
                                width: 1,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(
                                _utilityBillPicture!,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ] else if (_existingUtilityBillImageUrl != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            height: 100,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.grey[300]!,
                                width: 1,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                _existingUtilityBillImageUrl!,
                                fit: BoxFit.cover,
                                loadingBuilder: (context, child, progress) {
                                  if (progress == null) return child;
                                  return Container(
                                    height: 100,
                                    color: Colors.grey[200],
                                    child: const Center(
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  );
                                },
                                errorBuilder: (_, __, ___) => Container(
                                  height: 100,
                                  color: Colors.grey[200],
                                  child: const Icon(
                                    Icons.image_not_supported,
                                    size: 40,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // Submit Button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.whiteBackground,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 4,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitPersonalInformation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    foregroundColor: AppColors.textLight,
                    disabledBackgroundColor: Colors.grey[400],
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.textLight,
                            ),
                          ),
                        )
                      : Text(
                          _hasExistingData ? 'UPDATE' : 'SUBMIT',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // WIDGET BUILDERS
  // ============================================================
  Widget _buildHeader() {
    return Container(
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
            onPressed: () => context.pop(false),
          ),
          const Expanded(
            child: Center(
              child: Text(
                'PERSONAL INFORMATION',
                style: TextStyle(
                  color: AppColors.textLight,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: () => context.pop(false),
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.blueBackground,
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.textLight.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: const Icon(
                Icons.close,
                color: AppColors.textLight,
                size: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(
            fontSize: 16,
            color: Colors.black87,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
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
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w400,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
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
          ),
          hint: Text(
            'Select $label',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[400],
            ),
          ),
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.black87,
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildLocationDropdown({
    required String label,
    required AsyncValue<List<LocationModel>> asyncValue,
    required String? selectedId,
    required String? selectedName,
    required Function(String id, String name) onChanged,
  }) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(
        label,
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey[600],
          fontWeight: FontWeight.w400,
        ),
      ),
      const SizedBox(height: 8),
      asyncValue.when(
        data: (items) {
          if (items.isEmpty) {
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber,
                    color: Colors.orange.shade700,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'No $label available',
                      style: TextStyle(
                        color: Colors.orange.shade700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          final bool hasValue =
              items.any((item) => item.id.toString() == selectedId);

          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: hasValue ? selectedId : null,
                isExpanded: true,
                hint: Text(
                  'Select $label',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[400],
                  ),
                ),
                items: [
                  DropdownMenuItem<String>(
                    value: null,
                    child: Text('Select $label'),
                  ),
                  ...items.map((item) {
                    return DropdownMenuItem<String>(
                      value: item.id.toString(),
                      child: Text(
                        item.name,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.black87,
                        ),
                      ),
                    );
                  }),
                ],
                onChanged: (value) {
                  if (value != null) {
                    final selectedItem = items.firstWhere(
                      (item) => item.id.toString() == value,
                      orElse: () => items.first,
                    );
                    onChanged(value, selectedItem.name);
                  }
                },
              ),
            ),
          );
        },
        loading: () => Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: const Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: 12),
              Text('Loading...'),
            ],
          ),
        ),
        error: (error, _) => Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.red.shade200),
          ),
          child: Row(
            children: [
              Icon(
                Icons.error_outline,
                color: Colors.red.shade700,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Error loading $label',
                  style: TextStyle(
                    color: Colors.red.shade700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ]);
  }
}
