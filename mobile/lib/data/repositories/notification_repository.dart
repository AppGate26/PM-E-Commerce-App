import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/notification_model.dart';

class NotificationRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<NotificationModel>> getAllNotifications() async {
  try {
    final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.notifications);
    final response = await _apiClient.dio.get(
      normalizedUrl,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('📥 [Notifications Response] Status: ${response.statusCode}');
    print('📥 [Notifications Response] Data: ${response.data}');

    if (response.statusCode != 200) {
      final errorMessage =
          response.data['message'] ?? 'Failed to fetch notifications';
      throw errorMessage;
    }

    final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
    
    // Check if it's a paginated response with 'content' array
    if (responseData is Map && responseData['content'] != null) {
      final content = responseData['content'] as List;
      return content
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it's a direct list
    if (responseData is List) {
      return responseData
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it has a 'notifications' key
    if (responseData is Map && responseData['notifications'] != null) {
      final notifications = responseData['notifications'] as List;
      return notifications
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // If empty or no content, return empty list
    return [];
  } on DioException catch (e) {
    throw _handleDioError(e);
  } catch (e) {
    rethrow;
  }
}

  Future<List<NotificationModel>> getUserNotifications(int userId) async {
  try {
    final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.userNotifications(userId));
    final response = await _apiClient.dio.get(
      normalizedUrl,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('📥 [User Notifications Response] Status: ${response.statusCode}');
    print('📥 [User Notifications Response] Data: ${response.data}');

    if (response.statusCode != 200) {
      final errorMessage =
          response.data['message'] ?? 'Failed to fetch user notifications';
      throw errorMessage;
    }

    // Handle paginated response structure: {status: 200, data: {content: [], pageable: {...}}}
    final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
    
    // Check if it's a paginated response with 'content' array
    if (responseData is Map && responseData['content'] != null) {
      final content = responseData['content'] as List;
      return content
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it's a direct list
    if (responseData is List) {
      return responseData
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it has a 'notifications' key
    if (responseData is Map && responseData['notifications'] != null) {
      final notifications = responseData['notifications'] as List;
      return notifications
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // If empty or no content, return empty list instead of throwing error
    return [];
  } on DioException catch (e) {
    throw _handleDioError(e);
  } catch (e) {
    rethrow;
  }
}
Future<List<NotificationModel>> getUnreadNotifications(int userId) async {
  try {
    final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.userUnreadNotifications(userId));
    final response = await _apiClient.dio.get(
      normalizedUrl,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('📥 [Unread Notifications Response] Status: ${response.statusCode}');
    print('📥 [Unread Notifications Response] Data: ${response.data}');

    if (response.statusCode != 200) {
      final errorMessage =
          response.data['message'] ?? 'Failed to fetch unread notifications';
      throw errorMessage;
    }

    final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
    
    // Check if it's a paginated response with 'content' array
    if (responseData is Map && responseData['content'] != null) {
      final content = responseData['content'] as List;
      return content
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it's a direct list
    if (responseData is List) {
      return responseData
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it has a 'notifications' key
    if (responseData is Map && responseData['notifications'] != null) {
      final notifications = responseData['notifications'] as List;
      return notifications
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Return empty list if no content
    return [];
  } on DioException catch (e) {
    throw _handleDioError(e);
  } catch (e) {
    rethrow;
  }
}
 Future<List<NotificationModel>> getNotificationsByType(int userId, String type) async {
  try {
    final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.userNotificationsByType(userId, type));
    final response = await _apiClient.dio.get(
      normalizedUrl,
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('📥 [Notifications By Type Response] Status: ${response.statusCode}');
    print('📥 [Notifications By Type Response] Data: ${response.data}');

    if (response.statusCode != 200) {
      final errorMessage =
          response.data['message'] ?? 'Failed to fetch notifications by type';
      throw errorMessage;
    }

    final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
    
    // Check if it's a paginated response with 'content' array
    if (responseData is Map && responseData['content'] != null) {
      final content = responseData['content'] as List;
      return content
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it's a direct list
    if (responseData is List) {
      return responseData
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Check if it has a 'notifications' key
    if (responseData is Map && responseData['notifications'] != null) {
      final notifications = responseData['notifications'] as List;
      return notifications
          .map((json) => NotificationModel.fromJson(json))
          .toList();
    }
    
    // Return empty list if no content
    return [];
  } on DioException catch (e) {
    throw _handleDioError(e);
  } catch (e) {
    rethrow;
  }
}
  Future<NotificationStats> getNotificationStats(int userId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.userNotificationStats(userId));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Notification Stats Response] Status: ${response.statusCode}');
      print('📥 [Notification Stats Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch notification stats';
        throw errorMessage;
      }

      final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
      return NotificationStats.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<NotificationModel> markAsRead(int notificationId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.markNotificationRead(notificationId));
      final response = await _apiClient.dio.put(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Mark Read Response] Status: ${response.statusCode}');
      print('📥 [Mark Read Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to mark notification as read';
        throw errorMessage;
      }

      final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
      return NotificationModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<NotificationModel> archiveNotification(int notificationId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.archiveNotification(notificationId));
      final response = await _apiClient.dio.put(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Archive Notification Response] Status: ${response.statusCode}');
      print('📥 [Archive Notification Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to archive notification';
        throw errorMessage;
      }

      final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
      return NotificationModel.fromJson(responseData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<String> markAllAsRead(int userId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.markAllNotificationsRead(userId));
      final response = await _apiClient.dio.put(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Mark All Read Response] Status: ${response.statusCode}');
      print('📥 [Mark All Read Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to mark all notifications as read';
        throw errorMessage;
      }

      return response.data['message'] ?? 'All notifications marked as read';
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<NotificationModel> getNotificationById(int notificationId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.notificationById(notificationId));
      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [Notification By ID Response] Status: ${response.statusCode}');
      print('📥 [Notification By ID Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch notification';
        throw errorMessage;
      }

      final responseData = response.data['response'] ?? response.data['data'] ?? response.data;
      return NotificationModel.fromJson(responseData);
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