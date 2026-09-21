import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/user_profile_model.dart';
import 'package:pm_e_commerce_app/data/repositories/profile_repository.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository();
});

final profileProvider = NotifierProvider<ProfileNotifier, AsyncValue<UserProfileModel?>>(() {
  return ProfileNotifier();
});

class ProfileNotifier extends Notifier<AsyncValue<UserProfileModel?>> {
  @override
  AsyncValue<UserProfileModel?> build() {
    // Load profile when provider is first accessed
    Future.microtask(() => fetchUserProfile());
    return const AsyncValue.loading();
  }

  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  Future<void> fetchUserProfile() async {
    state = const AsyncValue.loading();
    try {
      final userProfile = await _repo.getUserProfile();
      // Debugging log for profile fetch
      // ignore: avoid_print
      print('✅ [ProfileProvider] Loaded profile for userId=${userProfile.id}');
      print('📍 [ProfileProvider] Location IDs - stateId: ${userProfile.stateId}, lgaId: ${userProfile.lgaId}, wardId: ${userProfile.wardId}');
      state = AsyncValue.data(userProfile);
    } catch (e, st) {
      // ignore: avoid_print
      print('❌ [ProfileProvider] Failed to fetch profile: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateUserProfile(UserProfileModel updatedProfile) async {
    try {
      state = const AsyncValue.loading();
      print('🔄 [ProfileProvider] Updating profile with - stateId: ${updatedProfile.stateId}, lgaId: ${updatedProfile.lgaId}, wardId: ${updatedProfile.wardId}');
      final userProfile = await _repo.updateUserProfile(updatedProfile);
      // ignore: avoid_print
      print('✅ [ProfileProvider] Updated profile successfully');
      print('📍 [ProfileProvider] Updated Location IDs - stateId: ${userProfile.stateId}, lgaId: ${userProfile.lgaId}, wardId: ${userProfile.wardId}');
      state = AsyncValue.data(userProfile);
    } catch (e, st) {
      // ignore: avoid_print
      print('❌ [ProfileProvider] Failed to update profile: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<List<LocationModel>> fetchStates() async {
    // ignore: avoid_print
    print('➡️ [ProfileProvider] Fetching states list');
    return _repo.getStates();
  }

  Future<List<LocationModel>> fetchLgas(int stateId) async {
    // ignore: avoid_print
    print('➡️ [ProfileProvider] Fetching LGAs for stateId=$stateId');
    return _repo.getLgasByStateId(stateId);
  }

  Future<List<LocationModel>> fetchWards(int lgaId) async {
    // ignore: avoid_print
    print('➡️ [ProfileProvider] Fetching Wards for lgaId=$lgaId');
    return _repo.getWardsByLgaId(lgaId);
  }

  // Clear profile data (useful for logout)
  void clearProfile() {
    state = const AsyncValue.data(null);
  }
}