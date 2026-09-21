// data/repositories/bank_repository.dart

import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/data/repositories/base_repository.dart';

class BankRepository extends BaseRepository {
  // ============================================================
  // SAVE BANK DETAILS (POST)
  // ============================================================
  Future<Map<String, dynamic>> saveBankDetails({
    required int userId,
    required String accountNumber,
    required String accountName,
    required String bankName,
    required String bvn,
    required String nin,
  }) async {
    try {
      print('📤 [Bank] ===== SAVING BANK DETAILS =====');
      print('📤 [Bank] UserId: $userId');
      print('📤 [Bank] Bank: $bankName');
      print(
          '📤 [Bank] Account: ****${accountNumber.substring(accountNumber.length - 4)}');

      final payload = {
        'userId': userId,
        'accountNumber': accountNumber,
        'accountName': accountName,
        'bankName': bankName,
        'bvn': bvn,
        'nin': nin,
      };

      final url = ApiConstants.normalizeUrl(ApiConstants.bankDetails);
      print('📤 [Bank] URL: $url');
      print('📤 [Bank] Payload: $payload');

      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Bank] Status: ${response.statusCode}');
      print('📥 [Bank] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to save bank details';
      }

      // Mark as verified
      await _markBankVerified(userId);

      return {
        'success': true,
        'message': response.data['message'] ?? 'Bank details saved successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [Bank] saveBankDetails error: ${e.message}');
      handleDioError(e, 'SaveBankDetails');
      rethrow;
    }
  }

  // ============================================================
  // UPDATE BANK DETAILS (PUT)
  // ============================================================
  Future<Map<String, dynamic>> updateBankDetails({
    required int userId,
    required String accountNumber,
    required String accountName,
    required String bankName,
    required String bvn,
    required String nin,
  }) async {
    try {
      print('📤 [Bank] ===== UPDATING BANK DETAILS =====');
      print('📤 [Bank] UserId: $userId');

      final payload = {
        'accountNumber': accountNumber,
        'accountName': accountName,
        'bankName': bankName,
        'bvn': bvn,
        'nin': nin,
      };

      final url =
          ApiConstants.normalizeUrl(ApiConstants.updateBankAccount(userId));
      print('📤 [Bank] URL: $url');
      print('📤 [Bank] Payload: $payload');

      final response = await apiClient.dio.put(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Bank] Status: ${response.statusCode}');
      print('📥 [Bank] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to update bank details';
      }

      await _markBankVerified(userId);

      return {
        'success': true,
        'message':
            response.data['message'] ?? 'Bank details updated successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [Bank] updateBankDetails error: ${e.message}');
      handleDioError(e, 'UpdateBankDetails');
      rethrow;
    }
  }

  // ============================================================
  // GET MY BANK DETAILS (/me)
  // ============================================================
  Future<Map<String, dynamic>?> getMyBankDetails() async {
    try {
      print('📤 [Bank] ===== GET MY BANK DETAILS =====');

      final url = ApiConstants.normalizeUrl(ApiConstants.bankAccountMe);
      print('📤 [Bank] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('📥 [Bank] Status: ${response.statusCode}');
      print('📥 [Bank] Data: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data['data'] ??
            response.data['response'] ??
            response.data;
        if (data is Map<String, dynamic> && data.isNotEmpty) {
          print('✅ [Bank] Bank details found');
          return data;
        }
      }
      return null;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        print('ℹ️ [Bank] No bank details found (404)');
        return null;
      }
      print('🔴 [Bank] getMyBankDetails error: ${e.message}');
      return null;
    }
  }

  // ============================================================
  // VERIFY BANK ACCOUNT
  // ============================================================
  Future<Map<String, dynamic>> verifyBankAccount({
    required int userId,
    required String accountNumber,
    required String accountName,
    required String bankName,
  }) async {
    try {
      print('📤 [Bank] ===== VERIFY BANK ACCOUNT =====');
      print('📤 [Bank] UserId: $userId');

      final payload = {
        'accountNumber': accountNumber,
        'accountName': accountName,
        'bankName': bankName,
      };

      final url =
          ApiConstants.normalizeUrl(ApiConstants.verifyBankAccount(userId));
      print('📤 [Bank] URL: $url');

      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [Bank] Status: ${response.statusCode}');
      print('📥 [Bank] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to verify bank account';
      }

      return {
        'success': true,
        'message': response.data['message'] ?? 'Bank account verified',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [Bank] verifyBankAccount error: ${e.message}');
      handleDioError(e, 'VerifyBankAccount');
      rethrow;
    }
  }

  // ============================================================
  // MARK AS VERIFIED (internal helper)
  // ============================================================
  Future<void> _markBankVerified(int userId) async {
    try {
      print('🟣 [Bank] Marking bank account as verified...');
      final url =
          ApiConstants.normalizeUrl(ApiConstants.updateBankAccount(userId));

      await apiClient.dio.put(
        url,
        data: {
          'additionalProp1': true,
          'additionalProp2': true,
          'additionalProp3': true,
        },
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );
      print('✅ [Bank] Marked as verified');
    } catch (e) {
      print('⚠️ [Bank] Could not mark verified: $e');
    }
  }
}