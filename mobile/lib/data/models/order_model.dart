import 'package:intl/intl.dart';
import 'package:flutter/material.dart';

class OrderModel {
  final int id;
  final String orderNumber;
  final int userId;
  final String status; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED, etc.
  final String paymentStatus; // PENDING, PAID, FAILED, etc.
  final String?
      paymentType; // ✅ Nullable - FULL_PAYMENT, INSTALLMENT_PAYMENT, PARTIAL_PAYMENT
  final double totalAmount;
  final double paidAmount;
  final double deliveryFee;
  final double grandTotal;
  final String? deliveryAddress;
  final String? deliveryType; // DELIVERY, PICKUP
  final String? createdAt;
  final String? updatedAt;
  final String? lastActivity;
  final List<OrderItemModel> items;
  final int? riderId;
  final int? installmentPlanId;
  final bool isPaid;
  final String? paymentReference;
  final double discountAmount;
  final double? totalAmountRemaining;
  final List<OrderInstallment> installments;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.userId,
    required this.status,
    required this.paymentStatus,
    this.paymentType,
    required this.totalAmount,
    required this.paidAmount,
    this.deliveryFee = 0.0,
    this.grandTotal = 0.0,
    this.deliveryAddress,
    this.deliveryType,
    this.createdAt,
    this.updatedAt,
    this.lastActivity,
    this.items = const [],
    this.riderId,
    this.installmentPlanId,
    this.isPaid = false,
    this.paymentReference,
    this.discountAmount = 0.0,
    this.totalAmountRemaining,
    this.installments = const [],
  });

  /// ✅ Fraction (0.0-1.0) paid so far. For installment orders, the amount
  /// actually financed (paid + remaining) can differ from grandTotal
  /// (e.g. interest/insurance baked into the plan), so prefer that basis
  /// when the backend gives us totalAmountRemaining.
  double get paymentProgress {
    final denom = totalAmountRemaining != null
        ? paidAmount + totalAmountRemaining!
        : (totalAmount > 0 ? totalAmount : grandTotal);
    if (denom <= 0) return 0.0;
    return (paidAmount / denom).clamp(0.0, 1.0);
  }

  double get remainingBalance =>
      totalAmountRemaining ?? (grandTotal - paidAmount).clamp(0.0, double.infinity);

  // ─────────────────────────────────────────────────────────────
  // ✅ SAFE PARSING HELPERS
  // These prevent "type 'Null' is not a subtype of type 'double'"
  // and similar crashes when the backend sends null, String, int,
  // or double for what should be a numeric field.
  // ─────────────────────────────────────────────────────────────

  static double _parseDouble(dynamic value, [double fallback = 0.0]) {
    if (value == null) return fallback;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    if (value is num) return value.toDouble();
    return fallback;
  }

  static double? _parseNullableDouble(dynamic value) {
    if (value == null) return null;
    return _parseDouble(value);
  }

  static int _parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is num) return value.toInt();
    return fallback;
  }

  static int? _parseNullableInt(dynamic value) {
    if (value == null) return null;
    return _parseInt(value);
  }

  static String _parseString(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    return value.toString();
  }

  static String? _parseNullableString(dynamic value) {
    if (value == null) return null;
    final str = value.toString();
    return str.isEmpty ? null : str;
  }

  static bool _parseBool(dynamic value, [bool fallback = false]) {
    if (value == null) return fallback;
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true';
    if (value is num) return value != 0;
    return fallback;
  }

 bool get isInstallment {
  return paymentType == 'INSTALLMENT_PAYMENT' ||
      paymentType == 'INSTALLMENT' ||
      paymentType == 'installment_payment' ||
      paymentType == 'installment';
}

  // ✅ Helper: Check if this is a full payment order
  bool get isFullPayment {
    return paymentType == 'FULL_PAYMENT' ||
        paymentType == 'FULL' ||
        paymentType == 'full_payment' ||
        paymentType == 'full' ||
        paymentType == null; // ✅ Default to full payment if null
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'PROCESSING':
        return 'Processing';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PAYMENT_CONFIRMED':
        return 'Payment Confirmed';
      case 'PAID':
        return 'Paid';
      case 'SHIPPED':
        return 'Shipped';
      case 'NOT_SHIPPED':
        return 'Not Shipped';
      case 'DELIVERED':
        return 'Delivered ✅';
      case 'COMPLETED':
        return 'Completed ✅';
      case 'CANCELLED':
        return 'Cancelled ❌';
      default:
        return status;
    }
  }

  Color get statusColor {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'PROCESSING':
        return Colors.blue;
      case 'IN_PROGRESS':
        return Colors.blue;
      case 'PAYMENT_CONFIRMED':
        return Colors.blue; // ✅ Still Ongoing - Blue
      case 'PAID':
        return Colors.blue; // ✅ Still Ongoing - Blue
      case 'SHIPPED':
        return Colors.blue; // ✅ Still Ongoing - Blue
      case 'NOT_SHIPPED':
        return Colors.blue; // ✅ Still Ongoing - Blue
      case 'DELIVERED':
        return Colors.green; // ✅ Completed - Green
      case 'COMPLETED':
        return Colors.green; // ✅ Completed - Green
      case 'CANCELLED':
        return Colors.red; // ❌ Cancelled - Red
      default:
        return Colors.grey;
    }
  }

  // ✅ Helper: Get payment type display text
  String get paymentTypeDisplay {
    if (isInstallment) {
      return 'Installment';
    } else {
      return 'Full Payment';
    }
  }

  // ✅ Helper: Get payment type color
  Color get paymentTypeColor {
    if (isInstallment) {
      return Colors.orange;
    } else {
      return Colors.green;
    }
  }

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    var orderData = json['data'] ?? json['response'] ?? json;

    // ✅ GET /api/orders/{id} wraps the actual order under an 'order' key,
    // alongside a sibling top-level 'orderItems' list - drill in so the
    // rest of this parser sees the same shape as the list endpoint.
    if (orderData is Map && orderData['order'] is Map) {
      orderData = orderData['order'];
    }

    // Parse items
    List<OrderItemModel> items = [];
    if (orderData['items'] != null) {
      items = (orderData['items'] as List)
          .map((item) => OrderItemModel.fromJson(item))
          .toList();
    } else if (orderData['orderItems'] != null) {
      items = (orderData['orderItems'] as List)
          .map((item) => OrderItemModel.fromJson(item))
          .toList();
    }

    // Calculate last activity
    String? lastActivity;
    if (orderData['lastActivity'] != null) {
      lastActivity = _parseString(orderData['lastActivity']);
    } else if (orderData['updatedAt'] != null) {
      try {
        final date = DateTime.parse(orderData['updatedAt'].toString());
        lastActivity = _formatLastActivity(
            date,
            _parseString(orderData['orderStatus'] ?? orderData['status'],
                'PENDING')); // ✅ Also fix here
      } catch (e) {
        lastActivity = _parseNullableString(orderData['updatedAt']);
      }
    }

    // ✅ Get payment type - safely handle null/empty
    String? paymentType = _parseNullableString(orderData['paymentType']);
    if (paymentType == null || paymentType.isEmpty) {
      paymentType = 'FULL_PAYMENT';
    }

    // ✅ Safely parse all numeric fields
    final totalAmount =
        _parseDouble(orderData['totalAmount'] ?? orderData['totalPrice']);
    // ✅ Backend sends totalAmountPaid (order.dart /user/{id}/new response),
    // not paidAmount/amountPaid - check those first.
    final paidAmount = _parseDouble(orderData['totalAmountPaid'] ??
        orderData['paidAmount'] ??
        orderData['amountPaid']);
    final deliveryFee = _parseDouble(orderData['deliveryFee']);
    final grandTotal = _parseDouble(
      orderData['grandTotal'] ?? orderData['totalAmount'],
    );
    final discountAmount = _parseDouble(orderData['discountAmount']);
    final totalAmountRemaining =
        _parseNullableDouble(orderData['totalAmountRemaining']);

    List<OrderInstallment> installments = [];
    if (orderData['installments'] is List) {
      installments = (orderData['installments'] as List)
          .map((e) => OrderInstallment.fromJson(e))
          .toList();
    }

    return OrderModel(
      id: _parseInt(orderData['id']),
      orderNumber:
          _parseString(orderData['orderNumber'] ?? orderData['orderNo']),
      userId: _parseInt(orderData['userId'] ?? orderData['user']?['id']),
      // ✅ FIX: Check orderStatus FIRST, then fallback to status
      status: _parseString(
          orderData['orderStatus'] ?? orderData['status'], 'PENDING'),
      paymentStatus: _parseString(
          orderData['paymentStatus'] ?? orderData['payment']?['status'],
          'PENDING'),
      paymentType: paymentType,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      deliveryFee: deliveryFee,
      grandTotal: grandTotal,
      deliveryAddress: _parseNullableString(
          orderData['deliveryAddress'] ?? orderData['address']),
      deliveryType: _parseNullableString(
          orderData['deliveryType'] ?? orderData['deliveryMethod']),
      createdAt: _parseNullableString(orderData['createdAt']),
      updatedAt: _parseNullableString(orderData['updatedAt']),
      lastActivity: lastActivity,
      items: items,
      riderId:
          _parseNullableInt(orderData['riderId'] ?? orderData['rider']?['id']),
      installmentPlanId: _parseNullableInt(orderData['installmentPlanId']),
      isPaid: _parseBool(orderData['isPaid']),
      paymentReference: _parseNullableString(orderData['paymentReference']),
      discountAmount: discountAmount,
      totalAmountRemaining: totalAmountRemaining,
      installments: installments,
    );
  }

  static String _formatLastActivity(DateTime date, String status) {
    if (status == 'CANCELLED') {
      return 'Cancelled: ${DateFormat('EEEE, MMMM d, yyyy').format(date)}';
    } else if (status == 'COMPLETED' || status == 'DELIVERED') {
      return 'Delivered: ${DateFormat('EEEE, MMMM d, yyyy').format(date)}';
    } else {
      return 'Placed: ${DateFormat('EEEE, MMMM d, yyyy').format(date)}';
    }
  }

  // ✅ Convert to display format for history screen
  Map<String, dynamic> toDisplayFormat() {
    final firstItem = items.isNotEmpty ? items.first : null;

    // ✅ Calculate progress based on payment type
    double? progress;
    String? installmentText;
    String? installmentDetails;

    if (isInstallment) {
      // ✅ ONLY for installment orders
      progress = paymentProgress;

      if (status == 'IN_PROGRESS' ||
          status == 'PENDING' ||
          status == 'PROCESSING') {
        final nextDate = DateTime.now().add(const Duration(days: 7));
        installmentText =
            'Next Installment on ${DateFormat('EEEE, MMMM d, yyyy').format(nextDate)}';
        installmentDetails = 'Processing your Delivery (T&C Apply)';
      } else if (status == 'COMPLETED' || status == 'DELIVERED') {
        installmentText = 'All Installments Completed';
        installmentDetails = 'Order Delivered';
      } else if (status == 'CANCELLED') {
        installmentText = 'Installment Plan Cancelled';
        installmentDetails = 'Order Cancelled';
      }
    } else {
      // ✅ For FULL_PAYMENT orders - NO installment text
      progress = null;
      installmentText = null;
      installmentDetails = null;
    }

    // ✅ Button text based on status
    String? buttonText;
    if (status == 'CANCELLED') {
      buttonText = 'Reorder';
    } else if (status == 'PENDING' || status == 'PROCESSING') {
      buttonText = 'Cancel Order';
    }

    // ✅ Last activity text
    final activityText = lastActivity ?? _getActivityText();

    return {
      'id': id.toString(),
      'orderId': id,
      'orderNumber': orderNumber,
      'image': firstItem?.productImage ?? 'assets/images/product1.png',
      'title': firstItem?.productName ?? 'Order #$orderNumber',
      'price':
          '₦${_formatCurrency(paidAmount)} of ₦${_formatCurrency(totalAmount)}',
      'grandTotal': '₦${_formatCurrency(grandTotal)}',
      'progress': progress, // ✅ null for full payment
      'installment': installmentText, // ✅ null for full payment
      'installmentDetails': installmentDetails, // ✅ null for full payment
      'lastActivity': activityText,
      'button': buttonText,
      'status': status,
      'statusDisplay': statusDisplay,
      'statusColor': statusColor,
      'paymentType': paymentType ?? 'FULL_PAYMENT',
      'paymentTypeDisplay': paymentTypeDisplay,
      'paymentTypeColor': paymentTypeColor,
      'isInstallment': isInstallment,
      'isFullPayment': isFullPayment,
      'paymentStatus': paymentStatus,
      'isPaid': isPaid,
    };
  }

  String _getActivityText() {
    try {
      final dateStr = updatedAt ?? createdAt;
      if (dateStr == null) return 'No activity';
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inDays > 7) {
        return '${diff.inDays ~/ 7} weeks ago';
      } else if (diff.inDays > 1) {
        return '${diff.inDays} days ago';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inHours > 1) {
        return '${diff.inHours} hours ago';
      } else if (diff.inMinutes > 1) {
        return '${diff.inMinutes} minutes ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'No activity';
    }
  }

  static String _formatCurrency(double amount) {
    return NumberFormat('#,###').format(amount);
  }
}

