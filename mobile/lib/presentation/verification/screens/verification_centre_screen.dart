import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_card_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/personal_info_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/employment_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/bank_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';

class VerificationCentreScreen extends ConsumerStatefulWidget {
  const VerificationCentreScreen({super.key});

  @override
  ConsumerState<VerificationCentreScreen> createState() =>
      _VerificationCentreScreenState();
}

class _VerificationCentreScreenState
    extends ConsumerState<VerificationCentreScreen> {
  final VerificationRepository _verificationRepo = VerificationRepository();
  final PersonalInfoRepository _personalInfoRepo = PersonalInfoRepository();
  final EmploymentRepository _employmentRepo = EmploymentRepository();
  final BankRepository _bankRepo = BankRepository();

  // Keys
  static const String _keyPersonal = 'PERSONAL_INFORMATION';
  static const String _keyEmployment = 'EMPLOYMENT_INFORMATION';
  static const String _keyBvnNin = 'BVN_NIN';
  static const String _keyBank = 'BANK_ACCOUNT';
  static const String _keyPaymentCards = 'PAYMENT_CARDS';
  static const String _keyTerms = 'TERMS';

  List<String> _verifiedTypes = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Local flags (for checkmarks)
  bool _hasPersonalInfo = false;
  bool _hasEmploymentInfo = false;
  bool _hasBankAccount = false;
  bool _hasTermsAccepted = false;
  bool _hasBvnNin = false;
  bool _hasPaymentCards = false;

  @override
  void initState() {
    super.initState();
    print('🟣 [VerificationCentre] ===== SCREEN INITIALIZED =====');
    _fetchAllStatus();
  }

  // ============================================================
  // MAIN FETCH METHOD
  // ============================================================
  Future<void> _fetchAllStatus() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    print('🟣 [VerificationCentre] ===== FETCHING ALL STATUS =====');

    try {
      final userData = await StorageService.getUserData();
      if (userData == null) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'User not found. Please login again.';
        });
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      if (userId == null) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Invalid user data.';
        });
        return;
      }

      print('🟣 [VerificationCentre] User ID: $userId');

      // --------------------------------------------------------
      // 1. Get verifiedTypes from main verification endpoint
      // --------------------------------------------------------
      List<String> verifiedTypes = [];
      try {
        final result = await _verificationRepo.checkIsVerified(userId: userId);
        final data = result['data'] as Map<String, dynamic>?;
        if (data != null && data['verifiedTypes'] is List) {
          verifiedTypes = (data['verifiedTypes'] as List)
              .map((e) => e.toString().toUpperCase())
              .toList();
        }
        print('🟣 [VerificationCentre] verifiedTypes from API: $verifiedTypes');
      } catch (e) {
        print('⚠️ [VerificationCentre] checkIsVerified failed: $e');
      }

      // --------------------------------------------------------
      // 2. Check PERSONAL INFORMATION
      // --------------------------------------------------------
      bool hasPersonal = false;
      try {
        final personal = await _personalInfoRepo.getMyPersonalInfo();
        hasPersonal = personal != null && personal.isNotEmpty;
        print('🟣 [VerificationCentre] Has Personal Info: $hasPersonal');
      } catch (e) {
        print('⚠️ [VerificationCentre] Personal info check failed: $e');
      }

      // Also check from verifiedTypes
      final personalFromApi = verifiedTypes.any(
          (t) => t.contains('PERSONAL') || t.contains('PERSONAL_INFORMATION'));
      if (personalFromApi) hasPersonal = true;

      // --------------------------------------------------------
      // 3. Check EMPLOYMENT INFORMATION
      // --------------------------------------------------------
      bool hasEmployment = false;
      try {
        final employment = await _employmentRepo.getEmploymentInfo();
        hasEmployment = employment != null && employment.isNotEmpty;
        print('🟣 [VerificationCentre] Has Employment Info: $hasEmployment');
      } catch (e) {
        print('⚠️ [VerificationCentre] Employment check failed: $e');
      }

      final employmentFromApi = verifiedTypes.any((t) =>
          t.contains('EMPLOYMENT') || t.contains('EMPLOYMENT_INFORMATION'));
      if (employmentFromApi) hasEmployment = true;

      // --------------------------------------------------------
      // 4. Check BANK ACCOUNT
      // --------------------------------------------------------
      bool hasBank = false;
      try {
        final bank = await _bankRepo.getMyBankDetails();
        hasBank = bank != null &&
            bank.isNotEmpty &&
            bank['accountNumber'] != null &&
            bank['accountNumber'].toString().isNotEmpty &&
            bank['accountNumber'].toString() != 'null';
        print('🟣 [VerificationCentre] Has Bank Account: $hasBank');
      } catch (e) {
        print('⚠️ [VerificationCentre] Bank check failed: $e');
      }

      final bankFromApi = verifiedTypes
          .any((t) => t.contains('BANK') || t.contains('BANK_ACCOUNT'));
      if (bankFromApi) hasBank = true;

      // --------------------------------------------------------
      // 5. Check BVN & NIN
      // --------------------------------------------------------
      bool hasBvnNin =
          verifiedTypes.any((t) => t.contains('BVN') || t.contains('NIN'));
      print('🟣 [VerificationCentre] Has BVN/NIN: $hasBvnNin');

      // --------------------------------------------------------
      // 6. Check PAYMENT CARDS
      // --------------------------------------------------------
      bool hasPaymentCards = false;
      try {
        final cardRepo = PaymentCardRepository();
        final cards = await cardRepo.getPaymentCards();
        hasPaymentCards = cards.isNotEmpty;
        print(
            '🟣 [VerificationCentre] Has Payment Cards: $hasPaymentCards (${cards.length} cards)');
      } catch (e) {
        print('⚠️ [VerificationCentre] Payment cards check failed: $e');
      }

