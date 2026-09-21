import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';
  static const String _onboardingKey = 'has_seen_onboarding';

  // ============================================================
  // TOKEN METHODS
  // ============================================================
  static Future<void> saveToken(String token) async {
    print('💾 [StorageService] Saving token...');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    print('💾 [StorageService] Token saved successfully');
  }

  static Future<String?> getToken() async {
    // print('💾 [StorageService] Getting token...');
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    // print(
    //     '💾 [StorageService] Token: ${token != null ? 'Found (${token.length} chars)' : 'Not found'}');
    return token;
  }

  static Future<void> removeToken() async {
    print('💾 [StorageService] Removing token...');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    print('💾 [StorageService] Token removed');
  }

  // ============================================================
  // USER DATA METHODS
  // ============================================================
  static Future<void> saveUserData(String userJson) async {
    print('💾 [StorageService] Saving user data...');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, userJson);
    print('💾 [StorageService] User data saved successfully');
  }

  static Future<String?> getUserData() async {
    print('💾 [StorageService] Getting user data...');
    final prefs = await SharedPreferences.getInstance();
    final userData = prefs.getString(_userKey);
    print(
        '💾 [StorageService] User data: ${userData != null ? 'Found' : 'Not found'}');
    return userData;
  }

  // ✅ NEW: Remove user data only (for session expiration)
  static Future<void> removeUserData() async {
    print('💾 [StorageService] Removing user data...');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    print('💾 [StorageService] User data removed');
  }

  // ✅ NEW: Remove both token and user data (full logout)
  static Future<void> removeAllAuthData() async {
    print('💾 [StorageService] Removing all auth data (token + user)...');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    print('💾 [StorageService] All auth data removed');
  }

  // ============================================================
  // ONBOARDING METHODS
  // ============================================================
  static Future<void> setOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
  }

  static Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  // ============================================================
  // CLEAR ALL DATA (For testing)
  // ============================================================
  static Future<void> clearAll() async {
    print('💾 [StorageService] Clearing all storage data...');
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    print('💾 [StorageService] All storage data cleared');
  }
}
