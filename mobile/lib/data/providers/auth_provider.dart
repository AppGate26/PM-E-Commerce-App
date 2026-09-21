import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/user_model.dart';
import 'package:pm_e_commerce_app/data/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final authProvider = NotifierProvider<AuthNotifier, AsyncValue<UserModel?>>(() {
  return AuthNotifier();
});

class AuthNotifier extends Notifier<AsyncValue<UserModel?>> {
  String? _lastRegistrationMessage;

  @override
  AsyncValue<UserModel?> build() {
    // Initialize with loading state, then load stored user
    Future.microtask(() => _loadStoredUser());
    return const AsyncValue.loading();
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  String? get lastRegistrationMessage => _lastRegistrationMessage;

  Future<void> _loadStoredUser() async {
    try {
      final user = await _repo.getStoredUser();
      if (user != null) {
        state = AsyncValue.data(user);
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _repo.login(email, password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> register(String firstName, String lastName, String phoneNumber,
      String email, String password) async {
    state = const AsyncValue.loading();
    _lastRegistrationMessage = null; // Reset message
    try {
      final result = await _repo.register(
          firstName, lastName, phoneNumber, email, password);
      // Store the message
      _lastRegistrationMessage = result.message;
      state = AsyncValue.data(result.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<String> forgotPassword(String email) async {
    try {
      final message = await _repo.forgotPassword(email);
      return message;
    } catch (e) {
      rethrow;
    }
  }

  Future<String> resetPassword(
      String email, String password, String resetOtp) async {
    try {
      final message = await _repo.resetPassword(email, password, resetOtp);
      return message;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncValue.data(null);
  }

    Future<void> clearUserData() async {
    print('🔄 [AuthNotifier] Clearing user data on session expiration');
    await _repo.logout(); // This clears token and storage
    state = const AsyncValue.data(null);
  }

}
