import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth/error_codes.dart' as auth_error;

/// Why a biometric prompt ended the way it did. Callers need this to tell
/// "the user tapped cancel" apart from "this phone can't do it at all" —
/// returning a bare bool made every failure look identical on-screen.
enum BiometricOutcome {
  success,

  /// User dismissed the sheet, or the OS cancelled it (e.g. the launcher
  /// stole focus). Not an error — say nothing.
  canceled,

  /// Fingerprint/face read failed too many times. Temporary (30s) lockout.
  lockedOut,

  /// Locked out until the device passcode is entered in Settings.
  permanentlyLockedOut,

  /// Hardware exists but the user hasn't registered a fingerprint/face.
  notEnrolled,

  /// No usable sensor, or the OS refused the request (common on phones with
  /// a Class 2 / "weak" sensor when strong biometrics are demanded).
  notAvailable,

  /// Anything else — see the logged code for the real reason.
  unknown,
}

class BiometricResult {
  const BiometricResult(this.outcome, {this.code, this.message});

  final BiometricOutcome outcome;

  /// Raw PlatformException code, kept for logging/bug reports.
  final String? code;
  final String? message;

  bool get isSuccess => outcome == BiometricOutcome.success;

  /// What to show the user, or null when they cancelled deliberately.
  String? get userMessage {
    switch (outcome) {
      case BiometricOutcome.success:
      case BiometricOutcome.canceled:
        return null;
      case BiometricOutcome.lockedOut:
        return 'Too many failed attempts. Wait a moment and try again, '
            'or sign in with your password.';
      case BiometricOutcome.permanentlyLockedOut:
        return 'Fingerprint is locked. Unlock your phone with your PIN or '
            'pattern first, then try again.';
      case BiometricOutcome.notEnrolled:
        return 'No fingerprint is set up on this phone. Add one in your '
            "phone's Settings, then try again.";
      case BiometricOutcome.notAvailable:
        return "This phone can't use fingerprint login. Please sign in with "
            'your password.';
      case BiometricOutcome.unknown:
        return 'Fingerprint login failed. Please sign in with your password.';
    }
  }
}

class BiometricService {
  static final LocalAuthentication _auth = LocalAuthentication();

  /// Whether this device can show a biometric prompt right now.
  ///
  /// Deliberately does NOT check `getAvailableBiometrics()`: several OEM
  /// builds return an empty list even with a fingerprint enrolled, which
  /// silently hid the whole feature on those phones. `canCheckBiometrics`
  /// plus `isDeviceSupported` is the reliable pair — anything past that we
  /// find out from the prompt itself, and now report properly.
  static Future<bool> isAvailable() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      return canCheck && isSupported;
    } catch (e) {
      debugPrint('[Biometric] isAvailable() failed: $e');
      return false;
    }
  }

  /// Which biometrics the OS reports. Only for diagnostics — never gate the
  /// UI on this, see the note on [isAvailable].
  static Future<List<BiometricType>> enrolledTypes() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      debugPrint('[Biometric] getAvailableBiometrics() failed: $e');
      return const [];
    }
  }

  /// Prompts the OS biometric sheet (fingerprint / Face ID).
  ///
  /// `biometricOnly` is false so phones whose sensor the OS classes as weak
  /// can still fall back to the device PIN/pattern instead of failing with
  /// no way forward.
  static Future<BiometricResult> authenticate({
    String reason = 'Authenticate to log in',
  }) async {
    try {
      final ok = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
      return BiometricResult(
        ok ? BiometricOutcome.success : BiometricOutcome.canceled,
      );
    } on PlatformException catch (e) {
      debugPrint('[Biometric] authenticate() failed: ${e.code} — ${e.message}');
      return BiometricResult(_outcomeFor(e.code),
          code: e.code, message: e.message);
    } catch (e) {
      debugPrint('[Biometric] authenticate() threw: $e');
      return BiometricResult(BiometricOutcome.unknown, message: e.toString());
    }
  }

  static BiometricOutcome _outcomeFor(String code) {
    switch (code) {
      case auth_error.notEnrolled:
        return BiometricOutcome.notEnrolled;
      case auth_error.lockedOut:
        return BiometricOutcome.lockedOut;
      case auth_error.permanentlyLockedOut:
        return BiometricOutcome.permanentlyLockedOut;
      case auth_error.notAvailable:
      // Literals rather than package constants: these are the raw codes the
      // platform channel sends, and they don't all have a stable exported
      // constant across local_auth versions.
      case 'PasscodeNotSet':
      case 'NoHardware':
      case 'biometricOnlyNotSupported':
        return BiometricOutcome.notAvailable;
      default:
        return BiometricOutcome.unknown;
    }
  }
}
