// lib/data/providers/wishlist_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/wishlist_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/wishlist_repository.dart';

final wishlistRepositoryProvider = Provider<WishlistRepository>((ref) {
  return WishlistRepository();
});

final wishlistProvider = NotifierProvider<WishlistNotifier, AsyncValue<List<WishlistItemModel>>>(() {
  return WishlistNotifier();
});

class WishlistNotifier extends Notifier<AsyncValue<List<WishlistItemModel>>> {
  @override
  AsyncValue<List<WishlistItemModel>> build() {
    return const AsyncValue.data([]);
  }

  WishlistRepository get _repo => ref.read(wishlistRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    return user?.id;
  }

  Future<void> fetchWishlistItems() async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final items = await _repo.getWishlistItems(userId);
      state = AsyncValue.data(items);
    } catch (e) {
      // Don't show error to user, just return empty list
      state = const AsyncValue.data([]);
    }
  }

  Future<bool> addToWishlist({
    required int productId,
  }) async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      return false;
    }

    try {
      await _repo.addToWishlist(
        userId: userId,
        productId: productId,
      );
      // Refresh wishlist after adding
      await fetchWishlistItems();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> removeFromWishlist(int productId) async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      return false;
    }

    try {
      await _repo.removeFromWishlist(
        userId: userId,
        productId: productId,
      );
      await fetchWishlistItems();
      return true;
    } catch (e) {
      return false;
    }
  }

  void clearWishlist() {
    state = const AsyncValue.data([]);
  }
}