class UserModel {
  final int id;
  final String name;
  final String email;
  final String? token;
  final bool isVerified;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.token,
    this.isVerified = false, // ✅ Default to false
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    print('📦 [UserModel] Parsing from JSON: $json');
    
    // ✅ Safely parse isVerified
    bool verified = false;
    try {
      if (json['isVerified'] != null) {
        if (json['isVerified'] is bool) {
          verified = json['isVerified'];
        } else if (json['isVerified'] is String) {
          verified = json['isVerified'] == 'true';
        } else if (json['isVerified'] is int) {
          verified = json['isVerified'] == 1;
        }
      } else if (json['verified'] != null) {
        if (json['verified'] is bool) {
          verified = json['verified'];
        } else if (json['verified'] is String) {
          verified = json['verified'] == 'true';
        }
      } else if (json['verificationStatus'] != null) {
        verified = json['verificationStatus'] == 'VERIFIED' || 
                   json['verificationStatus'] == 'COMPLETED' ||
                   json['verificationStatus'] == 'APPROVED';
      }
    } catch (e) {
      print('⚠️ [UserModel] Error parsing isVerified: $e');
      verified = false;
    }
    
    final model = UserModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      token: json['token'],
      isVerified: verified,
    );
    
    print('📦 [UserModel] Parsed - id: ${model.id}, name: ${model.name}, email: ${model.email}, hasToken: ${model.token != null}, isVerified: ${model.isVerified}');
    return model;
  }

  UserModel copyWith({
    int? id,
    String? name,
    String? email,
    String? token,
    bool? isVerified,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      token: token ?? this.token,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}