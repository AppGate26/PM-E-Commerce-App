// data/repositories/personal_info_repository.dart

import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/base_repository.dart';

class PersonalInfoRepository extends BaseRepository {
  // ============================================================
  // SAVE PERSONAL INFORMATION (multipart/form-data)
  // ============================================================
  Future<Map<String, dynamic>> savePersonalInformation({
    required String firstName,
    required String lastName,
    required String email,
    required String homeAddress,
    required String city,
    required String phoneNumber,
    required int stateId,
    required int lgaId,
    int? wardId,
    required String stateOfOrigin,
    required String dateOfBirth,
    required String gender,
    required String maritalStatus,
    required String utilityBillType,
    File? utilityBillPicture,
  }) async {
    try {
      print('📤 [Personal Info] ===== SAVING PERSONAL INFO (multipart) =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        throw 'User not found. Please login again.';
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('📤 [Personal Info] UserId: $userId');

      // Build multipart form data
      final formData = FormData.fromMap({
        'userId': userId,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'homeAddress': homeAddress,
        'city': city,
        'phoneNumber': phoneNumber,
        'stateId': stateId,
        'lgaId': lgaId,
        if (wardId != null) 'wardId': wardId,
        'stateOfOrigin': stateOfOrigin,
        'dateOfBirth': dateOfBirth,
        'gender': gender,
        'maritalStatus': maritalStatus,
        'utilityBillType': utilityBillType,
      });

      // Attach utility bill image if present
      if (utilityBillPicture != null) {
        final fileName = utilityBillPicture.path.split('/').last;
        formData.files.add(
          MapEntry(
            'utilityBillPicture', // change key if Swagger shows a different name
            await MultipartFile.fromFile(
              utilityBillPicture.path,
              filename: fileName,
            ),
          ),
        );
        print('📤 [Personal Info] Attached image: $fileName');
      }

      final url = ApiConstants.normalizeUrl(ApiConstants.personalInformation);
      print('📤 [Personal Info] URL: $url');
      print('📤 [Personal Info] Form fields: ${formData.fields}');

      final response = await apiClient.dio.post(
        url,
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Personal Info POST] Status: ${response.statusCode}');
      print('📥 [Personal Info POST] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage =
            response.data['message'] ?? 'Failed to save personal information';
        print('🔴 [Personal Info] Error: $errorMessage');
        throw errorMessage;
      }

      return {
        'success': true,
        'message': response.data['message'] ??
            'Personal information saved successfully',
        'data': response.data['response'] ?? response.data['data'],
      };
    } on DioException catch (e) {
      print('🔴 [Personal Info] DioError: ${e.message}');
      if (e.response != null) {
        print('🔴 [Personal Info] Status: ${e.response?.statusCode}');
        print('🔴 [Personal Info] Response: ${e.response?.data}');
      }
      handleDioError(e, 'Personal Info');
      rethrow;
    } catch (e) {
      print('🔴 [Personal Info] Error: $e');
      rethrow;
    }
  }

  // ============================================================
  // GET MY PERSONAL INFORMATION (FIXED ENDPOINT)
  // ============================================================
  Future<Map<String, dynamic>?> getMyPersonalInfo() async {
    try {
      print('📤 [Personal Info] ===== FETCHING MY PERSONAL INFO =====');

      // ✅ FIX: Use the correct endpoint
      final url = ApiConstants.normalizeUrl(ApiConstants.personalInfoMe);
      print('📤 [Personal Info] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Personal Info GET] Status: ${response.statusCode}');
      print('📥 [Personal Info GET] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        print('⚠️ [Personal Info] Failed with status: ${response.statusCode}');
        return null;
      }

      final responseData = response.data;
      final data =
          responseData['response'] ?? responseData['data'] ?? responseData;

      print('✅ [Personal Info] Retrieved successfully');
      print('📊 [Personal Info] Data keys: ${data.keys}');

      return data;
    } on DioException catch (e) {
      print('🔴 [Personal Info] DioError: ${e.message}');
      if (e.response?.statusCode == 404) {
        print('ℹ️ [Personal Info] No personal info found');
        return null;
      }
      if (e.response != null) {
        print('🔴 [Personal Info] Status: ${e.response?.statusCode}');
        print('🔴 [Personal Info] Response: ${e.response?.data}');
      }
      return null;
    } catch (e) {
      print('🔴 [Personal Info] Error: $e');
      return null;
    }
  }

  // ============================================================
  // UPDATE PERSONAL INFORMATION (PUT)
  // ============================================================
  Future<Map<String, dynamic>> updatePersonalInformation({
    required int userId,
    required String firstName,
    required String lastName,
    required String email,
    required String homeAddress,
    required String city,
    required String phoneNumber,
    required int stateId,
    required int lgaId,
    int? wardId,
    required String stateOfOrigin,
    required String dateOfBirth,
    required String gender,
    required String maritalStatus,
    required String utilityBillType,
    File? utilityBillPicture,
  }) async {
    try {
      print('📤 [Personal Info] ===== UPDATING PERSONAL INFO =====');
      print('📤 [Personal Info] UserId: $userId');

      final jsonPayload = {
        'userId': userId,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'homeAddress': homeAddress,
        'city': city,
        'phoneNumber': phoneNumber,
        'stateId': stateId,
        'lgaId': lgaId,
        if (wardId != null) 'wardId': wardId,
        'stateOfOrigin': stateOfOrigin,
        'dateOfBirth': dateOfBirth,
        'gender': gender,
        'maritalStatus': maritalStatus,
        'utilityBillType': utilityBillType,
      };

      print('📤 [Personal Info] Payload: $jsonPayload');

      final url =
          ApiConstants.normalizeUrl(ApiConstants.updatePersonalInfo(userId));
      print('📤 [Personal Info] URL: $url');

      final response = await apiClient.dio.put(
        url,
        data: jsonPayload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Personal Info PUT] Status: ${response.statusCode}');
      print('📥 [Personal Info PUT] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final errorMessage =
            response.data['message'] ?? 'Failed to update personal information';
        throw errorMessage;
      }

      return {
        'success': true,
        'message': response.data['message'] ??
            'Personal information updated successfully',
        'data': response.data['response'] ?? response.data['data'],
      };
    } on DioException catch (e) {
      print('🔴 [Personal Info] DioError: ${e.message}');
      handleDioError(e, 'Personal Info');
      rethrow;
    } catch (e) {
      print('🔴 [Personal Info] Error: $e');
      rethrow;
    }
  }

  // ============================================================
  // GET ALL VERIFICATION DATA FOR CURRENT USER
  // ============================================================
  Future<Map<String, dynamic>?> getMyVerificationData() async {
    try {
      print('📤 [Personal Info] ===== FETCHING MY VERIFICATION DATA =====');

      final url = ApiConstants.normalizeUrl(ApiConstants.getUserVerificationMe);
      print('📤 [Personal Info] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Verification Data GET] Status: ${response.statusCode}');
      print('📥 [Verification Data GET] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        print(
            '⚠️ [Verification Data] Failed with status: ${response.statusCode}');
        return null;
      }

      final responseData = response.data;
      final data =
          responseData['response'] ?? responseData['data'] ?? responseData;

      print('✅ [Verification Data] Retrieved successfully');
      return data;
    } on DioException catch (e) {
      print('🔴 [Verification Data] DioError: ${e.message}');
      return null;
    } catch (e) {
      print('🔴 [Verification Data] Error: $e');
      return null;
    }
  }
}
