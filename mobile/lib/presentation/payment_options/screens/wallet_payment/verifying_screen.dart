// lib/presentation/wallet/screens/verifying_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class VerifyingScreen extends ConsumerStatefulWidget {
  const VerifyingScreen({super.key});

  @override
  ConsumerState<VerifyingScreen> createState() => _VerifyingScreenState();
}

class _VerifyingScreenState extends ConsumerState<VerifyingScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      final args = GoRouterState.of(context).extra as Map<String, dynamic>?;
      context.pushReplacement(AppRoutes.pmBankTransfer, extra: args);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'PM WALLET',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: const Center(
        child: Text(
          'Verifying.....',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w500,
            color: AppColors.textBlue,
          ),
        ),
      ),
    );
  }
}