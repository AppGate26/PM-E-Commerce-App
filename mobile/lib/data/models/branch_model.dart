class Branch {
  final int id;
  final String name;
  final String address;
  final String? phone;
  final String? email;
  final int? stateId;
  final int? lgaId;
  final int? wardId;
  final String? branchName;
  final bool? isActive;

  Branch({
    required this.id,
    required this.name,
    required this.address,
    this.phone,
    this.email,
    this.stateId,
    this.lgaId,
    this.wardId,
    this.branchName,
    this.isActive,
  });

  factory Branch.fromJson(Map<String, dynamic> json) {
    return Branch(
      id: json['id'] ?? json['branchId'] ?? 0,
      name: json['name'] ?? json['branchName'] ?? 'Unknown Branch',
      address: json['address'] ?? 'No address provided',
      phone: json['phone'],
      email: json['email'],
      stateId: json['stateId'],
      lgaId: json['lgaId'],
      wardId: json['wardId'],
      branchName: json['branchName'],
      isActive: json['active'] ?? json['isActive'] ?? true,
    );
  }

  String get displayName => branchName ?? name;
  
  String get fullAddress {
    String addr = address;
    if (phone != null) addr += '\n📞 $phone';
    if (email != null) addr += '\n✉️ $email';
    return addr;
  }

  // ✅ ADD THIS: Proper equality comparison
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Branch && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}