// lib/data/models/wishlist_model.dart
class WishlistItemModel {
  final int id;
  final int productId;
  final String productName;
  final String? productDescription;
  final String? productImage;
  final double price;
  final DateTime? dateAdded;

  WishlistItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    this.productDescription,
    this.productImage,
    required this.price,
    this.dateAdded,
  });

  factory WishlistItemModel.fromJson(Map<String, dynamic> json) {
    final productData = json['product'] ?? json;

    return WishlistItemModel(
      id: json['id'] ?? 0,
      productId: productData['id'] ?? json['productId'] ?? 0,
      productName: productData['productName'] ?? productData['name'] ?? '',
      productDescription:
          productData['productDescription'] ?? productData['description'],
      productImage: productData['productImage'] ?? productData['image'],
      price: ((productData['sellingPrice'] ??
              productData['price'] ??
              json['price'] ??
              0.0) as num)
          .toDouble(),
      dateAdded: json['dateAdded'] != null
          ? DateTime.parse(json['dateAdded'])
          : json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : null,
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
      'dateAdded': dateAdded?.toIso8601String(),
    };
  }
}
