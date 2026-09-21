class CartItemModel {
  final int id;
  final int productId;
  final String productName;
  final String? productDescription;
  final String? productImage;
  final double price;
  final int quantity;
  final double? totalPrice;
  final String? dateAdded;

  CartItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    this.productDescription,
    this.productImage,
    required this.price,
    required this.quantity,
    this.totalPrice,
    this.dateAdded,
  });

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    final productData = json['product'];
    
    return CartItemModel(
      id: json['id'] ?? 0,
      // Always use json['productId'] first, fallback to productData['id'] only if product exists
      productId: json['productId'] ?? (productData != null ? (productData['id'] ?? 0) : 0),
      productName: productData != null 
          ? (productData['productName'] ?? productData['name'] ?? '')
          : json['productName'] ?? '',
      productDescription: productData != null
          ? (productData['productDescription'] ?? productData['description'])
          : json['productDescription'],
      productImage: productData != null
          ? (productData['productImage'] ?? productData['image'])
          : json['productImage'],
      price: productData != null
          ? ((productData['sellingPrice'] ?? productData['price'] ?? 0.0) as num).toDouble()
          : ((json['price'] ?? json['sellingPrice'] ?? 0.0) as num).toDouble(),
      quantity: json['quantity'] ?? 1,
      totalPrice: json['totalPrice'] != null ? (json['totalPrice'] as num).toDouble() : null,
      dateAdded: json['dateAdded'] ?? json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      'productDescription': productDescription,
      'productImage': productImage,
      'price': price,
      'quantity': quantity,
      'totalPrice': totalPrice,
      'dateAdded': dateAdded,
    };
  }

  // Convert to display format
  CartItemModel copyWith({
    String? productName,
    String? productDescription,
    String? productImage,
    double? price,
    double? totalPrice,
  }) {
    return CartItemModel(
      id: id,
      productId: productId,
      productName: productName ?? this.productName,
      productDescription: productDescription ?? this.productDescription,
      productImage: productImage ?? this.productImage,
      price: price ?? this.price,
      quantity: quantity,
      totalPrice: totalPrice ?? this.totalPrice,
      dateAdded: dateAdded,
    );
  }

  Map<String, dynamic> toDisplayFormat() {
    return {
      'id': id.toString(),
      'name': productName,
      'price': price,
      'image': productImage ?? 'assets/images/product1.png',
      'description': productDescription ?? '',
      'quantity': quantity,
    };
  }
}

class CartSummaryModel {
  final int totalItems;
  final double totalValue;
  final double? deliveryFee;
  final double? discount;
  final double? finalTotal;

  CartSummaryModel({
    required this.totalItems,
    required this.totalValue,
    this.deliveryFee,
    this.discount,
    this.finalTotal,
  });

  factory CartSummaryModel.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json['response'] ?? json;
    return CartSummaryModel(
      totalItems: data['totalItems'] ?? 0,
      totalValue: ((data['totalValue'] ?? data['totalPrice'] ?? 0.0) as num).toDouble(),
      deliveryFee: data['deliveryFee'] != null ? (data['deliveryFee'] as num).toDouble() : null,
      discount: data['discount'] != null ? (data['discount'] as num).toDouble() : null,
      finalTotal: data['finalTotal'] != null ? (data['finalTotal'] as num).toDouble() : null,
    );
  }
}