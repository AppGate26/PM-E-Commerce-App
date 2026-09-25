// lib/presentation/delivery/screens/delivery_notifications_screen.dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/delivery_messaging_model.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';
import 'package:pm_e_commerce_app/presentation/delivery/delivery_session.dart';

/// Delivery events for this rider: new assignments, trips started, deliveries completed or
/// taken off them. No push service is set up, so the list refreshes itself while open.
class DeliveryNotificationsScreen extends ConsumerStatefulWidget {
  const DeliveryNotificationsScreen({super.key});

  @override
  ConsumerState<DeliveryNotificationsScreen> createState() =>
      _DeliveryNotificationsScreenState();
}

class _DeliveryNotificationsScreenState
    extends ConsumerState<DeliveryNotificationsScreen> {
  static const _refreshInterval = Duration(seconds: 30);

  int? _riderId;
  List<RiderNotification> _items = [];
  bool _isLoading = true;
  String? _error;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _riderId = await currentRiderId();
    if (_riderId == null) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Please log in again.';
        });
      }
      return;
    }
    await _load();
    _timer = Timer.periodic(_refreshInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (_riderId == null) return;
    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }
    try {
      final page = await ref.read(deliveryAgentRepositoryProvider).getNotifications(_riderId!);
      if (!mounted) return;
      setState(() {
        _items = page.items;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        if (!silent) _error = e.toString();
      });
    }
  }

  Future<void> _open(RiderNotification n) async {
    if (!n.isRead && _riderId != null) {
      setState(() {
        _items = _items.map((i) => i.id == n.id ? i.copyWith(isRead: true) : i).toList();
      });
      try {
        await ref.read(deliveryAgentRepositoryProvider).markNotificationRead(_riderId!, n.id);
      } catch (_) {
        // Stays read locally; the next refresh shows the server's view.
      }
    }
    if (!mounted) return;
    if (n.type == 'ORDER_ASSIGNED' || n.type == 'IN_TRANSIT') {
      context.push(AppRoutes.pendingDeliveries);
    } else if (n.type == 'DELIVERED') {
      context.push(AppRoutes.deliveryHistory);
    }
  }

  Future<void> _markAllRead() async {
    if (_riderId == null) return;
    setState(() {
      _items = _items.map((i) => i.copyWith(isRead: true)).toList();
    });
    try {
      await ref.read(deliveryAgentRepositoryProvider).markAllNotificationsRead(_riderId!);
    } catch (_) {}
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'ORDER_ASSIGNED':
        return Icons.assignment_outlined;
      case 'IN_TRANSIT':
        return Icons.local_shipping_outlined;
      case 'DELIVERED':
        return Icons.check_circle_outline;
      case 'REJECTED':
        return Icons.cancel_outlined;
      default:
        return Icons.notifications_none;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'ORDER_ASSIGNED':
        return AppColors.blueBackground;
      case 'IN_TRANSIT':
        return const Color(0xFF6A3FC1);
      case 'DELIVERED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

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
      default:
        return type.replaceAll('_', ' ');
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _items.any((n) => !n.isRead);

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontWeight: FontWeight.w500,
            color: AppColors.textLight,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.canPop() ? context.pop() : context.go(AppRoutes.deliveryHome),
        ),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read', style: TextStyle(color: Colors.white)),
            ),
        ],
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _items.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 120),
                            Center(
                              child: Text('No notifications yet',
                                  style: TextStyle(fontSize: 16, color: Colors.grey)),
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final n = _items[index];
                            final color = _colorFor(n.type);
                            return InkWell(
                              onTap: () => _open(n),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: n.isRead ? Colors.white : const Color(0xFFEAF3FF),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: const [
                                    BoxShadow(color: Color(0x0D000000), blurRadius: 8, offset: Offset(0, 2)),
                                  ],
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    CircleAvatar(
                                      radius: 20,
                                      backgroundColor: color.withOpacity(0.12),
                                      child: Icon(_iconFor(n.type), color: color),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _titleFor(n.type),
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: n.isRead ? FontWeight.w500 : FontWeight.w700,
                                              color: const Color(0xFF222222),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            n.message,
                                            style: const TextStyle(fontSize: 13, color: Color(0xFF555555)),
                                          ),
                                          if (n.date != null) ...[
                                            const SizedBox(height: 6),
                                            Text(
                                              DateFormat('dd MMM yyyy, h:mm a').format(n.date!),
                                              style: const TextStyle(fontSize: 11, color: Color(0xFF888888)),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (!n.isRead)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        margin: const EdgeInsets.only(top: 6, left: 6),
                                        decoration: const BoxDecoration(
                                          color: AppColors.blueBackground,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
