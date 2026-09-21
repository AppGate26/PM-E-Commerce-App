// lib/data/providers/goods_recovery_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/recovery_model.dart';
import 'package:pm_e_commerce_app/data/repositories/goods_recovery_repository.dart';

final goodsRecoveryRepositoryProvider = Provider<GoodsRecoveryRepository>((ref) {
  return GoodsRecoveryRepository();
});

final goodsRecoveryProvider = NotifierProvider<GoodsRecoveryNotifier, AsyncValue<RecoveryAgent?>>(() {
  return GoodsRecoveryNotifier();
});

class GoodsRecoveryNotifier extends Notifier<AsyncValue<RecoveryAgent?>> {
  @override
  AsyncValue<RecoveryAgent?> build() {
    return const AsyncValue.data(null);
  }

  GoodsRecoveryRepository get _repo => ref.read(goodsRecoveryRepositoryProvider);

  Future<RecoveryAgent> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      print('🔄 [GoodsRecoveryProvider] Attempting login for: $email');
      final agent = await _repo.login(email, password);
      print('✅ [GoodsRecoveryProvider] Login successful - agentId: ${agent.recoveryAgentId}');
      state = AsyncValue.data(agent);
      return agent;
    } catch (e, st) {
      print('❌ [GoodsRecoveryProvider] Login failed: $e');
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    print('🔄 [GoodsRecoveryProvider] Logging out');
    state = const AsyncValue.data(null);
  }

  Future<List<PendingRecovery>> getPendingRecoveries() async {
    try {
      print('🔄 [GoodsRecoveryProvider] Fetching pending recoveries');
      final recoveries = await _repo.getPendingRecoveries();
      print('✅ [GoodsRecoveryProvider] Loaded ${recoveries.length} pending recoveries');
      return recoveries;
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to fetch pending recoveries: $e');
      rethrow;
    }
  }

  Future<List<RecoveryReport>> getRecoveryReports() async {
    try {
      print('🔄 [GoodsRecoveryProvider] Fetching recovery reports');
      final reports = await _repo.getRecoveryReports();
      print('✅ [GoodsRecoveryProvider] Loaded ${reports.length} recovery reports');
      return reports;
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to fetch recovery reports: $e');
      rethrow;
    }
  }

  Future<RecoveryReport> getRecoveryReportById(int recoveryId) async {
    try {
      print('🔄 [GoodsRecoveryProvider] Fetching recovery report for recoveryId: $recoveryId');
      final report = await _repo.getRecoveryReportById(recoveryId);
      print('✅ [GoodsRecoveryProvider] Loaded recovery report');
      return report;
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to fetch recovery report: $e');
      rethrow;
    }
  }

  Future<CustomerDetail> getCustomerDetails(int customerId) async {
    try {
      print('🔄 [GoodsRecoveryProvider] Fetching customer details for customerId: $customerId');
      final customer = await _repo.getCustomerDetails(customerId);
      print('✅ [GoodsRecoveryProvider] Loaded customer details');
      return customer;
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to fetch customer details: $e');
      rethrow;
    }
  }

  Future<void> markAsRecovered({
    required int customerId,
    required int productId,
    required int recoveryAgentId,
    required int numberOfItemsRecovered,
    String? recoveryPhotoPath,
    DateTime? timeOfRecovery,
  }) async {
    try {
      print('🔄 [GoodsRecoveryProvider] Marking as recovered');
      await _repo.markAsRecovered(
        customerId: customerId,
        productId: productId,
        recoveryAgentId: recoveryAgentId,
        numberOfItemsRecovered: numberOfItemsRecovered,
        recoveryPhotoPath: recoveryPhotoPath,
        timeOfRecovery: timeOfRecovery,
      );
      print('✅ [GoodsRecoveryProvider] Marked as recovered successfully');
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to mark as recovered: $e');
      rethrow;
    }
  }

  Future<String> forgotPassword(String email) async {
    try {
      print('🔄 [GoodsRecoveryProvider] Forgot password for: $email');
      final result = await _repo.forgotPassword(email);
      print('✅ [GoodsRecoveryProvider] Forgot password successful');
      return result;
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to send forgot password: $e');
      rethrow;
    }
  }

  Future<void> changePassword({
    int? riderId,
    String? email,
    String? oldPassword,
    required String newPassword,
    String? resetCode,
  }) async {
    try {
      print('🔄 [GoodsRecoveryProvider] Changing password');
      await _repo.changePassword(
        riderId: riderId,
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword,
        resetCode: resetCode,
      );
      print('✅ [GoodsRecoveryProvider] Password changed successfully');
    } catch (e) {
      print('❌ [GoodsRecoveryProvider] Failed to change password: $e');
      rethrow;
    }
  }
}

