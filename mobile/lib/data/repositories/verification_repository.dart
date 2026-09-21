import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/bank_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/base_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/employment_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/payment_card_repository.dart';
import 'package:pm_e_commerce_app/data/repositories/personal_info_repository.dart';

class VerificationRepository extends BaseRepository {
  // ============================================================
  // BVN VERIFICATION (DO NOT TOUCH - WORKING)
  // ============================================================
  Future<Map<String, dynamic>> verifyBvn({
    required int userId,
    required String bvn,
    String? firstName,
    String? lastName,
    String? dateOfBirth,
    String? phoneNumber,
  }) async {
    try {
      print('🟣 [BVN] ===== STARTING BVN VERIFICATION =====');
      print('🟣 [BVN] UserId: $userId');
      print(
          '🟣 [BVN] BVN: ${bvn.substring(0, 3)}***${bvn.substring(bvn.length - 3)}');

      final payload = {
        'userId': userId,
        'bvn': bvn,
        if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
        if (lastName != null && lastName.isNotEmpty) 'lastName': lastName,
        if (dateOfBirth != null && dateOfBirth.isNotEmpty)
          'dateOfBirth': dateOfBirth,
        if (phoneNumber != null && phoneNumber.isNotEmpty)
          'phoneNumber': phoneNumber,
      };

      final url = ApiConstants.normalizeUrl(ApiConstants.verifyBvn);
      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to verify BVN';
      }

      return {
        'success': true,
        'message': response.data['message'] ?? 'BVN verified successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      handleDioError(e, 'BVN');
      rethrow;
    }
  }

  // ============================================================
  // NIN VERIFICATION (DO NOT TOUCH - WORKING)
  // ============================================================
  Future<Map<String, dynamic>> verifyNin({
    required int userId,
    required String nin,
    String? firstName,
    String? lastName,
    String? dateOfBirth,
  }) async {
    try {
      print('🟣 [NIN] ===== STARTING NIN VERIFICATION =====');
      print('🟣 [NIN] UserId: $userId');

      final payload = {
        'userId': userId,
        'nin': nin,
        if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
        if (lastName != null && lastName.isNotEmpty) 'lastName': lastName,
        if (dateOfBirth != null && dateOfBirth.isNotEmpty)
          'dateOfBirth': dateOfBirth,
      };

      final url = ApiConstants.normalizeUrl(ApiConstants.verifyNin);
      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to verify NIN';
      }

      return {
        'success': true,
        'message': response.data['message'] ?? 'NIN verified successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      handleDioError(e, 'NIN');
      rethrow;
    }
  }

  // ============================================================
  // CHECK IF USER IS VERIFIED
  // ============================================================
  Future<Map<String, dynamic>> checkIsVerified({required int userId}) async {
    try {
      final url = ApiConstants.normalizeUrl(ApiConstants.isVerified(userId));
      print('📤 [IsVerified] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('📥 [IsVerified] Status: ${response.statusCode}');
      print('📥 [IsVerified] Data: ${response.data}');

      final responseData = response.data;
      final data =
          responseData['response'] ?? responseData['data'] ?? responseData;

      List<String> verifiedTypes = [];
      if (data['verifiedTypes'] != null && data['verifiedTypes'] is List) {
        verifiedTypes = (data['verifiedTypes'] as List)
            .map((e) => e.toString().toUpperCase())
            .toList();
      }

      return {
        'success': true,
        'data': {
          'verifiedTypes': verifiedTypes,
          'isVerified': data['isVerified'] ?? false,
          'verifiedCount': data['verifiedCount'] ?? verifiedTypes.length,
          'totalCount': data['totalCount'] ?? 6,
        }
      };
    } on DioException catch (e) {
      handleDioError(e, 'IsVerified');
      rethrow;
    }
  }

  // ============================================================
// ACCEPT TERMS - FIXED
// ============================================================
  Future<Map<String, dynamic>> acceptTerms({
    required int userId,
    String termsVersion = 'v1.0',
  }) async {
    try {
      print('=' * 80);
      print('📤 [Terms] ===== ACCEPTING TERMS =====');
      print('📤 [Terms] UserId: $userId');
      print('📤 [Terms] Terms Version: $termsVersion');
      print('=' * 80);

      // ✅ ADD verification_type - THIS FIXES THE ERROR
      final payload = {
        'termsVersion': termsVersion,
        'acceptedAt': DateTime.now().toIso8601String(),
        'verificationType': 'TERMS_ACCEPTANCE', // ✅ REQUIRED BY BACKEND
      };

      final url = ApiConstants.normalizeUrl(ApiConstants.acceptTerms(userId));
      print('📤 [Terms] URL: $url');
      print('📤 [Terms] Payload: $payload');

      final token = await StorageService.getToken();

      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {
            'Accept': 'application/json',
            'Authorization': token != null ? 'Bearer $token' : '',
          },
        ),
      );

      print('📥 [Terms] Status: ${response.statusCode}');
      print('📥 [Terms] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to accept terms';
      }

      // ✅ Also update local storage with terms accepted
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        userJson['termsAccepted'] = true;
        userJson['termsVersion'] = termsVersion;
        userJson['termsAcceptedDate'] = DateTime.now().toIso8601String();
        await StorageService.saveUserData(jsonEncode(userJson));
        print('✅ [Terms] Local storage updated');
      }

