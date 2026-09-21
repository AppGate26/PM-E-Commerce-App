import 'package:flutter/foundation.dart';

// ============================================================
// CALL MODEL - Represents a phone call
// ============================================================
class Call {
  final int id;
  final String callId;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String status; // 'queued', 'incoming', 'active', 'ended', 'declined', 'missed'
  final DateTime timestamp;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final int? duration; // in seconds
  final int? queuePosition;
  final int? agentId;
  final String? agentName;

  Call({
    required this.id,
    required this.callId,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.status,
    required this.timestamp,
    this.startedAt,
    this.endedAt,
    this.duration,
    this.queuePosition,
    this.agentId,
    this.agentName,
  });

  factory Call.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 Call.fromJson: Parsing call data');
    final data = json['data'] ?? json;
    
    return Call(
      id: data['id'] ?? 0,
      callId: data['callId'] ?? data['call_id'] ?? '',
      customerName: data['customerName'] ?? data['customer_name'] ?? 'Unknown Customer',
      customerPhone: data['customerPhone'] ?? data['customer_phone'] ?? '',
      customerEmail: data['customerEmail'] ?? data['customer_email'],
      status: data['status'] ?? 'queued',
      timestamp: DateTime.parse(data['timestamp'] ?? data['createdAt'] ?? data['created_at'] ?? DateTime.now().toIso8601String()),
      startedAt: data['startedAt'] != null || data['started_at'] != null
          ? DateTime.tryParse(data['startedAt'] ?? data['started_at'] ?? '')
          : null,
      endedAt: data['endedAt'] != null || data['ended_at'] != null
          ? DateTime.tryParse(data['endedAt'] ?? data['ended_at'] ?? '')
          : null,
      duration: data['duration'] ?? 0,
      queuePosition: data['queuePosition'] ?? data['queue_position'],
      agentId: data['agentId'] ?? data['agent_id'],
      agentName: data['agentName'] ?? data['agent_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'callId': callId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'status': status,
      'timestamp': timestamp.toIso8601String(),
      'startedAt': startedAt?.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'duration': duration,
      'queuePosition': queuePosition,
      'agentId': agentId,
      'agentName': agentName,
    };
  }

  bool get isQueued => status == 'queued';
  bool get isIncoming => status == 'incoming';
  bool get isActive => status == 'active';
  bool get isEnded => status == 'ended';
  bool get isDeclined => status == 'declined';
  bool get isMissed => status == 'missed';

  @override
  String toString() {
    return 'Call(id: $id, customer: $customerName, status: $status, duration: ${duration ?? 0}s)';
  }
}

// ============================================================
// CALL LOG MODEL - Represents call history
// ============================================================
class CallLog {
  final int id;
  final String callId;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String status; // 'received', 'missed', 'declined', 'rejected'
  final DateTime timestamp;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final int? duration; // in seconds
  final int? agentId;
  final String? agentName;
  final String? notes;

  CallLog({
    required this.id,
    required this.callId,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.status,
    required this.timestamp,
    this.startedAt,
    this.endedAt,
    this.duration,
    this.agentId,
    this.agentName,
    this.notes,
  });

  factory CallLog.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 CallLog.fromJson: Parsing call log data');
    final data = json['data'] ?? json;
    
    return CallLog(
      id: data['id'] ?? 0,
      callId: data['callId'] ?? data['call_id'] ?? '',
      customerName: data['customerName'] ?? data['customer_name'] ?? 'Unknown Customer',
      customerPhone: data['customerPhone'] ?? data['customer_phone'] ?? '',
      customerEmail: data['customerEmail'] ?? data['customer_email'],
      status: data['status'] ?? 'received',
      timestamp: DateTime.parse(data['timestamp'] ?? data['createdAt'] ?? data['created_at'] ?? DateTime.now().toIso8601String()),
      startedAt: data['startedAt'] != null || data['started_at'] != null
          ? DateTime.tryParse(data['startedAt'] ?? data['started_at'] ?? '')
          : null,
      endedAt: data['endedAt'] != null || data['ended_at'] != null
          ? DateTime.tryParse(data['endedAt'] ?? data['ended_at'] ?? '')
          : null,
      duration: data['duration'] ?? 0,
      agentId: data['agentId'] ?? data['agent_id'],
      agentName: data['agentName'] ?? data['agent_name'],
      notes: data['notes'] ?? data['complain'] ?? data['comment'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'callId': callId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'status': status,
      'timestamp': timestamp.toIso8601String(),
      'startedAt': startedAt?.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'duration': duration,
      'agentId': agentId,
      'agentName': agentName,
      'notes': notes,
    };
  }

  bool get isReceived => status == 'received';
  bool get isMissed => status == 'missed';
  bool get isDeclined => status == 'declined';
  bool get isRejected => status == 'rejected';

  @override
  String toString() {
    return 'CallLog(id: $id, customer: $customerName, status: $status, duration: ${duration ?? 0}s)';
  }
}

// ============================================================
// END CALL REQUEST MODEL
// ============================================================
class EndCallRequest {
  final String? complain;
  final String? comment;

  EndCallRequest({
    this.complain,
    this.comment,
  });

  Map<String, dynamic> toJson() {
    return {
      if (complain != null) 'complain': complain,
      if (comment != null) 'comment': comment,
    };
  }

  @override
  String toString() {
    return 'EndCallRequest(complain: $complain, comment: $comment)';
  }
}

// ============================================================
// CALL COUNT MODEL
// ============================================================
class CallCount {
  final int total;
  final int queued;
  final int incoming;
  final int active;
  final int missed;

  CallCount({
    required this.total,
    required this.queued,
    required this.incoming,
    required this.active,
    required this.missed,
  });

  factory CallCount.fromJson(Map<String, dynamic> json) {
    debugPrint('📦 CallCount.fromJson: Parsing call count data');
    final data = json['data'] ?? json;
    return CallCount(
      total: data['total'] ?? 0,
      queued: data['queued'] ?? 0,
      incoming: data['incoming'] ?? 0,
      active: data['active'] ?? 0,
      missed: data['missed'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'queued': queued,
      'incoming': incoming,
      'active': active,
      'missed': missed,
    };
  }

  @override
  String toString() {
    return 'CallCount(total: $total, queued: $queued, incoming: $incoming, active: $active, missed: $missed)';
  }
}