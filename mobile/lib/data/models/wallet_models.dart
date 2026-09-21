import 'package:intl/intl.dart';

class WalletBalance {
  final double availableBalance;

  WalletBalance({required this.availableBalance});

  factory WalletBalance.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json['response'] ?? json;
    return WalletBalance(
      availableBalance: ((data['balance'] ?? data['availableBalance'] ?? 0) as num).toDouble(),
    );
  }
}

class WalletTransaction {
  final int id;
  final String narration;
  final double amount;
  final String type; // CREDIT, DEBIT
  final DateTime createdAt;

  WalletTransaction({
    required this.id,
    required this.narration,
    required this.amount,
    required this.type,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return WalletTransaction(
      id: data['id'] ?? 0,
      narration: data['narration'] ?? data['description'] ?? '',
      amount: ((data['amount'] ?? 0) as num).toDouble(),
      type: data['type'] ?? data['transactionType'] ?? 'DEBIT',
      createdAt: DateTime.tryParse(data['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  String get formattedDate => DateFormat('d/M/y').format(createdAt);
  bool get isCredit => type.toUpperCase() == 'CREDIT';
}

class WalletTransferRequest {
  final int fromUserId;
  final int toUserId;
  final double amount;
  final String senderName;
  final String recipientName;
  final String narration;

  WalletTransferRequest({
    required this.fromUserId,
    required this.toUserId,
    required this.amount,
    required this.senderName,
    required this.recipientName,
    required this.narration,
  });

  Map<String, dynamic> toJson() => {
        'fromUserId': fromUserId,
        'toUserId': toUserId,
        'amount': amount,
        'senderName': senderName,
        'recipientName': recipientName,
        'narration': narration,
      };
}
