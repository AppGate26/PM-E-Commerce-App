// lib/data/repositories/goods_recovery_repository.dart
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/utils/error_handler.dart';
import 'package:pm_e_commerce_app/data/models/recovery_model.dart';

class GoodsRecoveryRepository {
  final ApiClient _apiClient = ApiClient();

  // Login
  Future<RecoveryAgent> login(String email, String password) async {
    try {
      final payload = {
        'email': email,
        'password': password,
      };

      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryLogin);
      print('🔄 [GoodsRecovery Login] URL: $normalizedUrl');
      print('🔄 [GoodsRecovery Login] Payload: $payload');

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [GoodsRecovery Login Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery Login Response] Data: ${response.data}');

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
        final errorResponse = response.data['response'] ?? response.data['data'];
        String errorMessage;
        if (errorResponse is String) {
          errorMessage = errorResponse;
        } else if (errorResponse is Map && errorResponse['message'] != null) {
          errorMessage = errorResponse['message'].toString();
        } else {
          errorMessage = response.data['message']?.toString() ?? 'Invalid email or password';
        }
        throw errorMessage;
      }

      // Handle response structure: {status: 200, message: ..., data: {recoveryAgentId, fullName, email, token}}
      final responseData = response.data['data'] ?? response.data['response'] ?? response.data;
      if (responseData == null) {
        throw 'Invalid response format: missing data field';
      }

      // Extract token and agent data
      final token = responseData['token'] ?? responseData['accessToken'];
      final agentData = responseData['recoveryAgentDetails'] ?? responseData['recoveryAgent'] ?? responseData;

      // Extract agent information
      final agentId = agentData['recoveryAgentId'] ?? agentData['id'] ?? responseData['recoveryAgentId'] ?? responseData['id'] ?? 0;
      final fullName = agentData['fullName'] ?? agentData['name'] ?? responseData['fullName'] ?? responseData['name'] ?? '';
      final agentEmail = agentData['email'] ?? responseData['email'] ?? email;
      
      print('🔍 [GoodsRecovery Login] Parsed - agentId: $agentId, fullName: $fullName, email: $agentEmail');
      final agent = RecoveryAgent(
        recoveryAgentId: agentId,
        email: agentEmail,
        name: fullName.isNotEmpty ? fullName : (agentData['name'] ?? agentData['recoveryAgentName'] ?? ''),
        phoneNumber: agentData['phoneNumber'] ?? agentData['phone'],
        accessToken: token,
      );

      // Save token and agent data
      if (token != null && token.toString().isNotEmpty) {
        await _apiClient.updateToken(token.toString());
        await StorageService.saveUserData(jsonEncode({
          'id': agentId,
          'email': agentEmail,
          'name': fullName.isNotEmpty ? fullName : 'USER',
          'token': token,
          'role': 'RECOVERY_AGENT',
        }));
        print('✅ [GoodsRecovery Login] Token and user data saved - agentId: $agentId, name: $fullName');
      }

