import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/services/secure_credentials_service.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/models/user_model.dart';

class RegistrationResult {
  final UserModel user;
  final String message;

  RegistrationResult({required this.user, required this.message});
}

class AuthRepository {
  final ApiClient _apiClient = ApiClient();

  Future<UserModel> login(String email, String password) async {
    try {
      final payload = {
        'email': email,
        'password': password,
      };

      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.login);
      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      // Log server response
      print('📥 [Login Response] Status: ${response.statusCode}');
      print('📥 [Login Response] Data: ${response.data}');
      
      // Check HTTP status code
      if (response.statusCode != null && (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Login failed (Status: ${response.statusCode})';
        throw errorMessage;
      }

      // Check nested status field in response body (API returns HTTP 200 but body may have status: 400)
      final bodyStatus = response.data['status'];
      if (bodyStatus != null && bodyStatus != 200) {
        // Extract error message from response body
        // Response structure: {status: 400, message: "failure", response: "Invalid username or password"}
        final errorResponse = response.data['response'];
        String errorMessage;
        if (errorResponse is String) {
          errorMessage = errorResponse;
        } else if (errorResponse is Map && errorResponse['message'] != null) {
          errorMessage = errorResponse['message'].toString();
        } else {
          errorMessage = response.data['message']?.toString() ?? 'Invalid username or password';
        }
        throw errorMessage;
      }

      // New API response structure: {status: 200, message: successful, response: {accessToken, userDetails, ...}}
      final responseData = response.data['response'];
      
      if (responseData == null) {
        throw 'Invalid response format: missing response field';
      }

      final token = responseData['accessToken'];
      final userData = responseData['userDetails'];

      if (userData == null) {
        throw 'Invalid response format: missing userDetails field';
      }

      if (token == null || token.toString().isEmpty) {
        throw 'Invalid response format: missing accessToken';
      }

      // Map server response to UserModel format
      // Server returns: id (int), firstName, lastName, email, phoneNumber
      // UserModel expects: id (int), name, email, token
      final idValue = userData['id'];
      int userId = 0;
      if (idValue != null) {
        if (idValue is int) {
          userId = idValue;
        } else {
          final idStr = idValue.toString();
          userId = int.tryParse(idStr) ?? idStr.hashCode.abs();
        }
      }

      // Combine firstName and lastName for name
      final firstName = userData['firstName'] ?? '';
      final lastName = userData['lastName'] ?? '';
      final fullName = '$firstName $lastName'.trim();

      final userJson = {
        'id': userId,
        'name': fullName.isNotEmpty ? fullName : (userData['email'] ?? ''),
        'email': userData['email'] ?? '',
        'token': token,
      };

      final user = UserModel.fromJson(userJson);

      // Save token and user data
      if (user.token != null && user.token!.isNotEmpty) {
        await _apiClient.updateToken(user.token);
        // Save the complete response data structure for future use
        await StorageService.saveUserData(jsonEncode(userJson));
      }

      return user;
    } on DioException catch (e) {
      ErrorHandler.logError('Auth Login', e);
      
      // Handle error response - check if responseData is a Map
      if (e.response != null) {
        final responseData = e.response?.data;
        
        // Handle error response - check if responseData is a Map
        if (responseData != null && responseData is Map) {
          // Check if there are validation errors in the response (only if response is a Map)
          final responseField = responseData['response'];
          if (responseField != null && responseField is Map<String, dynamic>) {
            final validationErrors = responseField;
            if (validationErrors.isNotEmpty) {
              // Format validation errors into a readable message
              final errorMessages = validationErrors.entries
                  .map((e) => '${e.key}: ${e.value}')
                  .join('\n');
              throw errorMessages;
            }
          }
          
          // Extract error message from response
          final errorMessage = responseData['message'] ??
              responseData['error'] ??
              ErrorHandler.getUserFriendlyError(e);
          throw errorMessage;
        } else {
          // If responseData is not a Map, use user-friendly error
          throw ErrorHandler.getUserFriendlyError(e);
        }
      } else {
        // No response data, use user-friendly error handler
        throw ErrorHandler.getUserFriendlyError(e);
      }
    } catch (e) {
      // If it's already a user-friendly string, rethrow it
      if (e is String) {
        rethrow;
      }
      // Otherwise, convert to user-friendly error
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  Future<RegistrationResult> register(
      String firstName, String lastName, String phoneNumber, String email, String password) async {
    try {
      final payload = {
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
        'email': email,
        'password': password,
      };

      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.register);
      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      // Log server response
      print('📥 [Register Response] Status: ${response.statusCode}');
      print('📥 [Register Response] Data: ${response.data}');
      
      // Check if response is successful (should be handled by validateStatus, but double-check)
      if (response.statusCode != null && (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Registration failed (Status: ${response.statusCode})';
        throw errorMessage;
      }

      // Get success message from response
      final successMessage =
          response.data['message'] ?? 'User registered successfully';

      final responseData = response.data['data'];

      // For registration, data might be empty - that's okay
      // Check if we have user data (like login) or if data is empty (registration success)
      if (responseData == null || responseData.isEmpty) {
        // Registration successful but no user data yet (email verification required)
        // Return a minimal user model with just the email
        final userJson = {
          'id': 0,
          'name': '$firstName $lastName',
          'email': email,
          'token': null, // No token until email is verified
        };
        return RegistrationResult(
          user: UserModel.fromJson(userJson),
          message: successMessage,
        );
      }

      // If data exists, process like login
      final token = responseData['token'];
      final userData = responseData['user'];

      if (userData == null) {
        // Even if userData is null, registration was successful
        // Return minimal user model
        final userJson = {
          'id': 0,
          'name': '$firstName $lastName',
          'email': email,
          'token': token,
        };
        final user = UserModel.fromJson(userJson);

        // Save token if available
        if (user.token != null && user.token!.isNotEmpty) {
          await _apiClient.updateToken(user.token);
          await StorageService.saveUserData(jsonEncode(userJson));
        }

        return RegistrationResult(
          user: user,
          message: successMessage,
        );
      }

      // Map server response to UserModel format (same as login)
      final idValue = userData['id'] ?? userData['_id'] ?? '';
      int userId = 0;
      if (idValue != null && idValue.toString().isNotEmpty) {
        if (idValue is int) {
          userId = idValue;
        } else {
          final idStr = idValue.toString();
          userId = int.tryParse(idStr) ?? idStr.hashCode.abs();
        }
      }

      final userJson = {
        'id': userId,
        'name': userData['fullName'] ??
            userData['name'] ??
            userData['username'] ??
            '$firstName $lastName',
        'email': userData['email'] ?? email,
        'token': token,
      };

      final user = UserModel.fromJson(userJson);

      // Save token and user data
      if (user.token != null && user.token!.isNotEmpty) {
        await _apiClient.updateToken(user.token);
        await StorageService.saveUserData(jsonEncode(userJson));
      }

      return RegistrationResult(
        user: user,
        message: successMessage,
      );
    } on DioException catch (e) {
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
        
        // Check if there are validation errors in the response
        if (responseData != null && responseData['response'] != null) {
          final validationErrors = responseData['response'] as Map<String, dynamic>?;
          if (validationErrors != null && validationErrors.isNotEmpty) {
            // Format validation errors into a readable message
            final errorMessages = validationErrors.entries
                .map((e) => '${e.key}: ${e.value}')
                .join('\n');
            throw errorMessages;
          }
        }
        
        final errorMessage = responseData?['message'] ??
            responseData?['error'] ??
            'Registration failed (Status: ${e.response?.statusCode})';
        throw errorMessage;
      } else {
        final errorMsg = e.message ?? 'Network error: ${e.type}';
        throw errorMsg;
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<UserModel?> getStoredUser() async {
    try {
      final userData = await StorageService.getUserData();
      if (userData != null) {
        return UserModel.fromJson(jsonDecode(userData));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<String> forgotPassword(String email) async {
    try {
      final payload = {
        'email': email,
      };

      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.forgotPassword);
      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      // Log server response
      print('📥 [Forgot Password Response] Status: ${response.statusCode}');
      print('📥 [Forgot Password Response] Data: ${response.data}');
      
      // Check if response is successful (should be handled by validateStatus, but double-check)
      if (response.statusCode != null && (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to send password reset email (Status: ${response.statusCode})';
        throw errorMessage;
      }

      // Get success message from response
      final successMessage = response.data['message'] ??
          response.data['response']?['message'] ??
          'Password reset email sent successfully';
      
      return successMessage;
    } on DioException catch (e) {
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
        
        // Handle specific status codes with user-friendly messages
        if (statusCode == 403) {
          throw 'Access forbidden. Please contact support if you believe this is an error.';
        } else if (statusCode == 404) {
          throw 'Password reset service not found. Please try again later.';
        } else if (statusCode == 429) {
          throw 'Too many requests. Please wait a moment and try again.';
        }
        
        // Check if there are validation errors in the response
        if (responseData != null && responseData['response'] != null) {
          final validationErrors = responseData['response'] as Map<String, dynamic>?;
          if (validationErrors != null && validationErrors.isNotEmpty) {
            // Format validation errors into a readable message
            final errorMessages = validationErrors.entries
                .map((e) => '${e.key}: ${e.value}')
                .join('\n');
            throw errorMessages;
          }
        }
        
        final errorMessage = responseData?['message'] ??
            responseData?['error'] ??
            'Failed to send password reset email (Status: $statusCode)';
        throw errorMessage;
      } else {
        final errorMsg = e.message ?? 'Network error: ${e.type}';
        throw errorMsg;
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<String> resetPassword(String email, String password, String resetOtp) async {
    try {
      final payload = {
        'email': email,
        'password': password,
        'resetOtp': resetOtp,
      };

      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.resetPassword);
      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      // Log server response
      print('📥 [Reset Password Response] Status: ${response.statusCode}');
      print('📥 [Reset Password Response] Data: ${response.data}');
      
      // Check if response is successful (should be handled by validateStatus, but double-check)
      if (response.statusCode != null && (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to reset password (Status: ${response.statusCode})';
        throw errorMessage;
      }

      // Get success message from response
      final successMessage = response.data['message'] ??
          response.data['response']?['message'] ??
          'Password reset successfully';
      
      return successMessage;
    } on DioException catch (e) {
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
        
        // Handle specific status codes with user-friendly messages
        if (statusCode == 403) {
          throw 'Access forbidden. Please contact support if you believe this is an error.';
        } else if (statusCode == 404) {
          throw 'Password reset service not found. Please try again later.';
        } else if (statusCode == 400) {
          // Check for validation errors
          if (responseData != null && responseData['response'] != null) {
            final validationErrors = responseData['response'] as Map<String, dynamic>?;
            if (validationErrors != null && validationErrors.isNotEmpty) {
              final errorMessages = validationErrors.entries
                  .map((e) => '${e.key}: ${e.value}')
                  .join('\n');
              throw errorMessages;
            }
          }
          throw responseData?['message'] ?? 
              responseData?['error'] ?? 
              'Invalid OTP or email. Please check and try again.';
        }
        
        // Check if there are validation errors in the response
        if (responseData != null && responseData['response'] != null) {
          final validationErrors = responseData['response'] as Map<String, dynamic>?;
          if (validationErrors != null && validationErrors.isNotEmpty) {
            // Format validation errors into a readable message
            final errorMessages = validationErrors.entries
                .map((e) => '${e.key}: ${e.value}')
                .join('\n');
            throw errorMessages;
          }
        }
        
        final errorMessage = responseData?['message'] ??
            responseData?['error'] ??
            'Failed to reset password (Status: $statusCode)';
        throw errorMessage;
      } else {
        final errorMsg = e.message ?? 'Network error: ${e.type}';
        throw errorMsg;
      }
    } catch (e) {
      rethrow;
    }
  }



  Future<void> logout() async {
  await _apiClient.updateToken(null);
  await StorageService.removeAllAuthData(); // clears token + user data
  // Explicit logout revokes fingerprint quick-login too, so the next
  // person to use this device can't silently reuse this account.
  await SecureCredentialsService.disable();
}


}
