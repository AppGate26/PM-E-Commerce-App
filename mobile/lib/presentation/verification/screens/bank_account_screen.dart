// presentation/verification/bank_account_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/bank_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';

final bankRepositoryProvider = Provider<BankRepository>((ref) {
  return BankRepository();
});

final verificationRepositoryProvider = Provider<VerificationRepository>((ref) {
  return VerificationRepository();
});

class BankAccountScreen extends ConsumerStatefulWidget {
  const BankAccountScreen({super.key});

  @override
  ConsumerState<BankAccountScreen> createState() => _BankAccountScreenState();
}

class _BankAccountScreenState extends ConsumerState<BankAccountScreen>
    with SingleTickerProviderStateMixin {
  final _accountNumberController = TextEditingController();
  final _accountNameController = TextEditingController();
  final _bvnController = TextEditingController();
  final _ninController = TextEditingController();

  late TabController _tabController;
  String? _selectedBank;
  bool _isLoading = false;
  bool _isLoadingData = true;
  Map<String, dynamic>? _existingBankData;
  bool _hasValidBankData = false;

  String? _bvnFromVerification;
  String? _ninFromVerification;
  bool _isFetchingBvnNin = false;

  final List<String> _banks = [
    'Access Bank',
    'First Bank',
    'GTBank',
    'Zenith Bank',
    'UBA',
    'Fidelity Bank',
    'First City Monument Bank',
    'Stanbic IBTC Bank',
    'Union Bank',
    'Ecobank',
    'Heritage Bank',
    'Keystone Bank',
    'Polaris Bank',
    'Providus Bank',
    'Standard Chartered Bank',
    'Sterling Bank',
    'Suntrust Bank',
    'TajBank',
    'Unity Bank',
    'Wema Bank',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    print('🟣 [BankAccount] ===== SCREEN INITIALIZED =====');
    _loadAllData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _accountNumberController.dispose();
    _accountNameController.dispose();
    _bvnController.dispose();
    _ninController.dispose();
    super.dispose();
  }

  // ============================================================
  // LOAD DATA
  // ============================================================
  Future<void> _loadAllData() async {
    print('🟣 [BankAccount] ===== LOADING ALL DATA =====');
    await Future.wait([
      _loadExistingBankDetails(),
      _loadBvnAndNinFromVerification(),
    ]);
  }

  Future<void> _loadExistingBankDetails() async {
    print('🟣 [BankAccount] Loading existing bank details...');
    setState(() => _isLoadingData = true);

    try {
      final bankRepo = ref.read(bankRepositoryProvider);
      final bankData = await bankRepo.getMyBankDetails();

      final hasValidData = bankData != null &&
          bankData.isNotEmpty &&
          bankData['accountNumber'] != null &&
          bankData['accountNumber'].toString().isNotEmpty &&
          bankData['accountNumber'].toString() != 'null';

      if (hasValidData) {
        print('✅ [BankAccount] Valid bank details found');
        print('📊 [BankAccount] Data: $bankData');

        setState(() {
          _existingBankData = bankData;
          _hasValidBankData = true;
          _accountNumberController.text =
              bankData['accountNumber']?.toString() ?? '';
          _accountNameController.text =
              bankData['accountName']?.toString() ?? '';
          _selectedBank = bankData['bankName']?.toString();
        });
      } else {
        print('ℹ️ [BankAccount] No valid bank details found');
        setState(() {
          _existingBankData = null;
          _hasValidBankData = false;
        });
      }
    } catch (e) {
      print('🔴 [BankAccount] Error loading bank details: $e');
    } finally {
      if (mounted) setState(() => _isLoadingData = false);
    }
  }

  Future<void> _loadBvnAndNinFromVerification() async {
    print('🟣 [BankAccount] Loading BVN & NIN from verification...');
    setState(() => _isFetchingBvnNin = true);

    try {
      final verificationRepo = ref.read(verificationRepositoryProvider);

      final bvn = await verificationRepo.getUserBvn();
      if (bvn != null && bvn.isNotEmpty) {
        print(
            '✅ [BankAccount] BVN found: ${bvn.substring(0, 3)}***${bvn.substring(bvn.length - 3)}');
        setState(() {
          _bvnFromVerification = bvn;
          _bvnController.text = bvn;
        });
      }

      final nin = await verificationRepo.getUserNin();
      if (nin != null && nin.isNotEmpty) {
        print(
            '✅ [BankAccount] NIN found: ${nin.substring(0, 3)}***${nin.substring(nin.length - 3)}');
        setState(() {
          _ninFromVerification = nin;
          _ninController.text = nin;
        });
      }
    } catch (e) {
      print('🔴 [BankAccount] Error loading BVN/NIN: $e');
    } finally {
      if (mounted) setState(() => _isFetchingBvnNin = false);
    }
  }

  // ============================================================
  // SAVE / UPDATE
  // ============================================================
  Future<void> _authenticateAccount() async {
    print('🟣 [BankAccount] ===== AUTHENTICATE ACCOUNT =====');

    if (_accountNumberController.text.trim().isEmpty) {
      _showError('Please enter your account number');
      return;
    }
    if (_selectedBank == null) {
      _showError('Please select your bank');
      return;
    }
    if (_accountNameController.text.trim().isEmpty) {
      _showError('Please enter your account name');
      return;
    }
    if (_bvnController.text.trim().length != 11) {
      _showError('BVN must be 11 digits');
      return;
    }
    if (_ninController.text.trim().length != 11) {
      _showError('NIN must be 11 digits');
      return;
    }

    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    if (user == null) {
      _showError('User not authenticated. Please login again.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final bankRepo = ref.read(bankRepositoryProvider);
      final isUpdate = _hasValidBankData;

      print('📊 [BankAccount] Is Update: $isUpdate');
      print('📊 [BankAccount] Bank: $_selectedBank');
      print(
          '📊 [BankAccount] Account: ****${_accountNumberController.text.substring(_accountNumberController.text.length - 4)}');

      final result = isUpdate
          ? await bankRepo.updateBankDetails(
              userId: user.id,
              accountNumber: _accountNumberController.text.trim(),
              accountName: _accountNameController.text.trim(),
              bankName: _selectedBank!,
              bvn: _bvnController.text.trim(),
              nin: _ninController.text.trim(),
            )
          : await bankRepo.saveBankDetails(
              userId: user.id,
              accountNumber: _accountNumberController.text.trim(),
              accountName: _accountNameController.text.trim(),
              bankName: _selectedBank!,
              bvn: _bvnController.text.trim(),
              nin: _ninController.text.trim(),
            );

      print('✅ [BankAccount] Success: ${result['message']}');

      if (mounted) {
        _showSuccess(result['message'] ?? 'Bank details saved successfully');
        await _loadExistingBankDetails();

        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) context.pop(true);
        });
      }
    } catch (e) {
      print('🔴 [BankAccount] Error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        _showError(e.toString());
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ============================================================
  // UI HELPERS
  // ============================================================
  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  // ============================================================
  // BUILD
  // ============================================================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Container(
              color: AppColors.whiteBackground,
              child: TabBar(
                controller: _tabController,
                labelColor: const Color(0xFF333333),
                unselectedLabelColor: const Color(0xFF666666),
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
                indicator: const UnderlineTabIndicator(
                  borderSide: BorderSide(
                    color: AppColors.blueBackground,
                    width: 2.5,
                  ),
                ),
                tabs: const [
                  Tab(text: 'REGISTER'),
                  Tab(text: 'VIEW'),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // REGISTER TAB
                  _isLoadingData || _isFetchingBvnNin
                      ? _buildLoading()
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_hasValidBankData) _buildStatusBanner(),
                              _buildFormField(
                                label: 'ACCOUNT NUMBER',
                                controller: _accountNumberController,
                                keyboardType: TextInputType.number,
                                maxLength: 10,
                              ),
                              const SizedBox(height: 20),
                              _buildBankDropdown(),
                              const SizedBox(height: 20),
                              _buildFormField(
                                label: 'ACCOUNT NAME',
                                controller: _accountNameController,
                              ),
                              const SizedBox(height: 20),
                              _buildFormField(
                                label: 'BVN',
                                controller: _bvnController,
                                keyboardType: TextInputType.number,
                                maxLength: 11,
                                isAutoFilled: _bvnFromVerification != null,
                              ),
                              const SizedBox(height: 20),
                              _buildFormField(
                                label: 'NIN',
                                controller: _ninController,
                                keyboardType: TextInputType.number,
                                maxLength: 11,
                                isAutoFilled: _ninFromVerification != null,
                              ),
                              const SizedBox(height: 32),
                              _buildSubmitButton(),
                            ],
                          ),
                        ),

                  // VIEW TAB
                  _isLoadingData
                      ? _buildLoading()
                      : _hasValidBankData && _existingBankData != null
                          ? _buildBankDetailsView()
                          : _buildEmptyState(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // WIDGETS
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
            onPressed: () => context.pop(),
          ),
          const Text(
            'BANK ACCOUNT',
            style: TextStyle(
              color: AppColors.textLight,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.textLight),
            onPressed: () => context.pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.blueBackground),
          SizedBox(height: 16),
          Text('Loading bank details...'),
        ],
      ),
    );
  }

  Widget _buildStatusBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Bank details found. You can update below.',
              style: TextStyle(
                color: Colors.green.shade700,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    int? maxLength,
    bool isAutoFilled = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF333333),
                letterSpacing: 0.5,
              ),
            ),
            if (isAutoFilled)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Auto-filled',
                  style: TextStyle(
                    fontSize: 9,
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLength: maxLength,
          style: const TextStyle(fontSize: 16, color: Colors.black87),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.whiteBackground,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide:
                  const BorderSide(color: AppColors.blueBackground, width: 2),
            ),
            counterText: '',
          ),
        ),
      ],
    );
  }

  Widget _buildBankDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'BANK',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF333333),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _selectedBank,
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.whiteBackground,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide:
                  const BorderSide(color: AppColors.blueBackground, width: 2),
            ),
          ),
          hint: const Text('Select Bank'),
          items: _banks
              .map((bank) => DropdownMenuItem(value: bank, child: Text(bank)))
              .toList(),
          onChanged: (value) {
            setState(() => _selectedBank = value);
            print('🟣 [BankAccount] Bank selected: $value');
          },
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _authenticateAccount,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.blueBackground,
          foregroundColor: Colors.white,
          disabledBackgroundColor: Colors.grey.shade300,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation(Colors.white),
                ),
              )
            : Text(
                _hasValidBankData
                    ? 'UPDATE BANK DETAILS'
                    : 'AUTHENTICATE ACCOUNT',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.account_balance_outlined,
              size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            'No bank account registered',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF666666),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add your bank details in the REGISTER tab',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _buildBankDetailsView() {
    final data = _existingBankData!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 24),
                SizedBox(width: 10),
                Text(
                  'Bank Account Details',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const Divider(height: 28),
            _buildDetailRow('Bank Name', data['bankName'] ?? 'N/A'),
            _buildDetailRow('Account Number', data['accountNumber'] ?? 'N/A'),
            _buildDetailRow('Account Name', data['accountName'] ?? 'N/A'),
            _buildDetailRow('BVN', data['bvn'] ?? 'N/A'),
            _buildDetailRow('NIN', data['nin'] ?? 'N/A'),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.verified, color: Colors.green.shade700, size: 20),
                  const SizedBox(width: 10),
                  const Text(
                    'Bank account verified',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF666666),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF333333),
              ),
            ),
          ),
        ],
      ),
    );
  }
}