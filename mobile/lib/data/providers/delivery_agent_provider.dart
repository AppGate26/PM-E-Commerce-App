// lib/data/providers/delivery_agent_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/delivery_agent_model.dart';
import 'package:pm_e_commerce_app/data/repositories/delivery_agent_repository.dart';

final deliveryAgentRepositoryProvider = Provider<DeliveryAgentRepository>((ref) {
  return DeliveryAgentRepository();
});

final deliveryAgentProvider = NotifierProvider<DeliveryAgentNotifier, AsyncValue<DeliveryAgent?>>(() {
  return DeliveryAgentNotifier();
});

class DeliveryAgentNotifier extends Notifier<AsyncValue<DeliveryAgent?>> {
  @override
  AsyncValue<DeliveryAgent?> build() {
    return const AsyncValue.data(null);
  }

  DeliveryAgentRepository get _repo => ref.read(deliveryAgentRepositoryProvider);

  Future<DeliveryAgent> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      print('🔄 [DeliveryAgentProvider] Attempting login for: $email');
      final agent = await _repo.login(email, password);
      print('✅ [DeliveryAgentProvider] Login successful - riderId: ${agent.riderId}');
      state = AsyncValue.data(agent);
      return agent;
    } catch (e, st) {
      print('❌ [DeliveryAgentProvider] Login failed: $e');
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    print('🔄 [DeliveryAgentProvider] Logging out');
    state = const AsyncValue.data(null);
  }

  Future<String> forgotPassword(String email) async {
    try {
      print('🔄 [DeliveryAgentProvider] Forgot password for: $email');
      final result = await _repo.forgotPassword(email);
      print('✅ [DeliveryAgentProvider] Forgot password code received');
      return result;
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Forgot password failed: $e');
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
      print('🔄 [DeliveryAgentProvider] Changing password for riderId: $riderId, email: $email');
      print('🔄 [DeliveryAgentProvider] Using resetCode: ${resetCode != null}');
      await _repo.changePassword(
        riderId: riderId,
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword,
        resetCode: resetCode,
      );
      print('✅ [DeliveryAgentProvider] Password changed successfully');
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Change password failed: $e');
      rethrow;
    }
  }

  Future<List<PendingDelivery>> getPendingDeliveries(int riderId) async {
    try {
      print('🔄 [DeliveryAgentProvider] Fetching pending deliveries for riderId: $riderId');
      final deliveries = await _repo.getPendingDeliveries(riderId);
      print('✅ [DeliveryAgentProvider] Loaded ${deliveries.length} pending deliveries');
      return deliveries;
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Failed to fetch pending deliveries: $e');
      rethrow;
    }
  }

  Future<List<DeliveryHistory>> getDeliveryHistory(int riderId) async {
    try {
      print('🔄 [DeliveryAgentProvider] Fetching delivery history for riderId: $riderId');
      final history = await _repo.getDeliveryHistory(riderId);
      print('✅ [DeliveryAgentProvider] Loaded ${history.length} history records');
      return history;
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Failed to fetch delivery history: $e');
      rethrow;
    }
  }

  Future<DeliveryDetail> getDeliveryDetail(int riderBoxId) async {
    try {
      print('🔄 [DeliveryAgentProvider] Fetching delivery detail for riderBoxId: $riderBoxId');
      final detail = await _repo.getDeliveryDetail(riderBoxId);
      print('✅ [DeliveryAgentProvider] Loaded delivery detail');
      return detail;
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Failed to fetch delivery detail: $e');
      rethrow;
    }
  }

  Future<void> confirmDelivery({
    required int riderBoxId,
    required String deliveryAgentName,
    required String deliveryAddress,
    required String itemOfDelivery,
    String? proofOfDeliveryImagePath,
    DateTime? timeOfDelivery,
  }) async {
    try {
      print('🔄 [DeliveryAgentProvider] Confirming delivery for riderBoxId: $riderBoxId');
      await _repo.confirmDelivery(
        riderBoxId: riderBoxId,
        deliveryAgentName: deliveryAgentName,
        deliveryAddress: deliveryAddress,
        itemOfDelivery: itemOfDelivery,
        proofOfDeliveryImagePath: proofOfDeliveryImagePath,
        timeOfDelivery: timeOfDelivery,
      );
      print('✅ [DeliveryAgentProvider] Delivery confirmed successfully');
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Failed to confirm delivery: $e');
      rethrow;
    }
  }

  Future<void> submitFeedback({
    required int riderBoxId,
    required String deliveryAgentName,
    required int productId,
    required String customerName,
    required String status,
  }) async {
    try {
      print('🔄 [DeliveryAgentProvider] Submitting feedback for riderBoxId: $riderBoxId');
      await _repo.submitFeedback(
        riderBoxId: riderBoxId,
        deliveryAgentName: deliveryAgentName,
        productId: productId,
        customerName: customerName,
        status: status,
      );
      print('✅ [DeliveryAgentProvider] Feedback submitted successfully');
    } catch (e) {
      print('❌ [DeliveryAgentProvider] Failed to submit feedback: $e');
      rethrow;
    }
  }
}

