// presentation/verification/pm_terms_screen.dart

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/verification_repository.dart';

class PmTermsScreen extends ConsumerStatefulWidget {
  const PmTermsScreen({super.key});

  @override
  ConsumerState<PmTermsScreen> createState() => _PmTermsScreenState();
}

class _PmTermsScreenState extends ConsumerState<PmTermsScreen> {
  bool _isLoading = false;
  bool _isAccepted = false;
  bool _isScrolledToBottom = false;
  final ScrollController _scrollController = ScrollController();
  final VerificationRepository _verificationRepo = VerificationRepository();

  @override
  void initState() {
    super.initState();
    print('🟣 [Terms] ===== SCREEN INITIALIZED =====');
    _scrollController.addListener(_onScroll);
    _checkIfAlreadyAccepted();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 50) {
      if (!_isScrolledToBottom) {
        setState(() => _isScrolledToBottom = true);
        print('🟣 [Terms] User scrolled to bottom');
      }
    }
  }

  Future<void> _checkIfAlreadyAccepted() async {
    try {
      print('🟣 [Terms] Checking if terms already accepted...');

      // 1. Check local storage first
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final termsAccepted = userJson['termsAccepted'] ?? false;

        if (termsAccepted == true) {
          print('✅ [Terms] Already accepted (local storage)');
          if (mounted) setState(() => _isAccepted = true);
          return;
        }
      }

      // 2. Check API
      final termsData = await _verificationRepo.getPaymentTermsMe();
      if (termsData != null) {
        final accepted = termsData['accepted'] == true ||
            termsData['termsAccepted'] == true ||
            termsData['isAccepted'] == true;

        if (accepted) {
          print('✅ [Terms] Already accepted (API)');
          // Sync to local
          if (userData != null) {
            final userJson = jsonDecode(userData);
            userJson['termsAccepted'] = true;
            userJson['termsVersion'] = termsData['termsVersion'] ?? 'v1.0';
            await StorageService.saveUserData(jsonEncode(userJson));
          }
          if (mounted) setState(() => _isAccepted = true);
        }
      }
    } catch (e) {
      print('🔴 [Terms] Error checking acceptance: $e');
    }
  }

  Future<void> _acceptTerms() async {
    print('🟣 [Terms] ===== ACCEPTING TERMS =====');
    setState(() => _isLoading = true);

    try {
      final userData = await StorageService.getUserData();
      if (userData == null) {
        _showError('User not found');
        setState(() => _isLoading = false);
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      if (userId == null) {
        _showError('User not found');
        setState(() => _isLoading = false);
        return;
      }

      // Call API
      await _verificationRepo.acceptTerms(
        userId: userId,
        termsVersion: 'v1.0',
      );
      print('✅ [Terms] Accepted via API');

      // Save locally
      userJson['termsAccepted'] = true;
      userJson['termsVersion'] = 'v1.0';
      userJson['termsAcceptedDate'] = DateTime.now().toIso8601String();
      await StorageService.saveUserData(jsonEncode(userJson));
      print('✅ [Terms] Saved to local storage');

      if (mounted) {
        setState(() {
          _isAccepted = true;
          _isLoading = false;
        });
        _showSuccess('Terms Accepted ✅');

        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) context.pop(true);
        });
      }
    } catch (e) {
      print('🔴 [Terms] Error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        _showError(e.toString());
      }
    }
  }

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
            Text(message),
          ],
        ),
        backgroundColor: Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            if (_isAccepted)
              _buildAlreadyAcceptedView()
            else
              Expanded(
                child: Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildHeaderSection(),
                            const SizedBox(height: 28),
                            _buildTermsContent(),
                            const SizedBox(height: 16),
                            _buildScrollIndicator(),
                            const SizedBox(height: 16),
                          ],
                        ),
                      ),
                    ),
                    _buildFooter(),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ==================== UI BUILDERS (same design) ====================

  Widget _buildHeader() {
    return Container(
      height: 60,
      width: double.infinity,
      color: AppColors.blueBackground,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_rounded,
                color: AppColors.textLight, size: 20),
            onPressed: () => context.pop(false),
          ),
          const Expanded(
            child: Center(
              child: Text(
                'Terms & Conditions',
                style: TextStyle(
                  color: AppColors.textLight,
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Montserrat',
                ),
              ),
            ),
          ),
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppColors.textLight.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.close_rounded,
                  color: AppColors.textLight, size: 16),
              onPressed: () => context.pop(false),
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlreadyAcceptedView() {
    return Expanded(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.green.shade200, width: 2),
              ),
              child: Icon(Icons.check_circle_rounded,
                  size: 56, color: Colors.green.shade700),
            ),
            const SizedBox(height: 20),
            const Text(
              'Already Accepted ✅',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A1A1A),
                fontFamily: 'Montserrat',
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'You have accepted the Terms & Conditions',
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF666666),
                fontFamily: 'Montserrat',
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: () => context.pop(false),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 36, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Text(
                'Go Back',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Montserrat',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.blueBackground.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: AppColors.blueBackground.withOpacity(0.08), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.blueBackground.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.description_rounded,
                size: 20, color: AppColors.blueBackground),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'PM\'s Terms & Conditions',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A1A),
                    fontFamily: 'Montserrat',
                  ),
                ),
                Text(
                  'Last updated: July 2026',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade500,
                    fontFamily: 'Montserrat',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTermsContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSection(
          title: '1. Introduction',
          content:
              'Welcome to PM E-Commerce App. By using our platform, you agree to comply with and be bound by the following terms and conditions.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '2. User Accounts',
          content:
              'To access certain features you must create an account. You agree to provide accurate information and keep your credentials confidential.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '3. Product Purchases',
          content:
              'All purchases are subject to product availability and confirmation of the order price. We reserve the right to refuse or cancel any order.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '4. Payment and Pricing',
          content:
              'All prices are in Nigerian Naira (₦). We accept bank transfers, cards and wallet payments.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '5. Delivery and Shipping',
          content:
              'Delivery times are estimates. Delivery fees may apply based on location and order value.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '6. Returns and Refunds',
          content:
              'You may request a return or refund within 7 days of delivery if the product is unused and in original packaging.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '7. Privacy Policy',
          content:
              'Your privacy is important to us. We process your data according to our Privacy Policy.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '8. Prohibited Activities',
          content:
              'You agree not to engage in any illegal, fraudulent or harmful activities on the platform.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '9. Termination',
          content:
              'We may suspend or terminate your account if you violate these terms.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '10. Changes to Terms',
          content:
              'We may update these terms. Continued use after changes constitutes acceptance.',
        ),
        const SizedBox(height: 20),
        _buildSection(
          title: '11. Contact Us',
          content:
              'For questions contact support@pmecommerce.com or our customer support channels.',
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.blue.shade200),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded,
                  color: Colors.blue.shade700, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Please scroll to the bottom to accept',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.blue.shade700,
                    fontFamily: 'Montserrat',
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSection({required String title, required String content}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A1A),
            fontFamily: 'Montserrat',
          ),
        ),
        const SizedBox(height: 6),
        Text(
          content,
          style: const TextStyle(
            fontSize: 14,
            height: 1.7,
            color: Color(0xFF555555),
            fontFamily: 'Montserrat',
          ),
        ),
      ],
    );
  }

  Widget _buildScrollIndicator() {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: _isScrolledToBottom
              ? Colors.green.shade50
              : Colors.orange.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _isScrolledToBottom
                ? Colors.green.shade200
                : Colors.orange.shade200,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _isScrolledToBottom
                  ? Icons.check_circle_rounded
                  : Icons.arrow_downward_rounded,
              size: 14,
              color: _isScrolledToBottom ? Colors.green : Colors.orange,
            ),
            const SizedBox(width: 6),
            Text(
              _isScrolledToBottom
                  ? 'You\'ve read all terms'
                  : 'Scroll to read all terms',
              style: TextStyle(
                fontSize: 11,
                color: _isScrolledToBottom
                    ? Colors.green.shade700
                    : Colors.orange.shade700,
                fontFamily: 'Montserrat',
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.whiteBackground,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed:
                    (_isLoading || !_isScrolledToBottom) ? null : _acceptTerms,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isScrolledToBottom
                      ? AppColors.blueBackground
                      : Colors.grey.shade300,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        _isScrolledToBottom
                            ? 'Accept Terms'
                            : 'Scroll to Accept',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Montserrat',
                          color: _isScrolledToBottom
                              ? Colors.white
                              : Colors.grey.shade500,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => context.pop(false),
              child: Text(
                'Decline',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade500,
                  fontFamily: 'Montserrat',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
