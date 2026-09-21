import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/notification_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/notification_repository.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository();
});

final notificationProvider = NotifierProvider<NotificationNotifier, AsyncValue<List<NotificationModel>>>(() {
  return NotificationNotifier();
});

final notificationStatsProvider = NotifierProvider<NotificationStatsNotifier, AsyncValue<NotificationStats?>>(() {
  return NotificationStatsNotifier();
});

class NotificationNotifier extends Notifier<AsyncValue<List<NotificationModel>>> {
  @override
  AsyncValue<List<NotificationModel>> build() {
    // Load notifications when provider is first accessed
    Future.microtask(() => fetchNotifications());
    return const AsyncValue.loading();
  }

  NotificationRepository get _repo => ref.read(notificationRepositoryProvider);

  Future<void> fetchNotifications() async {
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        throw 'User not authenticated';
      }

      final notifications = await _repo.getUserNotifications(user.id);
      state = AsyncValue.data(notifications);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshNotifications() async {
    await fetchNotifications();
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      await _repo.markAsRead(notificationId);
      // Refresh notifications after marking as read
      await fetchNotifications();
      // Also refresh stats
      ref.read(notificationStatsProvider.notifier).fetchStats();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> archiveNotification(int notificationId) async {
    try {
      await _repo.archiveNotification(notificationId);
      // Refresh notifications after archiving
      await fetchNotifications();
      // Also refresh stats
      ref.read(notificationStatsProvider.notifier).fetchStats();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        throw 'User not authenticated';
      }

      await _repo.markAllAsRead(user.id);
      // Refresh notifications after marking all as read
      await fetchNotifications();
      // Also refresh stats
      ref.read(notificationStatsProvider.notifier).fetchStats();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> fetchUnreadNotifications() async {
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        throw 'User not authenticated';
      }

      final notifications = await _repo.getUnreadNotifications(user.id);
      state = AsyncValue.data(notifications);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> fetchNotificationsByType(String type) async {
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        throw 'User not authenticated';
      }

      final notifications = await _repo.getNotificationsByType(user.id, type);
      state = AsyncValue.data(notifications);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class NotificationStatsNotifier extends Notifier<AsyncValue<NotificationStats?>> {
  @override
  AsyncValue<NotificationStats?> build() {
    Future.microtask(() => fetchStats());
    return const AsyncValue.loading();
  }

  NotificationRepository get _repo => ref.read(notificationRepositoryProvider);

  Future<void> fetchStats() async {
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        state = const AsyncValue.data(null);
        return;
      }

      final stats = await _repo.getNotificationStats(user.id);
      state = AsyncValue.data(stats);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}