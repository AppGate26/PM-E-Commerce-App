// lib/data/models/installment_models.dart
import 'package:intl/intl.dart';

class InstallmentCalculateRequest {
  final int orderId; // Required by API - use 0 if no order exists yet
  final int userId;
  final int productId;
  final double productPrice;
  final String frequency; // DAILY, WEEKLY, MONTHLY
  final int durationInMonths;

  InstallmentCalculateRequest({
    this.orderId = 0, // Default to 0 if no order exists yet
    required this.userId,
    required this.productId,
    required this.productPrice,
    required this.frequency,
    required this.durationInMonths,
  });

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'userId': userId,
      'frequency': frequency.toUpperCase(),
      'durationInMonths': durationInMonths,
    };
  }
}

class InstallmentPlan {
  final int planId;
  final int? orderId;
  final int userId;
  final int productId;
  final String productName;
  final double productPrice;
  final double insurance;
  final double? deliveryFee;
  final double totalAmount;
  final String frequency;
  final int durationInMonths;
  final List<InstallmentSchedule> schedule;
  final DateTime? createdAt;

  InstallmentPlan({
    required this.planId,
    this.orderId,
    required this.userId,
    required this.productId,
    required this.productName,
    required this.productPrice,
    required this.insurance,
    this.deliveryFee,
    required this.totalAmount,
    required this.frequency,
    required this.durationInMonths,
    required this.schedule,
    this.createdAt,
  });

  InstallmentPlan copyWith({
    int? planId,
    List<InstallmentSchedule>? schedule,
  }) {
    return InstallmentPlan(
      planId: planId ?? this.planId,
      orderId: orderId,
      userId: userId,
      productId: productId,
      productName: productName,
      productPrice: productPrice,
      insurance: insurance,
      deliveryFee: deliveryFee,
      totalAmount: totalAmount,
      frequency: frequency,
      durationInMonths: durationInMonths,
      schedule: schedule ?? this.schedule,
      createdAt: createdAt,
    );
  }

  factory InstallmentPlan.fromJson(Map<String, dynamic> json) {
    // Handle nested structure if needed
    final data = json['data'] ?? json['response'] ?? json;

    // Map API field names to model fields
    // API uses: id, insuranceAmount, grandTotal, totalAmount, installments
    final planId = data['planId'] ?? data['id'] ?? 0;
    final insuranceAmount =
        ((data['insuranceAmount'] ?? data['insurance'] ?? 0.0) as num)
            .toDouble();
    final grandTotal = ((data['grandTotal'] ??
            data['totalAmount'] ??
            data['total'] ??
            0.0) as num)
        .toDouble();
    final productPrice =
        ((data['productPrice'] ?? data['totalAmount'] ?? 0.0) as num)
            .toDouble();
    print(
        '🧾 [InstallmentPlan.fromJson] raw data[productPrice] = ${data['productPrice']}');
    print(
        '🧾 [InstallmentPlan.fromJson] raw data[totalAmount]  = ${data['totalAmount']}');
    print(
        '🧾 [InstallmentPlan.fromJson] resolved productPrice  = $productPrice');

    // Extract installments/schedule
    List<dynamic> installmentsList = [];
    if (data['installments'] != null && data['installments'] is List) {
      installmentsList = data['installments'] as List;
    } else if (data['schedule'] != null && data['schedule'] is List) {
      installmentsList = data['schedule'] as List;
    }

    // Parse installments - handle nested structure if present
    List<InstallmentSchedule> schedule = [];

    if (installmentsList.isNotEmpty) {
      schedule = installmentsList.map((item) {
        // If item is a Map, use it directly (should already be cleaned by repository)
        if (item is Map) {
          // Convert to Map<String, dynamic> if needed
          final itemMap = item is Map<String, dynamic>
              ? item
              : Map<String, dynamic>.from(item);
          // Make sure we have the required fields, use defaults if missing
          if (!itemMap.containsKey('dateDue') &&
              !itemMap.containsKey('dueDate')) {
            // Calculate date based on plan data
            final startDateStr =
                data['startDate'] ?? data['nextPaymentDate'] ?? '';
            if (startDateStr.isNotEmpty) {
              final startDate =
                  DateTime.tryParse(startDateStr.toString()) ?? DateTime.now();
              final index = installmentsList.indexOf(item);
              final frequency =
                  (data['frequency'] ?? 'DAILY').toString().toUpperCase();
              if (frequency == 'DAILY') {
                itemMap['dateDue'] =
                    startDate.add(Duration(days: index + 1)).toIso8601String();
              } else if (frequency == 'WEEKLY') {
                itemMap['dateDue'] = startDate
                    .add(Duration(days: (index + 1) * 7))
                    .toIso8601String();
              } else if (frequency == 'MONTHLY') {
                itemMap['dateDue'] = DateTime(startDate.year,
                        startDate.month + index + 1, startDate.day)
                    .toIso8601String();
              }
            }
          }
          // Use installmentAmount from plan if not in item
          if (!itemMap.containsKey('amountToPay') &&
              !itemMap.containsKey('amount')) {
            final installmentAmount =
                ((data['installmentAmount'] ?? 0.0) as num).toDouble();
            itemMap['amountToPay'] = installmentAmount;
          }
          return InstallmentSchedule.fromJson(itemMap);
        } else {
          return InstallmentSchedule.fromJson(<String, dynamic>{});
        }
      }).toList();
    } else {
      // If no installments provided, generate them from plan data
      final numberOfInstallments =
          data['numberOfInstallments'] ?? data['durationInMonths'] ?? 0;
      final installmentAmount =
          ((data['installmentAmount'] ?? 0.0) as num).toDouble();
      final downPayment = ((data['downPayment'] ?? 0.0) as num).toDouble();
      final startDateStr = data['startDate'] ?? data['nextPaymentDate'] ?? '';
      DateTime startDate = DateTime.now();
      if (startDateStr.isNotEmpty) {
        startDate =
            DateTime.tryParse(startDateStr.toString()) ?? DateTime.now();
      }

      // Generate schedule based on frequency
      double cumulative = downPayment;
      for (int i = 0; i < numberOfInstallments; i++) {
        cumulative += installmentAmount;
        DateTime dueDate = startDate;

        // Calculate next payment date based on frequency
        if (data['frequency']?.toString().toUpperCase() == 'DAILY') {
          dueDate = startDate.add(Duration(days: i + 1));
        } else if (data['frequency']?.toString().toUpperCase() == 'WEEKLY') {
          dueDate = startDate.add(Duration(days: (i + 1) * 7));
        } else if (data['frequency']?.toString().toUpperCase() == 'MONTHLY') {
          dueDate =
              DateTime(startDate.year, startDate.month + i + 1, startDate.day);
        }

        schedule.add(InstallmentSchedule(
          installmentId: i + 1,
          dateDue: dueDate,
          amountToPay: installmentAmount,
          cumulative: cumulative,
          isPaid: false,
          paidAt: null,
        ));
      }
    }

    return InstallmentPlan(
      planId: planId,
      orderId: data['orderId'],
      userId: data['userId'] ?? 0,
      productId: data['productId'] ?? 0,
      productName:
          data['productName'] ?? 'Product', // API might not return this
      productPrice: productPrice,
      insurance: insuranceAmount,
      deliveryFee: data['deliveryFee'] != null
          ? ((data['deliveryFee'] as num).toDouble())
          : null,
      totalAmount: grandTotal, // Use grandTotal as it includes insurance
      frequency: (data['frequency'] ?? 'MONTHLY').toString().toUpperCase(),
      durationInMonths: data['durationInMonths'] ??
          data['numberOfInstallments'] ??
          data['duration'] ??
          0,
      schedule: schedule,
      createdAt: data['createdAt'] != null
          ? DateTime.tryParse(data['createdAt'].toString())
          : null,
    );
  }
}

