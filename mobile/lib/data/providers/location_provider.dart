import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/location_model.dart';
import 'package:pm_e_commerce_app/data/repositories/location_repository.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  return LocationRepository();
});

// ✅ Fix: Use proper type annotation
final statesProvider = FutureProvider<List<LocationModel>>((ref) async {
  final repository = ref.read(locationRepositoryProvider);
  return await repository.getStates();
});

// ✅ Fix: Use proper type annotation
final lgasByStateProvider = FutureProvider.family<List<LocationModel>, String>((ref, stateId) async {
  final repository = ref.read(locationRepositoryProvider);
  return await repository.getLgasByStateId(int.parse(stateId));
});

// ✅ Fix: Use proper type annotation
final wardsByLgaProvider = FutureProvider.family<List<LocationModel>, String>((ref, lgaId) async {
  final repository = ref.read(locationRepositoryProvider);
  return await repository.getWardsByLgaId(int.parse(lgaId));
});