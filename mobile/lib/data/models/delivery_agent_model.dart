// lib/data/models/delivery_agent_model.dart
class DeliveryAgent {
  final int riderId;
  final String email;
  final String? name;
  final String? phoneNumber;
  final String? accessToken;

  DeliveryAgent({
    required this.riderId,
    required this.email,
    this.name,
    this.phoneNumber,
    this.accessToken,
  });

  factory DeliveryAgent.fromJson(Map<String, dynamic> json) {
    return DeliveryAgent(
      riderId: json['riderId'] ?? json['id'] ?? 0,
      email: json['email'] ?? '',
      name: json['name'] ?? json['deliveryAgentName'],
      phoneNumber: json['phoneNumber'] ?? json['phone'],
      accessToken: json['accessToken'] ?? json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'riderId': riderId,
      'email': email,
      'name': name,
      'phoneNumber': phoneNumber,
      'accessToken': accessToken,
    };
  }
}

/// Reads an int the API may send as a number or a numeric string.
int _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

/// Falls back to the first entry of `items` - the backend lists every product on an
/// order there, and older responses had no top-level productId at all.
int _productIdFrom(Map<String, dynamic> json) {
  final direct = _asInt(json['productId']);
  if (direct != 0) return direct;
  final items = json['items'];
  if (items is List && items.isNotEmpty && items.first is Map) {
    return _asInt((items.first as Map)['productId']);
  }
  return 0;
}

class PendingDelivery {
  final int riderBoxId;
  final int productId;
  final String productName;
  final String? productImage;
  final String customerName;
  final String? customerPhone;
  final String deliveryAddress;
  final String? estimatedTime;
  final DateTime? createdAt;

  /// PENDING, ACCEPTED or IN_TRANSIT (the rider has tapped "Start delivery").
  final String status;

  PendingDelivery({
    required this.riderBoxId,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.customerName,
    this.customerPhone,
    required this.deliveryAddress,
    this.estimatedTime,
    this.createdAt,
    this.status = 'PENDING',
  });

  bool get isInTransit => status == 'IN_TRANSIT';

  factory PendingDelivery.fromJson(Map<String, dynamic> json) {
    return PendingDelivery(
      riderBoxId: _asInt(json['riderBoxId'] ?? json['id']),
      productId: _productIdFrom(json),
      customerPhone: json['customerPhone']?.toString(),
      status: json['status']?.toString() ?? 'PENDING',
      productName: json['productName'] ?? json['product'] ?? '',
      productImage: json['productImage'] ?? json['image'],
      customerName: json['customerName'] ?? json['customer'] ?? '',
      deliveryAddress: json['deliveryAddress'] ?? json['address'] ?? '',
      estimatedTime: json['estimatedTime'] ?? json['time'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class DeliveryHistory {
  final int riderBoxId;
  final int productId;
  final String productName;
  final String customerName;
  final String deliveryAddress;
  final String status; // DELIVERED, FAILED, PENDING
  final DateTime? deliveryDate;
  final String? deliveryAgentName;

  DeliveryHistory({
    required this.riderBoxId,
    required this.productId,
    required this.productName,
    required this.customerName,
    required this.deliveryAddress,
    required this.status,
    this.deliveryDate,
    this.deliveryAgentName,
  });

  factory DeliveryHistory.fromJson(Map<String, dynamic> json) {
    return DeliveryHistory(
      riderBoxId: _asInt(json['riderBoxId'] ?? json['id']),
      productId: _productIdFrom(json),
      productName: json['productName'] ?? json['product'] ?? '',
      customerName: json['customerName'] ?? json['customer'] ?? '',
      deliveryAddress: json['deliveryAddress'] ?? json['address'] ?? '',
      status: json['status'] ?? 'PENDING',
      deliveryDate: json['deliveryDate'] != null
          ? DateTime.tryParse(json['deliveryDate'].toString())
          : null,
      deliveryAgentName: json['deliveryAgentName'] ?? json['agentName'],
    );
  }
}

class DeliveryDetail {
  final int riderBoxId;
  final int productId;
  final String productName;
  final String? productImage;
  final String customerName;
  final String deliveryAddress;
  final String? itemOfDelivery;
  final String? timeOfDelivery;
  final String? proofOfDeliveryImage;
  final String status;
  final String? customerPhone;
  final String? salesReference;
  final String? productCategory;
  final String? riderName;

  DeliveryDetail({
    required this.riderBoxId,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.customerName,
    required this.deliveryAddress,
    this.itemOfDelivery,
    this.timeOfDelivery,
    this.proofOfDeliveryImage,
    required this.status,
    this.customerPhone,
    this.salesReference,
    this.productCategory,
    this.riderName,
  });

  bool get isInTransit => status == 'IN_TRANSIT';

  factory DeliveryDetail.fromJson(Map<String, dynamic> json) {
    return DeliveryDetail(
      riderBoxId: _asInt(json['riderBoxId'] ?? json['id']),
      productId: _productIdFrom(json),
      customerPhone: json['customerPhone']?.toString(),
      salesReference: json['salesReference']?.toString(),
      productCategory: json['productCategory']?.toString(),
      riderName: json['riderName']?.toString(),
      productName: json['productName'] ?? json['product'] ?? '',
      productImage: json['productImage'] ?? json['image'],
      customerName: json['customerName'] ?? json['customer'] ?? '',
      deliveryAddress: json['deliveryAddress'] ?? json['address'] ?? '',
      itemOfDelivery: json['itemOfDelivery'] ?? json['item'],
      timeOfDelivery: json['timeOfDelivery'] ?? json['time'],
      proofOfDeliveryImage: json['proofOfDeliveryImage'] ?? json['proofImage'],
      status: json['status'] ?? 'PENDING',
    );
  }
}










