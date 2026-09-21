// lib/core/utils/error_handler.dart
import 'package:dio/dio.dart';

class ErrorHandler {
  /// Converts technical errors to user-friendly messages
  static String getUserFriendlyError(dynamic error) {
    // Handle DioException
    if (error is DioException) {
      return _handleDioError(error);
    }
    
    // Handle String errors
    if (error is String) {
      return _handleStringError(error);
    }
    
    // Handle generic errors
    final errorString = error.toString().toLowerCase();
    
    // Network errors
    if (errorString.contains('socket') || 
        errorString.contains('network') ||
        errorString.contains('connection')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }
    
    // Timeout errors
    if (errorString.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    // Generic fallback
    return 'Something went wrong. Please try again later.';
  }
  
  static String _handleDioError(DioException e) {
    // Connection errors
    if (e.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    }
    
    if (e.type == DioExceptionType.receiveTimeout) {
      return 'Request took too long. Please try again.';
    }
    
    if (e.type == DioExceptionType.sendTimeout) {
      return 'Unable to send request. Please check your connection.';
    }
    
    if (e.type == DioExceptionType.connectionError) {
      return 'Cannot connect to server. Please check your internet connection.';
    }
    
    // Response errors
    if (e.response != null) {
      final statusCode = e.response?.statusCode;
      final responseData = e.response?.data;
      
      // Extract user-friendly message from response
      String? backendMessage;
      if (responseData is Map) {
        backendMessage = responseData['message'] as String?;
        backendMessage ??= responseData['error'] as String?;
      }
      
      // Status code specific messages
      switch (statusCode) {
        case 400:
          return backendMessage ?? 'Invalid request. Please check your input and try again.';
        case 401:
          return backendMessage ?? 'Invalid credentials. Please check your email and password.';
        case 403:
          return backendMessage ?? 'Access denied. Please contact support if you believe this is an error.';
        case 404:
          return backendMessage ?? 'Resource not found. Please try again later.';
        case 409:
          return backendMessage ?? 'This action conflicts with existing data. Please try again.';
        case 413:
          return 'File too large. Please choose a smaller file.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Server error. Our team has been notified. Please try again later.';
        default:
          return backendMessage ?? 'Request failed. Please try again.';
      }
    }
    
    // Unknown error
    return 'An unexpected error occurred. Please try again.';
  }
  
  static String _handleStringError(String error) {
    final lowerError = error.toLowerCase();
    
    // Authentication errors
    if (lowerError.contains('unauthorized') || 
        lowerError.contains('invalid credentials') ||
        lowerError.contains('wrong password')) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (lowerError.contains('not found') || 
        lowerError.contains('404') ||
        lowerError.contains('no rider found') ||
        lowerError.contains('no recovery agent found')) {
      return 'Account not found. Please check your email and try again.';
    }
    
    // Network errors
    if (lowerError.contains('connection') || 
        lowerError.contains('network') ||
        lowerError.contains('socket')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    
    // Timeout errors
    if (lowerError.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    // Forbidden errors
    if (lowerError.contains('forbidden') || lowerError.contains('403')) {
      return 'Access denied. Please contact support if you need assistance.';
    }
    
    // Server errors
    if (lowerError.contains('500') || 
        lowerError.contains('502') ||
        lowerError.contains('503') ||
        lowerError.contains('server error')) {
      return 'Server error. Please try again later.';
    }
    
    // Return original if it's already user-friendly, otherwise generic message
    if (error.length < 100 && !error.contains('exception') && !error.contains('dio')) {
      return error;
    }
    
    return 'Something went wrong. Please try again.';
  }
  
  /// Logs error for debugging (only in debug mode)
  static void logError(String context, dynamic error) {
    // Only log in debug mode - production won't see these
    assert(() {
      print('❌ [$context] Error: $error');
      if (error is DioException && error.response != null) {
        print('❌ [$context] Status: ${error.response?.statusCode}');
        print('❌ [$context] Response: ${error.response?.data}');
      }
      return true;
    }());
  }
}








