// lib/data/models/delivery_messaging_model.dart
// Rider-side notifications and dispatch chat - see DeliveryAgentRepository.

int _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

DateTime? _asDate(dynamic value) {
  if (value == null) return null;
  // Spring may serialise LocalDateTime as an ISO string or as [y, m, d, h, min, s, nanos].
  if (value is List && value.length >= 3) {
    final parts = value.map(_asInt).toList();
    return DateTime(
      parts[0],
      parts[1],
      parts[2],
      parts.length > 3 ? parts[3] : 0,
      parts.length > 4 ? parts[4] : 0,
      parts.length > 5 ? parts[5] : 0,
    );
  }
  return DateTime.tryParse(value.toString());
}

class RiderNotification {
  final int id;

  /// ORDER_ASSIGNED, IN_TRANSIT, DELIVERED or REJECTED.
  final String type;
  final String message;
  final String? customerName;
  final String? productName;
  final String? deliveryAddress;
  final bool isRead;
  final DateTime? date;

  RiderNotification({
    required this.id,
    required this.type,
    required this.message,
    this.customerName,
    this.productName,
    this.deliveryAddress,
    required this.isRead,
    this.date,
  });

  factory RiderNotification.fromJson(Map<String, dynamic> json) {
    return RiderNotification(
      id: _asInt(json['id']),
      type: json['notificationType']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      customerName: json['customerName']?.toString(),
      productName: json['productName']?.toString(),
      deliveryAddress: json['deliveryAddress']?.toString(),
      isRead: json['isRead'] == true,
      date: _asDate(json['notificationDate'] ?? json['createdAt']),
    );
  }

  RiderNotification copyWith({bool? isRead}) => RiderNotification(
        id: id,
        type: type,
        message: message,
        customerName: customerName,
        productName: productName,
        deliveryAddress: deliveryAddress,
        isRead: isRead ?? this.isRead,
        date: date,
      );
}

class RiderNotificationPage {
  final List<RiderNotification> items;
  final int unreadCount;

  RiderNotificationPage({required this.items, required this.unreadCount});
}

class ChatContact {
  final int userId;
  final String name;
  final String? role;
  final bool isOnline;
  final int unreadCount;
  final String? lastMessage;
  final DateTime? lastMessageAt;

  ChatContact({
    required this.userId,
    required this.name,
    this.role,
    required this.isOnline,
    required this.unreadCount,
    this.lastMessage,
    this.lastMessageAt,
  });

  String get roleLabel {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'Dispatch / Admin';
      case 'BRANCH_MANAGER':
        return 'Branch Manager';
      default:
        return role?.replaceAll('_', ' ') ?? '';
    }
  }

  factory ChatContact.fromJson(Map<String, dynamic> json) {
    return ChatContact(
      userId: _asInt(json['userId']),
      name: json['name']?.toString() ?? 'Unknown',
      role: json['role']?.toString(),
      isOnline: json['isOnline'] == true,
      unreadCount: _asInt(json['unreadCount']),
      lastMessage: json['lastMessage']?.toString(),
      lastMessageAt: _asDate(json['lastMessageAt']),
    );
  }
}

class ChatMessage {
  final int id;
  final String message;
  final DateTime? sentAt;
  final bool fromMe;

  ChatMessage({
    required this.id,
    required this.message,
    this.sentAt,
    required this.fromMe,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: _asInt(json['id']),
      message: json['message']?.toString() ?? '',
      sentAt: _asDate(json['sentAt']),
      fromMe: json['fromMe'] == true,
    );
  }
}
