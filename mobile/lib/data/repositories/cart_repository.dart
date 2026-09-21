import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/cart_model.dart';
import 'package:pm_e_commerce_app/data/models/product_model.dart';

class CartRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<CartItemModel>> getCartItems(int userId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.cartByUserId(userId));
      print('🛒 [API REQUEST] GET $normalizedUrl');
      
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('🛒 [API RESPONSE] GET Cart Items - Status: ${response.statusCode}');
      print('🛒 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch cart items';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;

      List<CartItemModel> items = [];
      if (responseData is List) {
        items = responseData
            .map((json) => CartItemModel.fromJson(json))
            .toList();
      } else if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        items = content.map((json) => CartItemModel.fromJson(json)).toList();
      }

      print('🛒 [API RESPONSE] Parsed ${items.length} cart items');

      // Enrich items that are missing product details (name/price) from the product API
      final enriched = await Future.wait(items.map((item) async {
        if (item.productName.isNotEmpty && item.price > 0) return item;
        try {
          print('🛒 [CART] Fetching product details for productId=${item.productId}');
          final productUrl = ApiConstants.normalizeUrl(ApiConstants.productById(item.productId));
          final productRes = await _apiClient.dio.get(productUrl);
          final raw = productRes.data['data'] ?? productRes.data['response'] ?? productRes.data;
          final product = ProductModel.fromJson(raw as Map<String, dynamic>);
          return item.copyWith(
            productName: product.name,
            productDescription: product.description,
            productImage: product.image,
            price: product.price,
            totalPrice: item.totalPrice ?? product.price * item.quantity,
          );
        } catch (e) {
          print('🛒 [CART] Failed to enrich productId=${item.productId}: $e');
          return item;
        }
      }));

      return enriched;
    } on DioException catch (e) {
      print('🛒 [API ERROR] DioException: ${e.message}');
      print('🛒 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('🛒 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<CartSummaryModel> getCartSummary(int userId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.cartSummary(userId));
      print('🛒 [API REQUEST] GET $normalizedUrl');
      
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('🛒 [API RESPONSE] GET Cart Summary - Status: ${response.statusCode}');
      print('🛒 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch cart summary';
        throw errorMessage;
      }

      final summary = CartSummaryModel.fromJson(response.data);
      print('🛒 [API RESPONSE] Summary parsed: ${summary.totalItems} items, ₦${summary.totalValue}');
      return summary;
    } on DioException catch (e) {
      print('🛒 [API ERROR] DioException: ${e.message}');
      print('🛒 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('🛒 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<void> addToCart({
    required int userId,
    required int productId,
    required int quantity,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.addToCart);
      print('🛒 [API REQUEST] POST $normalizedUrl');
      print('🛒 [API REQUEST] Body: {userId: $userId, productId: $productId, quantity: $quantity}');
      
      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: {
          'userId': userId,
          'productId': productId,
          'quantity': quantity,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('🛒 [API RESPONSE] POST Add to Cart - Status: ${response.statusCode}');
      print('🛒 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorMessage =
            response.data['message'] ?? 'Failed to add item to cart';
        throw errorMessage;
      }
      print('🛒 [API RESPONSE] Item added successfully');
    } on DioException catch (e) {
      print('🛒 [API ERROR] DioException: ${e.message}');
      print('🛒 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('🛒 [API ERROR] General: $e');
      rethrow;
    }
  }

  // In cart_repository.dart, add this method:

Future<bool> clearCart(int userId) async {
  try {
    print('🗑️ [CartRepository] Clearing cart for user: $userId');
    
    final url = ApiConstants.normalizeUrl(ApiConstants.clearCart(userId));
    print('🗑️ [CartRepository] URL: $url');

    final response = await _apiClient.dio.delete(
      url,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('🗑️ [CartRepository] Response status: ${response.statusCode}');
    
    if (response.statusCode == 200 || response.statusCode == 204) {
      print('✅ [CartRepository] Cart cleared successfully');
      return true;
    } else {
      print('❌ [CartRepository] Failed to clear cart: ${response.statusCode}');
      return false;
    }
  } on DioException catch (e) {
    print('❌ [CartRepository] Error clearing cart: ${e.message}');
    if (e.response != null) {
      print('❌ Response: ${e.response?.data}');
    }
    return false;
  } catch (e) {
    print('❌ [CartRepository] Unexpected error: $e');
    return false;
  }
}

  Future<void> updateCartItem({
    required int userId,
    required int productId,
    required int quantity,
  }) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.cartItem(userId, productId));
      print('🛒 [API REQUEST] PUT $normalizedUrl');
      print('🛒 [API REQUEST] Body: {quantity: $quantity}');

      final response = await _apiClient.dio.put(
        normalizedUrl,
        data: {
          'quantity': quantity,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('🛒 [API RESPONSE] PUT Update Cart - Status: ${response.statusCode}');
      print('🛒 [API RESPONSE] Data: ${response.data}');

      // Check both HTTP status code and response body status
      final responseData = response.data;
      final bodyStatus = responseData is Map ? (responseData['status'] ?? response.statusCode) : response.statusCode;
      
      if (response.statusCode != 200 || (bodyStatus is int && bodyStatus != 200)) {
        final errorMessage =
            (responseData is Map ? responseData['message'] : null) ?? 'Failed to update cart item';
        print('🛒 [API ERROR] Update failed: $errorMessage');
        throw errorMessage;
      }
      print('🛒 [API RESPONSE] Cart item updated successfully');
    } on DioException catch (e) {
      print('🛒 [API ERROR] DioException: ${e.message}');
      print('🛒 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('🛒 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<void> removeFromCart({
    required int userId,
    required int productId,
  }) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.cartItem(userId, productId));
      print('🛒 [API REQUEST] DELETE $normalizedUrl');
      
      final response = await _apiClient.dio.delete(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('🛒 [API RESPONSE] DELETE Remove from Cart - Status: ${response.statusCode}');
      print('🛒 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200 && response.statusCode != 204) {
        final errorMessage =
            response.data['message'] ?? 'Failed to remove item from cart';
        throw errorMessage;
      }
      print('🛒 [API RESPONSE] Item removed successfully');
    } on DioException catch (e) {
      print('🛒 [API ERROR] DioException: ${e.message}');
      print('🛒 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('🛒 [API ERROR] General: $e');
      rethrow;
    }
  }

  String _handleDioError(DioException e) {
    if (e.response != null) {
      final statusCode = e.response!.statusCode;
      final message = e.response!.data['message'] ??
          e.response!.data['error'] ??
          'Request failed with status $statusCode';
      return message.toString();
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    } else if (e.type == DioExceptionType.connectionError) {
      return 'No internet connection. Please check your network.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