class OrderItemModel {
  final int id;
  final int productId;
  final String productName;
  final String? productImage;
  final double price;
  final int quantity;
  final double? totalPrice;

  OrderItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.price,
    required this.quantity,
    this.totalPrice,
  });

  static double _parseDouble(dynamic value, [double fallback = 0.0]) {
    if (value == null) return fallback;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    if (value is num) return value.toDouble();
    return fallback;
  }

  static double? _parseNullableDouble(dynamic value) {
    if (value == null) return null;
    return _parseDouble(value);
  }

  static int _parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is num) return value.toInt();
    return fallback;
  }

  static String _parseString(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    return value.toString();
  }

  static String? _parseNullableString(dynamic value) {
    if (value == null) return null;
    final str = value.toString();
    return str.isEmpty ? null : str;
  }

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    // ✅ The order-items API (orderItems[]) has no nested 'product' object -
    // it puts productId/unitPrice directly on the item. Only fall back to
    // productData['id']/['price'] when there IS a nested product to read.
    final productData = json['product'] ?? json;

    return OrderItemModel(
      id: _parseInt(json['id']),
      productId: _parseInt(json['productId'] ?? productData['id']),
      productName: _parseString(
          json['productName'] ?? productData['productName'] ?? productData['name']),
      productImage: _parseNullableString(
          json['productImage'] ?? productData['productImage'] ?? productData['image']),
      price: _parseDouble(json['unitPrice'] ??
          productData['sellingPrice'] ??
          productData['price'] ??
          json['price']),
      quantity: _parseInt(json['quantity'], 1),
      totalPrice: _parseNullableDouble(
          json['total'] ?? json['subtotal'] ?? json['totalPrice']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      'productImage': productImage,
      'price': price,
      'quantity': quantity,
      'totalPrice': totalPrice,
    };
  }
}

