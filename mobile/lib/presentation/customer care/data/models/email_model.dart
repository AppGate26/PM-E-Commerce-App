import 'package:flutter/foundation.dart';

// ============================================================
// EMAIL TICKET MODEL
// ============================================================
class EmailTicket {
  final int id;
  final String ticketId;
  final String subject;
  final String message;
  final String customerName;
  final String customerEmail;
  final String? customerPhone;
  final String status; // 'open', 'in_progress', 'resolved', 'closed'
  final String priority; // 'low', 'medium', 'high', 'urgent'
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? resolvedAt;
  final int? agentId;
  final String? agentName;
  final List<EmailReply> replies;

  EmailTicket({
    required this.id,
    required this.ticketId,
    required this.subject,
    required this.message,
    required this.customerName,
    required this.customerEmail,
    this.customerPhone,
    required this.status,
    required this.priority,
    required this.createdAt,
    this.updatedAt,
    this.resolvedAt,
    this.agentId,
    this.agentName,
    this.replies = const [],
  });

  factory EmailTicket.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 EmailTicket.fromJson: Parsing email ticket data');
    debugPrint('📦 EmailTicket.fromJson: JSON keys: ${json.keys}');

    // ✅ Handle both 'data' (Swagger) and 'response' (Actual API)
    final data = json['data'] ?? json['response'] ?? json;

    debugPrint('📦 EmailTicket.fromJson: data keys: ${data.keys}');

    return EmailTicket(
      id: data['id'] ?? 0,
      ticketId: data['ticketId'] ?? data['ticket_id'] ?? '',
      subject: data['subject'] ?? 'No Subject',
      message: data['message'] ?? data['content'] ?? '',
      customerName:
          data['customerName'] ?? data['customer_name'] ?? 'Unknown Customer',
      customerEmail: data['customerEmail'] ?? data['customer_email'] ?? '',
      customerPhone: data['customerPhone'] ?? data['customer_phone'],
      status: data['status'] ?? 'open',
      priority: data['priority'] ?? 'medium',
      createdAt: DateTime.parse(data['createdAt'] ??
          data['created_at'] ??
          DateTime.now().toIso8601String()),
      updatedAt: data['updatedAt'] != null || data['updated_at'] != null
          ? DateTime.tryParse(data['updatedAt'] ?? data['updated_at'] ?? '')
          : null,
      resolvedAt: data['resolvedAt'] != null || data['resolved_at'] != null
          ? DateTime.tryParse(data['resolvedAt'] ?? data['resolved_at'] ?? '')
          : null,
      agentId: data['agentId'] ?? data['agent_id'],
      agentName: data['agentName'] ?? data['agent_name'],
      replies: data['replies'] != null
          ? (data['replies'] as List)
              .map((r) => EmailReply.fromJson(r))
              .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketId': ticketId,
      'subject': subject,
      'message': message,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'status': status,
      'priority': priority,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'resolvedAt': resolvedAt?.toIso8601String(),
      'agentId': agentId,
      'agentName': agentName,
      'replies': replies.map((r) => r.toJson()).toList(),
    };
  }

  bool get isOpen => status == 'open' || status == 'in_progress';
  bool get isResolved => status == 'resolved' || status == 'closed';

  @override
  String toString() {
    return 'EmailTicket(id: $id, ticketId: $ticketId, subject: $subject, status: $status)';
  }
}

// ============================================================
// EMAIL REPLY MODEL
// ============================================================
class EmailReply {
  final int id;
  final int ticketId;
  final String message;
  final String senderName;
  final String senderEmail;
  final String senderType; // 'customer', 'agent', 'system'
  final List<String> attachments;
  final DateTime createdAt;
  final bool isRead;

  EmailReply({
    required this.id,
    required this.ticketId,
    required this.message,
    required this.senderName,
    required this.senderEmail,
    required this.senderType,
    this.attachments = const [],
    required this.createdAt,
    this.isRead = false,
  });

  factory EmailReply.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 EmailReply.fromJson: Parsing email reply data');
    debugPrint('📦 EmailReply.fromJson: JSON keys: ${json.keys}');

    // ✅ Handle both 'data' (Swagger) and 'response' (Actual API)
    final data = json['data'] ?? json['response'] ?? json;

    debugPrint('📦 EmailReply.fromJson: data keys: ${data.keys}');

    return EmailReply(
      id: data['id'] ?? 0,
      ticketId: data['ticketId'] ?? data['ticket_id'] ?? 0,
      message: data['message'] ?? data['content'] ?? '',
      senderName: data['senderName'] ?? data['sender_name'] ?? 'Unknown',
      senderEmail: data['senderEmail'] ?? data['sender_email'] ?? '',
      senderType: data['senderType'] ?? data['sender_type'] ?? 'customer',
      attachments: data['attachments'] != null
          ? List<String>.from(data['attachments'])
          : [],
      createdAt: DateTime.parse(data['createdAt'] ??
          data['created_at'] ??
          DateTime.now().toIso8601String()),
      isRead: data['isRead'] ?? data['is_read'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticketId': ticketId,
      'message': message,
      'senderName': senderName,
      'senderEmail': senderEmail,
      'senderType': senderType,
      'attachments': attachments,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
    };
  }

  bool get isFromCustomer => senderType == 'customer';
  bool get isFromAgent => senderType == 'agent';
  bool get isSystem => senderType == 'system';

  @override
  String toString() {
    return 'EmailReply(id: $id, sender: $senderName, message: "${message.length > 20 ? '${message.substring(0, 20)}...' : message}")';
  }
}

// ============================================================
// SEND EMAIL REPLY REQUEST MODEL
// ============================================================
class SendEmailReplyRequest {
  final String message;
  final List<String> attachments;

  SendEmailReplyRequest({
    required this.message,
    this.attachments = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      if (attachments.isNotEmpty) 'attachments': attachments,
    };
  }

  @override
  String toString() {
    return 'SendEmailReplyRequest(message: "${message.length > 20 ? '${message.substring(0, 20)}...' : message}", attachments: ${attachments.length})';
  }
}

// ============================================================
// EMAIL COUNT MODEL
// ============================================================
class EmailCount {
  final int total;
  final int open;
  final int inProgress;
  final int resolved;
  final int closed;

  EmailCount({
    required this.total,
    required this.open,
    required this.inProgress,
    required this.resolved,
    required this.closed,
  });

  factory EmailCount.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 EmailCount.fromJson: Parsing email count data');
    debugPrint('📦 EmailCount.fromJson: JSON keys: ${json.keys}');

    // ✅ Handle both 'data' (Swagger) and 'response' (Actual API)
    final data = json['data'] ?? json['response'] ?? json;

    debugPrint('📦 EmailCount.fromJson: data keys: ${data.keys}');

    return EmailCount(
      total: data['total'] ?? 0,
      open: data['open'] ?? 0,
      inProgress: data['inProgress'] ?? data['in_progress'] ?? 0,
      resolved: data['resolved'] ?? 0,
      closed: data['closed'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'open': open,
      'inProgress': inProgress,
      'resolved': resolved,
      'closed': closed,
    };
  }

  @override
  String toString() {
    return 'EmailCount(total: $total, open: $open, inProgress: $inProgress, resolved: $resolved, closed: $closed)';
  }
}
