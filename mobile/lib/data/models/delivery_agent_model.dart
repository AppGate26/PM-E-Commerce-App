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

class PendingDelivery {
  final int riderBoxId;
  final int productId;
  final String productName;
  final String? productImage;
  final String customerName;
  final String deliveryAddress;
  final String? estimatedTime;
  final DateTime? createdAt;

  PendingDelivery({
    required this.riderBoxId,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.customerName,
    required this.deliveryAddress,
    this.estimatedTime,
    this.createdAt,
  });

  factory PendingDelivery.fromJson(Map<String, dynamic> json) {
    return PendingDelivery(
      riderBoxId: json['riderBoxId'] ?? json['id'] ?? 0,
      productId: json['productId'] ?? 0,
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
      riderBoxId: json['riderBoxId'] ?? json['id'] ?? 0,
      productId: json['productId'] ?? 0,
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
  });

  factory DeliveryDetail.fromJson(Map<String, dynamic> json) {
    return DeliveryDetail(
      riderBoxId: json['riderBoxId'] ?? json['id'] ?? 0,
      productId: json['productId'] ?? 0,
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










