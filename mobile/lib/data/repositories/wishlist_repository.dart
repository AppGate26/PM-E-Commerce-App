// lib/data/repositories/wishlist_repository.dart
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/wishlist_model.dart';

class WishlistRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<WishlistItemModel>> getWishlistItems(int userId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.wishlistByUserId(userId));
      print('💝 [API REQUEST] GET $normalizedUrl');
      
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('💝 [API RESPONSE] GET Wishlist Items - Status: ${response.statusCode}');
      print('💝 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch wishlist items';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;

      List<WishlistItemModel> items = [];
      if (responseData is List) {
        items = responseData
            .map((json) => WishlistItemModel.fromJson(json))
            .toList();
      } else if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        items = content.map((json) => WishlistItemModel.fromJson(json)).toList();
      }

      print('💝 [API RESPONSE] Parsed ${items.length} wishlist items');
      return items;
    } on DioException catch (e) {
      print('💝 [API ERROR] DioException: ${e.message}');
      print('💝 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💝 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<void> addToWishlist({
    required int userId,
    required int productId,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.wishlists);
      print('💝 [API REQUEST] POST $normalizedUrl');
      print('💝 [API REQUEST] Body: {userId: $userId, productId: $productId}');
      
      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: {
          'userId': userId,
          'productId': productId,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('💝 [API RESPONSE] POST Add to Wishlist - Status: ${response.statusCode}');
      print('💝 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorMessage =
            response.data['message'] ?? 'Failed to add item to wishlist';
        throw errorMessage;
      }
      print('💝 [API RESPONSE] Item added to wishlist successfully');
    } on DioException catch (e) {
      print('💝 [API ERROR] DioException: ${e.message}');
      print('💝 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💝 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<void> removeFromWishlist({
    required int userId,
    required int productId,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.wishlistItem(userId, productId));
      print('💝 [API REQUEST] DELETE $normalizedUrl');
      
      final response = await _apiClient.dio.delete(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('💝 [API RESPONSE] DELETE Remove from Wishlist - Status: ${response.statusCode}');
      print('💝 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200 && response.statusCode != 204) {
        final errorMessage =
            response.data['message'] ?? 'Failed to remove item from wishlist';
        throw errorMessage;
      }
      print('💝 [API RESPONSE] Item removed from wishlist successfully');
    } on DioException catch (e) {
      print('💝 [API ERROR] DioException: ${e.message}');
      print('💝 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💝 [API ERROR] General: $e');
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
