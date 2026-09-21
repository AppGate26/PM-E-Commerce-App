import 'package:shared_preferences/shared_preferences.dart';

class SignupHelper {
  static const String _shouldShowPickupModalKey = 'should_show_pickup_modal';
  static const String _productIdKey = 'pending_product_id';
  static const String _actionTypeKey = 'pending_action_type';

  static Future<void> setPendingSignupAction({
    required String productId,
    required String actionType,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_shouldShowPickupModalKey, true);
    await prefs.setString(_productIdKey, productId);
    await prefs.setString(_actionTypeKey, actionType);
  }

  static Future<Map<String, dynamic>?> getPendingSignupAction() async {
    final prefs = await SharedPreferences.getInstance();
    final shouldShow = prefs.getBool(_shouldShowPickupModalKey) ?? false;
    
    if (shouldShow) {
      final productId = prefs.getString(_productIdKey);
      final actionType = prefs.getString(_actionTypeKey);
      
      if (productId != null && actionType != null) {
        return {
          'productId': productId,
          'actionType': actionType,
        };
      }
    }
    return null;
  }

  static Future<void> clearPendingSignupAction() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_shouldShowPickupModalKey);
    await prefs.remove(_productIdKey);
    await prefs.remove(_actionTypeKey);
  }
}