// lib/data/repositories/delivery_agent_repository.dart
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/services/delivery_api_verification_service.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/models/delivery_agent_model.dart';

class DeliveryAgentRepository {
  final ApiClient _apiClient = ApiClient();

  // Login
  Future<DeliveryAgent> login(String email, String password) async {
    try {
      final payload = {
        'email': email,
        'password': password,
      };

      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.deliveryAgentLogin);
      DeliveryApiVerificationService.logApiCall(
          'Delivery Agent Login', 'POST', normalizedUrl,
          payload: payload);

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [DeliveryAgent Login Response] Status: ${response.statusCode}');
      print('📥 [DeliveryAgent Login Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Login failed (Status: ${response.statusCode})';
        throw errorMessage;
      }

      // Check nested status field in response body (API returns HTTP 200 but body may have status: 400)
      final bodyStatus = response.data['status'];
      if (bodyStatus != null && bodyStatus != 200) {
        // Extract error message from response body
        // Response structure: {status: 400, message: "failure", response: "Invalid email or password"}
        final errorResponse =
            response.data['response'] ?? response.data['data'];
        String errorMessage;
        if (errorResponse is String) {
          errorMessage = errorResponse;
        } else if (errorResponse is Map && errorResponse['message'] != null) {
          errorMessage = errorResponse['message'].toString();
        } else {
          errorMessage = response.data['message']?.toString() ??
              'Invalid email or password';
        }
        throw errorMessage;
      }

      // Handle response structure: {status: 200, message: ..., data: {riderId, fullName, email, token}}
      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      if (responseData == null) {
        throw 'Invalid response format: missing data field';
      }

      // Extract token and rider data
      final token = responseData['token'] ?? responseData['accessToken'];

      // Extract rider information
      final riderId = responseData['riderId'] ?? responseData['id'] ?? 0;
      final fullName = responseData['fullName'] ?? responseData['name'] ?? '';
      final riderEmail = responseData['email'] ?? email;

      print(
          '🔍 [DeliveryAgent Login] Parsed - riderId: $riderId, fullName: $fullName, email: $riderEmail');

      final agent = DeliveryAgent(
        riderId: riderId,
        email: riderEmail,
        name: fullName,
        phoneNumber: responseData['phoneNumber'] ?? responseData['phone'],
        accessToken: token,
      );

      // Save token and rider data
      if (token != null && token.toString().isNotEmpty) {
        await _apiClient.updateToken(token.toString());
        await StorageService.saveUserData(jsonEncode({
          'id': riderId,
          'email': riderEmail,
          'name': fullName.isNotEmpty ? fullName : 'USER',
          'token': token,
          'role': 'DELIVERY_AGENT',
        }));
        print(
            '✅ [DeliveryAgent Login] Token and user data saved - riderId: $riderId, name: $fullName');
      }

      print(
          '✅ [DeliveryAgent Login] Success - riderId: $riderId, email: $riderEmail, name: $fullName');
      DeliveryApiVerificationService.logApiSuccess('Delivery Agent Login',
          response: {'riderId': riderId, 'email': riderEmail});
      return agent;
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent Login', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Login', userFriendlyError);
      throw userFriendlyError;
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent Login', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Login', userFriendlyError);
      throw userFriendlyError;
    }
  }

  // Forgot Password - Returns reset code
  Future<String> forgotPassword(String email) async {
    try {
      final payload = {'email': email};
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.deliveryAgentForgotPassword);
      DeliveryApiVerificationService.logApiCall(
          'Delivery Agent Forgot Password', 'POST', normalizedUrl,
          payload: payload);

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print(
          '📥 [DeliveryAgent ForgotPassword Response] Status: ${response.statusCode}');
      print(
          '📥 [DeliveryAgent ForgotPassword Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to send reset code';
        throw errorMessage;
      }

      // Extract code from response
      final responseData = response.data['response'] ?? response.data;
      final code = responseData['code'] ??
          responseData['resetCode'] ??
          responseData['otp'];
      final message =
          response.data['message'] ?? 'Reset code sent successfully';

      if (code != null) {
        print('✅ [DeliveryAgent ForgotPassword] Code received: $code');
        DeliveryApiVerificationService.logApiSuccess(
            'Delivery Agent Forgot Password',
            response: {'code': code});
        return code.toString();
      } else {
        print('✅ [DeliveryAgent ForgotPassword] Success - code sent to email');
        DeliveryApiVerificationService.logApiSuccess(
            'Delivery Agent Forgot Password',
            response: {'message': message});
        return message;
      }
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent ForgotPassword', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Forgot Password', userFriendlyError);
      throw userFriendlyError;
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent ForgotPassword', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Forgot Password', userFriendlyError);
      throw userFriendlyError;
    }
  }

  // Reset Password - Uses reset code (for forgot password flow)
  Future<void> resetPassword({
    required String email,
    required String password,
    required String resetOtp,
  }) async {
    try {
      // Try with resetOtp first (as per Swagger docs)
      // If that fails with 403, backend might expect resetCode instead
      Map<String, dynamic> payload = {
        'email': email,
        'password': password,
        'resetOtp': resetOtp,
      };

      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.deliveryAgentResetPassword);
      DeliveryApiVerificationService.logApiCall(
          'Delivery Agent Reset Password', 'POST', normalizedUrl,
          payload: payload);
      print('');
      print('═══════════════════════════════════════════════════════════════');
      print('🔐 DELIVERY AGENT RESET PASSWORD REQUEST');
      print('═══════════════════════════════════════════════════════════════');
      print('📧 Email: $email');
      print('🔑 Reset OTP: $resetOtp (${resetOtp.length} digits)');
      print('🌐 Endpoint: $normalizedUrl');
      print('📦 Payload: $payload');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print(
          '📥 [DeliveryAgent ResetPassword Response] Status: ${response.statusCode}');
      print('📥 [DeliveryAgent ResetPassword Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to reset password';
        throw errorMessage;
      }

      print('✅ [DeliveryAgent ResetPassword] Success');
      DeliveryApiVerificationService.logApiSuccess(
          'Delivery Agent Reset Password');
    } on DioException catch (e) {
      // Enhanced error logging
      print('');
      print('═══════════════════════════════════════════════════════════════');
      print('❌ DELIVERY AGENT RESET PASSWORD ERROR');
      print('═══════════════════════════════════════════════════════════════');
      print('📧 Email: $email');
      print('🔑 Reset OTP: $resetOtp (${resetOtp.length} digits)');
      print('🔴 Error Type: ${e.type}');
      print('🔴 Status Code: ${e.response?.statusCode}');
      print('🔴 Response Data: ${e.response?.data}');
      print('🔴 Error Message: ${e.message}');
      print('🔴 Request URL: ${e.requestOptions.uri}');
      print('🔴 Request Headers: ${e.requestOptions.headers}');
      print('🔴 Request Data: ${e.requestOptions.data}');
      print('');
      print('🔍 TROUBLESHOOTING:');
      print('   1. Check if OTP code is valid and not expired');
      print('   2. Verify email matches the one used in forgot-password');
      print('   3. Check if backend endpoint requires authentication');
      print('   4. Verify field names match backend expectations');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      // If 403, try with resetCode instead of resetOtp (some backends use different field names)
      if (e.response?.statusCode == 403) {
        final retryUrl =
            ApiConstants.normalizeUrl(ApiConstants.deliveryAgentResetPassword);
        print(
            '🔄 [DeliveryAgent ResetPassword] Got 403, trying with "resetCode" field name...');
        try {
          final alternativePayload = {
            'email': email,
            'password': password,
            'resetCode': resetOtp, // Try resetCode instead
          };

          print(
              '🔄 [DeliveryAgent ResetPassword] Retry payload: $alternativePayload');

          await _apiClient.dio.post(
            retryUrl,
            data: alternativePayload,
            options: Options(
              contentType: 'application/json',
              headers: {'Accept': 'application/json'},
            ),
          );

          print(
              '✅ [DeliveryAgent ResetPassword] Success with resetCode field!');
          DeliveryApiVerificationService.logApiSuccess(
              'Delivery Agent Reset Password (with resetCode)');
          return;
        } catch (retryError) {
          print(
              '❌ [DeliveryAgent ResetPassword] Retry with resetCode also failed: $retryError');
          // Continue to throw original error
        }
      }

      ErrorHandler.logError('DeliveryAgent ResetPassword', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Reset Password', userFriendlyError);
      throw userFriendlyError;
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent ResetPassword', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Reset Password', userFriendlyError);
      throw userFriendlyError;
    }
  }

  // Change Password - For authenticated users changing their password
  Future<void> changePassword({
    int? riderId,
    String? email,
    String? oldPassword,
    required String newPassword,
    String? resetCode,
  }) async {
    try {
      // If resetCode is provided, use resetPassword endpoint instead
      if (resetCode != null && email != null) {
        print('');
        print(
            '🔄 [DeliveryAgent] Using reset code - calling resetPassword endpoint instead');
        print('   → This is a password reset flow, not a password change');
        print('');
        await resetPassword(
          email: email,
          password: newPassword,
          resetOtp: resetCode,
        );
        return;
      }

      // Regular password change (authenticated user)
      if (riderId == null) {
        throw 'Rider ID is required for password change';
      }

      final payload = {
        'newPassword': newPassword,
        if (oldPassword != null) 'oldPassword': oldPassword,
      };

      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.deliveryAgentChangePassword(riderId));
      DeliveryApiVerificationService.logApiCall(
          'Delivery Agent Change Password', 'PUT', normalizedUrl,
          payload: payload);
      print('🚚 [DeliveryAgent ChangePassword] RiderId: $riderId');
      print(
          '🚚 [DeliveryAgent ChangePassword] Regular password change (authenticated)');

      final response = await _apiClient.dio.put(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print(
          '📥 [DeliveryAgent ChangePassword Response] Status: ${response.statusCode}');
      print(
          '📥 [DeliveryAgent ChangePassword Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to change password';
        throw errorMessage;
      }

      print('✅ [DeliveryAgent ChangePassword] Success');
      DeliveryApiVerificationService.logApiSuccess(
          'Delivery Agent Change Password');
    } on DioException catch (e) {
      // Enhanced error logging
      print('');
      print('═══════════════════════════════════════════════════════════════');
      print('❌ DELIVERY AGENT CHANGE PASSWORD ERROR');
      print('═══════════════════════════════════════════════════════════════');
      print('🆔 RiderId: $riderId');
      print('📧 Email: $email');
      print('🔴 Error Type: ${e.type}');
      print('🔴 Status Code: ${e.response?.statusCode}');
      print('🔴 Response Data: ${e.response?.data}');
      print('🔴 Error Message: ${e.message}');
      print('═══════════════════════════════════════════════════════════════');
      print('');

      ErrorHandler.logError('DeliveryAgent ChangePassword', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Change Password', userFriendlyError);
      throw userFriendlyError;
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent ChangePassword', e);
      final userFriendlyError = ErrorHandler.getUserFriendlyError(e);
      DeliveryApiVerificationService.logApiError(
          'Delivery Agent Change Password', userFriendlyError);
      throw userFriendlyError;
    }
  }

  // Get Pending Deliveries
  // Get Pending Deliveries
  Future<List<PendingDelivery>> getPendingDeliveries(int riderId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.deliveryAgentPendingDeliveries(riderId));
      print('🚚 [DeliveryAgent PendingDeliveries] URL: $normalizedUrl');

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
          '📥 [DeliveryAgent PendingDeliveries Response] Status: ${response.statusCode}');
      print(
          '📥 [DeliveryAgent PendingDeliveries Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch pending deliveries';
        throw errorMessage;
      }

      // Extract data from the nested structure
      List<dynamic> list;

      if (response.data is Map) {
        // First check for 'data' -> 'content' structure
        if (response.data['data'] != null &&
            response.data['data']['content'] != null) {
          list = response.data['data']['content'] as List<dynamic>;
          print(
              '✅ [DeliveryAgent PendingDeliveries] Found data in response.data.data.content');
        }
        // Then check for 'response' -> 'content' structure
        else if (response.data['response'] != null &&
            response.data['response']['content'] != null) {
          list = response.data['response']['content'] as List<dynamic>;
          print(
              '✅ [DeliveryAgent PendingDeliveries] Found data in response.data.response.content');
        }
        // Then check for direct 'content'
        else if (response.data['content'] != null) {
          list = response.data['content'] as List<dynamic>;
          print(
              '✅ [DeliveryAgent PendingDeliveries] Found data in response.data.content');
        }
        // Then check for direct array in 'data'
        else if (response.data['data'] != null &&
            response.data['data'] is List) {
          list = response.data['data'] as List<dynamic>;
          print(
              '✅ [DeliveryAgent PendingDeliveries] Found direct array in response.data');
        }
        // Then check for direct array in 'response'
        else if (response.data['response'] != null &&
            response.data['response'] is List) {
          list = response.data['response'] as List<dynamic>;
          print(
              '✅ [DeliveryAgent PendingDeliveries] Found direct array in response.data.response');
        }
        // Then check if response.data itself is a list
        else if (response.data is List) {
          list = response.data as List<dynamic>;
          print(
              '✅ [DeliveryAgent PendingDeliveries] response.data is direct array');
        }
        // Try to find any list in the response
        else {
          // Search for any list in the response
          final allLists = _findListsInResponse(response.data);
          if (allLists.isNotEmpty) {
            list = allLists.first;
            print(
                '✅ [DeliveryAgent PendingDeliveries] Found list in nested structure');
          } else {
            print(
                '⚠️ [DeliveryAgent PendingDeliveries] No deliveries list found in response');
            print('📋 Response structure: ${response.data}');
            return [];
          }
        }
      } else if (response.data is List) {
        list = response.data as List<dynamic>;
        print(
            '✅ [DeliveryAgent PendingDeliveries] response.data is direct array');
      } else {
        print(
            '⚠️ [DeliveryAgent PendingDeliveries] Response data is not a Map or List');
        return [];
      }

      if (list.isEmpty) {
        print('ℹ️ [DeliveryAgent PendingDeliveries] Deliveries list is empty');
        return [];
      }

      print(
          '📋 [DeliveryAgent PendingDeliveries] First item in list: ${list.first}');

      final deliveries = list
          .map((e) {
            try {
              return PendingDelivery.fromJson(e as Map<String, dynamic>);
            } catch (parseError) {
              print(
                  '❌ [DeliveryAgent PendingDeliveries] Error parsing delivery item: $parseError');
              print('   Item data: $e');
              return null;
            }
          })
          .whereType<PendingDelivery>()
          .toList();

      print(
          '✅ [DeliveryAgent PendingDeliveries] Loaded ${deliveries.length} pending deliveries');
      DeliveryApiVerificationService.logApiSuccess(
          'Delivery Agent Pending Deliveries',
          response: {'count': deliveries.length});
      return deliveries;
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent PendingDeliveries', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent PendingDeliveries', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

