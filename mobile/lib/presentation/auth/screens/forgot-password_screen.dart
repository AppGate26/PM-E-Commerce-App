import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';
import 'package:pm_e_commerce_app/data/providers/goods_recovery_provider.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _emailSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    final email = _emailController.text.trim();

    // 1) Try RECOVERY AGENT forgot-password first
    print('');
    print('═══════════════════════════════════════════════════════════════');
    print('🔐 FORGOT PASSWORD FLOW - RECOVERY AGENT');
    print('═══════════════════════════════════════════════════════════════');
    print('📧 Email: $email');
    print('🔄 Attempting recovery-agent forgot password...');
    print('');
    try {
      final recoveryResult = await ref.read(goodsRecoveryProvider.notifier).forgotPassword(email);

      print('');
      print('✅✅✅ RECOVERY AGENT FORGOT PASSWORD SUCCESS ✅✅✅');
      print('📧 Email: $email');
      print('📨 Result: $recoveryResult');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'If you are a recovery officer, password reset instructions have been sent to your email (check spam).',
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 4),
        ),
      );

      final code = RegExp(r'^\d{4,6}$').hasMatch(recoveryResult) ? recoveryResult : null;

      print('ℹ️ [ForgotPassword] Code extracted: ${code != null ? "YES (${code.length} digits)" : "NO - check email"}');
      print('ℹ️ [ForgotPassword] Navigating to RecoveryChangePasswordScreen');
      print('   → Email: $email');
      print('   → Has Code: ${code != null}');
      print('');

      Future.delayed(const Duration(seconds: 1), () {
        if (!mounted) return;
        print('🚀 [ForgotPassword] Navigating to recovery change password screen...');
        context.push(
          AppRoutes.recoveryChangePassword,
          extra: {
            'email': email,
            if (code != null) 'resetCode': code,
          },
        );
      });

      return;
    } catch (e) {
      final message = e.toString();
      print('❌ [ForgotPassword] Recovery-agent forgot password failed: $message');

      final lower = message.toLowerCase();
      final isNoAgent = lower.contains('no recovery agent found') || 
                        lower.contains('not found') || 
                        lower.contains('404');

      if (!isNoAgent) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      print('ℹ️ [ForgotPassword] Email is not a recovery agent. Trying DELIVERY AGENT...');
    }

    // 2) Try DELIVERY AGENT forgot-password
    print('');
    print('═══════════════════════════════════════════════════════════════');
    print('🔐 FORGOT PASSWORD FLOW - DELIVERY AGENT');
    print('═══════════════════════════════════════════════════════════════');
    print('📧 Email: $email');
    print('🔄 Attempting delivery-agent forgot password...');
    print('');
    try {
      final deliveryResult =
          await ref.read(deliveryAgentProvider.notifier).forgotPassword(email);

      print('');
      print('✅✅✅ DELIVERY AGENT FORGOT PASSWORD SUCCESS ✅✅✅');
      print('📧 Email: $email');
      print('📨 Result: $deliveryResult');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      if (!mounted) return;

      setState(() {
        _isLoading = false;
        // We do NOT set _emailSent here; we go straight to the delivery change password flow.
      });

      // Show a friendly message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'If you are a delivery rider, password reset instructions have been sent to your email (check spam).',
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 4),
        ),
      );

      // If the backend actually returned a numeric code, pre-fill it.
      final code =
          RegExp(r'^\d{4,6}$').hasMatch(deliveryResult) ? deliveryResult : null;

      print('ℹ️ [ForgotPassword] Code extracted: ${code != null ? "YES (${code.length} digits)" : "NO - check email"}');
      print('ℹ️ [ForgotPassword] Navigating to DeliveryChangePasswordScreen');
      print('   → Email: $email');
      print('   → Has Code: ${code != null}');
      print('');

      // Navigate to delivery change password screen
      Future.delayed(const Duration(seconds: 1), () {
        if (!mounted) return;
        print('🚀 [ForgotPassword] Navigating to change password screen...');
        context.push(
          AppRoutes.deliveryChangePassword,
          extra: {
            'email': email,
            if (code != null) 'resetCode': code,
          },
        );
      });

      // IMPORTANT: Stop here – do not fall through to customer flow if delivery succeeded.
      return;
    } catch (e) {
      final message = e.toString();
      print('❌ [ForgotPassword] Delivery-agent forgot password failed: $message');

      // If backend explicitly says "No rider found with this email", we FALL BACK to customer flow.
      final lower = message.toLowerCase();
      final isNoRider =
          lower.contains('no rider found') || lower.contains('not_found');

      if (!isNoRider) {
        // Some other delivery error (network, server, etc.) – show it and stop.
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      // Otherwise, fall through and try CUSTOMER forgot-password below.
      print(
          'ℹ️ [ForgotPassword] Email is not a rider. Falling back to CUSTOMER forgot password for: $email');
    }

    // 2) CUSTOMER forgot-password (existing flow, unchanged)
    try {
      final message = await ref.read(authProvider.notifier).forgotPassword(email);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
          _emailSent = true;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red,
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
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.of(context).size.height -
                    MediaQuery.of(context).padding.top -
                    MediaQuery.of(context).padding.bottom,
              ),
              child: IntrinsicHeight(
                child: Column(
                  children: [
                    const SizedBox(height: 40),

                    // Back Button
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        onPressed: () => context.go(AppRoutes.login),
                        icon: const Icon(
                          Icons.arrow_back_ios,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Icon
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.lock_reset_outlined,
                        color: Colors.white,
                        size: 48,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Title
                    const Text(
                      'Forgot your password?',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                        fontFamily: 'Montserrat',
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 24),

                    // Description
                    if (!_emailSent) ...[
                      const Text(
                        'Please enter your registered email to receive your password reset information:',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 40),

                      // Form
                      Form(
                        key: _formKey,
                        child: _buildEmailField(),
                      ),

                      const SizedBox(height: 32),

                      // Reset Button
                      _buildResetButton(),
                    ] else ...[
                      // Success State
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.mark_email_read_outlined,
                              color: Colors.white,
                              size: 48,
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Email Sent!',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'We\'ve sent password reset instructions to\n${_emailController.text}\n\nClick "Reset Password" to proceed.',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 16,
                                height: 1.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () =>
                                        context.go(AppRoutes.login),
                                    style: OutlinedButton.styleFrom(
                                      side:
                                          const BorderSide(color: Colors.white),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 16),
                                    ),
                                    child: const Text(
                                      'Back to Login',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () =>
                                        context.go(AppRoutes.resetPassword),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      foregroundColor: AppColors.blueBackground,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 16),
                                    ),
                                    child: const Text(
                                      'Reset Password',
                                      style: TextStyle(
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
                    ],

                    const Spacer(),

                    // Back to Login Link
                    if (!_emailSent) ...[
                      const SizedBox(height: 32),
                      GestureDetector(
                        onTap: () => context.go(AppRoutes.login),
                        child: const Text(
                          'Remember your password? Login',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 16,
                            decoration: TextDecoration.underline,
                            decorationColor: Colors.white70,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmailField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Enter Registered email:',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter your email address',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
            prefixIcon: const Icon(Icons.email_outlined, color: Colors.white70),
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
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your email';
            }
            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
              return 'Please enter a valid email address';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildResetButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleResetPassword,
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
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppColors.blueBackground),
                ),
              )
            : const Text(
                'RESET PASSWORD',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
      ),
    );
  }
}