/// ✅ One row of an order's real installment schedule, as returned by the
/// backend's `installments[]` array (id, installmentNumber, amountDue,
/// amountPaid, dueDate, paidDate, status, daysOverdue, ...).
class OrderInstallment {
  final int id;
  final int installmentNumber;
  final double amountDue;
  final double amountPaid;
  final String? dueDate;
  final String? paidDate;
  final String status; // PAID, PENDING, OVERDUE, ...
  final int? paymentId;
  final int daysOverdue;

  OrderInstallment({
    required this.id,
    required this.installmentNumber,
    required this.amountDue,
    required this.amountPaid,
    this.dueDate,
    this.paidDate,
    required this.status,
    this.paymentId,
    this.daysOverdue = 0,
  });

  bool get isPaid => status == 'PAID';

  static double _parseDouble(dynamic value, [double fallback = 0.0]) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static int _parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  factory OrderInstallment.fromJson(Map<String, dynamic> json) {
    return OrderInstallment(
      id: _parseInt(json['id']),
      installmentNumber: _parseInt(json['installmentNumber']),
      amountDue: _parseDouble(json['amountDue']),
      amountPaid: _parseDouble(json['amountPaid']),
      dueDate: json['dueDate']?.toString(),
      paidDate: json['paidDate']?.toString(),
      status: json['status']?.toString() ?? 'PENDING',
      paymentId: json['paymentId'] == null ? null : _parseInt(json['paymentId']),
      daysOverdue: _parseInt(json['daysOverdue']),
    );
  }
}

class OrderStatisticsModel {
  final int totalOrders;
  final int inProgressOrders;
  final int completedOrders;
  final int cancelledOrders;
  final double totalSpent;

  OrderStatisticsModel({
    required this.totalOrders,
    required this.inProgressOrders,
    required this.completedOrders,
    required this.cancelledOrders,
    required this.totalSpent,
  });

  static double _parseDouble(dynamic value, [double fallback = 0.0]) {
    if (value == null) return fallback;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    if (value is num) return value.toDouble();
    return fallback;
  }

  static int _parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    if (value is num) return value.toInt();
    return fallback;
  }

  factory OrderStatisticsModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json['response'] ?? json;
    return OrderStatisticsModel(
      totalOrders: _parseInt(data['totalOrders']),
      inProgressOrders:
          _parseInt(data['inProgressOrders'] ?? data['inProgress']),
      completedOrders: _parseInt(data['completedOrders'] ?? data['completed']),
      cancelledOrders: _parseInt(data['cancelledOrders'] ?? data['cancelled']),
      totalSpent: _parseDouble(data['totalSpent']),
    );
  }
}
