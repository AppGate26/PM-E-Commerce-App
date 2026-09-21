// data/models/popular_product_model.dart

class PopularProductModel {
  final int id;
  final String name;
  final double price;
  final String? image;
  final int? salesCount;
  final double? rating;

  PopularProductModel({
    required this.id,
    required this.name,
    required this.price,
    this.image,
    this.salesCount,
    this.rating,
  });

  factory PopularProductModel.fromJson(Map<String, dynamic> json) {
    return PopularProductModel(
      id: json['id'] ?? 0,
      name: json['productName'] ?? json['name'] ?? '',
      price: (json['sellingPrice'] ?? json['price'] ?? 0.0).toDouble(),
      image: json['productImage']?.toString() ?? json['image']?.toString(),
      salesCount: json['salesCount'] ?? json['sales_count'],
      rating: json['rating'] != null ? (json['rating'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toCartFormat() {
    return {
      'id': id.toString(),
      'name': name,
      'price': price,
      'image': image ?? 'assets/images/product1.png',
    };
  }
}