// lib/core/services/delivery_alert_service.dart
import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:pm_e_commerce_app/core/routes/app_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/models/delivery_messaging_model.dart';
import 'package:pm_e_commerce_app/data/repositories/delivery_agent_repository.dart';
import 'package:pm_e_commerce_app/presentation/delivery/delivery_session.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Shows delivery-app notifications (new assignments, status changes, chat messages) as
/// phone notifications.
///
/// There is no push service (Firebase) behind the app, so this polls the delivery
/// notification and chat endpoints while the app is running - in the foreground or in
/// the background - and raises a local notification for anything new. Nothing arrives
/// once the app has been closed/killed; whatever came in meanwhile is shown the next
/// time the rider opens the app.
class DeliveryAlertService {
  DeliveryAlertService._();
  static final DeliveryAlertService instance = DeliveryAlertService._();

  static const Duration _pollInterval = Duration(seconds: 15);
  static const String _channelId = 'delivery_alerts';
  static const String _channelName = 'Delivery alerts';
  static const int _chatIdBase = 1000000;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  final DeliveryAgentRepository _repo = DeliveryAgentRepository();

  bool _initialized = false;
  Timer? _timer;
  bool _polling = false;
  int? _riderId;
  // Unread count per chat contact from the previous poll; null until the first poll so
  // messages that were already unread don't all pop up at once.
  Map<int, int>? _chatUnread;

  bool get _supported => !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  Future<void> _init() async {
    if (_initialized || !_supported) return;
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (response) {
        final route = response.payload;
        if (route != null && route.isNotEmpty) {
          AppRouter.router.push(route);
        }
      },
    );
    if (Platform.isAndroid) {
      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    } else if (Platform.isIOS) {
      await _plugin
          .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin>()
          ?.requestPermissions(alert: true, badge: true, sound: true);
    }
    _initialized = true;
  }

  /// Starts watching for the logged-in rider. Safe to call more than once.
  Future<void> start() async {
    if (!_supported) return;
    try {
      await _init();
    } catch (e) {
      debugPrint('⚠️ [DeliveryAlerts] Could not initialise notifications: $e');
      return;
    }
    final riderId = await currentRiderId();
    if (riderId == null) return;
    if (_timer != null && _riderId == riderId) return;

    stop();
    _riderId = riderId;
    await _poll();
    _timer = Timer.periodic(_pollInterval, (_) => _poll());
  }

  /// Stops watching (on logout).
  void stop() {
    _timer?.cancel();
    _timer = null;
    _riderId = null;
    _chatUnread = null;
  }

  Future<void> _poll() async {
    final riderId = _riderId;
    if (riderId == null || _polling) return;
    _polling = true;
    try {
      await _checkNotifications(riderId);
      await _checkChat();
    } finally {
      _polling = false;
    }
  }

  String _lastSeenKey(int riderId) => 'delivery_alerts_last_id_$riderId';

  Future<void> _checkNotifications(int riderId) async {
    try {
      final page = await _repo.getNotifications(riderId);
      if (page.items.isEmpty) return;
      final prefs = await SharedPreferences.getInstance();
      final lastSeen = prefs.getInt(_lastSeenKey(riderId));
      final newest = page.items.map((n) => n.id).reduce((a, b) => a > b ? a : b);

      // First run for this rider: remember where we are instead of replaying history.
      if (lastSeen == null) {
        await prefs.setInt(_lastSeenKey(riderId), newest);
        return;
      }

      final fresh = page.items
          .where((n) => n.id > lastSeen && !n.isRead)
          .toList()
        ..sort((a, b) => a.id.compareTo(b.id));
      for (final n in fresh) {
        await _show(
          id: n.id,
          title: _titleFor(n.type),
          body: n.message,
          route: _routeFor(n.type),
        );
      }
      if (newest > lastSeen) {
        await prefs.setInt(_lastSeenKey(riderId), newest);
      }
    } catch (e) {
      debugPrint('⚠️ [DeliveryAlerts] Notification poll failed: $e');
    }
  }

  Future<void> _checkChat() async {
    try {
      final contacts = await _repo.getChatContacts();
      final previous = _chatUnread;
      final current = <int, int>{
        for (final c in contacts) c.userId: c.unreadCount,
      };
      _chatUnread = current;
      if (previous == null) return;

      for (final ChatContact c in contacts) {
        if (c.unreadCount > (previous[c.userId] ?? 0)) {
          await _show(
            id: _chatIdBase + c.userId,
            title: 'New message from ${c.name}',
            body: c.lastMessage ?? 'You have ${c.unreadCount} unread message(s)',
            route: AppRoutes.deliveryChatList,
          );
        }
      }
    } catch (e) {
      debugPrint('⚠️ [DeliveryAlerts] Chat poll failed: $e');
    }
  }

  Future<void> _show({
    required int id,
    required String title,
    required String body,
    required String route,
  }) {
    return _plugin.show(
      id: id,
      title: title,
      body: body,
      payload: route,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: 'New deliveries, delivery updates and messages',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  // Same wording and tap targets as DeliveryNotificationsScreen.
  String _titleFor(String type) {
    switch (type) {
      case 'ORDER_ASSIGNED':
        return 'New delivery assigned';
      case 'IN_TRANSIT':
        return 'Delivery started';
      case 'DELIVERED':
        return 'Delivery completed';
      case 'REJECTED':
        return 'Delivery removed';
      case 'FAILED':
        return 'Delivery not completed';
      default:
        return 'Delivery update';
    }
  }

  String _routeFor(String type) {
    switch (type) {
      case 'ORDER_ASSIGNED':
      case 'IN_TRANSIT':
        return AppRoutes.pendingDeliveries;
      case 'DELIVERED':
        return AppRoutes.deliveryHistory;
      default:
        return AppRoutes.deliveryNotifications;
    }
  }
}