// Also check from verifiedTypes (backup)
      final paymentFromApi =
          verifiedTypes.any((t) => t.contains('PAYMENT') || t.contains('CARD'));
      if (paymentFromApi) hasPaymentCards = true;

      // --------------------------------------------------------
      // 7. Check TERMS (local + API)
      // --------------------------------------------------------
      bool hasTerms = false;

      // Local storage
      final localTerms = userJson['termsAccepted'] == true;
      if (localTerms) {
        hasTerms = true;
        print('🟣 [VerificationCentre] Terms found in local storage');
      }

      // API
      try {
        final termsData = await _verificationRepo.getPaymentTermsMe();
        if (termsData != null) {
          final accepted = termsData['accepted'] == true ||
              termsData['termsAccepted'] == true ||
              termsData['isAccepted'] == true ||
              termsData['status']?.toString().toUpperCase() == 'ACCEPTED';
          if (accepted) {
            hasTerms = true;
            print('🟣 [VerificationCentre] Terms accepted via API');
          }
        }
      } catch (e) {
        print('⚠️ [VerificationCentre] Payment terms check failed: $e');
      }

      // Also from verifiedTypes
      final termsFromApi = verifiedTypes.any((t) =>
          t.contains('TERMS') ||
          t.contains('ACCEPT_TERMS') ||
          t == 'TERMS_ACCEPTED');
      if (termsFromApi) hasTerms = true;

      print('🟣 [VerificationCentre] Final Terms status: $hasTerms');

      // --------------------------------------------------------
      // UPDATE STATE
      // --------------------------------------------------------
      if (mounted) {
        setState(() {
          _verifiedTypes = verifiedTypes;
          _hasPersonalInfo = hasPersonal;
          _hasEmploymentInfo = hasEmployment;
          _hasBankAccount = hasBank;
          _hasBvnNin = hasBvnNin;
          _hasPaymentCards = hasPaymentCards;
          _hasTermsAccepted = hasTerms;
          _isLoading = false;
        });
      }

      // Summary
      print('📊 [VerificationCentre] ===== SUMMARY =====');
      print('   PERSONAL: ${_hasPersonalInfo ? "✅" : "❌"}');
      print('   EMPLOYMENT: ${_hasEmploymentInfo ? "✅" : "❌"}');
      print('   BVN/NIN: ${_hasBvnNin ? "✅" : "❌"}');
      print('   BANK: ${_hasBankAccount ? "✅" : "❌"}');
      print('   PAYMENT CARDS: ${_hasPaymentCards ? "✅" : "❌"}');
      print('   TERMS: ${_hasTermsAccepted ? "✅" : "❌"}');
    } catch (e) {
      print('🔴 [VerificationCentre] Fatal error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  // ============================================================
  // HELPER: Is this key verified?
  // ============================================================
  bool _isVerified(String key) {
    switch (key) {
      case _keyPersonal:
        return _hasPersonalInfo;
      case _keyEmployment:
        return _hasEmploymentInfo;
      case _keyBvnNin:
        return _hasBvnNin;
      case _keyBank:
        return _hasBankAccount;
      case _keyPaymentCards:
        return _hasPaymentCards;
      case _keyTerms:
        return _hasTermsAccepted;
      default:
        return false;
    }
  }

  static const List<String> _allKeys = [
    _keyPersonal,
    _keyEmployment,
    _keyBvnNin,
    _keyBank,
    _keyPaymentCards,
    _keyTerms,
  ];

  double get _progress {
    final completed = _allKeys.where((k) => _isVerified(k)).length;
    return completed / _allKeys.length;
  }

  // ============================================================
  // BUILD
  // ============================================================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            // ==================== HEADER ====================
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
                        'VERIFICATION CENTRE',
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
                    onPressed: _fetchAllStatus,
                  ),
                ],
              ),
            ),

            // ==================== STATUS BANNERS ====================
            if (_hasPersonalInfo)
              _buildSuccessBanner('✅ Personal Information saved'),
            if (_hasEmploymentInfo)
              _buildSuccessBanner('✅ Employment Information saved'),
            if (_hasBankAccount) _buildSuccessBanner('✅ Bank Account saved'),
            if (_hasTermsAccepted)
              _buildSuccessBanner('✅ PM\'s Terms accepted'),

            // ==================== BODY ====================
            Expanded(
              child: _isLoading
                  ? _buildLoading()
                  : _errorMessage != null
                      ? _buildError()
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              const SizedBox(height: 8),
                              _VerificationItem(
                                title: 'PERSONAL INFORMATION',
                                isCompleted: _isVerified(_keyPersonal),
                                onTap: () async {
                                  await context
                                      .push(AppRoutes.personalInformation);
                                  _fetchAllStatus(); // refresh after return
                                },
                              ),
                              const SizedBox(height: 12),
                              _VerificationItem(
                                title: 'EMPLOYMENT STATUS',
                                isCompleted: _isVerified(_keyEmployment),
                                onTap: () async {
                                  await context
                                      .push(AppRoutes.employmentInformation);
                                  _fetchAllStatus();
                                },
                              ),
                              const SizedBox(height: 12),
                              _VerificationItem(
                                title: 'BVN & NIN',
                                isCompleted: _isVerified(_keyBvnNin),
                                onTap: () async {
                                  await context
                                      .push(AppRoutes.bvnNinVerification);
                                  _fetchAllStatus();
                                },
                              ),
                              const SizedBox(height: 12),
                              _VerificationItem(
                                title: 'BANK ACCOUNT',
                                isCompleted: _isVerified(_keyBank),
                                onTap: () async {
                                  await context.push(AppRoutes.bankAccount);
                                  _fetchAllStatus();
                                },
                              ),
                              const SizedBox(height: 12),
                              _VerificationItem(
                                title: 'PAYMENT CARDS',
                                isCompleted: _isVerified(_keyPaymentCards),
                                onTap: () async {
                                  await context.push(AppRoutes.paymentCards);
                                  _fetchAllStatus();
                                },
                              ),
                              const SizedBox(height: 12),
                              _VerificationItem(
                                title: 'PM\'S TERMS',
                                isCompleted: _isVerified(_keyTerms),
                                onTap: () async {
                                  final result =
                                      await context.push(AppRoutes.pmTerms);
                                  if (result == true) {
                                    // User just accepted terms
                                    setState(() => _hasTermsAccepted = true);
                                  }
                                  _fetchAllStatus();
                                },
                              ),
                            ],
                          ),
                        ),
            ),

            // ==================== FOOTER PROGRESS ====================
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
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 8,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: _progress,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.blueBackground,
                                    AppColors.blueBackground.withOpacity(0.7),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${(_progress * 100).round()}%',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF333333),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_allKeys.where((k) => _isVerified(k)).length} of ${_allKeys.length} completed',
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
    );
  }

  // ============================================================
  // HELPER WIDGETS
  // ============================================================
  Widget _buildSuccessBanner(String text) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
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

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.blueBackground),
          SizedBox(height: 16),
          Text('Loading verification status...'),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 16),
            const Text(
              'Error loading status',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? '',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchAllStatus,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// VERIFICATION ITEM WIDGET
// ============================================================
class _VerificationItem extends StatelessWidget {
  final String title;
  final bool isCompleted;
  final VoidCallback onTap;

  const _VerificationItem({
    required this.title,
    required this.isCompleted,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        decoration: BoxDecoration(
          color: AppColors.blueBackground,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: AppColors.textLight,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isCompleted ? Colors.green : Colors.red,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: (isCompleted ? Colors.green : Colors.red)
                        .withOpacity(0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                isCompleted ? Icons.check : Icons.close,
                color: AppColors.textLight,
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
