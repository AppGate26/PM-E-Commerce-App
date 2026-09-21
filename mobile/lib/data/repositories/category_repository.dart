// data/repositories/category_repository.dart

import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/category_model.dart';

class CategoryRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.normalizeUrl(ApiConstants.categories),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Categories] Status: ${response.statusCode}');

      if (response.statusCode != 200) {
        throw response.data['message'] ?? 'Failed to fetch categories';
      }

      final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
      
      if (responseData is List) {
        return responseData
            .map((json) => CategoryModel.fromJson(json))
            .toList();
      }
      
      return [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
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