import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/cart_model.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/cart_repository.dart';

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepository();
});

final cartProvider = NotifierProvider<CartNotifier, AsyncValue<List<CartItemModel>>>(() {
  return CartNotifier();
});

final cartSummaryProvider = NotifierProvider<CartSummaryNotifier, AsyncValue<CartSummaryModel?>>(() {
  return CartSummaryNotifier();
});

class CartNotifier extends Notifier<AsyncValue<List<CartItemModel>>> {
  @override
  AsyncValue<List<CartItemModel>> build() {
    return const AsyncValue.data([]);
  }

  CartRepository get _repo => ref.read(cartRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    return user?.id;
  }

  Future<void> fetchCartItems() async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      print('🛒 [CART PROVIDER] Fetching cart items for userId: $userId');
      final items = await _repo.getCartItems(userId);
      print('🛒 [CART PROVIDER] Fetched ${items.length} cart items');
      state = AsyncValue.data(items);
    } catch (e) {
      print('🛒 [CART PROVIDER] Error fetching cart: $e');
      state = const AsyncValue.data([]);
    }
  }

  Future<bool> addToCart({
    required int productId,
    int quantity = 1,
  }) async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      print('🛒 [CART PROVIDER] Cannot add to cart: User not authenticated');
      return false;
    }

    // Check if item already exists in cart
    final currentCart = state.value ?? [];
    final existingItemIndex = currentCart.indexWhere(
      (item) => item.productId == productId,
    );

    if (existingItemIndex >= 0) {
      // Item already exists
      print('🛒 [CART PROVIDER] Item already exists in cart: productId=$productId');
      return false; // Return false to show "item already exists" message
    }

    try {
      print('🛒 [CART PROVIDER] Adding new item: productId=$productId, quantity=$quantity');
      await _repo.addToCart(
        userId: userId,
        productId: productId,
        quantity: quantity,
      );
      // Refresh cart after adding
      await fetchCartItems();
      // Refresh summary
      await ref.read(cartSummaryProvider.notifier).fetchCartSummary();
      print('🛒 [CART PROVIDER] Item added successfully');
      return true;
    } catch (e) {
      print('🛒 [CART PROVIDER] Error adding item: $e');
      return false;
    }
  }

  Future<bool> updateQuantity({
    required int productId,
    required int quantity,
  }) async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      print('🛒 [CART PROVIDER] Cannot update quantity: User not authenticated');
      return false;
    }

    if (quantity <= 0) {
      print('🛒 [CART PROVIDER] Quantity is 0, removing item instead');
      return await removeFromCart(productId);
    }

    try {
      print('🛒 [CART PROVIDER] Updating quantity: productId=$productId, newQuantity=$quantity');
      await _repo.updateCartItem(
        userId: userId,
        productId: productId,
        quantity: quantity,
      );
      // Refresh cart after updating
      await fetchCartItems();
      // Refresh summary
      await ref.read(cartSummaryProvider.notifier).fetchCartSummary();
      print('🛒 [CART PROVIDER] Quantity updated successfully');
      return true;
    } catch (e) {
      print('🛒 [CART PROVIDER] Error updating quantity: $e');
      // Log the current cart state to debug
      final currentCart = state.value ?? [];
      print('🛒 [CART PROVIDER] Current cart items: ${currentCart.map((item) => 'id=${item.id}, productId=${item.productId}, quantity=${item.quantity}').join(', ')}');
      return false;
    }
  }

  Future<bool> removeFromCart(int productId) async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      print('🛒 [CART PROVIDER] Cannot remove from cart: User not authenticated');
      return false;
    }

    try {
      print('🛒 [CART PROVIDER] Removing item: productId=$productId');
      await _repo.removeFromCart(
        userId: userId,
        productId: productId,
      );
      // Refresh cart after removing
      await fetchCartItems();
      // Refresh summary
      await ref.read(cartSummaryProvider.notifier).fetchCartSummary();
      print('🛒 [CART PROVIDER] Item removed successfully');
      return true;
    } catch (e) {
      print('🛒 [CART PROVIDER] Error removing item: $e');
      return false;
    }
  }

  void clearCart() {
    state = const AsyncValue.data([]);
  }
}

class CartSummaryNotifier extends Notifier<AsyncValue<CartSummaryModel?>> {
  @override
  AsyncValue<CartSummaryModel?> build() {
    return const AsyncValue.data(null);
  }

  CartRepository get _repo => ref.read(cartRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    return user?.id;
  }

  Future<void> fetchCartSummary() async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data(null);
      return;
    }

    state = const AsyncValue.loading();
    try {
      print('🛒 [CART SUMMARY] Fetching summary for userId: $userId');
      final summary = await _repo.getCartSummary(userId);
      print('🛒 [CART SUMMARY] Summary: ${summary.totalItems} items, ₦${summary.totalValue}');
      state = AsyncValue.data(summary);
    } catch (e) {
      print('🛒 [CART SUMMARY] Error fetching summary: $e');
      state = const AsyncValue.data(null);
    }
  }
}