      return {
        'success': true,
        'message': response.data['message'] ?? 'Terms accepted successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('=' * 80);
      print('🔴 [Terms] ===== ERROR =====');
      print('🔴 [Terms] Message: ${e.message}');
      if (e.response != null) {
        print('🔴 [Terms] Status: ${e.response?.statusCode}');
        print('🔴 [Terms] Response: ${e.response?.data}');
      }
      print('=' * 80);
      handleDioError(e, 'AcceptTerms');
      rethrow;
    }
  }

  // ============================================================
  // ✅ FULL VERIFICATION CHECK - mirrors VerificationCentreScreen exactly
  // Uses the SAME repositories/methods that screen already proved work.
  // ============================================================
  Future<Map<String, bool>> checkFullVerificationStatus() async {
    final personalInfoRepo = PersonalInfoRepository();
    final employmentRepo = EmploymentRepository();
    final bankRepo = BankRepository();
    final cardRepo = PaymentCardRepository();

    final result = <String, bool>{
      'personalInformation': false,
      'employment': false,
      'bankAccount': false,
      'paymentCards': false,
      'terms': false,
    };

    // Personal Information
    try {
      final personal = await personalInfoRepo.getMyPersonalInfo();
      result['personalInformation'] = personal != null && personal.isNotEmpty;
    } catch (e) {
      print('🔴 [FullVerification] Personal info check failed: $e');
    }

    // Employment
    try {
      final employment = await employmentRepo.getEmploymentInfo();
      result['employment'] = employment != null && employment.isNotEmpty;
    } catch (e) {
      print('🔴 [FullVerification] Employment check failed: $e');
    }

    // Bank Account
    try {
      final bank = await bankRepo.getMyBankDetails();
      result['bankAccount'] = bank != null &&
          bank.isNotEmpty &&
          bank['accountNumber'] != null &&
          bank['accountNumber'].toString().isNotEmpty &&
          bank['accountNumber'].toString() != 'null';
    } catch (e) {
      print('🔴 [FullVerification] Bank account check failed: $e');
    }

    // Payment Cards
    try {
      final cards = await cardRepo.getPaymentCards();
      result['paymentCards'] = cards.isNotEmpty;
    } catch (e) {
      print('🔴 [FullVerification] Payment cards check failed: $e');
    }

    // Terms
    try {
      final termsData = await getPaymentTermsMe();
      if (termsData != null) {
        final accepted = termsData['accepted'] == true ||
            termsData['termsAccepted'] == true ||
            termsData['isAccepted'] == true ||
            termsData['status']?.toString().toUpperCase() == 'ACCEPTED';
        result['terms'] = accepted;
      }
    } catch (e) {
      print('🔴 [FullVerification] Terms check failed: $e');
    }

    print('📊 [FullVerification] Result: $result');
    return result;
  }

  // ============================================================
  // GET PAYMENT TERMS (ME)
  // ============================================================
  Future<Map<String, dynamic>?> getPaymentTermsMe() async {
    try {
      print('🟣 [Terms] Fetching payment-terms/me ...');
      final url = ApiConstants.normalizeUrl(ApiConstants.paymentTermsMe);

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('📥 [Terms] Status: ${response.statusCode}');
      print('📥 [Terms] Data: ${response.data}');

      if (response.statusCode == 200) {
        final data =
            response.data['data'] ?? response.data['response'] ?? response.data;
        return data is Map<String, dynamic> ? data : null;
      }
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        print('🟣 [Terms] No payment terms found (404)');
        return null;
      }
      handleDioError(e, 'PaymentTermsMe');
      rethrow;
    }
  }

  // ============================================================
  // GET BVN DETAILS
  // ============================================================
  Future<Map<String, dynamic>> getBvnDetails(String bvn) async {
    try {
      final url = ApiConstants.normalizeUrl(ApiConstants.getBvnDetails(bvn));
      print('🟣 [BVN Details] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('🟣 [BVN Details] Status: ${response.statusCode}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to fetch BVN details';
      }

      print('✅ [BVN Details] Retrieved successfully');
      return {
        'success': true,
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [BVN Details] Error: ${e.message}');
      handleDioError(e, 'BVN Details');
      rethrow;
    }
  }

  // ============================================================
  // GET NIN DETAILS
  // ============================================================
  Future<Map<String, dynamic>> getNinDetails(String nin) async {
    try {
      final url = ApiConstants.normalizeUrl(ApiConstants.getNinDetails(nin));
      print('🟣 [NIN Details] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('🟣 [NIN Details] Status: ${response.statusCode}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to fetch NIN details';
      }

      print('✅ [NIN Details] Retrieved successfully');
      return {
        'success': true,
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [NIN Details] Error: ${e.message}');
      handleDioError(e, 'NIN Details');
      rethrow;
    }
  }

  // ============================================================
  // GET USER'S BVN
  // ============================================================
  Future<String?> getUserBvn() async {
    try {
      print('🟣 [Verification] ===== FETCHING USER BVN =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [Verification] No user data found');
        return null;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [Verification] User ID: $userId');

      // 1. Check if BVN is already saved in user data
      if (userJson['bvn'] != null &&
          userJson['bvn'].toString().isNotEmpty &&
          userJson['bvn'].toString() != 'false' &&
          userJson['bvn'].toString() != 'null') {
        final bvn = userJson['bvn'].toString();
        print(
            '✅ [Verification] BVN found in user data: ${bvn.substring(0, 3)}***${bvn.substring(bvn.length - 3)}');
        return bvn;
      }

      // 2. Check verification status
      print('🟣 [Verification] Checking BVN verification status...');
      final verificationResult = await checkIsVerified(userId: userId);
      final data = verificationResult['data'] as Map<String, dynamic>?;
      final verifiedTypes = (data?['verifiedTypes'] as List?)
              ?.map((e) => e.toString().toUpperCase())
              .toList() ??
          [];

      final hasBvn = verifiedTypes.any((type) => type.contains('BVN'));
      print('🟣 [Verification] Has BVN verified: $hasBvn');

      if (hasBvn) {
        if (userJson['bvnNumber'] != null &&
            userJson['bvnNumber'].toString().isNotEmpty &&
            userJson['bvnNumber'].toString() != 'false' &&
            userJson['bvnNumber'].toString() != 'null') {
          final bvn = userJson['bvnNumber'].toString();
          print(
              '✅ [Verification] BVN found in user data (bvnNumber): ${bvn.substring(0, 3)}***${bvn.substring(bvn.length - 3)}');
          return bvn;
        }
        print(
            'ℹ️ [Verification] BVN is verified but the number is not stored. User must enter it manually.');
        return null;
      }

      print('ℹ️ [Verification] No BVN found');
      return null;
    } catch (e) {
      print('🔴 [Verification] Error: $e');
      return null;
    }
  }

  // ============================================================
  // GET USER'S NIN
  // ============================================================
  Future<String?> getUserNin() async {
    try {
      print('🟣 [Verification] ===== FETCHING USER NIN =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [Verification] No user data found');
        return null;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      print('🟣 [Verification] User ID: $userId');

      // 1. Check if NIN is already saved in user data
      if (userJson['nin'] != null &&
          userJson['nin'].toString().isNotEmpty &&
          userJson['nin'].toString() != 'false' &&
          userJson['nin'].toString() != 'null') {
        final nin = userJson['nin'].toString();
        print(
            '✅ [Verification] NIN found in user data: ${nin.substring(0, 3)}***${nin.substring(nin.length - 3)}');
        return nin;
      }

      // 2. Check verification status
      print('🟣 [Verification] Checking NIN verification status...');
      final verificationResult = await checkIsVerified(userId: userId);
      final data = verificationResult['data'] as Map<String, dynamic>?;
      final verifiedTypes = (data?['verifiedTypes'] as List?)
              ?.map((e) => e.toString().toUpperCase())
              .toList() ??
          [];

      final hasNin = verifiedTypes.any((type) => type.contains('NIN'));
      print('🟣 [Verification] Has NIN verified: $hasNin');

      if (hasNin) {
        if (userJson['ninNumber'] != null &&
            userJson['ninNumber'].toString().isNotEmpty &&
            userJson['ninNumber'].toString() != 'false' &&
            userJson['ninNumber'].toString() != 'null') {
          final nin = userJson['ninNumber'].toString();
          print(
              '✅ [Verification] NIN found in user data (ninNumber): ${nin.substring(0, 3)}***${nin.substring(nin.length - 3)}');
          return nin;
        }
        print(
            'ℹ️ [Verification] NIN is verified but the number is not stored. User must enter it manually.');
        return null;
      }

      print('ℹ️ [Verification] No NIN found');
      return null;
    } catch (e) {
      print('🔴 [Verification] Error: $e');
      return null;
    }
  }

  // ============================================================
  // GET PAYMENT TERMS BY USER ID
  // ============================================================
  Future<Map<String, dynamic>?> getPaymentTermsByUserId(int userId) async {
    try {
      final url =
          ApiConstants.normalizeUrl(ApiConstants.paymentTermsByUserId(userId));
      print('🟣 [Terms] Fetching payment-terms for user $userId');

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      if (response.statusCode == 200) {
        final data =
            response.data['data'] ?? response.data['response'] ?? response.data;
        return data is Map<String, dynamic> ? data : null;
      }
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      handleDioError(e, 'PaymentTermsByUserId');
      rethrow;
    }
  }
}
