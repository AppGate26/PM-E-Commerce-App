class UserProfileModel {
  final int id;
  final String email;
  final String phoneNumber;
  final String firstName;
  final String lastName;
  final String? address;
  final int? stateId;
  final int? lgaId;
  final int? wardId;
  final String role;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserProfileModel({
    required this.id,
    required this.email,
    required this.phoneNumber,
    required this.firstName,
    required this.lastName,
    required this.address,
    required this.stateId,
    required this.lgaId,
    required this.wardId,
    required this.role,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    int? parseId(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is String) return int.tryParse(value);
      if (value is Map && value['id'] != null) return parseId(value['id']);
      return null;
    }

    return UserProfileModel(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      address: json['address'],
      stateId: parseId(json['stateId'] ?? json['state']),
      lgaId: parseId(json['lgaId'] ?? json['lga']),
      wardId: parseId(json['wardId'] ?? json['ward']),
      role: json['role'] ?? 'USER',
      createdAt:
          DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt:
          DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'address': address,
      'stateId': stateId,
      'lgaId': lgaId,
      'wardId': wardId,
    };
  }

  // Helper method to get full name
  String get fullName => '$firstName $lastName';

  UserProfileModel copyWith({
    String? firstName,
    String? lastName,
    String? phoneNumber,
    String? address,
    int? stateId,
    int? lgaId,
    int? wardId,
  }) {
    return UserProfileModel(
      id: id,
      email: email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      address: address ?? this.address,
      stateId: stateId ?? this.stateId,
      lgaId: lgaId ?? this.lgaId,
      wardId: wardId ?? this.wardId,
      role: role,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}