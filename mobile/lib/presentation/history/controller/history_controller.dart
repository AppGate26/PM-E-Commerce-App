// lib/presentation/history/controllers/history_controller.dart
import 'package:flutter/material.dart';
import 'package:pm_e_commerce_app/data/models/order_model.dart';

// Keep this for backward compatibility with existing code
class HistoryController extends ChangeNotifier {
  List<OrderModel> _allOrders = [];

  HistoryController(); // Remove Ref requirement

  List<Map<String, dynamic>> get inProgressItems {
    final orders = _allOrders.where((order) => 
      order.status == 'IN_PROGRESS' || 
      order.status == 'PENDING' ||
      order.status == 'PROCESSING'
    ).toList();
    return orders.map((order) => order.toDisplayFormat()).toList();
  }

  List<Map<String, dynamic>> get completedItems {
    final orders = _allOrders.where((order) => 
      order.status == 'COMPLETED' || 
      order.status == 'DELIVERED'
    ).toList();
    return orders.map((order) => order.toDisplayFormat()).toList();
  }

  List<Map<String, dynamic>> get cancelledItems {
    final orders = _allOrders.where((order) => 
      order.status == 'CANCELLED'
    ).toList();
    return orders.map((order) => order.toDisplayFormat()).toList();
  }

  void updateOrders(List<OrderModel> orders) {
    _allOrders = orders;
    notifyListeners();
  }

  void moveToCancelled(Map<String, dynamic> order) {
    // This will be handled by the API when cancel is called
    notifyListeners();
  }

  double _extractPrice(String priceText) {
    final match = RegExp(r'₦([\d,]+)').firstMatch(priceText);
    return match != null ? double.tryParse(match.group(1)!.replaceAll(',', '')) ?? 0.0 : 0.0;
  }

  List<Map<String, dynamic>> sortItems(List<Map<String, dynamic>> items, String criteria) {
    final sorted = List<Map<String, dynamic>>.from(items);
    switch (criteria) {
      case 'Payment':
      case 'Price':
        sorted.sort((a, b) => _extractPrice(b['price']).compareTo(_extractPrice(a['price'])));
        break;
      case 'Name':
        sorted.sort((a, b) => (a['title'] as String).compareTo(b['title'] as String));
        break;
      case 'Date':
      default:
        // Sort by order ID (newest first)
        sorted.sort((a, b) => (b['orderId'] ?? 0).compareTo(a['orderId'] ?? 0));
        break;
    }
    return sorted;
  }
}