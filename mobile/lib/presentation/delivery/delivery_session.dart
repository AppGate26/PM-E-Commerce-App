// lib/presentation/delivery/delivery_session.dart
import 'dart:convert';

import 'package:pm_e_commerce_app/core/services/storage_service.dart';

/// The logged-in rider's id, as saved by DeliveryAgentRepository.login under
/// user_data['id'] (older builds saved it as 'riderId').
Future<int?> currentRiderId() async {
  try {
    final userData = await StorageService.getUserData();
    if (userData == null) return null;
    final json = jsonDecode(userData) as Map<String, dynamic>;
    final raw = json['id'] ?? json['riderId'];
    if (raw is int) return raw;
    return int.tryParse(raw?.toString() ?? '');
  } catch (_) {
    return null;
  }
}
