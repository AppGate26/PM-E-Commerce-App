import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/core/services/shared_preference_service.dart';
import 'package:pm_e_commerce_app/core/services/biometric_service.dart';
import 'package:pm_e_commerce_app/core/services/secure_credentials_service.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';
import 'package:pm_e_commerce_app/data/providers/goods_recovery_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  bool _biometricLoginAvailable = false;

  /// Set by [_performLogin] so biometric login can tell "signed in" from
  /// "the saved password is stale". The three-tier cascade can't just return
  /// a bool — tier three reports through an AsyncValue callback.
  bool _loginSucceeded = false;

  /// True when the last login attempt died on the network rather than on bad
  /// credentials. Stops us wiping saved credentials just because the user is
  /// offline.
  bool _loginHitConnectionError = false;

  @override
  void initState() {
    super.initState();
    _initBiometricLogin();
  }

  Future<void> _initBiometricLogin() async {
    final enabled = await SecureCredentialsService.isEnabled();
    if (!enabled) return;

    final available = await BiometricService.isAvailable();
    if (!mounted) return;

    setState(() {
      _biometricLoginAvailable = available;
    });

    // Auto-prompt once the screen has settled, so returning users aren't
    // forced to retype credentials every time the session expires.
    if (available) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _handleBiometricLogin();
      });
    }
  }

  void _showBiometricMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  Future<void> _handleBiometricLogin() async {
    if (_isLoading) return;

    final credentials = await SecureCredentialsService.getCredentials();
    if (credentials == null) {
      // Saved credentials are gone or unreadable (e.g. restored onto a new
      // phone, where the Keystore key didn't come across). Hide the button
      // rather than leaving one that does nothing when tapped.
      if (!mounted) return;
      setState(() => _biometricLoginAvailable = false);
      _showBiometricMessage(
        'Fingerprint login needs to be set up again on this phone. '
        'Please sign in with your password.',
      );
      return;
    }

    final result = await BiometricService.authenticate(
      reason: 'Authenticate to log in',
    );
    if (!mounted) return;

    if (!result.isSuccess) {
      final message = result.userMessage;
      if (message != null) _showBiometricMessage(message);
      return;
    }

    await _performLogin(credentials.email, credentials.password);
    if (!mounted || _loginSucceeded) return;

    // The fingerprint matched but the server rejected the saved password —
    // it was most likely changed elsewhere. Drop it so the user isn't stuck
    // replaying a dead credential every time they open the app. A network
    // failure is not the password's fault, so leave it alone in that case.
    if (_loginHitConnectionError) return;

    await SecureCredentialsService.disable();
    await SharedPreferenceService.clearBiometricPromptSeen();
    if (!mounted) return;
    setState(() => _biometricLoginAvailable = false);
    _showBiometricMessage(
      'Your saved sign-in details are out of date. Please sign in with your '
      'password to set fingerprint login up again.',
    );
  }

  Future<void> _maybeOfferBiometricEnrollment(
      String email, String password) async {
    if (!mounted) return;

    final alreadyEnabled = await SecureCredentialsService.isEnabled();
    if (alreadyEnabled) return;

    final alreadyAsked = await SharedPreferenceService.hasSeenBiometricPrompt();
    if (alreadyAsked) return;

    final available = await BiometricService.isAvailable();
    if (!available || !mounted) return;

    final wantsBiometric = await showDialog<bool>(
      context: context,
      // Force an explicit answer. This used to be marked "seen" before the
      // dialog even appeared, so a back-button dismissal burned the single
      // chance and the user was never offered fingerprint login again.
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Enable Fingerprint Login?'),
        content: const Text(
          'Use your fingerprint or Face ID to sign in next time instead of typing your email and password.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Not Now'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Enable'),
          ),
        ],
      ),
    );

    // Only remember the answer once they actually gave one.
    if (wantsBiometric != null) {
      await SharedPreferenceService.setBiometricPromptSeen();
    }
    if (wantsBiometric != true || !mounted) return;

    final result = await BiometricService.authenticate(
      reason: 'Confirm your fingerprint to enable quick login',
    );
    if (result.isSuccess) {
      await SecureCredentialsService.enable(email, password);
      return;
    }

    // Enrolment failed — tell them why, and let them try again next sign-in
    // instead of silently never offering it again.
    await SharedPreferenceService.clearBiometricPromptSeen();
    final message = result.userMessage;
    if (message != null) _showBiometricMessage(message);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  bool _isConnectionError(String errorMsg) {
    return errorMsg.contains('connection timeout') ||
        errorMsg.contains('timeout') ||
        errorMsg.contains('connection error') ||
        errorMsg.contains('network') ||
        errorMsg.contains('socket');
  }

  void _togglePasswordVisibility() {
    setState(() {
      _isPasswordVisible = !_isPasswordVisible;
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    await _performLogin(email, password);
  }

  Future<void> _performLogin(String email, String password) async {
    _loginSucceeded = false;
    _loginHitConnectionError = false;
    setState(() {
      _isLoading = true;
    });

    // First, try recovery agent login via API
    print('');
    print('═══════════════════════════════════════════════════════════════');
    print('🔐 LOGIN FLOW - CHECKING RECOVERY AGENT');
    print('═══════════════════════════════════════════════════════════════');
    print('📧 Email: $email');
    print('🔄 Attempting recovery agent login...');
    print('');
    try {
      final recoveryAgent =
          await ref.read(goodsRecoveryProvider.notifier).login(email, password);
      print('');
      print('✅✅✅ RECOVERY AGENT LOGIN SUCCESSFUL ✅✅✅');
      print('🆔 AgentId: ${recoveryAgent.recoveryAgentId}');
      print('📧 Email: ${recoveryAgent.email}');
      print('👤 Name: ${recoveryAgent.name}');
      print('🚀 Navigating to Recovery Splash Screen...');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      _loginSucceeded = true;
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        // Save login state for recovery agent
        await SharedPreferenceService.setUserLoggedIn(true);
        await SharedPreferenceService.setUserToken(
            recoveryAgent.recoveryAgentId.toString());
        await _maybeOfferBiometricEnrollment(email, password);
        if (!mounted) return;
        context.go(AppRoutes.recoverySplash);
      }
      return;
    } catch (recoveryError) {
      final errorMsg = recoveryError.toString().toLowerCase();
      print('ℹ️ [Login] Recovery agent login failed: $recoveryError');

      // If connection failed (timeout/network), skip all fallback logins — the server is unreachable
      if (_isConnectionError(errorMsg)) {
        _loginHitConnectionError = true;
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(ErrorHandler.getUserFriendlyError(recoveryError)),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        }
        return;
      }

      // Check if it's "not a recovery agent" vs "wrong password"
      if (errorMsg.contains('no recovery agent found') ||
          errorMsg.contains('not found') ||
          errorMsg.contains('404')) {
        print(
            'ℹ️ [Login] Email "$email" is NOT registered as a recovery agent');
        print('ℹ️ [Login] Falling back to DELIVERY AGENT login...');
      } else if (errorMsg.contains('password') ||
          errorMsg.contains('401') ||
          errorMsg.contains('unauthorized')) {
        print(
            '⚠️ [Login] Email "$email" IS a recovery agent, but password is WRONG');
        print('ℹ️ [Login] Will try delivery agent login as fallback...');
      } else {
        print(
            'ℹ️ [Login] Recovery agent login error (will try delivery agent login): $recoveryError');
      }
      // Not a recovery agent or wrong password, continue to delivery agent login
    }

    // Second, try delivery agent login via API
    print('');
    print('═══════════════════════════════════════════════════════════════');
    print('🔐 LOGIN FLOW - CHECKING DELIVERY AGENT');
    print('═══════════════════════════════════════════════════════════════');
    print('📧 Email: $email');
    print('🔄 Attempting delivery agent login...');
    print('');
    try {
      final deliveryAgent =
          await ref.read(deliveryAgentProvider.notifier).login(email, password);
      print('');
      print('✅✅✅ DELIVERY AGENT LOGIN SUCCESSFUL ✅✅✅');
      print('🆔 RiderId: ${deliveryAgent.riderId}');
      print('📧 Email: ${deliveryAgent.email}');
      print('👤 Name: ${deliveryAgent.name}');
      print('🚀 Navigating to Delivery Splash Screen...');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      _loginSucceeded = true;
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        // Save login state for delivery agent
        await SharedPreferenceService.setUserLoggedIn(true);
        await SharedPreferenceService.setUserToken(
            deliveryAgent.riderId.toString());
        await _maybeOfferBiometricEnrollment(email, password);
        if (!mounted) return;
        context.go(AppRoutes.deliverySplash);
      }
      return;
    } catch (deliveryError) {
      final errorMsg = deliveryError.toString().toLowerCase();
      print('ℹ️ [Login] Delivery agent login failed: $deliveryError');

      // Check if it's "not a rider" vs "wrong password"
      if (errorMsg.contains('no rider found') ||
          errorMsg.contains('not found') ||
          errorMsg.contains('404')) {
        print(
            'ℹ️ [Login] Email "$email" is NOT registered as a delivery agent');
        print('ℹ️ [Login] Falling back to CUSTOMER login...');
      } else if (errorMsg.contains('password') ||
          errorMsg.contains('401') ||
          errorMsg.contains('unauthorized')) {
        print(
            '⚠️ [Login] Email "$email" IS a delivery agent, but password is WRONG');
        print('ℹ️ [Login] Will try customer login as fallback...');
      } else {
        print(
            'ℹ️ [Login] Delivery agent login error (will try customer login): $deliveryError');
      }
      // Not a delivery agent or wrong password, continue to regular login
    }

    // Third, try regular user login
    try {
      print('🔐 [Login] Attempting regular user login for: $email');
      await ref.read(authProvider.notifier).login(email, password);

      final authState = ref.read(authProvider);

      if (mounted) {
        authState.when(
          data: (user) async {
            setState(() {
              _isLoading = false;
            });

            if (user != null) {
              _loginSucceeded = true;
              print(
                  '✅ [Login] Regular user login successful - userId: ${user.id}');
              // Save login state for regular user
              await SharedPreferenceService.setUserLoggedIn(true);
              await SharedPreferenceService.setUserToken(user.id.toString());
              await _maybeOfferBiometricEnrollment(email, password);
              if (!mounted) return;
              context.go(AppRoutes.home);
            } else {
              print('❌ [Login] Regular user login failed - user is null');
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Login failed. Please try again.'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          loading: () {
            // Still loading, keep loading state
          },
          error: (error, stackTrace) {
            _loginHitConnectionError =
                _isConnectionError(error.toString().toLowerCase());
            setState(() {
              _isLoading = false;
            });
            ErrorHandler.logError('Login Screen', error);
            final errorMessage = ErrorHandler.getUserFriendlyError(error);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(errorMessage),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 3),
              ),
            );
          },
        );
      }
    } catch (e) {
      _loginHitConnectionError = _isConnectionError(e.toString().toLowerCase());
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ErrorHandler.logError('Login Screen', e);
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
    final size = MediaQuery.of(context).size;

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
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      SizedBox(height: size.height * 0.08),

                      // Logo and Title
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Image.asset(
                              'assets/images/logo.png',
                              width: 32,
                              height: 32,
                              fit: BoxFit.contain,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Text(
                            'LOGIN',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2,
                              fontFamily: 'Montserrat',
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: size.height * 0.08),

                      // Email Field
                      _buildEmailField(),

                      const SizedBox(height: 24),

                      // Password Field
                      _buildPasswordField(),

                      const SizedBox(height: 16),

                      // Forgot Password - Customer forgot password
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {
                            // Navigate to customer forgot password screen
                            context.push(AppRoutes.forgotPassword);
                          },
                          child: const Text(
                            'Forgot Password?',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),

                      SizedBox(height: size.height * 0.04),

                      // Login Button
                      _buildLoginButton(),

                      if (_biometricLoginAvailable) ...[
                        const SizedBox(height: 16),
                        _buildBiometricLoginButton(),
                      ],

                      SizedBox(height: size.height * 0.06),

                      // Sign Up Link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'NOT A MEMBER? ',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              context.go(AppRoutes.register);
                            },
                            child: const Text(
                              'SIGNUP',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                decoration: TextDecoration.underline,
                                decorationColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
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
          'EMAIL',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter your email',
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
              return 'Please enter a valid email';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildPasswordField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'PASSWORD',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _passwordController,
          obscureText: !_isPasswordVisible,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter your password',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
            prefixIcon: const Icon(Icons.lock_outline, color: Colors.white70),
            suffixIcon: IconButton(
              icon: Icon(
                _isPasswordVisible ? Icons.visibility_off : Icons.visibility,
                color: Colors.white70,
              ),
              onPressed: _togglePasswordVisibility,
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
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your password';
            }
            if (value.length < 6) {
              return 'Password must be at least 6 characters';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
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
                'LOGIN',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
      ),
    );
  }

  Widget _buildBiometricLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton.icon(
        onPressed: _isLoading ? null : _handleBiometricLogin,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: Colors.white.withOpacity(0.5)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        icon: const Icon(Icons.fingerprint, size: 24),
        label: const Text(
          'LOGIN WITH FINGERPRINT',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }
}
