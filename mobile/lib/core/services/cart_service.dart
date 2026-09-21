import 'package:flutter/foundation.dart';

class CartItem {
  final String id;
  final String name;
  final String image;
  final double price;
  int quantity;
  final String? description;
  final bool inStock;

  CartItem({
    required this.id,
    required this.name,
    required this.image,
    required this.price,
    this.quantity = 1,
    this.description,
    this.inStock = true,
  });

  double get totalPrice => price * quantity;

  CartItem copyWith({
    int? quantity,
  }) {
    return CartItem(
      id: id,
      name: name,
      image: image,
      price: price,
      quantity: quantity ?? this.quantity,
      description: description,
      inStock: inStock,
    );
  }
}

class CartService extends ChangeNotifier {
  final List<CartItem> _cartItems = [];
  final List<CartItem> _aspiringItems = [];

  List<CartItem> get cartItems => _cartItems;
  List<CartItem> get aspiringItems => _aspiringItems;

  double get cartTotal {
    return _cartItems.fold(0, (total, item) => total + item.totalPrice);
  }

  int get cartItemsCount {
    return _cartItems.fold(0, (total, item) => total + item.quantity);
  }

  void addToCart(CartItem item) {
    final existingIndex = _cartItems.indexWhere((cartItem) => cartItem.id == item.id);
    
    if (existingIndex >= 0) {
      _cartItems[existingIndex] = _cartItems[existingIndex].copyWith(
        quantity: _cartItems[existingIndex].quantity + 1,
      );
    } else {
      _cartItems.add(item);
    }
    notifyListeners();
  }

  void removeFromCart(String itemId) {
    _cartItems.removeWhere((item) => item.id == itemId);
    notifyListeners();
  }

  void updateQuantity(String itemId, int newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    final index = _cartItems.indexWhere((item) => item.id == itemId);
    if (index >= 0) {
      _cartItems[index] = _cartItems[index].copyWith(quantity: newQuantity);
      notifyListeners();
    }
  }

  void clearCart() {
    _cartItems.clear();
    notifyListeners();
  }

  void addToAspiringList(CartItem item) {
    if (!_aspiringItems.any((aspiringItem) => aspiringItem.id == item.id)) {
      _aspiringItems.add(item);
      notifyListeners();
    }
  }

  void removeFromAspiringList(String itemId) {
    _aspiringItems.removeWhere((item) => item.id == itemId);
    notifyListeners();
  }

  bool isInCart(String itemId) {
    return _cartItems.any((item) => item.id == itemId);
  }
}