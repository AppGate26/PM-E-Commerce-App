class ProductModel {
  final int id;
  final String name;
  final String description;
  final double price;
  final String? image;
  final String? imageUrl;
  final int? categoryId;
  final String? categoryName;
  final double? rating;
  final int? stock;
  final bool? inStock;
  final Map<String, dynamic>? specifications;
  final List<String>? images;

  ProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.image,
    this.imageUrl,
    this.categoryId,
    this.categoryName,
    this.rating,
    this.stock,
    this.inStock,
    this.specifications,
    this.images,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // The repository already extracts items from content array, so json is the product object directly
    final productData = json;

    // Extract category info if nested
    int? catId;
    String? catName;
    if (productData['category'] != null && productData['category'] is Map) {
      final category = productData['category'] as Map<String, dynamic>;
      catId = category['id'] as int?;
      catName = category['name'] as String?;
    }

    // Debug print to verify parsing
    print(
        '🔍 [ProductModel] Parsing product: ${productData['productName'] ?? productData['name']}');

    return ProductModel(
      id: productData['id'] ?? 0,
      // API uses 'productName' - this is the correct field
      name: (productData['productName'] ??
              productData['name'] ??
              productData['title'] ??
              '')
          .toString(),
      // API uses 'productDescription'
      description: (productData['productDescription'] ??
              productData['description'] ??
              productData['details'] ??
              '')
          .toString(),
      // API uses 'sellingPrice'
      price:
          ((productData['sellingPrice'] ?? productData['price'] ?? 0.0) as num)
              .toDouble(),
      // API uses 'productImage'
      image: productData['productImage']?.toString(),
      imageUrl: productData['productImage']?.toString() ??
          productData['imageUrl']?.toString() ??
          productData['image_url']?.toString() ??
          productData['image']?.toString(),
      categoryId:
          catId ?? productData['categoryId'] ?? productData['category_id'],
      categoryName: catName ??
          productData['categoryName']?.toString() ??
          productData['category_name']?.toString(),
      rating: productData['rating'] != null
          ? (productData['rating'] as num).toDouble()
          : null,
      stock: productData['quantity'] ?? productData['stock'],
      inStock: productData['inStock'] ??
          productData['in_stock'] ??
          (productData['quantity'] != null &&
              (productData['quantity'] as num) > 0),
      specifications: productData['specifications'] ?? productData['specs'],
      images: productData['images'] != null
          ? List<String>.from(productData['images'].map((e) => e.toString()))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'image': image,
      'imageUrl': imageUrl,
      'categoryId': categoryId,
      'categoryName': categoryName,
      'rating': rating,
      'stock': stock,
      'inStock': inStock,
      'specifications': specifications,
      'images': images,
    };
  }

  // Helper to get display image
  // Helper to get display image
  // Helper to get display image
  String get displayImage {
    // If image exists, use it AS-IS
    if (image != null && image!.isNotEmpty) {
      // ✅ Use the original URL - DON'T modify it!
      return image!;
    }

    // Try imageUrl if image is null
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return imageUrl!;
    }

    return 'assets/images/product1.png';
  }

  // Convert to cart-compatible format
  Map<String, dynamic> toCartFormat() {
    return {
      'id': id.toString(),
      'name': name,
      'price': price,
      'image': displayImage,
      'description': description,
    };
  }
}
