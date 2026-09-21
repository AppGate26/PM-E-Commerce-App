import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/order_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/order_repository.dart';

final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepository();
});

final ordersProvider = NotifierProvider<OrdersNotifier, AsyncValue<List<OrderModel>>>(() {
  return OrdersNotifier();
});

final orderStatisticsProvider = NotifierProvider<OrderStatisticsNotifier, AsyncValue<OrderStatisticsModel?>>(() {
  return OrderStatisticsNotifier();
});

class OrdersNotifier extends Notifier<AsyncValue<List<OrderModel>>> {
  @override
  AsyncValue<List<OrderModel>> build() {
    return const AsyncValue.data([]);
  }

  OrderRepository get _repo => ref.read(orderRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    print('🔍 [OrdersNotifier] User ID: ${user?.id}, User: ${user?.name}');
    return user?.id;
  }

  Future<void> fetchUserOrders() async {
    final userId = _userId;
    print('🔄 [OrdersNotifier] Fetching orders for user ID: $userId');
    
    if (userId == null || userId == 0) {
      print('⚠️ [OrdersNotifier] No valid user ID - returning empty list');
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      print('📡 [OrdersNotifier] Calling API for user $userId...');
      final orders = await _repo.getUserOrders(userId);
      print('✅ [OrdersNotifier] Successfully fetched ${orders.length} orders');
      for (var order in orders) {
        print('   - Order ${order.id}: ${order.orderNumber} - Status: ${order.status}');
      }
      state = AsyncValue.data(orders);
    } catch (e, st) {
      print('❌ [OrdersNotifier] Error fetching orders: $e');
      print('   Stack trace: $st');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> fetchUserOrdersByStatus(String status) async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final orders = await _repo.getUserOrdersByStatus(userId, status);
      state = AsyncValue.data(orders);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<bool> cancelOrder(int orderId) async {
    print('🚫 [OrdersNotifier] Cancelling order $orderId');
    try {
      await _repo.cancelOrder(orderId);
      print('✅ [OrdersNotifier] Order $orderId cancelled successfully');
      // Refresh orders after cancellation
      await fetchUserOrders();
      return true;
    } catch (e) {
      print('❌ [OrdersNotifier] Error cancelling order $orderId: $e');
      return false;
    }
  }

  Future<void> refreshOrders() async {
    await fetchUserOrders();
  }
}

class OrderStatisticsNotifier extends Notifier<AsyncValue<OrderStatisticsModel?>> {
  @override
  AsyncValue<OrderStatisticsModel?> build() {
    return const AsyncValue.data(null);
  }

  OrderRepository get _repo => ref.read(orderRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    return user?.id;
  }

  Future<void> fetchStatistics() async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data(null);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final statistics = await _repo.getUserOrderStatistics(userId);
      state = AsyncValue.data(statistics);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
