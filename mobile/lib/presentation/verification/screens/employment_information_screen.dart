// presentation/verification/employment_information_screen.dart

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/employment_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';

class EmploymentInformationScreen extends StatefulWidget {
  const EmploymentInformationScreen({super.key});

  @override
  State<EmploymentInformationScreen> createState() =>
      _EmploymentInformationScreenState();
}

class _EmploymentInformationScreenState
    extends State<EmploymentInformationScreen> {
  // ============================================================
  // CONTROLLERS
  // ============================================================
  final _fieldController = TextEditingController();
  final _othersSpecify1Controller = TextEditingController();
  final _subSectorController = TextEditingController();
  final _othersSpecify2Controller = TextEditingController();
  final _companyNameController = TextEditingController();
  final _othersJobRoleController = TextEditingController();
  final _employerNameController = TextEditingController();
  final _employerEmailController = TextEditingController();
  final _yearOfEmploymentController = TextEditingController();
  final _othersSpecifyController = TextEditingController();
  final _savingsRangeController = TextEditingController();

  // ============================================================
  // STATE VARIABLES
  // ============================================================
  String? _employmentStatus;
  bool _isLoading = false;
  bool _isFetchingData = true;
  bool _hasExistingData = false;

  // Self-employed fields
  String? _employerOfLabour;
  String? _workforce;
  String? _profitRange;

  // Employed fields
  String? _sector;
  String? _jobRole;
  String? _salaryRange;

  // Unemployed fields
  String? _employmentHistory;
  String? _reasonForUnemployment;
  String? _intentionOfPayment;

  // ============================================================
  // REPOSITORIES
  // ============================================================
  final EmploymentRepository _employmentRepo = EmploymentRepository();
  final VerificationRepository _verificationRepo = VerificationRepository();

  // ============================================================
  // LIFECYCLE
  // ============================================================
  @override
  void initState() {
    super.initState();
    print('🟣 [EmploymentInformation] ===== SCREEN INITIALIZED =====');
    _loadExistingData();
  }

  @override
  void dispose() {
    _fieldController.dispose();
    _othersSpecify1Controller.dispose();
    _subSectorController.dispose();
    _othersSpecify2Controller.dispose();
    _companyNameController.dispose();
    _othersJobRoleController.dispose();
    _employerNameController.dispose();
    _employerEmailController.dispose();
    _yearOfEmploymentController.dispose();
    _othersSpecifyController.dispose();
    _savingsRangeController.dispose();
    super.dispose();
  }

  // presentation/verification/employment_information_screen.dart

// Only update the _loadExistingData method:

  Future<void> _loadExistingData() async {
    try {
      print('🟣 [EmploymentInformation] ===== LOADING EXISTING DATA =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🟣 [EmploymentInformation] No user data found');
        setState(() {
          _isFetchingData = false;
        });
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [EmploymentInformation] User ID: $userId');

      if (userId == null) {
        print('🟣 [EmploymentInformation] No user ID found');
        setState(() {
          _isFetchingData = false;
        });
        return;
      }

      // ✅ Step 1: Fetch employment data from API
      print('🟣 [EmploymentInformation] Fetching employment info from API...');
      final employmentData = await _employmentRepo.getEmploymentInfo();
      print('🟣 [EmploymentInformation] Employment data: $employmentData');

      // ✅ Step 2: Check verification status
      print('🟣 [EmploymentInformation] Checking verification status...');
      final verificationStatus =
          await _verificationRepo.checkIsVerified(userId: userId);

      final data = verificationStatus['data'] as Map<String, dynamic>?;
      final verifiedTypes = (data?['verifiedTypes'] as List?)
              ?.map((e) => e.toString().toUpperCase())
              .toList() ??
          [];

      final isVerified = verifiedTypes.contains('EMPLOYMENT_INFORMATION') ||
          verifiedTypes.contains('EMPLOYMENT');

      print('🟣 [EmploymentInformation] Employment verified: $isVerified');
      print('🟣 [EmploymentInformation] Verified types: $verifiedTypes');

      // ✅ Step 3: If data exists, populate the form
      if (employmentData != null && employmentData.isNotEmpty) {
        print(
            '✅ [EmploymentInformation] Employment data found! Populating form...');
        _populateForm(employmentData);
        setState(() {
          _hasExistingData = true;
          _isFetchingData = false;
        });
      } else if (isVerified) {
        // Data is verified but couldn't fetch (shouldn't happen, but handle gracefully)
        print('✅ [EmploymentInformation] Employment info is verified!');
        if (mounted) {
          _showSuccess('✅ Employment information is already verified!');
        }
        setState(() {
          _hasExistingData = true;
          _isFetchingData = false;
        });
      } else {
        print('🟣 [EmploymentInformation] No existing employment data found');
        setState(() {
          _hasExistingData = false;
          _isFetchingData = false;
        });
      }
    } catch (e) {
      print('🔴 [EmploymentInformation] Error loading existing data: $e');
      setState(() {
        _isFetchingData = false;
      });
    }
  }

// ✅ Add this method to populate the form with existing data
  void _populateForm(Map<String, dynamic> data) {
    print('🟣 [EmploymentInformation] Populating form with data...');
    print('📊 [EmploymentInformation] Data keys: ${data.keys}');

    setState(() {
      // Set employment status
      final employmentType =
          data['employmentType']?.toString().toUpperCase() ?? '';
      if (employmentType == 'SELF_EMPLOYED') {
        _employmentStatus = 'Self-employed';
      } else if (employmentType == 'EMPLOYED') {
        _employmentStatus = 'Employed';
      } else if (employmentType == 'UNEMPLOYED') {
        _employmentStatus = 'Unemployed';
      }

      // Self-employed fields
      if (data['descriptionOfServiceProduct'] != null) {
        final parts =
            data['descriptionOfServiceProduct'].toString().split(' - ');
        if (parts.isNotEmpty) {
          _fieldController.text = parts[0] ?? '';
          if (parts.length > 1) {
            _subSectorController.text = parts[1] ?? '';
          }
        }
      }
      _employerOfLabour = data['employerOfLabour'] == true ? 'Yes' : 'No';
      final workforce = data['workForce'];
      if (workforce != null) {
        if (workforce <= 20) {
          _workforce = '2 - 20';
        } else if (workforce <= 50) {
          _workforce = '21 - 50';
        } else if (workforce <= 100) {
          _workforce = '51 - 100';
        } else {
          _workforce = '100+';
        }
      }
      _profitRange = data['profitRange'];

      // Employed fields
      _sector = data['sector'];
      _companyNameController.text = data['nameOfCompany'] ?? '';
      // Map job role to display value
      final jobRole = data['jobRole']?.toString().toUpperCase() ?? '';
      const allowedRoles = {
        'BANKER': 'Banker',
        'ACCOUNTANT': 'Accountant',
        'MANAGER': 'Manager',
        'ENGINEER': 'Engineer',
        'DOCTOR': 'Doctor',
        'FARMER': 'Farmer',
        'CONTRACTOR': 'Contractor',
      };
      _jobRole = allowedRoles[jobRole] ?? 'Other';
      if (_jobRole == 'Other') {
        _othersJobRoleController.text = jobRole;
      }
      _employerNameController.text = data['employerName'] ?? '';
      _employerEmailController.text = data['employerEmail'] ?? '';
      final years = data['yearsOfEmployment'];
      if (years != null) {
        _yearOfEmploymentController.text =
            (DateTime.now().year - years).toString();
      }
      _salaryRange = data['salaryRange'];

      // Unemployed fields
      _employmentHistory = data['anyEmploymentHistory'] == true ? 'Yes' : 'No';
      final reason = data['reasonForUnemployment']?.toString() ?? '';
      if (reason.contains('RECENT_GRADUATE')) {
        _reasonForUnemployment = 'Recent Graduate';
      } else if (reason.contains('CAREER_CHANGE')) {
        _reasonForUnemployment = 'Career Change';
      } else if (reason.contains('LAID_OFF')) {
        _reasonForUnemployment = 'Laid Off';
      } else if (reason.contains('RESIGNED')) {
        _reasonForUnemployment = 'Resigned';
      } else if (reason.contains('RETIRED')) {
        _reasonForUnemployment = 'Retired';
      } else {
        _reasonForUnemployment = 'Other';
      }
      _intentionOfPayment = data['intentionForPayment']?.toString() ?? '';
      _savingsRangeController.text = data['savingsRange'] ?? '';
    });

    print('✅ [EmploymentInformation] Form populated successfully');
  }

  // ============================================================
  // MAPPING HELPERS
  // ============================================================
  String _mapEmploymentType(String? status) {
    print('🟣 [EmploymentInformation] Mapping employment type: $status');
    switch (status) {
      case 'Self-employed':
        return 'SELF_EMPLOYED';
      case 'Employed':
        return 'EMPLOYED';
      case 'Unemployed':
        return 'UNEMPLOYED';
      default:
        return '';
    }
  }

  String _mapJobRole(String? jobRole) {
    if (jobRole == null) return 'MANAGER';
    print('🟣 [EmploymentInformation] Mapping job role: $jobRole');

    final upper = jobRole.toUpperCase();
    const allowedRoles = {
      'BANKER': 'BANKER',
      'ACCOUNTANT': 'ACCOUNTANT',
      'MANAGER': 'MANAGER',
      'ENGINEER': 'ENGINEER',
      'DOCTOR': 'DOCTOR',
      'FARMER': 'FARMER',
      'CONTRACTOR': 'CONTRACTOR',
    };

    if (allowedRoles.containsKey(upper)) {
      print(
          '🟣 [EmploymentInformation] Job role matched: ${allowedRoles[upper]}');
      return allowedRoles[upper]!;
    }

    if (upper == 'OTHER') {
      final customRole = _othersJobRoleController.text.trim().toUpperCase();
      if (allowedRoles.containsKey(customRole)) {
        print(
            '🟣 [EmploymentInformation] Custom job role matched: ${allowedRoles[customRole]}');
        return allowedRoles[customRole]!;
      }
      print('🟣 [EmploymentInformation] Custom job role defaulting to MANAGER');
      return 'MANAGER';
    }

    for (final entry in allowedRoles.entries) {
      if (upper.contains(entry.key) || entry.key.contains(upper)) {
        print(
            '🟣 [EmploymentInformation] Job role partial match: ${entry.value}');
        return entry.value;
      }
    }

    print('🟣 [EmploymentInformation] Job role defaulting to MANAGER');
    return 'MANAGER';
  }

  String _mapReasonForUnemployment(String? reason) {
    if (reason == null) return '';
    print(
        '🟣 [EmploymentInformation] Mapping reason for unemployment: $reason');
    switch (reason) {
      case 'Recent Graduate':
        return 'RECENT_GRADUATE';
      case 'Career Change':
        return 'CAREER_CHANGE';
      case 'Laid Off':
        return 'LAID_OFF';
      case 'Resigned':
        return 'RESIGNED';
      case 'Retired':
        return 'RETIRED';
      default:
        return reason.toUpperCase().replaceAll(' ', '_');
    }
  }

  String _mapIntentionForPayment(String? intention) {
    if (intention == null) return '';
    print(
        '🟣 [EmploymentInformation] Mapping intention for payment: $intention');
    switch (intention) {
      case 'Savings from Menial jobs':
        return 'SAVINGS_FROM_MENIAL_JOBS';
      case 'Family Support':
        return 'FAMILY_SUPPORT';
      case 'Personal Savings':
        return 'PERSONAL_SAVINGS';
      case 'Gift':
        return 'GIFT';
      default:
        return intention.toUpperCase().replaceAll(' ', '_');
    }
  }

  int? _parseWorkforce(String? workforce) {
    if (workforce == null) return null;
    print('🟣 [EmploymentInformation] Parsing workforce: $workforce');
    if (workforce.contains('+')) return 100;
    final parts = workforce.split('-');
    if (parts.isNotEmpty) {
      final lowerBound = int.tryParse(parts[0].trim());
      print('🟣 [EmploymentInformation] Workforce parsed: $lowerBound');
      return lowerBound;
    }
    return null;
  }

  int? _calculateYearsOfEmployment() {
    if (_yearOfEmploymentController.text.isEmpty) return null;
    final selectedYear = int.tryParse(_yearOfEmploymentController.text);
    if (selectedYear == null) return null;
    final years = DateTime.now().year - selectedYear;
    print('🟣 [EmploymentInformation] Years of employment: $years');
    return years;
  }

  // ============================================================
  // SUBMIT
  // ============================================================
  Future<void> _submitEmploymentInfo() async {
    print('🟣 [EmploymentInformation] ===== SUBMIT STARTED =====');

    // ✅ Validate
    if (_employmentStatus == null) {
      _showError('Please select your employment status');
      return;
    }

    // ✅ Validate based on employment type
    if (_employmentStatus == 'Self-employed') {
      if (_fieldController.text.isEmpty ||
          _subSectorController.text.isEmpty ||
          _employerOfLabour == null ||
          _workforce == null ||
          _profitRange == null) {
        _showError('Please fill in all required self-employed fields');
        return;
      }
    } else if (_employmentStatus == 'Employed') {
      if (_sector == null ||
          _companyNameController.text.isEmpty ||
          _jobRole == null ||
          _employerNameController.text.isEmpty ||
          _employerEmailController.text.isEmpty ||
          _yearOfEmploymentController.text.isEmpty ||
          _salaryRange == null) {
        _showError('Please fill in all required employed fields');
        return;
      }
    } else if (_employmentStatus == 'Unemployed') {
      if (_employmentHistory == null ||
          _reasonForUnemployment == null ||
          _intentionOfPayment == null ||
          _savingsRangeController.text.isEmpty) {
        _showError('Please fill in all required unemployed fields');
        return;
      }
    }

    // ✅ Get userId
    int userId = 0;
    try {
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        userId = userJson['id'] ?? 0;
        print('🟣 [EmploymentInformation] User ID from storage: $userId');
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

    setState(() => _isLoading = true);

    try {
      final employmentType = _mapEmploymentType(_employmentStatus);
      print('🟣 [EmploymentInformation] Employment type enum: $employmentType');

      Map<String, dynamic>? result;

      if (_employmentStatus == 'Self-employed') {
        print('🟣 [EmploymentInformation] Submitting self-employed data...');
        result = await _employmentRepo.submitEmploymentInformation(
          userId: userId,
          employmentType: employmentType,
          descriptionOfServiceProduct:
              '${_fieldController.text.trim()} - ${_subSectorController.text.trim()}',
          employerOfLabour: _employerOfLabour == 'Yes',
          workForce: _parseWorkforce(_workforce),
          profitRange: _profitRange,
        );
        print('✅ [EmploymentInformation] Self-employed result: $result');
      } else if (_employmentStatus == 'Employed') {
        print('🟣 [EmploymentInformation] Submitting employed data...');
        final jobRoleValue = _jobRole == 'Other'
            ? _mapJobRole(_othersJobRoleController.text.trim())
            : _mapJobRole(_jobRole);
        print('🟣 [EmploymentInformation] Job role value: $jobRoleValue');

        result = await _employmentRepo.submitEmploymentInformation(
          userId: userId,
          employmentType: employmentType,
          nameOfCompany: _companyNameController.text.trim(),
          sector: _sector,
          jobRole: jobRoleValue,
          employerName: _employerNameController.text.trim(),
          employerEmail: _employerEmailController.text.trim(),
          yearsOfEmployment: _calculateYearsOfEmployment(),
          salaryRange: _salaryRange,
        );
        print('✅ [EmploymentInformation] Employed result: $result');
      } else if (_employmentStatus == 'Unemployed') {
        print('🟣 [EmploymentInformation] Submitting unemployed data...');
        final reasonEnum = _mapReasonForUnemployment(_reasonForUnemployment);
        final intentionEnum = _mapIntentionForPayment(_intentionOfPayment);
        print('🟣 [EmploymentInformation] Reason enum: $reasonEnum');
        print('🟣 [EmploymentInformation] Intention enum: $intentionEnum');

        result = await _employmentRepo.submitEmploymentInformation(
          userId: userId,
          employmentType: employmentType,
          anyEmploymentHistory: _employmentHistory == 'Yes',
          reasonForUnemployment: reasonEnum,
          intentionForPayment: intentionEnum,
          savingsRange: _savingsRangeController.text.trim(),
        );
        print('✅ [EmploymentInformation] Unemployed result: $result');
      }

      if (mounted) {
        setState(() => _isLoading = false);

        if (result != null && result['success'] == true) {
          final successMessage =
              result['message'] ?? 'Employment information saved successfully';
          print('✅ [EmploymentInformation] Success: $successMessage');

          // ✅ Show success message
          _showSuccess(successMessage);

          // ✅ Refresh verification status
          print('🟣 [EmploymentInformation] Refreshing verification status...');
          await _verificationRepo.checkIsVerified(userId: userId);
          print('✅ [EmploymentInformation] Verification status refreshed');

          // ✅ Navigate back after delay
          await Future.delayed(const Duration(seconds: 1));
          if (mounted) {
            print(
                '🟣 [EmploymentInformation] Navigating back to Verification Centre');
            context.pop(true);
          }
        } else {
          print('🔴 [EmploymentInformation] Result success was false or null');
          _showError(
              result?['message'] ?? 'Failed to save employment information');
        }
      }
    } catch (e) {
      print('🔴 [EmploymentInformation] Error submitting: $e');
      if (mounted) {
        setState(() => _isLoading = false);

        // ✅ Show a user-friendly error message
        final errorMsg = e.toString();
        if (errorMsg.contains('already have employment information')) {
          _showError(
              'You already have employment information saved. Please contact support to update it.');
        } else {
          _showError(errorMsg);
        }
      }
    }
  }

  // ============================================================
  // UI HELPERS
  // ============================================================
  void _showError(String message) {
    print('🔴 [EmploymentInformation] Error: $message');
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
    print('✅ [EmploymentInformation] Success: $message');
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

  Future<void> _selectYearOfEmployment(BuildContext context) async {
    final currentYear = DateTime.now().year;
    print('🟣 [EmploymentInformation] Selecting year of employment...');
    final int? selectedYear = await showDialog<int>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Year'),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: ListView.builder(
            itemCount: 50,
            itemBuilder: (context, index) {
              final year = currentYear - index;
              return ListTile(
                title: Text(year.toString()),
                onTap: () => Navigator.pop(context, year),
              );
            },
          ),
        ),
      ),
    );
    if (selectedYear != null) {
      setState(() {
        _yearOfEmploymentController.text = selectedYear.toString();
      });
      print('🟣 [EmploymentInformation] Year selected: $selectedYear');
    }
  }

  // ============================================================
  // BUILD WIDGETS
  // ============================================================
  @override
  Widget build(BuildContext context) {
    print('🟣 [EmploymentInformation] Building...');
    print('🟣 [EmploymentInformation] Status: $_employmentStatus');
    print('🟣 [EmploymentInformation] Has existing data: $_hasExistingData');

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
                    // ✅ Status Banner
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
                                '✅ Employment information is already verified!',
                                style: TextStyle(
                                  color: Colors.green.shade700,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Employment Status Dropdown
                    _buildDropdownField(
                      label: 'Employment Status',
                      value: _employmentStatus,
                      items: ['Self-employed', 'Employed', 'Unemployed'],
                      onChanged: (value) {
                        setState(() {
                          _employmentStatus = value;
                        });
                        print(
                            '🟣 [EmploymentInformation] Status selected: $value');
                      },
                    ),

                    if (_employmentStatus != null) ...[
                      const SizedBox(height: 24),

                      // ============================================================
                      // SELF-EMPLOYED
                      // ============================================================
                      if (_employmentStatus == 'Self-employed') ...[
                        _buildTextField(
                          label: 'Field',
                          controller: _fieldController,
                          hintText: 'e.g., Trade/craft',
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Others, please specify',
                          controller: _othersSpecify1Controller,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Sub-sector',
                          controller: _subSectorController,
                          hintText: 'e.g., Fashion design & Tailoring',
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Others, please specify',
                          controller: _othersSpecify2Controller,
                        ),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Employer of Labour?',
                          value: _employerOfLabour,
                          items: ['Yes', 'No'],
                          onChanged: (value) {
                            setState(() => _employerOfLabour = value);
                            print(
                                '🟣 [EmploymentInformation] Employer of labour: $value');
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Workforce?',
                          value: _workforce,
                          items: ['2 - 20', '21 - 50', '51 - 100', '100+'],
                          onChanged: (value) {
                            setState(() => _workforce = value);
                            print(
                                '🟣 [EmploymentInformation] Workforce: $value');
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Profit Range',
                          value: _profitRange,
                          items: [
                            'N11,000 - N40,000',
                            'N41,000 - N100,000',
                            'N101,000 - N200,000',
                            'N200,000+',
                          ],
                          onChanged: (value) {
                            setState(() => _profitRange = value);
                            print(
                                '🟣 [EmploymentInformation] Profit range: $value');
                          },
                        ),
                      ],

                      // ============================================================
                      // EMPLOYED
                      // ============================================================
                      if (_employmentStatus == 'Employed') ...[
                        _buildDropdownField(
                          label: 'Sector',
                          value: _sector,
                          items: [
                            'Educational Sector',
                            'Healthcare',
                            'Technology',
                            'Finance',
                            'Manufacturing',
                            'Government',
                            'Other',
                          ],
                          onChanged: (value) {
                            setState(() => _sector = value);
                            print('🟣 [EmploymentInformation] Sector: $value');
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Name of Company',
                          controller: _companyNameController,
                          hintText: 'e.g., The Acorn Private School',
                        ),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Job Role',
                          value: _jobRole,
                          items: [
                            'Manager',
                            'Engineer',
                            'Doctor',
                            'Accountant',
                            'Banker',
                            'Other'
                          ],
                          onChanged: (value) {
                            setState(() => _jobRole = value);
                            print(
                                '🟣 [EmploymentInformation] Job role: $value');
                          },
                        ),
                        if (_jobRole == 'Other') ...[
                          const SizedBox(height: 16),
                          _buildTextField(
                            label: 'If others, specify',
                            controller: _othersJobRoleController,
                          ),
                        ],
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Name of Employer',
                          controller: _employerNameController,
                          hintText: 'e.g., Mr. Ayoade',
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Employer\'s Email',
                          controller: _employerEmailController,
                          hintText: 'e.g., ayoade@gmail.com',
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 16),
                        _buildYearField(),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Salary Range',
                          value: _salaryRange,
                          items: [
                            'N11,000 - N40,000',
                            'N41,000 - N100,000',
                            'N101,000 - N200,000',
                            'N200,000+',
                          ],
                          onChanged: (value) {
                            setState(() => _salaryRange = value);
                            print(
                                '🟣 [EmploymentInformation] Salary range: $value');
                          },
                        ),
                      ],

                      // ============================================================
                      // UNEMPLOYED
                      // ============================================================
                      if (_employmentStatus == 'Unemployed') ...[
                        _buildDropdownField(
                          label: 'Any Employment History?',
                          value: _employmentHistory,
                          items: ['Yes', 'No'],
                          onChanged: (value) {
                            setState(() => _employmentHistory = value);
                            print(
                                '🟣 [EmploymentInformation] Employment history: $value');
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Reason for Unemployment?',
                          value: _reasonForUnemployment,
                          items: [
                            'Recent Graduate',
                            'Career Change',
                            'Laid Off',
                            'Resigned',
                            'Other',
                          ],
                          onChanged: (value) {
                            setState(() => _reasonForUnemployment = value);
                            print(
                                '🟣 [EmploymentInformation] Reason for unemployment: $value');
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildDropdownField(
                          label: 'Intention of Payment',
                          value: _intentionOfPayment,
                          items: [
                            'Savings from Menial jobs',
                            'Family Support',
                            'Personal Savings',
                            'Other',
                          ],
                          onChanged: (value) {
                            setState(() => _intentionOfPayment = value);
                            print(
                                '🟣 [EmploymentInformation] Intention of payment: $value');
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Others, Specify',
                          controller: _othersSpecifyController,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Savings Range',
                          controller: _savingsRangeController,
                          hintText: 'e.g., N11,000 - 40,000',
                        ),
                      ],
                    ],
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // Submit Button
            if (_employmentStatus != null && !_hasExistingData)
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
                    onPressed: _isLoading ? null : _submitEmploymentInfo,
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
                            _hasExistingData ? 'VERIFIED' : 'SUBMIT',
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
            icon: const Icon(Icons.arrow_back, color: AppColors.textLight),
            onPressed: () => context.pop(false),
          ),
          const Expanded(
            child: Center(
              child: Text(
                'EMPLOYMENT INFORMATION',
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
    String? hintText,
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
          style: const TextStyle(fontSize: 16, color: Colors.black87),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TextStyle(fontSize: 14, color: Colors.grey[400]),
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
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
              borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
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
            style: TextStyle(fontSize: 16, color: Colors.grey[400]),
          ),
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                style: const TextStyle(fontSize: 16, color: Colors.black87),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildYearField() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(
        'Year of Employment',
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey[600],
          fontWeight: FontWeight.w400,
        ),
      ),
      const SizedBox(height: 8),
      GestureDetector(
        onTap: () => _selectYearOfEmployment(context),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!, width: 1),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _yearOfEmploymentController.text.isEmpty
                      ? ''
                      : _yearOfEmploymentController.text,
                  style: TextStyle(
                    fontSize: 16,
                    color: _yearOfEmploymentController.text.isEmpty
                        ? Colors.grey[400]
                        : Colors.black87,
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
    ]);
  }
}
