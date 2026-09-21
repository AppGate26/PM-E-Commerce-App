// data/repositories/home_repository.dart

import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/quick_pick_model.dart';
import 'package:pm_e_commerce_app/data/models/popular_product_model.dart';

class HomeRepository {
  final ApiClient _apiClient = ApiClient();

 // data/repositories/home_repository.dart

Future<List<QuickPickModel>> getQuickPick() async {
  try {
    print('🚀 [Quick Pick] Fetching quick pick products...');
    
    // ✅ Use normalizeUrl instead of directly using the URL
    final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.quickPick);
    print('📡 [Quick Pick] URL: $normalizedUrl');
    
    final response = await _apiClient.dio.get(
      normalizedUrl,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('📥 [Quick Pick Response] Status: ${response.statusCode}');
    print('📥 [Quick Pick Response] Data: ${response.data}');

    if (response.statusCode != 200) {
      throw response.data['message'] ?? 'Failed to fetch quick pick';
    }

    final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
    
    if (responseData is List) {
      print('📦 [Quick Pick] Found ${responseData.length} items');
      return responseData
          .map((json) => QuickPickModel.fromJson(json))
          .toList();
    }
    
    return [];
  } on DioException catch (e) {
    print('❌ [Quick Pick] Dio Error: ${e.message}');
    throw _handleDioError(e);
  } catch (e) {
    print('❌ [Quick Pick] Error: $e');
    rethrow;
  }
}

Future<List<PopularProductModel>> getPopularProductsToday() async {
  try {
    print('🚀 [Popular Products] Fetching popular products...');
    
    // ✅ Use normalizeUrl instead of directly using the URL
    final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.popularProductsToday);
    print('📡 [Popular Products] URL: $normalizedUrl');
    
    final response = await _apiClient.dio.get(
      normalizedUrl,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('📥 [Popular Products Response] Status: ${response.statusCode}');
    print('📥 [Popular Products Response] Data: ${response.data}');

    if (response.statusCode != 200) {
      throw response.data['message'] ?? 'Failed to fetch popular products';
    }

    final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
    
    if (responseData is List) {
      print('📦 [Popular Products] Found ${responseData.length} items');
      return responseData
          .map((json) => PopularProductModel.fromJson(json))
          .toList();
    }
    
    return [];
  } on DioException catch (e) {
    print('❌ [Popular Products] Dio Error: ${e.message}');
    throw _handleDioError(e);
  } catch (e) {
    print('❌ [Popular Products] Error: $e');
    rethrow;
  }
}

  String _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    } else if (e.type == DioExceptionType.receiveTimeout) {
      return 'Request timeout. Please try again.';
    } else if (e.type == DioExceptionType.sendTimeout) {
      return 'Send timeout. Please check your connection.';
    } else if (e.type == DioExceptionType.connectionError) {
      return 'Cannot connect to server. Please check your internet connection.';
    }

    if (e.response != null) {
      final responseData = e.response?.data;
      final errorMessage = responseData?['message'] ??
          responseData?['error'] ??
          'Request failed (Status: ${e.response?.statusCode})';
      return errorMessage;
    } else {
      return e.message ?? 'Network error: ${e.type}';
    }
  }
}