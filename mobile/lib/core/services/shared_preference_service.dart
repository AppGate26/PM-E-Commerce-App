import 'package:shared_preferences/shared_preferences.dart';

class SharedPreferenceService {
  static const String _keyOnboardingSeen = 'onboarding_seen';
  static const String _keyUserLoggedIn = 'user_logged_in';
  static const String _keyUserToken = 'user_token';
  static const String _keyBiometricPromptSeen = 'biometric_prompt_seen';

  // Onboarding methods
  static Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyOnboardingSeen) ?? false;
  }

  static Future<void> setOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyOnboardingSeen, true);
  }

  // User login methods
  static Future<bool> isUserLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyUserLoggedIn) ?? false;
  }

  static Future<void> setUserLoggedIn(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyUserLoggedIn, value);
  }

  static Future<String?> getUserToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyUserToken);
  }

  static Future<void> setUserToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUserToken, token);
  }

  static Future<void> clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUserLoggedIn);
    await prefs.remove(_keyUserToken);
  }

  // Whether we've already asked this device's user if they want
  // fingerprint login (so we don't ask again every time they say no)
  static Future<bool> hasSeenBiometricPrompt() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyBiometricPromptSeen) ?? false;
  }

  static Future<void> setBiometricPromptSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyBiometricPromptSeen, true);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
