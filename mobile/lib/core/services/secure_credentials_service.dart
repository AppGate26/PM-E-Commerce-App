import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Encrypted, biometric-gated storage for the credentials needed to
/// silently replay a login (Keychain on iOS, EncryptedSharedPreferences /
/// Keystore-backed on Android). Never put this data in SharedPreferences.
class SecureCredentialsService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyEmail = 'biometric_email';
  static const _keyPassword = 'biometric_password';
  static const _keyEnabled = 'biometric_login_enabled';

  static Future<void> enable(String email, String password) async {
    await _storage.write(key: _keyEmail, value: email);
    await _storage.write(key: _keyPassword, value: password);
    await _storage.write(key: _keyEnabled, value: 'true');
  }

  static Future<void> disable() async {
    await _storage.delete(key: _keyEmail);
    await _storage.delete(key: _keyPassword);
    await _storage.delete(key: _keyEnabled);
  }

  static Future<bool> isEnabled() async {
    try {
      return await _storage.read(key: _keyEnabled) == 'true';
    } catch (e) {
      // Reads throw when the Keystore key is gone but the encrypted prefs
      // file survived — happens after an Android backup/restore onto a new
      // phone. Treat it as "not set up" and clear the wreckage so the user
      // gets offered enrollment again instead of a button that does nothing.
      debugPrint('[SecureCredentials] isEnabled() failed, resetting: $e');
      await _safeDisable();
      return false;
    }
  }

  static Future<({String email, String password})?> getCredentials() async {
    try {
      final email = await _storage.read(key: _keyEmail);
      final password = await _storage.read(key: _keyPassword);
      if (email == null || password == null) {
        await _safeDisable();
        return null;
      }
      return (email: email, password: password);
    } catch (e) {
      debugPrint('[SecureCredentials] getCredentials() failed, resetting: $e');
      await _safeDisable();
      return null;
    }
  }

  static Future<void> _safeDisable() async {
    try {
      await disable();
    } catch (e) {
      debugPrint('[SecureCredentials] disable() failed: $e');
    }
  }
}
