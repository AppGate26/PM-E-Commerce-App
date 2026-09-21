// lib/data/models/recovery_model.dart
class RecoveryAgent {
  final int recoveryAgentId;
  final String email;
  final String name;
  final String? phoneNumber;
  final String? accessToken;

  RecoveryAgent({
    required this.recoveryAgentId,
    required this.email,
    required this.name,
    this.phoneNumber,
    this.accessToken,
  });

  factory RecoveryAgent.fromJson(Map<String, dynamic> json) {
    return RecoveryAgent(
      recoveryAgentId: json['recoveryAgentId'] ?? json['id'] ?? 0,
      email: json['email'] ?? '',
      name: json['name'] ?? json['recoveryAgentName'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['phone'],
      accessToken: json['accessToken'] ?? json['token'],
    );
  }
}

class PendingRecovery {
  final int customerId;
  final String customerName;
  final String customerEmail;
  final int numberOfItems;
  final String status;
  final String? profileImage;

  PendingRecovery({
    required this.customerId,
    required this.customerName,
    required this.customerEmail,
    required this.numberOfItems,
    required this.status,
    this.profileImage,
  });

  factory PendingRecovery.fromJson(Map<String, dynamic> json) {
    return PendingRecovery(
      customerId: json['customerId'] ?? json['id'] ?? 0,
      customerName: json['customerName'] ?? json['name'] ?? '',
      customerEmail: json['customerEmail'] ?? json['email'] ?? '',
      numberOfItems: json['numberOfItems'] ?? json['itemCount'] ?? 0,
      status: json['status'] ?? 'Not yet recovered',
      profileImage: json['profileImage'] ?? json['image'],
    );
  }
}

class RecoveryReport {
  final int recoveryId;
  final int customerId;
  final String customerName;
  final String customerEmail;
  final int numberOfItems;
  final String status;
  final DateTime? timeOfRecovery;
  final String? recoveryPhoto;
  final String? profileImage;

  RecoveryReport({
    required this.recoveryId,
    required this.customerId,
    required this.customerName,
    required this.customerEmail,
    required this.numberOfItems,
    required this.status,
    this.timeOfRecovery,
    this.recoveryPhoto,
    this.profileImage,
  });

  factory RecoveryReport.fromJson(Map<String, dynamic> json) {
    return RecoveryReport(
      recoveryId: json['recoveryId'] ?? json['id'] ?? 0,
      customerId: json['customerId'] ?? 0,
      customerName: json['customerName'] ?? json['name'] ?? '',
      customerEmail: json['customerEmail'] ?? json['email'] ?? '',
      numberOfItems: json['numberOfItems'] ?? json['itemCount'] ?? 0,
      status: json['status'] ?? 'Recovered',
      timeOfRecovery: json['timeOfRecovery'] != null
          ? DateTime.tryParse(json['timeOfRecovery'])
          : null,
      recoveryPhoto: json['recoveryPhoto'] ?? json['photo'],
      profileImage: json['profileImage'] ?? json['image'],
    );
  }
}

class CustomerDetail {
  final int customerId;
  final String fullName;
  final String email;
  final String phoneNumber;
  final String homeAddress;
  final String city;
  final List<ProductDetail> products;

  CustomerDetail({
    required this.customerId,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.homeAddress,
    required this.city,
    required this.products,
  });

  factory CustomerDetail.fromJson(Map<String, dynamic> json) {
    final productsList = json['products'] ?? json['items'] ?? [];
    return CustomerDetail(
      customerId: json['customerId'] ?? json['id'] ?? 0,
      fullName: json['fullName'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['phone'] ?? '',
      homeAddress: json['homeAddress'] ?? json['address'] ?? '',
      city: json['city'] ?? '',
      products: (productsList as List)
          .map((p) => ProductDetail.fromJson(p))
          .toList(),
    );
  }
}

class ProductDetail {
  final int productId;
  final String productName;
  final String description;
  final String? imageUrl;
  final int numberOfItems;
  final String status;

  ProductDetail({
    required this.productId,
    required this.productName,
    required this.description,
    this.imageUrl,
    required this.numberOfItems,
    required this.status,
  });

  factory ProductDetail.fromJson(Map<String, dynamic> json) {
    return ProductDetail(
      productId: json['productId'] ?? json['id'] ?? 0,
      productName: json['productName'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image'],
      numberOfItems: json['numberOfItems'] ?? json['itemCount'] ?? 1,
      status: json['status'] ?? 'Not Yet Recovered',
    );
  }
}








