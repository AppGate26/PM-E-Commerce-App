import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/repositories/delivery_fee_repository.dart';

final deliveryFeeRepositoryProvider = Provider<DeliveryFeeRepository>((ref) {
  return DeliveryFeeRepository();
});