      print('✅ [GoodsRecovery Login] Success - agentId: $agentId, email: $agentEmail, name: $fullName');
      return agent;
    } on DioException catch (e) {
      print('');
      print('═══════════════════════════════════════════════════════════════');
      print('❌ [GoodsRecovery Login] DioException Error');
      print('═══════════════════════════════════════════════════════════════');
      print('🔴 Error Type: ${e.type}');
      print('🔴 Status Code: ${e.response?.statusCode}');
      print('🔴 Response Data: ${e.response?.data}');
      print('🔴 Error Message: ${e.message}');
      print('🔴 Request URL: ${e.requestOptions.uri}');
      print('═══════════════════════════════════════════════════════════════');
      print('');
      ErrorHandler.logError('GoodsRecovery Login', e);
      final errorMsg = ErrorHandler.getUserFriendlyError(e);
      print('❌ [GoodsRecovery Login] Throwing error: $errorMsg');
      throw errorMsg;
    } catch (e) {
      print('');
      print('═══════════════════════════════════════════════════════════════');
      print('❌ [GoodsRecovery Login] General Error');
      print('═══════════════════════════════════════════════════════════════');
      print('🔴 Error: $e');
      print('🔴 Error Type: ${e.runtimeType}');
      print('═══════════════════════════════════════════════════════════════');
      print('');
      ErrorHandler.logError('GoodsRecovery Login', e);
      final errorMsg = ErrorHandler.getUserFriendlyError(e);
      print('❌ [GoodsRecovery Login] Throwing error: $errorMsg');
      throw errorMsg;
    }
  }

  // Forgot Password - Returns reset code
  Future<String> forgotPassword(String email) async {
    try {
      final payload = {'email': email};
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryForgotPassword);
      print('🔄 [GoodsRecovery ForgotPassword] URL: $normalizedUrl');
      print('🔄 [GoodsRecovery ForgotPassword] Email: $email');

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [GoodsRecovery ForgotPassword Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery ForgotPassword Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to send reset code';
        throw errorMessage;
      }

      // Extract code from response
      final responseData = response.data['response'] ?? response.data;
      final code = responseData['code'] ?? responseData['resetCode'] ?? responseData['otp'];
      final message = response.data['message'] ?? 'Reset code sent successfully';

      if (code != null) {
        print('✅ [GoodsRecovery ForgotPassword] Code received: $code');
        return code.toString();
      } else {
        print('✅ [GoodsRecovery ForgotPassword] Success - code sent to email');
        return message;
      }
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery ForgotPassword', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery ForgotPassword', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Reset Password - Uses reset code (for forgot password flow)
  Future<void> resetPassword({
    required String email,
    required String password,
    required String resetOtp,
  }) async {
    try {
      Map<String, dynamic> payload = {
        'email': email,
        'password': password,
        'resetOtp': resetOtp,
      };
      
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryResetPassword);
      print('🔄 [GoodsRecovery ResetPassword] URL: $normalizedUrl');
      print('🔄 [GoodsRecovery ResetPassword] Email: $email');
      print('🔄 [GoodsRecovery ResetPassword] Reset OTP: ${resetOtp.length} digits');

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [GoodsRecovery ResetPassword Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery ResetPassword Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to reset password';
        throw errorMessage;
      }

      print('✅ [GoodsRecovery ResetPassword] Success');
    } on DioException catch (e) {
      // If 403, try with resetCode instead of resetOtp
      if (e.response?.statusCode == 403) {
        print('🔄 [GoodsRecovery ResetPassword] Got 403, trying with "resetCode" field name...');
        try {
          final alternativePayload = {
            'email': email,
            'password': password,
            'resetCode': resetOtp,
          };
          
          final retryUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryResetPassword);
          await _apiClient.dio.post(
            retryUrl,
            data: alternativePayload,
            options: Options(
              contentType: 'application/json',
              headers: {'Accept': 'application/json'},
            ),
          );
          
          print('✅ [GoodsRecovery ResetPassword] Success with resetCode field!');
          return;
        } catch (retryError) {
          print('❌ [GoodsRecovery ResetPassword] Retry with resetCode also failed: $retryError');
        }
      }
      
      ErrorHandler.logError('GoodsRecovery ResetPassword', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery ResetPassword', e);
      throw ErrorHandler.getUserFriendlyError(e);
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
        print('🔄 [GoodsRecovery] Using reset code - calling resetPassword endpoint instead');
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
        'confirmPassword': newPassword, // Some backends require this
      };
      
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryChangePassword(riderId));
      print('🔄 [GoodsRecovery ChangePassword] URL: $normalizedUrl');
      print('🔄 [GoodsRecovery ChangePassword] RiderId: $riderId');

      final response = await _apiClient.dio.put(
        normalizedUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [GoodsRecovery ChangePassword Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery ChangePassword Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to change password';
        throw errorMessage;
      }

      print('✅ [GoodsRecovery ChangePassword] Success');
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery ChangePassword', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery ChangePassword', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Get Pending Recoveries
  Future<List<PendingRecovery>> getPendingRecoveries() async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryPending);
      print('🔄 [GoodsRecovery Pending] URL: $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [GoodsRecovery Pending Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery Pending Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch pending recoveries';
        throw errorMessage;
      }

      final list = response.data['response'] ?? response.data['data'] ?? [];
      if (list is! List) {
        print('⚠️ [GoodsRecovery Pending] No recoveries found');
        return [];
      }

      final recoveries = list.map((e) => PendingRecovery.fromJson(e)).toList();
      print('✅ [GoodsRecovery Pending] Loaded ${recoveries.length} pending recoveries');
      return recoveries;
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery Pending', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery Pending', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Get Recovery Reports
  Future<List<RecoveryReport>> getRecoveryReports() async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryReports);
      print('🔄 [GoodsRecovery Reports] URL: $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [GoodsRecovery Reports Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery Reports Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch recovery reports';
        throw errorMessage;
      }

      final list = response.data['response'] ?? response.data['data'] ?? [];
      if (list is! List) {
        print('⚠️ [GoodsRecovery Reports] No reports found');
        return [];
      }

      final reports = list.map((e) => RecoveryReport.fromJson(e)).toList();
      print('✅ [GoodsRecovery Reports] Loaded ${reports.length} recovery reports');
      return reports;
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery Reports', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery Reports', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Get Recovery Report by ID
  Future<RecoveryReport> getRecoveryReportById(int recoveryId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryReportById(recoveryId));
      print('🔄 [GoodsRecovery Report Detail] URL: $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [GoodsRecovery Report Detail Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery Report Detail Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch recovery report';
        throw errorMessage;
      }

      final responseData = response.data['response'] ?? response.data;
      final report = RecoveryReport.fromJson(responseData);
      print('✅ [GoodsRecovery Report Detail] Loaded report for recoveryId: $recoveryId');
      return report;
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery Report Detail', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery Report Detail', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Get Customer Details
  Future<CustomerDetail> getCustomerDetails(int customerId) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryCustomer(customerId));
      print('🔄 [GoodsRecovery Customer] URL: $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [GoodsRecovery Customer Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery Customer Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to fetch customer details';
        throw errorMessage;
      }

      final responseData = response.data['response'] ?? response.data;
      final customer = CustomerDetail.fromJson(responseData);
      print('✅ [GoodsRecovery Customer] Loaded customer details for customerId: $customerId');
      return customer;
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery Customer', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery Customer', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }

  // Mark as Recovered
  Future<void> markAsRecovered({
    required int customerId,
    required int productId,
    required int recoveryAgentId,
    required int numberOfItemsRecovered,
    String? recoveryPhotoPath,
    DateTime? timeOfRecovery,
  }) async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.goodsRecoveryMarkRecovered);
      print('🔄 [GoodsRecovery MarkRecovered] URL: $normalizedUrl');
      print('🔄 [GoodsRecovery MarkRecovered] customerId: $customerId, productId: $productId');

      final formDataMap = <String, dynamic>{
        'customerId': customerId,
        'productId': productId,
        'recoveryAgentId': recoveryAgentId,
        'numberOfItemsRecovered': numberOfItemsRecovered,
      };

      // Add recovery photo if provided
      if (recoveryPhotoPath != null) {
        try {
          final file = await MultipartFile.fromFile(
            recoveryPhotoPath,
            filename: 'recovery_photo.jpg',
          );
          formDataMap['recoveryPhoto'] = file;
          print('✅ [GoodsRecovery MarkRecovered] Photo file attached');
        } catch (e) {
          print('⚠️ [GoodsRecovery MarkRecovered] Error attaching photo: $e');
        }
      }

      // Add time of recovery if provided
      if (timeOfRecovery != null) {
        formDataMap['timeOfRecovery'] = timeOfRecovery.toIso8601String();
      }

      final formData = FormData.fromMap(formDataMap);

      final response = await _apiClient.dio.post(
        normalizedUrl,
        data: formData,
        options: Options(
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [GoodsRecovery MarkRecovered Response] Status: ${response.statusCode}');
      print('📥 [GoodsRecovery MarkRecovered Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to mark as recovered';
        throw errorMessage;
      }

      print('✅ [GoodsRecovery MarkRecovered] Success');
    } on DioException catch (e) {
      ErrorHandler.logError('GoodsRecovery MarkRecovered', e);
      throw ErrorHandler.getUserFriendlyError(e);
    } catch (e) {
      ErrorHandler.logError('GoodsRecovery MarkRecovered', e);
      throw ErrorHandler.getUserFriendlyError(e);
    }
  }
}

