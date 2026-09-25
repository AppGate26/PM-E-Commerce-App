// lib/presentation/recovery/screens/recovery_home_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/services/secure_credentials_service.dart';
import 'package:pm_e_commerce_app/core/services/shared_preference_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/presentation/recovery/widgets/recovery_bottom_nav_bar.dart';

class RecoveryHomeScreen extends StatefulWidget {
  const RecoveryHomeScreen({super.key});

  @override
  State<RecoveryHomeScreen> createState() => _RecoveryHomeScreenState();
}

class _RecoveryHomeScreenState extends State<RecoveryHomeScreen> {
  int _currentIndex = 1;
  String _agentName = 'USER';

  @override
  void initState() {
    super.initState();
    _loadAgentName();
  }

  Future<void> _loadAgentName() async {
    try {
      print('🔄 [RecoveryHome] Loading agent name...');
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final name = userJson['name'] as String?;
        print('🔍 [RecoveryHome] Found name in storage: $name');
        if (name != null && name.isNotEmpty && name != 'USER') {
          setState(() {
            _agentName = name.toUpperCase();
          });
          print('✅ [RecoveryHome] Agent name loaded: $_agentName');
        } else {
          print('⚠️ [RecoveryHome] Name is null or empty, using default: USER');
          setState(() {
            _agentName = 'USER';
          });
        }
      } else {
        print('❌ [RecoveryHome] No user data found in storage');
        setState(() {
          _agentName = 'USER';
        });
      }
    } catch (e) {
      print('❌ [RecoveryHome] Error loading agent name: $e');
      setState(() {
        _agentName = 'USER';
      });
    }
  }

  void _onNavTap(int index) {
    setState(() => _currentIndex = index);
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Warning Icon
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.red.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.logout,
                    color: AppColors.red,
                    size: 30,
                  ),
                ),
                const SizedBox(height: 16),

                // Title
                const Text(
                  'Log Out',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),

                // Message
                const Text(
                  'Are you sure you want to log out?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 24),

                // Buttons Row
                Row(
                  children: [
                    // No Button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop(); // Close dialog
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey[300],
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'No',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Yes Button
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.of(context).pop();
                          await StorageService.removeAllAuthData();
                          await SecureCredentialsService.disable();
                          await SharedPreferenceService
                              .clearBiometricPromptSeen();
                          if (context.mounted) context.go(AppRoutes.login);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Yes',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              color: AppColors.blueBackground,
              child: Row(
                children: [
                  Image.asset('assets/images/logo.png',
                      height: 36, fit: BoxFit.contain),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _agentName == 'USER' ? 'WELCOME USER' : 'WELCOME $_agentName',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Menu Buttons
            _buildMenuButton(
              label: 'GOODS TO BE RECOVERED',
              onTap: () => context.go(AppRoutes.goodsToBeRecovered),
            ),
            const SizedBox(height: 20),
            _buildMenuButton(
              label: 'RECOVERY REPORT',
              onTap: () => context.go(AppRoutes.recoveryReport),
            ),
            const SizedBox(height: 20),
            _buildMenuButton(
              label: 'LOG OUT',
              isLogout: true,
              onTap: _showLogoutDialog, // Updated to show dialog
            ),

            const Spacer(),
          ],
        ),
      ),
      bottomNavigationBar: RecoveryBottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
      ),
    );
  }

  Widget _buildMenuButton({
    required String label,
    bool isLogout = false,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: const [
              BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 8,
                  offset: Offset(0, 2)),
            ],
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isLogout ? AppColors.red : const Color(0xFF444444),
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
            ),
          ),
        ),
      ),
    );
  }
}
