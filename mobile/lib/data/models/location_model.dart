class LocationModel {
  final int id;
  final String name;
  final String? description;

  LocationModel({
    required this.id,
    required this.name,
    this.description,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? json['stateName'] ?? json['lgaName'] ?? json['wardName'] ?? '',
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
    };
  }
}