// data/models/category_model.dart

class CategoryModel {
  final int id;
  final String name;
  final String? description;
  final String? image;
  final List<SubCategory>? subCategories;

  CategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.image,
    this.subCategories,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      image: json['image']?.toString(),
      subCategories: json['subCategories'] != null
          ? (json['subCategories'] as List)
              .map((e) => SubCategory.fromJson(e))
              .toList()
          : null,
    );
  }
}

class SubCategory {
  final int id;
  final String name;
  final String? description;
  final String? image;
  final int? categoryId;

  SubCategory({
    required this.id,
    required this.name,
    this.description,
    this.image,
    this.categoryId,
  });

  factory SubCategory.fromJson(Map<String, dynamic> json) {
    return SubCategory(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      image: json['image']?.toString(),
      categoryId: json['categoryId'],
    );
  }
}