class InstallmentSchedule {
  final int installmentId;
  final DateTime dateDue;
  final double amountToPay;
  final double cumulative;
  final bool isPaid;
  final DateTime? paidAt;

  InstallmentSchedule({
    required this.installmentId,
    required this.dateDue,
    required this.amountToPay,
    required this.cumulative,
    this.isPaid = false,
    this.paidAt,
  });

  factory InstallmentSchedule.fromJson(Map<String, dynamic> json) {
    // Handle empty or invalid json
    if (json.isEmpty) {
      return InstallmentSchedule(
        installmentId: 0,
        dateDue: DateTime.now(),
        amountToPay: 0.0,
        cumulative: 0.0,
        isPaid: false,
        paidAt: null,
      );
    }

    // Extract date - try multiple field names and formats
    DateTime? dateDue;
    final dateStr = json['dateDue'] ??
        json['dueDate'] ??
        json['nextPaymentDate'] ??
        json['paymentDate'] ??
        '';
    if (dateStr.isNotEmpty) {
      dateDue = DateTime.tryParse(dateStr.toString());
    }
    dateDue ??= DateTime.now();

    // Extract amount - try multiple field names
    // Note: The API might return installmentAmount at the plan level, not per installment
    final amount = ((json['amountToPay'] ??
            json['amount'] ??
            json['installmentAmount'] ??
            json['amountDue'] ??
            0.0) as num)
        .toDouble();

    // Extract cumulative - might need to calculate if not provided
    final cumulative = ((json['cumulative'] ??
            json['cumulativeAmount'] ??
            json['cumulativePaid'] ??
            0.0) as num)
        .toDouble();

    return InstallmentSchedule(
      installmentId: json['installmentId'] ?? json['id'] ?? 0,
      dateDue: dateDue,
      amountToPay: amount,
      cumulative: cumulative,
      isPaid: json['isPaid'] ?? json['paid'] ?? false,
      paidAt: json['paidAt'] != null
          ? DateTime.tryParse(json['paidAt'].toString())
          : null,
    );
  }

  String get formattedDate => DateFormat('d/M/y').format(dateDue);
}

class InstallmentPaymentRequest {
  final int installmentId;

  InstallmentPaymentRequest({
    required this.installmentId,
  });

  Map<String, dynamic> toJson() => {
        'installmentId': installmentId,
      };
}

class UserInstallment {
  final int planId;
  final int productId;
  final String productName;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final String status; // ACTIVE, COMPLETED, CANCELLED
  final List<InstallmentSchedule> schedule;

  UserInstallment({
    required this.planId,
    required this.productId,
    required this.productName,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.status,
    required this.schedule,
  });

  factory UserInstallment.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json['response'] ?? json;

    return UserInstallment(
      planId: data['planId'] ?? data['id'] ?? 0,
      productId: data['productId'] ?? 0,
      productName: data['productName'] ?? '',
      totalAmount: ((data['totalAmount'] ?? 0.0) as num).toDouble(),
      paidAmount: ((data['paidAmount'] ?? 0.0) as num).toDouble(),
      remainingAmount: ((data['remainingAmount'] ?? 0.0) as num).toDouble(),
      status: data['status'] ?? 'ACTIVE',
      schedule: (data['schedule'] ?? data['installments'] ?? [])
          .map((item) => InstallmentSchedule.fromJson(item))
          .toList(),
    );
  }
}
