import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/notification_model.dart';
import 'package:pm_e_commerce_app/data/providers/notification_provider.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _filterType = 'all'; // 'all', 'unread', 'archived'

  @override
  void initState() {
    super.initState();
    // Fetch notifications when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).fetchNotifications();
      ref.read(notificationStatsProvider.notifier).fetchStats();
    });
  }

  void _handleMarkAsRead(NotificationModel notification) {
    if (!notification.isRead) {
      ref.read(notificationProvider.notifier).markAsRead(notification.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Notification marked as read'),
          backgroundColor: AppColors.blueBackground,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _handleArchive(NotificationModel notification) {
    ref
        .read(notificationProvider.notifier)
        .archiveNotification(notification.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(notification.isArchived
            ? 'Notification unarchived'
            : 'Notification archived'),
        backgroundColor: AppColors.blueBackground,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _handleMarkAllAsRead() {
    ref.read(notificationProvider.notifier).markAllAsRead();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read'),
        backgroundColor: AppColors.blueBackground,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _refreshNotifications() {
    ref.read(notificationProvider.notifier).refreshNotifications();
    ref.read(notificationStatsProvider.notifier).fetchStats();
  }

  @override
  Widget build(BuildContext context) {
    final notificationsState = ref.watch(notificationProvider);
    final statsState = ref.watch(notificationStatsProvider);

    return Scaffold(
      backgroundColor: AppColors.whiteBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Header Section
            Container(
              height: 60,
              width: double.infinity,
              color: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.textLight,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Notifications',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textLight,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.refresh,
                      color: AppColors.textLight,
                    ),
                    onPressed: _refreshNotifications,
                    tooltip: 'Refresh',
                  ),
                ],
              ),
            ),

            // Stats Bar (if available)
            statsState.when(
              data: (stats) {
                if (stats != null && stats.total > 0) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    color: AppColors.blueBackground.withOpacity(0.1),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem('Total', stats.total.toString(),
                            AppColors.blueBackground),
                        _buildStatItem(
                            'Unread', stats.unread.toString(), Colors.orange),
                        _buildStatItem(
                            'Read', stats.read.toString(), Colors.green),
                        if (stats.unread > 0)
                          TextButton.icon(
                            onPressed: _handleMarkAllAsRead,
                            icon: const Icon(Icons.done_all, size: 16),
                            label: const Text('Mark all read'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.blueBackground,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                            ),
                          ),
                      ],
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // Notifications List
            Expanded(
              child: notificationsState.when(
                data: (notifications) {
                  if (notifications.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.notifications_none,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No notifications',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'You\'re all caught up!',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  // Filter notifications based on filter type
                  final filteredNotifications = _filterType == 'unread'
                      ? notifications
                          .where((n) => !n.isRead && !n.isArchived)
                          .toList()
                      : _filterType == 'archived'
                          ? notifications.where((n) => n.isArchived).toList()
                          : notifications.where((n) => !n.isArchived).toList();

                  if (filteredNotifications.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _filterType == 'unread'
                                ? Icons.mark_email_read
                                : Icons.archive,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _filterType == 'unread'
                                ? 'No unread notifications'
                                : 'No archived notifications',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return Column(
                    children: [
                      // Filter Tabs
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            _buildFilterChip(
                                'All', 'all', _filterType == 'all'),
                            const SizedBox(width: 8),
                            _buildFilterChip(
                                'Unread', 'unread', _filterType == 'unread'),
                            const SizedBox(width: 8),
                            _buildFilterChip('Archived', 'archived',
                                _filterType == 'archived'),
                          ],
                        ),
                      ),
                      Expanded(
                        child: ListView.separated(
                          padding: EdgeInsets.zero,
                          itemCount: filteredNotifications.length,
                          separatorBuilder: (context, index) => const Divider(
                            height: 1,
                            thickness: 1,
                            color: Color(0xFFE0E0E0),
                          ),
                          itemBuilder: (context, index) {
                            final notification = filteredNotifications[index];
                            return _buildNotificationItem(notification);
                          },
                        ),
                      ),
                    ],
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(),
                ),
                error: (error, stackTrace) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Failed to load notifications',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.red[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          error.toString(),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _refreshNotifications,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value, bool isSelected) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _filterType = value;
        });
      },
      selectedColor: AppColors.blueBackground,
      checkmarkColor: AppColors.textLight,
      labelStyle: TextStyle(
        color: isSelected ? AppColors.textLight : Colors.grey[700],
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
    );
  }

  Widget _buildNotificationItem(NotificationModel notification) {
    final isUnread = !notification.isRead;
    final timeAgo = _getTimeAgo(notification.createdAt);

    return InkWell(
      onTap: () => _handleMarkAsRead(notification),
      child: Container(
        color: isUnread
            ? AppColors.blueBackground.withOpacity(0.05)
            : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Unread indicator
            if (isUnread)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 6, right: 12),
                decoration: const BoxDecoration(
                  color: AppColors.blueBackground,
                  shape: BoxShape.circle,
                ),
              )
            else
              const SizedBox(width: 20),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                                isUnread ? FontWeight.w600 : FontWeight.w500,
                            color: AppColors.blueBackground,
                          ),
                        ),
                      ),
                      // Type badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color:
                              _getTypeColor(notification.type).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          notification.type.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: _getTypeColor(notification.type),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    notification.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: const Color(0xFF666666),
                      height: 1.4,
                      fontWeight:
                          isUnread ? FontWeight.w400 : FontWeight.normal,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        timeAgo,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                      const Spacer(),
                      // Action buttons
                      if (!notification.isArchived)
                        IconButton(
                          icon: Icon(
                            notification.isRead
                                ? Icons.mark_email_unread
                                : Icons.mark_email_read,
                            size: 18,
                            color: Colors.grey[600],
                          ),
                          onPressed: () => _handleMarkAsRead(notification),
                          tooltip: notification.isRead
                              ? 'Mark as unread'
                              : 'Mark as read',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: Icon(
                          notification.isArchived
                              ? Icons.unarchive
                              : Icons.archive,
                          size: 18,
                          color: Colors.grey[600],
                        ),
                        onPressed: () => _handleArchive(notification),
                        tooltip:
                            notification.isArchived ? 'Unarchive' : 'Archive',
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return Colors.blue;
      case 'PROMOTION':
        return Colors.orange;
      case 'SYSTEM':
        return Colors.purple;
      case 'PAYMENT':
        return Colors.green;
      default:
        return AppColors.blueBackground;
    }
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 7) {
      return DateFormat('MMM d, y').format(dateTime);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
