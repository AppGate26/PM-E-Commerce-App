// lib/core/services/delivery_auth_service.dart
import 'package:flutter/foundation.dart';

class DeliveryAuthService extends ChangeNotifier {
  static const String _deliveryEmail = "delivery@pm.com";
  static const String _deliveryPassword = "delivery123";

  bool _isDeliveryMode = false;
  
  bool get isDeliveryMode => _isDeliveryMode;
  
  bool checkDeliveryCredentials(String email, String password) {
    // Check if credentials match our delivery account
    if (email.toLowerCase() == _deliveryEmail && password == _deliveryPassword) {
      _isDeliveryMode = true;
      notifyListeners();
      return true;
    }
    _isDeliveryMode = false;
    notifyListeners();
    return false;
  }

  void logout() {
    _isDeliveryMode = false;
    notifyListeners();
  }
}