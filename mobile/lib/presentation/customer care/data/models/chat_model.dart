import 'package:flutter/foundation.dart';

// ============================================================
// BASE RESPONSE MODEL
// ============================================================
class SupportApiResponse<T> {
  final int status;
  final String message;
  final T? data;

  SupportApiResponse({
    required this.status,
    required this.message,
    this.data,
  });

  factory SupportApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonT,
  ) {
    // ✅ FIX: Check both 'data' and 'response' fields
    // The API uses 'response' for the actual data
    final dataField = json['data'] ?? json['response'];

    debugPrint(
        '📦 SupportApiResponse.fromJson: status=${json['status']}, message=${json['message']}');
    debugPrint(
        '📦 SupportApiResponse.fromJson: dataField type: ${dataField.runtimeType}');

    return SupportApiResponse(
      status: json['status'] ?? 0,
      message: json['message'] ?? '',
      data: dataField != null ? fromJsonT(dataField) : null,
    );
  }

  bool get isSuccess => status >= 200 && status < 300;

  @override
  String toString() {
    return 'SupportApiResponse(status: $status, message: $message, data: ${data != null ? 'present' : 'null'})';
  }
}

// ============================================================
// CHAT MODEL
// ============================================================
class Chat {
  final int id;
  final int customerId;
  final String customerName;
  final String? customerEmail;
  final String? customerPhone;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final bool isActive;
  final int unreadCount;
  final String status; // 'active', 'resolved', 'closed'
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int? agentId;
  final String? agentName;

  Chat({
    required this.id,
    required this.customerId,
    required this.customerName,
    this.customerEmail,
    this.customerPhone,
    this.lastMessage,
    this.lastMessageTime,
    required this.isActive,
    required this.unreadCount,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.agentId,
    this.agentName,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 Chat.fromJson: Parsing chat data');
    return Chat(
      id: json['id'] ?? 0,
      customerId: json['customerId'] ?? json['customer_id'] ?? 0,
      customerName:
          json['customerName'] ?? json['customer_name'] ?? 'Unknown Customer',
      customerEmail: json['customerEmail'] ?? json['customer_email'],
      customerPhone: json['customerPhone'] ?? json['customer_phone'],
      lastMessage: json['lastMessage'] ?? json['last_message'],
      lastMessageTime:
          json['lastMessageTime'] != null || json['last_message_time'] != null
              ? DateTime.tryParse(
                  json['lastMessageTime'] ?? json['last_message_time'] ?? '')
              : null,
      isActive: json['isActive'] ?? json['is_active'] ?? false,
      unreadCount: json['unreadCount'] ?? json['unread_count'] ?? 0,
      status: json['status'] ?? 'active',
      createdAt: DateTime.parse(json['createdAt'] ??
          json['created_at'] ??
          DateTime.now().toIso8601String()),
      updatedAt: json['updatedAt'] != null || json['updated_at'] != null
          ? DateTime.tryParse(json['updatedAt'] ?? json['updated_at'] ?? '')
          : null,
      agentId: json['agentId'] ?? json['agent_id'],
      agentName: json['agentName'] ?? json['agent_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'lastMessage': lastMessage,
      'lastMessageTime': lastMessageTime?.toIso8601String(),
      'isActive': isActive,
      'unreadCount': unreadCount,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'agentId': agentId,
      'agentName': agentName,
    };
  }

  @override
  String toString() {
    return 'Chat(id: $id, customer: $customerName, status: $status, unread: $unreadCount)';
  }
}

// ============================================================
// MESSAGE MODEL
// ============================================================
class Message {
  final int id;
  final int chatId;
  final int senderId;
  final String senderType; // 'customer', 'agent', 'system'
  final String senderName;
  final String content;
  final String? attachmentUrl;
  final String? attachmentType; // 'image', 'file', 'audio'
  final bool isRead;
  final DateTime timestamp;
  final String? status; // 'sent', 'delivered', 'read'

  Message({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.senderType,
    required this.senderName,
    required this.content,
    this.attachmentUrl,
    this.attachmentType,
    required this.isRead,
    required this.timestamp,
    this.status,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 Message.fromJson: Parsing message data');
    return Message(
      id: json['id'] ?? 0,
      chatId: json['chatId'] ?? json['chat_id'] ?? 0,
      senderId: json['senderId'] ?? json['sender_id'] ?? 0,
      senderType: json['senderType'] ?? json['sender_type'] ?? 'customer',
      senderName: json['senderName'] ?? json['sender_name'] ?? 'Unknown',
      content: json['content'] ?? json['message'] ?? '',
      attachmentUrl: json['attachmentUrl'] ?? json['attachment_url'],
      attachmentType: json['attachmentType'] ?? json['attachment_type'],
      isRead: json['isRead'] ?? json['is_read'] ?? false,
      timestamp: DateTime.parse(json['timestamp'] ??
          json['createdAt'] ??
          json['created_at'] ??
          DateTime.now().toIso8601String()),
      status: json['status'] ?? 'sent',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chatId': chatId,
      'senderId': senderId,
      'senderType': senderType,
      'senderName': senderName,
      'content': content,
      'attachmentUrl': attachmentUrl,
      'attachmentType': attachmentType,
      'isRead': isRead,
      'timestamp': timestamp.toIso8601String(),
      'status': status,
    };
  }

  // For sending messages
  Map<String, dynamic> toSendJson() {
    return {
      'message': content,
      if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
    };
  }

  bool get isFromUser => senderType == 'customer';
  bool get isFromAgent => senderType == 'agent';
  bool get isSystem => senderType == 'system';

  @override
  String toString() {
    return 'Message(id: $id, sender: $senderName, content: "${content.length > 20 ? '${content.substring(0, 20)}...' : content}", timestamp: $timestamp)';
  }
}

// ============================================================
// CHAT COUNT MODEL
// ============================================================
class ChatCount {
  final int total;
  final int unread;
  final int active;
  final int resolved;

  ChatCount({
    required this.total,
    required this.unread,
    required this.active,
    required this.resolved,
  });

  factory ChatCount.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 ChatCount.fromJson: Parsing chat count data');
    return ChatCount(
      total: json['total'] ?? 0,
      unread: json['unread'] ?? json['unreadCount'] ?? 0,
      active: json['active'] ?? 0,
      resolved: json['resolved'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'unread': unread,
      'active': active,
      'resolved': resolved,
    };
  }

  @override
  String toString() {
    return 'ChatCount(total: $total, unread: $unread, active: $active, resolved: $resolved)';
  }
}
