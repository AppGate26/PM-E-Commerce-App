import 'package:local_auth/local_auth.dart';
import 'package:local_auth/error_codes.dart' as auth_error;

class BiometricService {
  static final LocalAuthentication _auth = LocalAuthentication();

  /// Whether this device has biometrics enrolled and available right now.
  static Future<bool> isAvailable() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      if (!canCheck || !isSupported) return false;
      final biometrics = await _auth.getAvailableBiometrics();
      return biometrics.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Prompts the OS biometric sheet (fingerprint / Face ID).
  /// Returns true only on a successful, real biometric match.
  static Future<bool> authenticate({
    String reason = 'Authenticate to log in',
  }) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
    } on Exception catch (e) {
      final message = e.toString();
      if (message.contains(auth_error.notAvailable) ||
          message.contains(auth_error.notEnrolled) ||
          message.contains(auth_error.lockedOut) ||
          message.contains(auth_error.permanentlyLockedOut)) {
        return false;
      }
      return false;
    }
  }
}
