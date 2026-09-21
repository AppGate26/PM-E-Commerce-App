import 'package:flutter/foundation.dart';

class RecoveryAuthService extends ChangeNotifier {
  static const String _recoveryEmail = "recovery@pm.com";
  static const String _recoveryPassword = "recovery123";

  bool _isRecoveryMode = false;

  bool get isRecoveryMode => _isRecoveryMode;

  bool checkRecoveryCredentials(String email, String password) {
    if (email.toLowerCase() == _recoveryEmail && password == _recoveryPassword) {
      _isRecoveryMode = true;
      notifyListeners();
      return true;
    }
    _isRecoveryMode = false;
    notifyListeners();
    return false;
  }

  void logout() {
    _isRecoveryMode = false;
    notifyListeners();
  }
}