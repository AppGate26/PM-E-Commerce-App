// data/models/quick_pick_model.dart

class QuickPickModel {
  final int id;
  final String name;
  final double price;
  final String? image;
  final String? description;

  QuickPickModel({
    required this.id,
    required this.name,
    required this.price,
    this.image,
    this.description,
  });

  factory QuickPickModel.fromJson(Map<String, dynamic> json) {
    return QuickPickModel(
      id: json['id'] ?? 0,
      name: json['productName'] ?? json['name'] ?? '',
      price: (json['sellingPrice'] ?? json['price'] ?? 0.0).toDouble(),
      image: json['productImage']?.toString() ?? json['image']?.toString(),
      description: json['productDescription'] ?? json['description'],
    );
  }

  Map<String, dynamic> toCartFormat() {
    return {
      'id': id.toString(),
      'name': name,
      'price': price,
      'image': image ?? 'assets/images/product1.png',
      'description': description ?? '',
    };
  }
}