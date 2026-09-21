import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';

class PmBankTransferScreen extends ConsumerStatefulWidget {
  const PmBankTransferScreen({super.key});

  @override
  ConsumerState<PmBankTransferScreen> createState() =>
      _PmBankTransferScreenState();
}

class _PmBankTransferScreenState
    extends ConsumerState<PmBankTransferScreen> {
  final _accountNumberController = TextEditingController();
  final _accountNameController = TextEditingController();
  final _amountController = TextEditingController();
  final _narrationController = TextEditingController();

  String? _selectedBank;
  bool _showBalance = true;
  double _availableBalance = 0;
  int? _resolvedRecipientId; // <-- NEW

  final List<String> _banks = [
    'Access Bank',
    'GTBank',
    'Zenith Bank',
    'First Bank',
    'UBA',
    'Fidelity Bank',
    'Stanbic IBTC',
    'Wema Bank',
    'Union Bank',
    'Sterling Bank',
  ];

  @override
  void dispose() {
    _accountNumberController.dispose();
    _accountNameController.dispose();
    _amountController.dispose();
    _narrationController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    _availableBalance = extra?['availableBalance'] ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final balance = _availableBalance;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Transfer to other banks',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => context.pop(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),
            _walletHeader(balance),
            const SizedBox(height: 32),
            _buildLabel('Bank'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedBank,
              hint: const Text('Choose a bank'),
              decoration: _inputDecoration(),
              items: _banks
                  .map((bank) => DropdownMenuItem(value: bank, child: Text(bank)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedBank = value),
            ),
            const SizedBox(height: 24),
            _buildLabel('Account Number'),
            const SizedBox(height: 8),
            TextField(
              controller: _accountNumberController,
              keyboardType: TextInputType.number,
              decoration: _inputDecoration(hintText: 'Input account number'),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _lookupBeneficiary,
                child: const Text(
                  'Find beneficiaries',
                  style: TextStyle(
                    color: AppColors.blueBackground,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 5),
            _buildLabel('Account Name'),
            const SizedBox(height: 8),
            TextField(
              controller: _accountNameController,
              readOnly: true,
              decoration: _inputDecoration().copyWith(
                fillColor: Colors.grey.shade50,
              ),
            ),
            const SizedBox(height: 24),
            _buildLabel('Amount'),
            const SizedBox(height: 8),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: _inputDecoration(
                hintText: 'Maximum ₦${balance.toStringAsFixed(0)}',
              ),
            ),
            const SizedBox(height: 24),
            _buildLabel('Narration'),
            const SizedBox(height: 8),
            TextField(
              controller: _narrationController,
              decoration: _inputDecoration(),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isFormValid(balance)
                    ? () => _goToReview(balance)
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isFormValid(balance)
                      ? AppColors.blueBackground
                      : Colors.grey.shade400,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'PROCEED',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _walletHeader(double balance) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.blueBackground,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _showBalance ? '₦${balance.toStringAsFixed(0)}' : '****',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _showBalance = !_showBalance),
                  child: Icon(
                    _showBalance ? Icons.visibility : Icons.visibility_off,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Account Number: 7393003899\nBank: Access Bank\nAccount Name: PM/AYOADE OLALEKAN',
              style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.3),
            ),
          ],
        ),
      );

  InputDecoration _inputDecoration({String? hintText}) => InputDecoration(
        hintText: hintText,
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.blueBackground, width: 2),
        ),
      );

  void _lookupBeneficiary() {
    if (_accountNumberController.text.length != 10) return;

    // TODO: Replace with actual API call
    setState(() {
      _accountNameController.text = 'Moeed Shukurat';
      _resolvedRecipientId = 42; // Replace with real userId result
    });
  }

  bool _isFormValid(double balance) {
    final amount = double.tryParse(_amountController.text) ?? 0;
    return _selectedBank != null &&
        _accountNumberController.text.length == 10 &&
        _accountNameController.text.isNotEmpty &&
        amount > 0 &&
        amount <= balance &&
        _narrationController.text.isNotEmpty;
  }

  void _goToReview(double balance) {
    final authState = ref.read(authProvider);
    final currentUserId = authState.value?.id ?? 0;
    final currentUserName = authState.value?.name ?? 'Unknown User';
    final recipientUserId = _resolvedRecipientId ?? 0;

    context.push(
      AppRoutes.bankReview,
      extra: {
        'fromUserId': currentUserId,
        'fromName': currentUserName,
        'fromAccount': '7393003899', // Replace with actual wallet account
        'toUserId': recipientUserId,
        'toName': _accountNameController.text,
        'toAccount': _accountNumberController.text,
        'amount': _amountController.text,
        'bank': _selectedBank!,
        'narration': _narrationController.text,
        'availableBalance': balance,
      },
    );
  }

  Widget _buildLabel(String text) => Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.black87,
        ),
      );
}
