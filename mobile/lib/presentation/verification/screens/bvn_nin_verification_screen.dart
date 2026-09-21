// presentation/verification/bvn_nin_verification_screen.dart

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/personal_info_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';

class BvnNinVerificationScreen extends ConsumerStatefulWidget {
  const BvnNinVerificationScreen({super.key});

  @override
  ConsumerState<BvnNinVerificationScreen> createState() =>
      _BvnNinVerificationScreenState();
}

class _BvnNinVerificationScreenState
    extends ConsumerState<BvnNinVerificationScreen> {
  final _bvnController = TextEditingController();
  final _ninController = TextEditingController();

  bool _isBvnVerified = false;
  bool _isNinVerified = false;
  bool _isLoading = false;
  bool _isLoadingData = true;
  String? _bvnVerificationError;
  String? _ninVerificationError;

  // ✅ Auto-filled from personal info
  String? _phoneNumber;
  String? _dateOfBirth;
  String? _firstName;
  String? _lastName;
  bool _hasProfileData = false;

  final VerificationRepository _verificationRepository =
      VerificationRepository();
  final PersonalInfoRepository _personalInfoRepo = PersonalInfoRepository();

  Map<String, dynamic> _bvnData = {};
  Map<String, dynamic> _ninData = {};

  @override
  void initState() {
    super.initState();
    print('🟣 [BVN/NIN Screen] ===== SCREEN INITIALIZED =====');
    _loadData();
  }

  @override
  void dispose() {
    print('🟣 [BVN/NIN Screen] Disposing...');
    _bvnController.dispose();
    _ninController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    print('🟣 [BVN/NIN Screen] ===== LOADING DATA =====');
    await _loadVerificationStatus();
    await _loadPersonalInfoFromApi();
  }

  // ============================================================
  // ✅ FETCH PERSONAL INFO FROM THE CORRECT API
  // ============================================================
  Future<void> _loadPersonalInfoFromApi() async {
    print('🟣 [BVN/NIN Screen] ===== FETCHING PERSONAL INFO FROM API =====');
    try {
      // ✅ Use the PersonalInfoRepository to get actual personal info
      final personalInfo = await _personalInfoRepo.getMyPersonalInfo();
      print('📊 [BVN/NIN Screen] Personal info from API: $personalInfo');

      if (personalInfo != null && personalInfo.isNotEmpty) {
        // ✅ Extract fields from personal info response
        final firstName = personalInfo['firstName']?.toString() ?? '';
        final lastName = personalInfo['lastName']?.toString() ?? '';
        final phone = personalInfo['phoneNumber']?.toString() ?? '';

        // ✅ Date of birth - handle different formats
        String dob = '';
        if (personalInfo['dateOfBirth'] != null) {
          dob = personalInfo['dateOfBirth'].toString();
          print('📊 [BVN/NIN Screen] Raw DOB from API: "$dob"');
        }

        // ✅ If phone number is empty, try alternative field names
        final finalPhone = phone.isNotEmpty
            ? phone
            : (personalInfo['phone']?.toString() ??
                personalInfo['phone_number']?.toString() ??
                '');

        print('✅ [BVN/NIN Screen] Personal info loaded successfully:');
        print('   FirstName: "$firstName"');
        print('   LastName: "$lastName"');
        print('   PhoneNumber: "$finalPhone"');
        print('   DateOfBirth: "$dob"');

        setState(() {
          _firstName = firstName;
          _lastName = lastName;
          _phoneNumber = finalPhone;
          _dateOfBirth = dob;
          _hasProfileData = true;
        });
      } else {
        print('⚠️ [BVN/NIN Screen] No personal info found in API');
        // ✅ Fallback to user data from storage
        await _loadFromStorage();
      }
    } catch (e) {
      print('🔴 [BVN/NIN Screen] Error fetching personal info: $e');
      // ✅ Fallback to user data from storage
      await _loadFromStorage();
    }
  }

  Future<void> _loadFromStorage() async {
    try {
      print('🟣 [BVN/NIN Screen] ===== LOADING FROM STORAGE (FALLBACK) =====');
      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [BVN/NIN Screen] No user data in storage');
        return;
      }

      final userJson = jsonDecode(userData);
      print('📊 [BVN/NIN Screen] User data keys: ${userJson.keys}');

      final firstName = userJson['firstName'] ??
          userJson['firstname'] ??
          userJson['name']?.split(' ').first ??
          '';
      final lastName = userJson['lastName'] ??
          userJson['lastname'] ??
          userJson['name']?.split(' ').last ??
          '';
      final phone = userJson['phoneNumber'] ??
          userJson['phone'] ??
          userJson['phone_number'] ??
          '';
      final dob = userJson['dateOfBirth'] ??
          userJson['dob'] ??
          userJson['date_of_birth'] ??
          '';

      print('📊 [BVN/NIN Screen] Extracted from storage:');
      print('   FirstName: "$firstName"');
      print('   LastName: "$lastName"');
      print('   PhoneNumber: "$phone"');
      print('   DateOfBirth: "$dob"');

      setState(() {
        _firstName = firstName;
        _lastName = lastName;
        _phoneNumber = phone;
        _dateOfBirth = dob;
        _hasProfileData = true;
      });
    } catch (e) {
      print('🔴 [BVN/NIN Screen] Error loading from storage: $e');
    }
  }

  Future<void> _loadVerificationStatus() async {
    setState(() {
      _isLoadingData = true;
      _bvnVerificationError = null;
      _ninVerificationError = null;
    });
    print('🟣 [BVN/NIN Screen] ===== LOADING VERIFICATION STATUS =====');

    try {
      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [BVN/NIN Screen] No user data found in storage');
        setState(() => _isLoadingData = false);
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [BVN/NIN Screen] User ID from storage: $userId');

      if (userId == null) {
        print('🔴 [BVN/NIN Screen] No userId found in user data');
        setState(() => _isLoadingData = false);
        return;
      }

      print(
          '🟣 [BVN/NIN Screen] Fetching verification status for user: $userId');
      final verificationStatus =
          await _verificationRepository.checkIsVerified(userId: userId);
      print('🟣 [BVN/NIN Screen] Verification status response received');

      final data = verificationStatus['data'] as Map<String, dynamic>?;
      final verifiedTypes = (data?['verifiedTypes'] as List?)
              ?.map((e) => e.toString().toUpperCase())
              .toList() ??
          [];

      print('📊 [BVN/NIN Screen] Verified types: $verifiedTypes');

      final isBvn = verifiedTypes.any((type) => type.contains('BVN'));
      final isNin = verifiedTypes.any((type) => type.contains('NIN'));

      print('📊 [BVN/NIN Screen] BVN verified: $isBvn');
      print('📊 [BVN/NIN Screen] NIN verified: $isNin');

      setState(() {
        _isBvnVerified = isBvn;
        _isNinVerified = isNin;
        _isLoadingData = false;
      });

      print('✅ [BVN/NIN Screen] Verification status loaded');
    } catch (e) {
      print('🔴 [BVN/NIN Screen] Error loading verification status: $e');
      setState(() => _isLoadingData = false);
    }
  }

  // ✅ Format date of birth from DD-MM-YYYY to YYYY-MM-DD for API
  String? _formatDobForApi(String? dob) {
    if (dob == null || dob.isEmpty) return null;

    print('🟣 [BVN/NIN Screen] Formatting DOB: "$dob"');

    // Check if it's already in YYYY-MM-DD format
    if (RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(dob)) {
      print('🟣 [BVN/NIN Screen] DOB already in YYYY-MM-DD format');
      return dob;
    }

    // Convert from DD-MM-YYYY to YYYY-MM-DD
    final parts = dob.split('-');
    if (parts.length == 3) {
      final formatted = '${parts[2]}-${parts[1]}-${parts[0]}';
      print('🟣 [BVN/NIN Screen] DOB formatted: "$formatted"');
      return formatted;
    }

    // Try DD/MM/YYYY format
    final parts2 = dob.split('/');
    if (parts2.length == 3) {
      final formatted = '${parts2[2]}-${parts2[1]}-${parts2[0]}';
      print('🟣 [BVN/NIN Screen] DOB formatted from /: "$formatted"');
      return formatted;
    }

    print('🔴 [BVN/NIN Screen] Could not format DOB: "$dob"');
    return null;
  }

  Future<void> _verifyBvn() async {
    final bvn = _bvnController.text.trim();

    final String maskedBvn = bvn.length >= 6
        ? '${bvn.substring(0, 3)}***${bvn.substring(bvn.length - 3)}'
        : '***';

    print('🟣 [BVN/NIN Screen] ===== BVN VERIFICATION STARTED =====');
    print('🟣 [BVN/NIN Screen] BVN length: ${bvn.length}');
    print('🟣 [BVN/NIN Screen] Phone from profile: "$_phoneNumber"');
    print('🟣 [BVN/NIN Screen] DOB from profile: "$_dateOfBirth"');

    if (bvn.isEmpty) {
      print('🔴 [BVN/NIN Screen] BVN is empty');
      _showError('Please enter your BVN');
      return;
    }

    if (bvn.length != 11) {
      print(
          '🔴 [BVN/NIN Screen] Invalid BVN length: ${bvn.length} (expected 11)');
      _showError('BVN must be 11 digits');
      return;
    }

    // ✅ Check if we have phone number
    if (_phoneNumber == null || _phoneNumber!.isEmpty) {
      print('🔴 [BVN/NIN Screen] Phone number not found in profile');
      _showError(
          'Phone number not found. Please complete your personal information first.');
      return;
    }

    // ✅ Check if we have date of birth
    if (_dateOfBirth == null || _dateOfBirth!.isEmpty) {
      print('🔴 [BVN/NIN Screen] Date of birth not found in profile');
      _showError(
          'Date of birth not found. Please complete your personal information first.');
      return;
    }

    // ✅ Format DOB for API
    final formattedDob = _formatDobForApi(_dateOfBirth);
    if (formattedDob == null) {
      print('🔴 [BVN/NIN Screen] Invalid date of birth format: $_dateOfBirth');
      _showError(
          'Invalid date of birth format. Please update your personal information.');
      return;
    }

    setState(() {
      _isLoading = true;
      _bvnVerificationError = null;
    });

    print('🟣 [BVN/NIN Screen] BVN: $maskedBvn');
    print('🟣 [BVN/NIN Screen] Phone: $_phoneNumber');
    print('🟣 [BVN/NIN Screen] DOB (formatted): $formattedDob');

    try {
      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [BVN/NIN Screen] No user data found');
        _showError('User not found. Please login again.');
        setState(() => _isLoading = false);
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [BVN/NIN Screen] User ID: $userId');

      if (userId == null) {
        print('🔴 [BVN/NIN Screen] No userId found');
        _showError('User not found. Please login again.');
        setState(() => _isLoading = false);
        return;
      }

      // ✅ Use first name and last name from profile
      final firstName = _firstName ?? '';
      final lastName = _lastName ?? '';

      print('📊 [BVN/NIN Screen] FirstName: "$firstName"');
      print('📊 [BVN/NIN Screen] LastName: "$lastName"');
      print('📊 [BVN/NIN Screen] PhoneNumber: "$_phoneNumber"');
      print('📊 [BVN/NIN Screen] DateOfBirth: "$formattedDob"');

      print('🟣 [BVN/NIN Screen] Calling verifyBvn API with:');
      print('   userId: $userId');
      print('   bvn: $maskedBvn');
      print('   firstName: ${firstName.isNotEmpty ? firstName : "null"}');
      print('   lastName: ${lastName.isNotEmpty ? lastName : "null"}');
      print('   phoneNumber: $_phoneNumber');
      print('   dateOfBirth: $formattedDob');

      final result = await _verificationRepository.verifyBvn(
        userId: userId,
        bvn: bvn,
        firstName: firstName.isNotEmpty ? firstName : null,
        lastName: lastName.isNotEmpty ? lastName : null,
        phoneNumber: _phoneNumber!,
        dateOfBirth: formattedDob,
      );

      print('📊 [BVN/NIN Screen] BVN verification response: $result');

      if (result['success'] == true) {
        print('✅ [BVN/NIN Screen] BVN verification successful!');

        final bvnDetails = await _verificationRepository.getBvnDetails(bvn);
        print('📊 [BVN/NIN Screen] BVN details: $bvnDetails');

        setState(() {
          _isBvnVerified = true;
          _isLoading = false;
          _bvnData = bvnDetails['data'] ?? {};
        });

        // Save BVN to user data
        userJson['bvn'] = bvn;
        await StorageService.saveUserData(jsonEncode(userJson));
        print('✅ [BVN/NIN Screen] BVN saved to storage');

        await _loadVerificationStatus();
        _showSuccess('BVN verified successfully!');
        print('✅ [BVN/NIN Screen] BVN verification completed');
      } else {
        print('🔴 [BVN/NIN Screen] BVN verification failed');
        final errorMsg = result['message'] ?? 'Verification failed';
        setState(() {
          _isLoading = false;
          _bvnVerificationError = errorMsg;
        });
        _showError(errorMsg);
      }
    } catch (e) {
      print('🔴 [BVN/NIN Screen] BVN verification exception: $e');
      setState(() {
        _isLoading = false;
        _bvnVerificationError = e.toString();
      });
      _showError(e.toString());
    }
  }

  Future<void> _verifyNin() async {
    final nin = _ninController.text.trim();

    final String maskedNin = nin.length >= 6
        ? '${nin.substring(0, 3)}***${nin.substring(nin.length - 3)}'
        : '***';

    print('🟣 [BVN/NIN Screen] ===== NIN VERIFICATION STARTED =====');
    print('🟣 [BVN/NIN Screen] NIN length: ${nin.length}');
    print('🟣 [BVN/NIN Screen] DOB from profile: "$_dateOfBirth"');

    if (nin.isEmpty) {
      print('🔴 [BVN/NIN Screen] NIN is empty');
      _showError('Please enter your NIN');
      return;
    }

    if (nin.length != 11) {
      print(
          '🔴 [BVN/NIN Screen] Invalid NIN length: ${nin.length} (expected 11)');
      _showError('NIN must be 11 digits');
      return;
    }

    // ✅ Check if we have date of birth for NIN (required)
    if (_dateOfBirth == null || _dateOfBirth!.isEmpty) {
      print('🔴 [BVN/NIN Screen] Date of birth not found in profile');
      _showError(
          'Date of birth not found. Please complete your personal information first.');
      return;
    }

    // ✅ Format DOB for API
    final formattedDob = _formatDobForApi(_dateOfBirth);
    if (formattedDob == null) {
      print('🔴 [BVN/NIN Screen] Invalid date of birth format: $_dateOfBirth');
      _showError(
          'Invalid date of birth format. Please update your personal information.');
      return;
    }

    setState(() {
      _isLoading = true;
      _ninVerificationError = null;
    });

    print('🟣 [BVN/NIN Screen] NIN: $maskedNin');
    print('🟣 [BVN/NIN Screen] DOB (formatted): $formattedDob');

    try {
      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [BVN/NIN Screen] No user data found');
        _showError('User not found. Please login again.');
        setState(() => _isLoading = false);
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [BVN/NIN Screen] User ID: $userId');

      if (userId == null) {
        print('🔴 [BVN/NIN Screen] No userId found');
        _showError('User not found. Please login again.');
        setState(() => _isLoading = false);
        return;
      }

      final firstName = _firstName ?? '';
      final lastName = _lastName ?? '';

      print('📊 [BVN/NIN Screen] FirstName: "$firstName"');
      print('📊 [BVN/NIN Screen] LastName: "$lastName"');
      print('📊 [BVN/NIN Screen] DateOfBirth: "$formattedDob"');

      print('🟣 [BVN/NIN Screen] Calling verifyNin API with:');
      print('   userId: $userId');
      print('   nin: $maskedNin');
      print('   firstName: ${firstName.isNotEmpty ? firstName : "null"}');
      print('   lastName: ${lastName.isNotEmpty ? lastName : "null"}');
      print('   dateOfBirth: $formattedDob');

      final result = await _verificationRepository.verifyNin(
        userId: userId,
        nin: nin,
        firstName: firstName.isNotEmpty ? firstName : null,
        lastName: lastName.isNotEmpty ? lastName : null,
        dateOfBirth: formattedDob,
      );

      print('📊 [BVN/NIN Screen] NIN verification response: $result');

      if (result['success'] == true) {
        print('✅ [BVN/NIN Screen] NIN verification successful!');

        final ninDetails = await _verificationRepository.getNinDetails(nin);
        print('📊 [BVN/NIN Screen] NIN details: $ninDetails');

        setState(() {
          _isNinVerified = true;
          _isLoading = false;
          _ninData = ninDetails['data'] ?? {};
        });

        userJson['nin'] = nin;
        await StorageService.saveUserData(jsonEncode(userJson));
        print('✅ [BVN/NIN Screen] NIN saved to storage');

        await _loadVerificationStatus();
        _showSuccess('NIN verified successfully!');
        print('✅ [BVN/NIN Screen] NIN verification completed');
      } else {
        print('🔴 [BVN/NIN Screen] NIN verification failed');
        final errorMsg = result['message'] ?? 'Verification failed';
        setState(() {
          _isLoading = false;
          _ninVerificationError = errorMsg;
        });
        _showError(errorMsg);
      }
    } catch (e) {
      print('🔴 [BVN/NIN Screen] NIN verification exception: $e');
      setState(() {
        _isLoading = false;
        _ninVerificationError = e.toString();
      });
      _showError(e.toString());
    }
  }

  void _showError(String message) {
    print('🔴 [BVN/NIN Screen] Showing error: $message');
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
    print('✅ [BVN/NIN Screen] Showing success: $message');
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

  @override
  Widget build(BuildContext context) {
    print('🟣 [BVN/NIN Screen] Building...');
    print('📊 [BVN/NIN Screen] Phone from profile: "$_phoneNumber"');
    print('📊 [BVN/NIN Screen] DOB from profile: "$_dateOfBirth"');
    print('📊 [BVN/NIN Screen] Has profile data: $_hasProfileData');

    final bool hasPhone = _phoneNumber != null && _phoneNumber!.isNotEmpty;
    final bool hasDob = _dateOfBirth != null && _dateOfBirth!.isNotEmpty;
    final bool canVerifyBvn = hasPhone && hasDob;

    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
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
                    icon: const Icon(Icons.arrow_back,
                        color: AppColors.textLight),
                    onPressed: () => context.pop(),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'BVN & NIN VERIFICATION',
                        style: TextStyle(
                          color: AppColors.textLight,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: AppColors.textLight),
                    onPressed: _loadData,
                  ),
                ],
              ),
            ),

            // Content Section
            Expanded(
              child: _isLoadingData
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(
                              color: AppColors.blueBackground),
                          SizedBox(height: 16),
                          Text('Loading verification status...'),
                        ],
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Status Header
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: _isBvnVerified && _isNinVerified
                                  ? Colors.green.shade50
                                  : Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _isBvnVerified && _isNinVerified
                                    ? Colors.green.shade200
                                    : Colors.orange.shade200,
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  _isBvnVerified && _isNinVerified
                                      ? Icons.verified
                                      : Icons.info_outline,
                                  color: _isBvnVerified && _isNinVerified
                                      ? Colors.green
                                      : Colors.orange,
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _isBvnVerified && _isNinVerified
                                            ? '✅ Fully Verified'
                                            : '⚠️ Verification Required',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color:
                                              _isBvnVerified && _isNinVerified
                                                  ? Colors.green.shade800
                                                  : Colors.orange.shade800,
                                        ),
                                      ),
                                      Text(
                                        _isBvnVerified && _isNinVerified
                                            ? 'Your BVN and NIN are verified'
                                            : 'Please verify your BVN and NIN to continue',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color:
                                              _isBvnVerified && _isNinVerified
                                                  ? Colors.green.shade600
                                                  : Colors.orange.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (_isBvnVerified && _isNinVerified)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.green,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Text(
                                      '100%',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Profile Info Status
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: canVerifyBvn
                                  ? Colors.green.shade50
                                  : Colors.red.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: canVerifyBvn
                                    ? Colors.green.shade200
                                    : Colors.red.shade200,
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  canVerifyBvn
                                      ? Icons.check_circle
                                      : Icons.warning_amber,
                                  color:
                                      canVerifyBvn ? Colors.green : Colors.red,
                                  size: 20,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        canVerifyBvn
                                            ? '✅ Profile information complete'
                                            : '⚠️ Missing profile information',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: canVerifyBvn
                                              ? Colors.green.shade800
                                              : Colors.red.shade800,
                                        ),
                                      ),
                                      if (!canVerifyBvn) ...[
                                        const SizedBox(height: 2),
                                        if (!hasPhone)
                                          Text(
                                            '• Phone number required',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.red.shade600,
                                            ),
                                          ),
                                        if (!hasDob)
                                          Text(
                                            '• Date of birth required',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.red.shade600,
                                            ),
                                          ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // BVN Section
                          const Text(
                            'BVN Verification',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF333333),
                            ),
                          ),
                          const SizedBox(height: 16),

                          if (_isBvnVerified)
                            _buildVerificationCard('BVN', _bvnData)
                          else
                            _buildBvnInput(canVerifyBvn),

                          const SizedBox(height: 32),

                          // NIN Section
                          const Text(
                            'NIN Verification',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF333333),
                            ),
                          ),
                          const SizedBox(height: 16),

                          if (_isNinVerified)
                            _buildVerificationCard('NIN', _ninData)
                          else
                            _buildNinInput(canVerifyBvn),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBvnInput(bool canVerify) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _bvnVerificationError != null
              ? Colors.red
              : AppColors.lightBlueBackground,
          width: _bvnVerificationError != null ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          TextField(
            controller: _bvnController,
            keyboardType: TextInputType.number,
            maxLength: 11,
            style: const TextStyle(fontSize: 16, color: Colors.black87),
            onChanged: (value) {
              print('🟣 [BVN/NIN Screen] BVN input: ${value.length} digits');
            },
            decoration: InputDecoration(
              hintText: 'Enter your BVN (11 digits)',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              filled: true,
              fillColor: Colors.white,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: _bvnVerificationError != null
                      ? Colors.red
                      : AppColors.lightBlueBackground,
                  width: _bvnVerificationError != null ? 2 : 1.5,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: _bvnVerificationError != null
                      ? Colors.red
                      : AppColors.lightBlueBackground,
                  width: _bvnVerificationError != null ? 2 : 1.5,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: _bvnVerificationError != null
                      ? Colors.red
                      : AppColors.blueBackground,
                  width: 2,
                ),
              ),
              counterText: '',
              errorText: _bvnVerificationError,
              errorStyle: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 16,
                  color: Colors.blue.shade700,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Phone number and date of birth are automatically fetched from your profile.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: canVerify ? (_isLoading ? null : _verifyBvn) : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: canVerify
                    ? AppColors.lightBlueBackground
                    : Colors.grey[400],
                foregroundColor:
                    canVerify ? AppColors.blueBackground : Colors.grey[600],
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
                        color: AppColors.blueBackground,
                      ),
                    )
                  : Text(
                      canVerify ? 'VERIFY BVN' : 'COMPLETE PROFILE FIRST',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNinInput(bool canVerify) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _ninVerificationError != null
              ? Colors.red
              : AppColors.lightBlueBackground,
          width: _ninVerificationError != null ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          TextField(
            controller: _ninController,
            keyboardType: TextInputType.number,
            maxLength: 11,
            style: const TextStyle(fontSize: 16, color: Colors.black87),
            onChanged: (value) {
              print('🟣 [BVN/NIN Screen] NIN input: ${value.length} digits');
            },
            decoration: InputDecoration(
              hintText: 'Enter your NIN (11 digits)',
              hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
              filled: true,
              fillColor: Colors.white,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: _ninVerificationError != null
                      ? Colors.red
                      : AppColors.lightBlueBackground,
                  width: _ninVerificationError != null ? 2 : 1.5,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: _ninVerificationError != null
                      ? Colors.red
                      : AppColors.lightBlueBackground,
                  width: _ninVerificationError != null ? 2 : 1.5,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: _ninVerificationError != null
                      ? Colors.red
                      : AppColors.blueBackground,
                  width: 2,
                ),
              ),
              counterText: '',
              errorText: _ninVerificationError,
              errorStyle: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 16,
                  color: Colors.blue.shade700,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Date of birth is automatically fetched from your profile.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: canVerify ? (_isLoading ? null : _verifyNin) : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: canVerify
                    ? AppColors.lightBlueBackground
                    : Colors.grey[400],
                foregroundColor:
                    canVerify ? AppColors.blueBackground : Colors.grey[600],
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
                        color: AppColors.blueBackground,
                      ),
                    )
                  : Text(
                      canVerify ? 'VERIFY NIN' : 'COMPLETE PROFILE FIRST',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationCard(String idType, Map<String, dynamic> data) {
    print('🟣 [BVN/NIN Screen] Building verification card for $idType');
    print('📊 [BVN/NIN Screen] $idType data: $data');

    final fullName = data['fullName'] ??
        data['fullname'] ??
        data['full_name'] ??
        data['name'] ??
        'N/A';
    final idNumber = data['idNumber'] ??
        data['id_number'] ??
        data['number'] ??
        (idType == 'BVN' ? data['bvn'] : data['nin']) ??
        'N/A';
    final dateOfBirth =
        data['dateOfBirth'] ?? data['date_of_birth'] ?? data['dob'] ?? 'N/A';
    final gender = data['gender'] ?? data['sex'] ?? 'N/A';
    final firstName = data['firstName'] ?? data['firstname'] ?? 'N/A';
    final lastName = data['lastName'] ?? data['lastname'] ?? 'N/A';
    final middleName = data['middleName'] ?? data['middle_name'] ?? '';
    final phoneNumber = data['phoneNumber'] ?? data['phone_number'] ?? 'N/A';
    final email = data['email'] ?? 'N/A';
    final address = data['address'] ?? 'N/A';
    final state = data['state'] ?? 'N/A';
    final nationality = data['nationality'] ?? 'N/A';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified, color: Colors.green, size: 20),
              const SizedBox(width: 8),
              Text(
                '$idType Verified ✅',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (fullName != 'N/A') _buildInfoRow('Full Name', fullName),
          if (idNumber != 'N/A') _buildInfoRow('ID Number', idNumber),
          if (firstName != 'N/A') _buildInfoRow('First Name', firstName),
          if (lastName != 'N/A') _buildInfoRow('Last Name', lastName),
          if (middleName.isNotEmpty) _buildInfoRow('Middle Name', middleName),
          if (dateOfBirth != 'N/A') _buildInfoRow('Date of Birth', dateOfBirth),
          if (gender != 'N/A') _buildInfoRow('Gender', gender),
          if (phoneNumber != 'N/A') _buildInfoRow('Phone', phoneNumber),
          if (email != 'N/A') _buildInfoRow('Email', email),
          if (address != 'N/A') _buildInfoRow('Address', address),
          if (state != 'N/A') _buildInfoRow('State', state),
          if (nationality != 'N/A') _buildInfoRow('Nationality', nationality),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF666666),
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF333333),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
