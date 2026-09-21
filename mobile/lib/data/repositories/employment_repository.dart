// data/repositories/employment_repository.dart

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/base_repository.dart';

class EmploymentRepository extends BaseRepository {
  // ============================================================
  // SUBMIT EMPLOYMENT INFORMATION (POST)
  // ============================================================
  Future<Map<String, dynamic>> submitEmploymentInformation({
    required int userId,
    required String employmentType,
    String? nameOfCompany,
    String? sector,
    String? jobRole,
    String? employerName,
    String? employerEmail,
    String? employerPhoneNumber,
    int? yearsOfEmployment,
    String? salaryRange,
    bool? anyEmploymentHistory,
    String? reasonForUnemployment,
    String? intentionForPayment,
    String? savingsRange,
    String? cacRegistrationNumber,
    String? descriptionOfServiceProduct,
    bool? employerOfLabour,
    int? workForce,
    String? profitRange,
  }) async {
    try {
      print('📤 [Employment] ===== SUBMITTING EMPLOYMENT INFO =====');

      final userData = await StorageService.getUserData();
      int finalUserId = userId;

      if (userData != null) {
        final userJson = jsonDecode(userData);
        finalUserId = userJson['id'] ?? userId;
      }

      // ✅ Build payload for POST
      final payload = <String, dynamic>{
        'userId': finalUserId,
        'employmentType': employmentType,
      };

      if (employmentType == 'EMPLOYED') {
        print('📤 [Employment] Building EMPLOYED payload...');
        if (nameOfCompany != null) payload['nameOfCompany'] = nameOfCompany;
        if (sector != null) payload['sector'] = sector;
        if (jobRole != null) payload['jobRole'] = jobRole;
        if (employerName != null) payload['employerName'] = employerName;
        if (employerEmail != null) payload['employerEmail'] = employerEmail;
        if (employerPhoneNumber != null) {
          payload['employerPhoneNumber'] = employerPhoneNumber;
        }
        if (yearsOfEmployment != null) {
          payload['yearsOfEmployment'] = yearsOfEmployment;
        }
        if (salaryRange != null) payload['salaryRange'] = salaryRange;
      } else if (employmentType == 'SELF_EMPLOYED') {
        print('📤 [Employment] Building SELF_EMPLOYED payload...');
        if (cacRegistrationNumber != null) {
          payload['cacRegistrationNumber'] = cacRegistrationNumber;
        }
        if (descriptionOfServiceProduct != null) {
          payload['descriptionOfServiceProduct'] = descriptionOfServiceProduct;
        }
        if (employerOfLabour != null) {
          payload['employerOfLabour'] = employerOfLabour;
        }
        if (workForce != null) payload['workForce'] = workForce;
        if (profitRange != null) payload['profitRange'] = profitRange;
      } else if (employmentType == 'UNEMPLOYED') {
        print('📤 [Employment] Building UNEMPLOYED payload...');
        if (anyEmploymentHistory != null) {
          payload['anyEmploymentHistory'] = anyEmploymentHistory;
        }
        if (reasonForUnemployment != null) {
          payload['reasonForUnemployment'] = reasonForUnemployment;
        }
        if (intentionForPayment != null) {
          payload['intentionForPayment'] = intentionForPayment;
        }
        if (savingsRange != null) payload['savingsRange'] = savingsRange;
      }

      print('📤 [Employment] Payload: $payload');

      final postUrl = ApiConstants.normalizeUrl(
        ApiConstants.employmentInformation,
      );
      print('📤 [Employment] URL: $postUrl');

      final response = await apiClient.dio.post(
        postUrl,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Employment POST] Status: ${response.statusCode}');
      print('📥 [Employment POST] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage = response.data['message'] ??
            response.data['error'] ??
            'Failed to submit employment information';
        print('🔴 [Employment] Error: $errorMessage');
        throw errorMessage;
      }

      print('✅ [Employment] Submitted successfully!');
      return {
        'success': true,
        'message': response.data['message'] ??
            'Employment information submitted successfully',
        'data': response.data['response'] ?? response.data['data'],
      };
    } on DioException catch (e) {
      final errorData = e.response?.data;
      final errorString = errorData?.toString() ?? '';
      final statusCode = e.response?.statusCode;

      print('🔴 [Employment] DioError: ${e.message}');
      print('🔴 [Employment] Status: $statusCode');
      print('🔴 [Employment] Response: ${e.response?.data}');

      // ✅ Check if duplicate error
      if (statusCode == 500 ||
          errorString.contains('identifier') ||
          errorString.contains('Duplicate entry') ||
          errorString.contains('already exists') ||
          errorString.contains('altered from')) {
        print('⚠️ [Employment] Record already exists!');
        throw 'You already have employment information saved. Please contact support to update it.';
      }

      handleDioError(e, 'Employment');
      rethrow;
    } catch (e) {
      print('🔴 [Employment] Error: $e');
      rethrow;
    }
  }

  // ============================================================
  // ✅ GET EMPLOYMENT INFORMATION (FETCH EXISTING DATA)
  // ============================================================
  Future<Map<String, dynamic>?> getEmploymentInfo() async {
    try {
      print('📤 [Employment] ===== FETCHING EMPLOYMENT INFO =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [Employment] No user data found');
        return null;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('📤 [Employment] User ID: $userId');

      // ✅ Use the /me endpoint to get current user's employment info
      final url = ApiConstants.normalizeUrl(ApiConstants.employmentInfoMe);
      print('📤 [Employment] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Employment GET] Status: ${response.statusCode}');
      print('📥 [Employment GET] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        print('⚠️ [Employment] Failed with status: ${response.statusCode}');
        return null;
      }

      final responseData = response.data;
      final data =
          responseData['response'] ?? responseData['data'] ?? responseData;

      if (data != null && data.isNotEmpty) {
        print('✅ [Employment] Retrieved successfully');
        print('📊 [Employment] Data keys: ${data.keys}');
        return data;
      }

      print('ℹ️ [Employment] No employment data found');
      return null;
    } on DioException catch (e) {
      print('🔴 [Employment] DioError: ${e.message}');
      if (e.response?.statusCode == 404) {
        print('ℹ️ [Employment] No employment info found');
        return null;
      }
      if (e.response != null) {
        print('🔴 [Employment] Status: ${e.response?.statusCode}');
        print('🔴 [Employment] Response: ${e.response?.data}');
      }
      return null;
    } catch (e) {
      print('🔴 [Employment] Error: $e');
      return null;
    }
  }

  // ============================================================
  // GET EMPLOYMENT INFO BY USER ID (Admin)
  // ============================================================
  Future<Map<String, dynamic>?> getEmploymentInfoByUserId(int userId) async {
    try {
      print(
          '📤 [Employment] ===== FETCHING EMPLOYMENT INFO FOR USER: $userId =====');

      final url = ApiConstants.normalizeUrl(
        ApiConstants.employmentInfoByUserId(userId),
      );
      print('📤 [Employment] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Employment GET] Status: ${response.statusCode}');
      print('📥 [Employment GET] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        print('⚠️ [Employment] Failed with status: ${response.statusCode}');
        return null;
      }

      final responseData = response.data;
      final data =
          responseData['response'] ?? responseData['data'] ?? responseData;

      print('✅ [Employment] Retrieved successfully');
      return data;
    } on DioException catch (e) {
      print('🔴 [Employment] DioError: ${e.message}');
      if (e.response?.statusCode == 404) {
        print('ℹ️ [Employment] No employment info found for user');
        return null;
      }
      return null;
    } catch (e) {
      print('🔴 [Employment] Error: $e');
      return null;
    }
  }
}
