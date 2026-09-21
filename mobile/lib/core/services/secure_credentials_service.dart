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
    return await _storage.read(key: _keyEnabled) == 'true';
  }

  static Future<({String email, String password})?> getCredentials() async {
    final email = await _storage.read(key: _keyEmail);
    final password = await _storage.read(key: _keyPassword);
    if (email == null || password == null) return null;
    return (email: email, password: password);
  }
}
