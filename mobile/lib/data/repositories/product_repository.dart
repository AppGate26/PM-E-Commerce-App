import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/product_model.dart';

class ProductRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<ProductModel>> getAllProducts({
    int? page,
    int? size,
    String? search,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.products);
      
      final queryParams = <String, dynamic>{};
      if (page != null) queryParams['page'] = page;
      if (size != null) queryParams['size'] = size;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await _apiClient.dio.get(
        normalizedUrl,
        queryParameters: queryParams.isEmpty ? null : queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Products Response] Status: ${response.statusCode}');
      print('📥 [Products Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch products';
        throw errorMessage;
      }

      final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
      
      // Handle paginated response
      if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        return content
            .map((json) => ProductModel.fromJson(json))
            .toList();
      }
      
      // Handle direct list
      if (responseData is List) {
        return responseData
            .map((json) => ProductModel.fromJson(json))
            .toList();
      }
      
      return [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<ProductModel> getProductById(int productId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.productById(productId));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Product By ID Response] Status: ${response.statusCode}');
      print('📥 [Product By ID Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch product';
        throw errorMessage;
      }

      final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
      return ProductModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<ProductModel>> getProductsByCategory(
    int categoryId, {
    int? page,
    int? size,
    String? search,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.productsByCategory(categoryId));
      
      final queryParams = <String, dynamic>{};
      if (page != null) queryParams['page'] = page;
      if (size != null) queryParams['size'] = size;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await _apiClient.dio.get(
        normalizedUrl,
        queryParameters: queryParams.isEmpty ? null : queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Products By Category Response] Status: ${response.statusCode}');
      print('📥 [Products By Category Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch products by category';
        throw errorMessage;
      }

      final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
      
      // Handle paginated response
      if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        return content
            .map((json) => ProductModel.fromJson(json))
            .toList();
      }
      
      // Handle direct list
      if (responseData is List) {
        return responseData
            .map((json) => ProductModel.fromJson(json))
            .toList();
      }
      
      return [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<ProductModel>> filterProductsByPrice({
    double? minPrice,
    double? maxPrice,
    int? categoryId,
    int? page,
    int? size,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.filterProductsByPrice);
      
      final queryParams = <String, dynamic>{};
      if (minPrice != null) queryParams['minPrice'] = minPrice;
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
      if (categoryId != null) queryParams['categoryId'] = categoryId;
      if (page != null) queryParams['page'] = page;
      if (size != null) queryParams['size'] = size;

      final response = await _apiClient.dio.get(
        normalizedUrl,
        queryParameters: queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Filter Products Response] Status: ${response.statusCode}');
      print('📥 [Filter Products Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to filter products';
        throw errorMessage;
      }

      final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
      
      // Handle paginated response
      if (responseData is Map && responseData['content'] != null) {
        final content = responseData['content'] as List;
        return content
            .map((json) => ProductModel.fromJson(json))
            .toList();
      }
      
      // Handle direct list
      if (responseData is List) {
        return responseData
            .map((json) => ProductModel.fromJson(json))
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

      if (responseData != null && responseData['response'] != null) {
        final validationErrors =
            responseData['response'] as Map<String, dynamic>?;
        if (validationErrors != null && validationErrors.isNotEmpty) {
          final errorMessages = validationErrors.entries
              .map((e) => '${e.key}: ${e.value}')
              .join('\n');
          return errorMessages;
        }
      }

      final errorMessage = responseData?['message'] ??
          responseData?['error'] ??
          'Request failed (Status: ${e.response?.statusCode})';
      return errorMessage;
    } else {
      final errorMsg = e.message ?? 'Network error: ${e.type}';
      return errorMsg;
    }
  }
}