import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/order_model.dart';

class OrderRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<OrderModel>> getUserOrders(int userId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.userOrdersNew(userId));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [User Orders Response] Status: ${response.statusCode}');
      debugPrint('📥 [User Orders Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch orders';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;

      // Handle paginated response
      if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        return content.map((json) {
          print(
              '📦 [OrderRepository] Processing order: ${json['id']} - paymentType: ${json['paymentType']}');
          return OrderModel.fromJson(json);
        }).toList();
      }

      // Handle direct list
      if (responseData is List) {
        return responseData.map((json) {
          print(
              '📦 [OrderRepository] Processing order: ${json['id']} - paymentType: ${json['paymentType']}');
          return OrderModel.fromJson(json);
        }).toList();
      }

      return [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<OrderModel>> getUserOrdersByStatus(
      int userId, String status) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.userOrdersByStatus(userId, status));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print(
          '📥 [User Orders By Status Response] Status: ${response.statusCode}');
      print('📥 [User Orders By Status Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch orders by status';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;

      // Handle paginated response
      if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        return content.map((json) => OrderModel.fromJson(json)).toList();
      }

      // Handle direct list
      if (responseData is List) {
        return responseData.map((json) => OrderModel.fromJson(json)).toList();
      }

      return [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<OrderModel> getOrderById(int orderId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.orderById(orderId));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Order By ID Response] Status: ${response.statusCode}');
      print('📥 [Order By ID Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch order';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      return OrderModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<OrderModel> getOrderByNumber(String orderNumber) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.orderByNumber(orderNumber));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch order';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      return OrderModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<OrderStatisticsModel> getUserOrderStatistics(int userId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.userOrderStatistics(userId));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch order statistics';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      return OrderStatisticsModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<OrderModel> cancelOrder(int orderId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.cancelOrder(orderId));
      final response = await _apiClient.dio.put(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to cancel order';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      return OrderModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  // ============================================================
  // ✅ UPDATE ORDER STATUS - CORRECT: Query Parameter
  // ============================================================
  Future<OrderModel> updateOrderStatus(int orderId, String status) async {
    try {
      print('=' * 80);
      print('📡 [OrderRepository] ===== UPDATE ORDER STATUS =====');
      print('📡 [OrderRepository] Order ID: $orderId');
      print('📡 [OrderRepository] New Status: $status');

      // ✅ Status goes as QUERY PARAMETER, NOT in body
      final url = ApiConstants.normalizeUrl(
          ApiConstants.updateOrderStatus(orderId, status));
      print('📡 [OrderRepository] URL: $url');

      final response = await _apiClient.dio.put(
        url,
        options: Options(
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ),
      );

      print('📥 [OrderRepository] Response Status: ${response.statusCode}');
      print('📥 [OrderRepository] Response Data: ${response.data}');

      if (response.statusCode == 200) {
        print('✅ [OrderRepository] Order status updated successfully!');
        final responseData =
            response.data['data'] ?? response.data['response'] ?? response.data;
        return OrderModel.fromJson(responseData);
      } else {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to update order status';
        print('❌ [OrderRepository] Error: $errorMessage');
        throw errorMessage;
      }
    } on DioException catch (e) {
      print('❌ [OrderRepository] Dio Error: ${e.message}');
      if (e.response != null) {
        print('❌ Response Status: ${e.response?.statusCode}');
        print('❌ Response Data: ${e.response?.data}');
      }
      throw _handleDioError(e);
    } catch (e) {
      print('❌ [OrderRepository] Unexpected error: $e');
      rethrow;
    }
  }

  Future<OrderModel> updateOrderPayment(
      int orderId, Map<String, dynamic> paymentData) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.updateOrderPayment(orderId));
      final response = await _apiClient.dio.put(
        normalizedUrl,
        data: paymentData,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to update order payment';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      return OrderModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> checkout(
      Map<String, dynamic> checkoutData) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.checkout);
      print('📡 [OrderRepository] POST $normalizedUrl');
      print('📦 [OrderRepository] Payload: $checkoutData');

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: checkoutData,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [OrderRepository] Response Status: ${response.statusCode}');
      print('📥 [OrderRepository] Response Data: ${response.data}');

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorMessage = response.data['message'] ?? 'Failed to checkout';
        print('❌ [OrderRepository] Error: $errorMessage');
        throw errorMessage;
      }

      return response.data;
    } on DioException catch (e) {
      print('❌ [OrderRepository] Dio Error: ${e.message}');
      if (e.response != null) {
        print('❌ [OrderRepository] Response: ${e.response?.data}');
        throw e.response?.data['message'] ?? 'An error occurred';
      }
      throw _handleDioError(e);
    } catch (e) {
      print('❌ [OrderRepository] Error: $e');
      rethrow;
    }
  }

  // ============================================================
  // 🛠️ ERROR HANDLER - IMPROVED
  // ============================================================
  String _handleDioError(DioException e) {
    print('❌ [OrderRepository] Dio Error: ${e.message}');
    print('❌ Error Type: ${e.type}');

    if (e.response != null) {
      print('❌ Response Status: ${e.response?.statusCode}');
      print('❌ Response Data: ${e.response?.data}');

      // ✅ Try to get error message from response
      final responseData = e.response?.data;
      if (responseData is Map) {
        return responseData['message'] ??
            responseData['error'] ??
            'Request failed (Status: ${e.response?.statusCode})';
      }
      return 'Request failed (Status: ${e.response?.statusCode})';
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    } else if (e.type == DioExceptionType.connectionError) {
      return 'Cannot connect to server. Please check your internet connection.';
    } else {
      return e.message ?? 'Network error. Please try again.';
    }
  }
}
