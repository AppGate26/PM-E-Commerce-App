// lib/presentation/recovery/screens/recovery_change_password_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/providers/goods_recovery_provider.dart';

class RecoveryChangePasswordScreen extends ConsumerStatefulWidget {
  final String? email;
  final String? resetCode;
  
  const RecoveryChangePasswordScreen({
    super.key,
    this.email,
    this.resetCode,
  });

  @override
  ConsumerState<RecoveryChangePasswordScreen> createState() => _RecoveryChangePasswordScreenState();
}

class _RecoveryChangePasswordScreenState extends ConsumerState<RecoveryChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _resetCodeController = TextEditingController();

  bool _isOldPasswordVisible = false;
  bool _isNewPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isLoading = false;
  bool _isFirstTime = true;
  String? _email;
  int? _riderId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      print('🔄 [RecoveryChangePassword] Loading data...');
      
      if (widget.resetCode == null && widget.email == null) {
        final userData = await StorageService.getUserData();
        if (userData != null) {
          final userJson = jsonDecode(userData);
          _riderId = userJson['id'] as int?;
          _email = userJson['email'] as String?;
          print('✅ [RecoveryChangePassword] Loaded from storage - RiderId: $_riderId, Email: $_email');
        }
      } else {
        print('ℹ️ [RecoveryChangePassword] First-time reset - not using stored data');
      }
    } catch (e) {
      ErrorHandler.logError('RecoveryChangePassword LoadData', e);
      print('❌ [RecoveryChangePassword] Error loading data: $e');
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    print('');
    print('═══════════════════════════════════════════════════════════════');
    print('🔐 RECOVERY CHANGE PASSWORD SCREEN LOADED');
    print('═══════════════════════════════════════════════════════════════');
    if (widget.email != null) {
      _email = widget.email;
      print('✅ Email received from forgot password: $_email');
      _riderId = null;
    } else {
      print('ℹ️ No email from forgot password, using stored data');
    }
    if (widget.resetCode != null) {
      _isFirstTime = true;
      _resetCodeController.text = widget.resetCode!;
      print('✅ Reset code received: ${widget.resetCode!.length} digits');
    } else {
      print('ℹ️ No reset code provided - user will enter manually');
    }
    print('🔄 First Time Reset: $_isFirstTime');
    print('📧 Email: $_email');
    print('🆔 RiderId: $_riderId');
    print('═══════════════════════════════════════════════════════════════');
    print('');
  }

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _resetCodeController.dispose();
    super.dispose();
  }

  void _toggleOldPasswordVisibility() {
    setState(() {
      _isOldPasswordVisible = !_isOldPasswordVisible;
    });
  }

  void _toggleNewPasswordVisibility() {
    setState(() {
      _isNewPasswordVisible = !_isNewPasswordVisible;
    });
  }

  void _toggleConfirmPasswordVisibility() {
    setState(() {
      _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
    });
  }

  Future<void> _handleChangePassword() async {
    if (!_formKey.currentState!.validate()) return;

    if (_riderId == null && !_isFirstTime) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Recovery agent ID not found. Please login again.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_isFirstTime && (_email == null || _email!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Email is required for password reset.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final newPassword = _newPasswordController.text;
    final oldPassword = _isFirstTime ? null : _oldPasswordController.text;
    final resetCode = _isFirstTime ? _resetCodeController.text.trim() : null;

    print('');
    print('═══════════════════════════════════════════════════════════════');
    print('🔐 RECOVERY AGENT CHANGE PASSWORD');
    print('═══════════════════════════════════════════════════════════════');
    print('📧 Email: $_email');
    print('🆔 RiderId: $_riderId');
    print('🔄 First Time: $_isFirstTime');
    print('🔑 Using Reset Code: ${resetCode != null}');
    print('═══════════════════════════════════════════════════════════════');
    print('');

    try {
      await ref.read(goodsRecoveryProvider.notifier).changePassword(
        riderId: _riderId,
        email: _email,
        oldPassword: oldPassword,
        newPassword: newPassword,
        resetCode: resetCode,
      );

      print('');
      print('✅✅✅ PASSWORD CHANGED SUCCESSFULLY ✅✅✅');
      print('📧 Email: $_email');
      print('🔄 Next: Navigate to Login Screen');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password changed successfully!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );

        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            print('🚀 [RecoveryChangePassword] Navigating to login screen...');
            context.go(AppRoutes.login);
          }
        });
      }
    } catch (e) {
      ErrorHandler.logError('RecoveryChangePassword', e);
      print('❌ [RecoveryChangePassword] Error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        final errorMessage = ErrorHandler.getUserFriendlyError(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.blueBackground,
      body: Container(
        height: double.infinity,
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.blueBackground,
              Color(0xFF0A4FC8),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 40),

                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.lock_outline,
                      color: Colors.white,
                      size: 48,
                    ),
                  ),

                  const SizedBox(height: 32),

                  const Text(
                    'Change password',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 40),

                  if (_isFirstTime) ...[
                    if (_email != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.white.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline, color: Colors.white70, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Reset code sent to: $_email\nPlease check your email (including spam folder)',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    _buildPasswordField(
                      label: 'Enter Reset Code',
                      controller: _resetCodeController,
                      isVisible: true,
                      onToggleVisibility: () {},
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter reset code from your email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (!_isFirstTime) ...[
                    _buildPasswordField(
                      label: 'Enter old password',
                      controller: _oldPasswordController,
                      isVisible: _isOldPasswordVisible,
                      onToggleVisibility: _toggleOldPasswordVisibility,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter old password';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  _buildPasswordField(
                    label: 'Enter new password',
                    controller: _newPasswordController,
                    isVisible: _isNewPasswordVisible,
                    onToggleVisibility: _toggleNewPasswordVisibility,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter new password';
                      }
                      if (value.length < 6) {
                        return 'Password must be at least 6 characters';
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 24),

                  _buildPasswordField(
                    label: 'Confirm New password',
                    controller: _confirmPasswordController,
                    isVisible: _isConfirmPasswordVisible,
                    onToggleVisibility: _toggleConfirmPasswordVisibility,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please confirm password';
                      }
                      if (value != _newPasswordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 40),

                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleChangePassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.blueBackground,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(AppColors.blueBackground),
                              ),
                            )
                          : const Text(
                              'CHANGE PASSWORD',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1,
                              ),
                            ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text(
                      'Back to Login',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required String label,
    required TextEditingController controller,
    required bool isVisible,
    required VoidCallback onToggleVisibility,
    required String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: !isVisible,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: label,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
            prefixIcon: const Icon(Icons.lock_outline, color: Colors.white70),
            suffixIcon: IconButton(
              icon: Icon(
                isVisible ? Icons.visibility_off : Icons.visibility,
                color: Colors.white70,
              ),
              onPressed: onToggleVisibility,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.3)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.white, width: 2),
            ),
            filled: true,
            fillColor: Colors.white.withOpacity(0.1),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          validator: validator,
        ),
      ],
    );
  }
}








