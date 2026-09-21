// data/repositories/payment_card_repository.dart

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/data/repositories/base_repository.dart';

class PaymentCardRepository extends BaseRepository {
  // ============================================================
  // GET ALL PAYMENT CARDS
  // ============================================================
  Future<List<Map<String, dynamic>>> getPaymentCards() async {
    try {
      print('🟣 [PaymentCard] ===== GET PAYMENT CARDS =====');
      final url = ApiConstants.normalizeUrl(ApiConstants.paymentCards);
      print('🟣 [PaymentCard] URL: $url');

      final response = await apiClient.dio.get(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('📥 [PaymentCard] Status: ${response.statusCode}');
      print('📥 [PaymentCard] Data: ${response.data}');

      if (response.statusCode == 200) {
        final data =
            response.data['data'] ?? response.data['response'] ?? response.data;

        if (data is List) {
          final cards =
              data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          print('✅ [PaymentCard] Found ${cards.length} cards');
          return cards;
        }
      }
      return [];
    } on DioException catch (e) {
      print('🔴 [PaymentCard] getPaymentCards error: ${e.message}');
      if (e.response?.statusCode == 404) return [];
      handleDioError(e, 'GetPaymentCards');
      rethrow;
    }
  }

  // ============================================================
  // ADD PAYMENT CARD (CORRECT PAYLOAD)
  // ============================================================
  Future<Map<String, dynamic>> addPaymentCard({
    required String cardNumber,
    required String cardHolderName,
    required String expiryDate, // format: MM/YY
    required String cvv,
    required String email,
    String? cardType,
    String? bankName,
  }) async {
    try {
      print('🟣 [PaymentCard] ===== ADD PAYMENT CARD =====');

      // Extract last4
      final cleanNumber = cardNumber.replaceAll(' ', '');
      final last4 = cleanNumber.length >= 4
          ? cleanNumber.substring(cleanNumber.length - 4)
          : cleanNumber;

      // Split expiry
      final parts = expiryDate.split('/');
      final expMonth = parts.isNotEmpty ? parts[0] : '';
      final expYear = parts.length > 1 ? parts[1] : '';

      final payload = {
        'cardName': cardHolderName,
        'brand': cardType ?? 'Visa',
        'expMonth': expMonth,
        'expYear': expYear,
        'last4': last4,
        'email': email,
        'authorizationCode': 'AUTH_${DateTime.now().millisecondsSinceEpoch}',
        'bankName': bankName ?? 'Unknown',
        'isActive': true,
      };

      print('🟣 [PaymentCard] Payload: $payload');

      final url = ApiConstants.normalizeUrl(ApiConstants.paymentCards);
      print('🟣 [PaymentCard] URL: $url');

      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [PaymentCard] Status: ${response.statusCode}');
      print('📥 [PaymentCard] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to add payment card';
      }

      // Mark as verified in Verification Centre
      await _markPaymentCardVerified();

      return {
        'success': true,
        'message':
            response.data['message'] ?? 'Payment card added successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [PaymentCard] addPaymentCard error: ${e.message}');
      handleDioError(e, 'AddPaymentCard');
      rethrow;
    }
  }

   // ============================================================
  // UPDATE PAYMENT CARD
  // ============================================================
  Future<Map<String, dynamic>> updatePaymentCard({
    required int cardId,
    required String cardNumber,
    required String cardHolderName,
    required String expiryDate,
    required String cvv,
    String? cardType,
    String? email,
    String? bankName,
  }) async {
    try {
      print('🟣 [PaymentCard] ===== UPDATE PAYMENT CARD =====');
      print('🟣 [PaymentCard] CardId: $cardId');

      final cleanNumber = cardNumber.replaceAll(' ', '').replaceAll('*', '');
      final last4 = cleanNumber.length >= 4
          ? cleanNumber.substring(cleanNumber.length - 4)
          : cleanNumber;

      final parts = expiryDate.split('/');
      final expMonth = parts.isNotEmpty ? parts[0] : '';
      final expYear = parts.length > 1 ? parts[1] : '';

      final payload = {
        'cardName': cardHolderName,
        'brand': cardType ?? 'Visa',
        'expMonth': expMonth,
        'expYear': expYear,
        'last4': last4,
        'email': email ?? 'user@example.com',
        'authorizationCode': 'AUTH_${DateTime.now().millisecondsSinceEpoch}',
        'bankName': bankName ?? 'Access Bank',
        'isActive': true,
      };

      print('🟣 [PaymentCard] Update Payload: $payload');

      final url =
          ApiConstants.normalizeUrl(ApiConstants.paymentCardById(cardId));
      print('🟣 [PaymentCard] URL: $url');

      final response = await apiClient.dio.put(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [PaymentCard] Status: ${response.statusCode}');
      print('📥 [PaymentCard] Data: ${response.data}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        throw response.data['message'] ?? 'Failed to update payment card';
      }

      return {
        'success': true,
        'message':
            response.data['message'] ?? 'Payment card updated successfully',
        'data': response.data['data'] ?? response.data['response'],
      };
    } on DioException catch (e) {
      print('🔴 [PaymentCard] updatePaymentCard error: ${e.message}');
      handleDioError(e, 'UpdatePaymentCard');
      rethrow;
    }
  }
  // ============================================================
  // DELETE PAYMENT CARD
  // ============================================================
  Future<bool> deletePaymentCard(int cardId) async {
    try {
      print('🟣 [PaymentCard] ===== DELETE PAYMENT CARD =====');
      print('🟣 [PaymentCard] CardId: $cardId');

      final url =
          ApiConstants.normalizeUrl(ApiConstants.paymentCardById(cardId));
      print('🟣 [PaymentCard] URL: $url');

      final response = await apiClient.dio.delete(
        url,
        options: Options(headers: {'Accept': 'application/json'}),
      );

      print('📥 [PaymentCard] Status: ${response.statusCode}');

      return response.statusCode == 200 || response.statusCode == 204;
    } on DioException catch (e) {
      print('🔴 [PaymentCard] deletePaymentCard error: ${e.message}');
      handleDioError(e, 'DeletePaymentCard');
      rethrow;
    }
  }

  // ============================================================
  // MARK AS VERIFIED (PUT /api/users/verification/{userId}/payment-card)
  // ============================================================
  Future<void> _markPaymentCardVerified() async {
    try {
      print('🟣 [PaymentCard] ===== MARKING PAYMENT CARD AS VERIFIED =====');

      final userData = await StorageService.getUserData();
      if (userData == null) {
        print('🔴 [PaymentCard] No user data found — cannot mark verified');
        return;
      }

      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      if (userId == null) {
        print('🔴 [PaymentCard] userId is null — cannot mark verified');
        return;
      }

      print('🟣 [PaymentCard] UserId: $userId');

      final url = ApiConstants.normalizeUrl(
        ApiConstants.updatePaymentCard(userId),
      );
      print('🟣 [PaymentCard] Mark Verified URL: $url');

      final payload = {
        'additionalProp1': true,
        'additionalProp2': true,
        'additionalProp3': true,
      };
      print('🟣 [PaymentCard] Mark Verified Payload: $payload');

      final response = await apiClient.dio.put(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('📥 [PaymentCard] Mark Verified Status: ${response.statusCode}');
      print('📥 [PaymentCard] Mark Verified Data: ${response.data}');

      if (response.statusCode != null &&
          response.statusCode! >= 200 &&
          response.statusCode! < 300) {
        print(
            '✅ [PaymentCard] Successfully marked as verified in Verification Centre');
      } else {
        print('⚠️ [PaymentCard] Mark verified returned non-success status');
      }
    } on DioException catch (e) {
      print('🔴 [PaymentCard] Mark verified DioError: ${e.message}');
      print('🔴 [PaymentCard] Status: ${e.response?.statusCode}');
      print('🔴 [PaymentCard] Response: ${e.response?.data}');
    } catch (e) {
      print('🔴 [PaymentCard] Mark verified unexpected error: $e');
    }
  }

  // ============================================================
  // LOCAL STORAGE FALLBACK
  // ============================================================
  Future<void> savePaymentCardLocally(Map<String, dynamic> cardData) async {
    try {
      final userData = await StorageService.getUserData();
      if (userData == null) return;

      final userJson = jsonDecode(userData);
      userJson['paymentCard'] = cardData;
      await StorageService.saveUserData(jsonEncode(userJson));
      print('✅ [PaymentCard] Saved locally');
    } catch (e) {
      print('🔴 [PaymentCard] Error saving locally: $e');
    }
  }

  Future<Map<String, dynamic>?> getPaymentCardLocally() async {
    try {
      final userData = await StorageService.getUserData();
      if (userData == null) return null;

      final userJson = jsonDecode(userData);
      final cardData = userJson['paymentCard'] as Map<String, dynamic>?;
      if (cardData != null && cardData.isNotEmpty) {
        print('✅ [PaymentCard] Retrieved from local storage');
        return cardData;
      }
      return null;
    } catch (e) {
      print('🔴 [PaymentCard] Error getting locally: $e');
      return null;
    }
  }
}
