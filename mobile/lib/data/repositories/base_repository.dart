// data/repositories/base_repository.dart

import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';

class BaseRepository {
  final ApiClient _apiClient = ApiClient();

  ApiClient get apiClient => _apiClient;

  // ============================================================
  // ERROR HANDLER
  // ============================================================
  void handleDioError(DioException e, String context) {
    print('🔴 [$context] DioError: ${e.message}');
    print('🔴 [$context] Type: ${e.type}');

    if (e.type == DioExceptionType.connectionTimeout) {
      throw 'Connection timeout. Please check your internet connection and try again.';
    } else if (e.type == DioExceptionType.receiveTimeout) {
      throw 'Request timeout. Please try again.';
    } else if (e.type == DioExceptionType.sendTimeout) {
      throw 'Send timeout. Please check your connection and try again.';
    } else if (e.type == DioExceptionType.connectionError) {
      throw 'Cannot connect to server. Please check your internet connection.';
    }

    if (e.response != null) {
      final responseData = e.response?.data;
      final statusCode = e.response?.statusCode;

      if (statusCode == 400) {
        if (responseData != null && responseData['response'] != null) {
          final validationErrors =
              responseData['response'] as Map<String, dynamic>?;
          if (validationErrors != null && validationErrors.isNotEmpty) {
            final errorMessages = validationErrors.entries
                .map((e) => '${e.key}: ${e.value}')
                .join('\n');
            throw errorMessages;
          }
        }
        throw responseData?['message'] ??
            responseData?['error'] ??
            'Invalid data. Please check all fields and try again.';
      } else if (statusCode == 403) {
        throw 'Access forbidden. Please contact support if you believe this is an error.';
      } else if (statusCode == 404) {
        throw 'Service not found. Please try again later.';
      } else if (statusCode == 500) {
        throw responseData?['message'] ??
            'Server error. Please try again later.';
      }

      throw responseData?['message'] ??
          responseData?['error'] ??
          'Failed to complete request (Status: $statusCode)';
    } else {
      throw e.message ?? 'Network error: ${e.type}';
    }
  }

  // ============================================================
  // HELPER: Check if error is a duplicate/conflict
  // ============================================================
  bool isDuplicateError(DioException e) {
    final errorData = e.response?.data;
    final errorString = errorData?.toString() ?? '';
    final statusCode = e.response?.statusCode;

    return statusCode == 500 ||
        errorString.contains('identifier') ||
        errorString.contains('Duplicate entry') ||
        errorString.contains('UK_') ||
        errorString.contains('already exists') ||
        errorString.contains('altered from') ||
        errorString.contains('duplicate');
  }
}