// Helper method to find lists in nested response
  List<dynamic> _findListsInResponse(dynamic data) {
    final lists = <List<dynamic>>[];

    void search(dynamic obj) {
      if (obj is List<dynamic>) {
        lists.add(obj);
      } else if (obj is Map<String, dynamic>) {
        for (final value in obj.values) {
          search(value);
        }
      }
    }

    search(data);
    return lists;
  }

  // Get Delivery History - DEBUG VERSION
  Future<List<DeliveryHistory>> getDeliveryHistory(int riderId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.deliveryAgentHistory(riderId));
      print('🚚 [DeliveryAgent History] URL: $normalizedUrl');
      print('🔍 [DeliveryAgent History] Rider ID: $riderId');

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
          '📥 [DeliveryAgent History Response] Status: ${response.statusCode}');

      // LOG THE FULL RESPONSE STRUCTURE
      print(
          '🔍 [DeliveryAgent History] Full response data type: ${response.data.runtimeType}');

      if (response.data is Map) {
        print('🔍 [DeliveryAgent History] Response is a Map');
        final mapData = response.data as Map<String, dynamic>;
        print('🔍 [DeliveryAgent History] Map keys: ${mapData.keys.toList()}');

        // Check each key for potential data
        for (final key in mapData.keys) {
          final value = mapData[key];
          print('   🔑 Key: "$key" - Type: ${value.runtimeType}');

          if (value is List) {
            print('   📋 List length: ${value.length}');
            if (value.isNotEmpty) {
              print('   📋 First item: ${value.first}');
            }
          } else if (value is Map) {
            print('   🗺️ Map keys: ${(value).keys.toList()}');
          }
        }
      }

      print('📥 [DeliveryAgent History Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch delivery history';
        throw errorMessage;
      }

      // Based on what we see in the logs, adjust the data extraction
      dynamic listData;

      if (response.data is Map) {
        final mapData = response.data as Map<String, dynamic>;

        // Try different possible structures based on the pending deliveries pattern
        // The pending deliveries used: data -> content
        if (mapData['data'] != null) {
          if (mapData['data'] is Map && mapData['data']['content'] != null) {
            listData = mapData['data']['content'];
            print(
                '✅ [DeliveryAgent History] Found data in response.data.data.content');
          } else if (mapData['data'] is List) {
            listData = mapData['data'];
            print(
                '✅ [DeliveryAgent History] Found direct list in response.data');
          }
        }

        // Try other possible structures
        if (listData == null && mapData['response'] != null) {
          if (mapData['response'] is Map &&
              mapData['response']['content'] != null) {
            listData = mapData['response']['content'];
            print(
                '✅ [DeliveryAgent History] Found data in response.data.response.content');
          } else if (mapData['response'] is List) {
            listData = mapData['response'];
            print(
                '✅ [DeliveryAgent History] Found direct list in response.data.response');
          }
        }

        if (listData == null && mapData['content'] != null) {
          listData = mapData['content'];
          print(
              '✅ [DeliveryAgent History] Found direct content in response.data');
        }

        if (listData == null && mapData.containsKey('items')) {
          listData = mapData['items'];
          print('✅ [DeliveryAgent History] Found data in response.data.items');
        }

        // If still null, check if there's any list in the response
        if (listData == null) {
          final allLists = _findListsInResponse(response.data);
          if (allLists.isNotEmpty) {
            listData = allLists.first;
            print('✅ [DeliveryAgent History] Found list in nested structure');
          }
        }
      } else if (response.data is List) {
        listData = response.data;
        print('✅ [DeliveryAgent History] response.data is direct array');
      }

      if (listData == null) {
        print('⚠️ [DeliveryAgent History] No history data found in response');
        print('📋 Response structure: ${response.data}');
        return [];
      }

      if (listData is! List) {
        print(
            '⚠️ [DeliveryAgent History] Response data is not a list: ${listData.runtimeType}');
        return [];
      }

      final List<dynamic> list = listData;
      if (list.isEmpty) {
        print('ℹ️ [DeliveryAgent History] History list is empty');
        return [];
      }

      // Debug the first item to see its structure
      if (list.isNotEmpty) {
        print('🔍 [DeliveryAgent History] First item structure:');
        final firstItem = list.first;
        if (firstItem is Map) {
          print('   Type: Map');
          print('   Keys: ${firstItem.keys.toList()}');
          print('   Values:');
          for (final key in firstItem.keys) {
            print(
                '     "$key": ${firstItem[key]} (${firstItem[key]?.runtimeType})');
          }
        } else {
          print('   Type: ${firstItem.runtimeType}');
          print('   Value: $firstItem');
        }
      }

      final history = list
          .map((e) {
            try {
              return DeliveryHistory.fromJson(e as Map<String, dynamic>);
            } catch (parseError) {
              print(
                  '❌ [DeliveryAgent History] Error parsing history item: $parseError');
              print('   Item data: $e');
              print('   Item type: ${e.runtimeType}');
              return null;
            }
          })
          .whereType<DeliveryHistory>()
          .toList();

      print(
          '✅ [DeliveryAgent History] Loaded ${history.length} history records');
      DeliveryApiVerificationService.logApiSuccess('Delivery Agent History',
          response: {'count': history.length});
      return history;
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent History', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent History', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Get Delivery Detail
  Future<DeliveryDetail> getDeliveryDetail(int riderBoxId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.deliveryAgentDetail(riderBoxId));
      print('🚚 [DeliveryAgent Detail] URL: $normalizedUrl');

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
          '📥 [DeliveryAgent Detail Response] Status: ${response.statusCode}');
      print('📥 [DeliveryAgent Detail Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch delivery detail';
        throw errorMessage;
      }

      final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
      final detail = DeliveryDetail.fromJson(responseData);
      print(
          '✅ [DeliveryAgent Detail] Loaded detail for riderBoxId: $riderBoxId');
      DeliveryApiVerificationService.logApiSuccess('Delivery Agent Detail',
          response: {'riderBoxId': riderBoxId});
      return detail;
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent Detail', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent Detail', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Confirm Delivery
  Future<void> confirmDelivery({
    required int riderBoxId,
    required String deliveryAgentName,
    required String deliveryAddress,
    required String itemOfDelivery,
    String? proofOfDeliveryImagePath,
    DateTime? timeOfDelivery,
  }) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.deliveryAgentConfirmDelivery);
      print('🚚 [DeliveryAgent ConfirmDelivery] URL: $normalizedUrl');
      print('🚚 [DeliveryAgent ConfirmDelivery] riderBoxId: $riderBoxId');
      print(
          '🚚 [DeliveryAgent ConfirmDelivery] deliveryAgentName: $deliveryAgentName');
      print(
          '🚚 [DeliveryAgent ConfirmDelivery] deliveryAddress: $deliveryAddress');
      print(
          '🚚 [DeliveryAgent ConfirmDelivery] itemOfDelivery: $itemOfDelivery');
      print(
          '🚚 [DeliveryAgent ConfirmDelivery] proofImagePath: $proofOfDeliveryImagePath');

      final formDataMap = <String, dynamic>{
        'riderBoxId': riderBoxId,
        'deliveryAgentName': deliveryAgentName,
        'deliveryAddress': deliveryAddress,
        'itemOfDelivery': itemOfDelivery,
      };

      // Add proof image if provided
      if (proofOfDeliveryImagePath != null) {
        try {
          final file = await MultipartFile.fromFile(
            proofOfDeliveryImagePath,
            filename: 'proof_of_delivery.jpg',
          );
          formDataMap['proofOfDeliveryImage'] = file;
          print('✅ [DeliveryAgent ConfirmDelivery] Image file attached');
        } catch (e) {
          print('⚠️ [DeliveryAgent ConfirmDelivery] Error attaching image: $e');
          // Continue without image if file read fails
        }
      }

      // Add time of delivery if provided
      if (timeOfDelivery != null) {
        formDataMap['timeOfDelivery'] = timeOfDelivery.toIso8601String();
      }

      final formData = FormData.fromMap(formDataMap);

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: formData,
        options: Options(
          headers: {'Accept': 'application/json'},
        ),
      );

      print(
          '📥 [DeliveryAgent ConfirmDelivery Response] Status: ${response.statusCode}');
      print(
          '📥 [DeliveryAgent ConfirmDelivery Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to confirm delivery';
        throw errorMessage;
      }

      print('✅ [DeliveryAgent ConfirmDelivery] Success');
      DeliveryApiVerificationService.logApiSuccess(
          'Delivery Agent Confirm Delivery');
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent ConfirmDelivery', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent ConfirmDelivery', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Submit Feedback
  Future<void> submitFeedback({
    required int riderBoxId,
    required String deliveryAgentName,
    required int productId,
    required String customerName,
    required String status, // DELIVERED, etc.
  }) async {
    try {
      final payload = {
        'riderBoxId': riderBoxId,
        'deliveryAgentName': deliveryAgentName,
        'productId': productId,
        'customerName': customerName,
        'status': status,
      };

      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.deliveryAgentSubmitFeedback);
      DeliveryApiVerificationService.logApiCall(
          'Delivery Agent Submit Feedback', 'POST', normalizedUrl,
          payload: payload);

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print(
          '📥 [DeliveryAgent SubmitFeedback Response] Status: ${response.statusCode}');
      print(
          '📥 [DeliveryAgent SubmitFeedback Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to submit feedback';
        throw errorMessage;
      }

      print('✅ [DeliveryAgent SubmitFeedback] Success');
      DeliveryApiVerificationService.logApiSuccess(
          'Delivery Agent Submit Feedback');
    } on DioException catch (e) {
      ErrorHandler.logError('DeliveryAgent SubmitFeedback', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('DeliveryAgent SubmitFeedback', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }
}
