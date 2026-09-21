import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';

class PaymentRepository {
  final ApiClient _apiClient = ApiClient();

  // ============================================================
  // 🔐 SECURITY HELPER - Get User ID from Storage
  // ============================================================
  Future<int> _getSecureUserId(int providedUserId) async {
    try {
      final userData = await StorageService.getUserData();
      if (userData == null) {
        throw Exception('User not authenticated');
      }
      final userJson = jsonDecode(userData);
      final userId = userJson['id'];
      if (userId == null || userId == 0) {
        throw Exception('Invalid user ID');
      }
      // ✅ Verify the provided userId matches the stored userId
      if (providedUserId != userId) {
        throw Exception('User ID mismatch - Security violation');
      }
      return userId;
    } catch (e) {
      print('🔴 [Security] User authentication failed: $e');
      rethrow;
    }
  }

  // ============================================================
  // 🔐 SECURITY HELPER - Validate Amount
  // ============================================================
  void _validateAmount(double amount) {
    if (amount <= 0) {
      throw Exception('Invalid payment amount: $amount');
    }
    if (amount > 1000000000) {
      // Max 1 billion
      throw Exception('Amount exceeds maximum allowed: $amount');
    }
  }

  // ============================================================
  // 🔐 SECURITY HELPER - Validate Reference
  // ============================================================
  void _validateReference(String reference) {
    if (reference.isEmpty) {
      throw Exception('Invalid payment reference');
    }
    if (reference.length < 5) {
      throw Exception('Payment reference too short');
    }
    // ✅ Only allow alphanumeric and hyphens
    if (!RegExp(r'^[a-zA-Z0-9\-_]+$').hasMatch(reference)) {
      throw Exception('Invalid payment reference format');
    }
  }

  // ============================================================
  // 🔐 SECURITY HELPER - Validate Order ID
  // ============================================================
  void _validateOrderId(int orderId) {
    if (orderId <= 0) {
      throw Exception('Invalid order ID: $orderId');
    }
  }

  // ============================================================
// 💳 CARD PAYMENT - WITH EXTENSIVE LOGGING
// ============================================================

  Future<Map<String, dynamic>> initializeCardPayment({
    required int userId,
    required double amount,
    required String email,
    required String callbackUrl,
  }) async {
    print('=' * 80);
    print('💳 [PaymentRepo] ===== CARD PAYMENT INITIALIZATION =====');
    print('💳 [PaymentRepo] userId: $userId');
    print('💳 [PaymentRepo] amount: ₦$amount');
    print('💳 [PaymentRepo] email: $email');
    print('💳 [PaymentRepo] callbackUrl: $callbackUrl');
    print('=' * 80);

    try {
      // ✅ Validate
      final secureUserId = await _getSecureUserId(userId);
      _validateAmount(amount);

      if (email.isEmpty || !email.contains('@')) {
        throw Exception('Invalid email address');
      }
      if (callbackUrl.isEmpty || !callbackUrl.startsWith('https://')) {
        throw Exception('Invalid callback URL');
      }

      final url = ApiConstants.normalizeUrl(ApiConstants.initializeCardPayment);
      print('📡 [PaymentRepo] URL: $url');

      final payload = {
        'userId': secureUserId,
        'amount': amount,
        'email': email,
        'callbackUrl': callbackUrl,
      };
      print('📤 [PaymentRepo] Payload: $payload');

      final response = await _apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('📥 [PaymentRepo] Response status: ${response.statusCode}');
      print('📥 [PaymentRepo] Response data: ${response.data}');

      _validateResponse(response);

      // ✅ Extract data
      final responseData =
          response.data['response'] ?? response.data['data'] ?? response.data;

      print('📊 [PaymentRepo] Extracted data: $responseData');

      // ✅ Get authorizationUrl
      String? authorizationUrl = responseData['authorizationUrl']?.toString() ??
          responseData['authorization_url']?.toString() ??
          responseData['url']?.toString() ??
          response.data['authorizationUrl']?.toString() ??
          response.data['authorization_url']?.toString() ??
          response.data['url']?.toString();

      // ✅ Get paymentReference
      String? paymentReference = responseData['paymentReference']?.toString() ??
          responseData['payment_reference']?.toString() ??
          response.data['paymentReference']?.toString() ??
          response.data['payment_reference']?.toString();

      print('🔑 [PaymentRepo] authorizationUrl: $authorizationUrl');
      print('🔑 [PaymentRepo] paymentReference: $paymentReference');

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        throw Exception('No payment URL received. Response: $response');
      }
      if (paymentReference == null || paymentReference.isEmpty) {
        throw Exception('No payment reference received. Response: $response');
      }

      print('✅ [PaymentRepo] Card payment initialized successfully!');
      print('=' * 80);

      return {
        'authorizationUrl': authorizationUrl,
        'paymentReference': paymentReference,
        'data': responseData,
      };
    } on DioException catch (e) {
      print('=' * 80);
      print('❌ [PaymentRepo] ===== DIO EXCEPTION =====');
      print('❌ [PaymentRepo] Message: ${e.message}');
      print('❌ [PaymentRepo] Type: ${e.type}');
      if (e.response != null) {
        print('❌ [PaymentRepo] Status: ${e.response?.statusCode}');
        print('❌ [PaymentRepo] Data: ${e.response?.data}');
      }
      print('=' * 80);
      _handleDioError(e, 'Card Payment Initialization');
      rethrow;
    } catch (e) {
      print('=' * 80);
      print('❌ [PaymentRepo] ===== EXCEPTION =====');
      print('❌ [PaymentRepo] Error: $e');
      print('=' * 80);
      rethrow;
    }
  }

  // ============================================================
  // ORDER-FIRST CARD PAYMENT
  // Backend: POST /api/orders/{orderId}/pay/card?callbackUrl=...
  // Order must already exist (via OrderRepository.checkout()) — the
  // backend computes the amount itself (order.grandTotal for a one-off
  // order, downPayment + outstanding delivery fee for an installment
  // order). No amount/userId is sent; only orderId (path) and callbackUrl
  // (query param).
  // ============================================================
  Future<Map<String, dynamic>> payOrderByCard({
    required int orderId,
    required String callbackUrl,
  }) async {
    if (orderId <= 0) {
      throw Exception('Invalid order ID: $orderId');
    }
    if (callbackUrl.isEmpty) {
      throw Exception('Invalid callback URL');
    }

    final url = ApiConstants.normalizeUrl(
      '${ApiConstants.payOrderByCard(orderId)}?callbackUrl=${Uri.encodeQueryComponent(callbackUrl)}',
    );
    final response = await _apiClient.dio.post(
      url,
      options: Options(
        contentType: 'application/json',
        headers: {'Accept': 'application/json'},
      ),
    );

    // The backend answers this endpoint with HTTP 200 even for a business
    // failure (e.g. "Order has already been paid") and encodes success only
    // in the body's own `status`/`message` — check that before trusting
    // `data` to be present.
    _validateResponse(response);
    final body = response.data;
    final int? bodyStatus = body is Map ? (body['status'] as num?)?.toInt() : null;
    if (bodyStatus != null && bodyStatus != 200 && bodyStatus != 201) {
      throw Exception(
          (body is Map ? body['message']?.toString() : null) ??
              'Failed to initialize order card payment');
    }

    final responseData =
        body['response'] ?? body['data'] ?? body;
    final authorizationUrl = responseData['authorizationUrl']?.toString() ??
        responseData['authorization_url']?.toString() ??
        responseData['url']?.toString();
    final paymentReference = responseData['paymentReference']?.toString() ??
        responseData['payment_reference']?.toString();

    if (authorizationUrl == null || authorizationUrl.isEmpty) {
      throw Exception('No payment URL received. Response: $response');
    }
    if (paymentReference == null || paymentReference.isEmpty) {
      throw Exception('No payment reference received. Response: $response');
    }

    return {
      'authorizationUrl': authorizationUrl,
      'paymentReference': paymentReference,
      'data': responseData,
    };
  }

// ============================================================
// ✅ VERIFY CARD PAYMENT - WITH EXTENSIVE LOGGING
// ============================================================

  Future<Map<String, dynamic>> verifyCardPayment(String reference) async {
    print('=' * 80);
    print('✅ [PaymentRepo] ===== VERIFY CARD PAYMENT =====');
    print('✅ [PaymentRepo] Reference: $reference');
    print('=' * 80);

    try {
      _validateReference(reference);

      final url = ApiConstants.normalizeUrl(
        ApiConstants.verifyCardPayment(reference),
      );
      print('📡 [PaymentRepo] URL: $url');

      final response = await _apiClient.dio.get(
        url,
        options: Options(
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('📥 [PaymentRepo] Response status: ${response.statusCode}');
      print('📥 [PaymentRepo] Response data: ${response.data}');

      _validateResponse(response);

      final responseData =
          response.data['response'] ?? response.data['data'] ?? response.data;

      // ✅ Check status
      final status = responseData['status']?.toString().toUpperCase() ??
          response.data['status']?.toString().toUpperCase() ??
          '';

      print('📊 [PaymentRepo] Status: $status');

      if (status == 'FAILED' || status == 'CANCELLED' || status == 'ERROR') {
        throw Exception('Payment verification failed: $status');
      }

      print('✅ [PaymentRepo] Card payment verified successfully!');
      print('=' * 80);

      return responseData is Map<String, dynamic>
          ? responseData
          : {'data': responseData};
    } on DioException catch (e) {
      print('=' * 80);
      print('❌ [PaymentRepo] ===== VERIFICATION EXCEPTION =====');
      print('❌ [PaymentRepo] Message: ${e.message}');
      if (e.response != null) {
        print('❌ [PaymentRepo] Status: ${e.response?.statusCode}');
        print('❌ [PaymentRepo] Data: ${e.response?.data}');
      }
      print('=' * 80);
      _handleDioError(e, 'Card Payment Verification');
      rethrow;
    } catch (e) {
      print('=' * 80);
      print('❌ [PaymentRepo] ===== VERIFICATION EXCEPTION =====');
      print('❌ [PaymentRepo] Error: $e');
      print('=' * 80);
      rethrow;
    }
  }

  // ============================================================
  // ✅ SECURE VERIFY PAYMENT
  // ============================================================
  Future<Map<String, dynamic>> verifyPayment(String reference) async {
    try {
      print('🔐 [Security] Starting secure payment verification...');

      // ✅ SECURITY: Validate Reference
      _validateReference(reference);
      print('✅ [Security] Reference validated');

      print('✅ [PaymentRepo] ===== VERIFY PAYMENT =====');
      print('✅ [PaymentRepo] Reference: $reference');

      final url = ApiConstants.normalizeUrl(
        ApiConstants.verifyCardPayment(reference),
      );

      // ✅ SECURITY: Add secure headers
      final response = await _apiClient.dio.get(
        url,
        options: Options(
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      _log('VERIFY PAYMENT', url, {'reference': reference}, response.data);
      _validateResponse(response);

      // ✅ SECURITY: Verify response contains status
      final responseData =
          response.data['response'] ?? response.data['data'] ?? response.data;
      if (responseData is! Map<String, dynamic>) {
        throw Exception('Invalid response format');
      }

      // ✅ SECURITY: Check payment status
      final status = responseData['status']?.toString().toUpperCase() ?? '';
      if (status == 'FAILED' || status == 'CANCELLED') {
        throw Exception('Payment verification failed: $status');
      }

      print('✅ [Security] Payment verified successfully');
      return responseData;
    } on DioException catch (e) {
      print('🔴 [Security] Payment verification failed: ${e.message}');
      _handleDioError(e, 'Payment Verification');
      rethrow;
    } catch (e) {
      print('🔴 [Security] Payment verification error: $e');
      rethrow;
    }
  }

  // ============================================================
// 🏦 BANK TRANSFER - FOR WALLET FUNDING (LEGACY SUPPORT)
// ============================================================
  Future<Map<String, dynamic>> initializeBankTransfer({
    required int userId,
    required double amount,
    required String email,
    required String callbackUrl,
  }) async {
    print('=' * 80);
    print('🏦 [PaymentRepo] ===== BANK TRANSFER (WALLET FUNDING) =====');
    print('🏦 [PaymentRepo] userId: $userId');
    print('🏦 [PaymentRepo] amount: ₦$amount');
    print('🏦 [PaymentRepo] email: $email');
    print('🏦 [PaymentRepo] callbackUrl: $callbackUrl');
    print('=' * 80);

    try {
      // ✅ Validate
      final secureUserId = await _getSecureUserId(userId);
      _validateAmount(amount);

      if (email.isEmpty || !email.contains('@')) {
        throw Exception('Invalid email address');
      }
      if (callbackUrl.isEmpty || !callbackUrl.startsWith('https://')) {
        throw Exception('Invalid callback URL');
      }

      // ✅ Use bank transfer endpoint
      final url =
          ApiConstants.normalizeUrl(ApiConstants.initializeBankTransferPayment);
      print('📡 [PaymentRepo] URL: $url');

      final payload = {
        'userId': secureUserId,
        'amount': amount,
        'email': email,
        'callbackUrl': callbackUrl,
      };
      print('📤 [PaymentRepo] Payload: $payload');

      final response = await _apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('📥 [PaymentRepo] Response status: ${response.statusCode}');
      print('📥 [PaymentRepo] Response data: ${response.data}');

      _validateResponse(response);

      // ✅ Extract data
      final responseData =
          response.data['response'] ?? response.data['data'] ?? response.data;

      print('📊 [PaymentRepo] Extracted data: $responseData');

      // ✅ Get authorizationUrl
      String? authorizationUrl = responseData['authorizationUrl']?.toString() ??
          responseData['authorization_url']?.toString() ??
          responseData['url']?.toString() ??
          response.data['authorizationUrl']?.toString() ??
          response.data['authorization_url']?.toString() ??
          response.data['url']?.toString();

      // ✅ Get paymentReference
      String? paymentReference = responseData['paymentReference']?.toString() ??
          responseData['payment_reference']?.toString() ??
          response.data['paymentReference']?.toString() ??
          response.data['payment_reference']?.toString();

      print('🔑 [PaymentRepo] authorizationUrl: $authorizationUrl');
      print('🔑 [PaymentRepo] paymentReference: $paymentReference');

      if (authorizationUrl == null || authorizationUrl.isEmpty) {
        throw Exception('No payment URL received. Response: $response');
      }
      if (paymentReference == null || paymentReference.isEmpty) {
        throw Exception('No payment reference received. Response: $response');
      }

      print('✅ [PaymentRepo] Bank transfer initialized successfully!');
      print('=' * 80);

      return {
        'authorizationUrl': authorizationUrl,
        'paymentReference': paymentReference,
        'data': responseData,
      };
    } on DioException catch (e) {
      print('=' * 80);
      print('❌ [PaymentRepo] ===== DIO EXCEPTION =====');
      print('❌ [PaymentRepo] Message: ${e.message}');
      print('❌ [PaymentRepo] Type: ${e.type}');
      if (e.response != null) {
        print('❌ [PaymentRepo] Status: ${e.response?.statusCode}');
        print('❌ [PaymentRepo] Data: ${e.response?.data}');
      }
      print('=' * 80);
      _handleDioError(e, 'Bank Transfer Initialization');
      rethrow;
    } catch (e) {
      print('=' * 80);
      print('❌ [PaymentRepo] ===== EXCEPTION =====');
      print('❌ [PaymentRepo] Error: $e');
      print('=' * 80);
      rethrow;
    }
  }

  // ============================================================
  // 💰 SECURE WALLET PAYMENT
  // ============================================================
  Future<Map<String, dynamic>> initializeWalletPayment({
    required int userId,
    required double amount,
    required String email,
    required String callbackUrl,
  }) async {
    try {
      print('🔐 [Security] Starting secure wallet payment...');

      // ✅ SECURITY: Validate User
      final secureUserId = await _getSecureUserId(userId);
      print('✅ [Security] User authenticated: $secureUserId');

      // ✅ SECURITY: Validate Amount
      _validateAmount(amount);
      print('✅ [Security] Amount validated: $amount');

      return initializeCardPayment(
        userId: secureUserId,
        amount: amount,
        email: email,
        callbackUrl: callbackUrl,
      );
    } catch (e) {
      print('🔴 [Security] Wallet payment initialization failed: $e');
      rethrow;
    }
  }

  // ============================================================
  // ✅ VERIFY WALLET PAYMENT
  // ============================================================
  Future<Map<String, dynamic>> verifyWalletPayment(String reference) async {
    return verifyPayment(reference);
  }

  // ============================================================
  // 💰 ORDER-FIRST WALLET PAYMENT
  // Backend: POST /api/orders/{orderId}/pay/wallet
  // Order must already exist (via OrderRepository.checkout()). The
  // endpoint takes no params at all — the backend derives the user from
  // the order and the amount from order.grandTotal (or downPayment +
  // outstanding delivery fee for an installment order) and debits/settles
  // immediately, no gateway redirect.
  // ============================================================
  Future<Map<String, dynamic>> payOrderByWallet({
    required int orderId,
  }) async {
    try {
      _validateOrderId(orderId);

      print('💰 [PaymentRepo] ===== ORDER-FIRST WALLET PAYMENT =====');
      print('💰 [PaymentRepo] orderId: $orderId');

      final url = ApiConstants.normalizeUrl(
        ApiConstants.payOrderWithWallet(orderId),
      );
      print('💰 [PaymentRepo] URL: $url');

      final response = await _apiClient.dio.post(
        url,
        options: Options(
          contentType: 'application/json',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('💰 [PaymentRepo] Response status: ${response.statusCode}');
      print('💰 [PaymentRepo] Response data: ${response.data}');

      // Transport-level failures only — the backend answers HTTP 200 even
      // for a business failure (e.g. "insufficient balance", "already
      // paid") and encodes that in the body's own `status`/`message`, so
      // the caller must check the returned `status`, same as the
      // installment pay endpoints below.
      _validateResponse(response);

      print('✅ [PaymentRepo] Wallet payment call completed');
      return _unwrapInstallmentPaymentBody(response.data);
    } on DioException catch (e) {
      print('🔴 [PaymentRepo] Wallet payment error: ${e.message}');
      if (e.response != null) {
        print('🔴 Response status: ${e.response?.statusCode}');
        print('🔴 Response data: ${e.response?.data}');
      }
      _handleDioError(e, 'Wallet Payment');
      rethrow;
    } catch (e) {
      print('🔴 [PaymentRepo] Wallet payment error: $e');
      rethrow;
    }
  }

  /// Backend always answers HTTP 200 and encodes success/failure in the
  /// body's own `status`/`message` — a business-level failure (e.g. wrong
  /// installment/user) looks identical to a transport success at the Dio
  /// layer, so callers must check the returned `status`, not just that the
  /// call didn't throw.
  Map<String, dynamic> _unwrapInstallmentPaymentBody(dynamic body) {
    final int? apiStatus =
        body is Map ? (body['status'] as num?)?.toInt() : null;
    final String apiMessage =
        (body is Map ? body['message']?.toString() : null) ?? '';
    final dynamic apiData = body is Map ? body['data'] : null;
    return {'status': apiStatus, 'message': apiMessage, 'data': apiData};
  }

  // ============================================================
  // 💰 PAY NEXT DUE INSTALLMENT BY WALLET
  // Backend: POST /api/installments/{planId}/pay-next/wallet
  // Use on an ongoing plan (orders/history page, continuing payments) —
  // no body needed, plan ID is in the path, user comes from the JWT.
  // Resolves and pays whichever pending installment is next due.
  // ============================================================
  Future<Map<String, dynamic>> payNextInstallmentByWallet({
    required int planId,
    required int userId,
  }) async {
    try {
      print('=' * 80);
      print('💰 [PaymentRepo] ===== PAY NEXT INSTALLMENT BY WALLET =====');
      print('💰 [PaymentRepo] planId: $planId');
      print('=' * 80);

      if (planId <= 0) {
        throw Exception('Invalid installment plan ID: $planId');
      }
      final secureUserId = await _getSecureUserId(userId);

      final url = ApiConstants.normalizeUrl(
        ApiConstants.payNextInstallmentByWallet(planId),
      );
      print('📡 [PaymentRepo] POST $url');
      print('📤 [PaymentRepo] Payload: <none — no body sent>');

      final response = await _apiClient.dio.post(
        url,
        data: {'userId': secureUserId},
        options: Options(
          contentType: 'application/json',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('📥 [PaymentRepo] Status: ${response.statusCode}');
      print('📥 [PaymentRepo] Data: ${response.data}');

      _validateResponse(response);

      print('✅ [PaymentRepo] Installment wallet payment call completed');
      print('=' * 80);

      return _unwrapInstallmentPaymentBody(response.data);
    } on DioException catch (e) {
      print('🔴 [PaymentRepo] Installment wallet error: ${e.message}');
      print('🔴 [PaymentRepo] Request: ${e.requestOptions.method} '
          '${e.requestOptions.uri}');
      print('🔴 [PaymentRepo] Request payload sent: ${e.requestOptions.data}');
      if (e.response != null) {
        print('🔴 Status: ${e.response?.statusCode}');
        print('🔴 Data: ${e.response?.data}');
      }
      _handleDioError(e, 'Installment Wallet Payment');
      rethrow;
    } catch (e) {
      print('🔴 [PaymentRepo] Installment wallet error: $e');
      rethrow;
    }
  }

  // ============================================================
  // 💰 PAY OFF FULL PLAN BY WALLET
  // Backend: POST /api/installments/{planId}/pay-full/wallet
  // Use on an ongoing plan (orders/history page) to clear the entire
  // remaining balance in one payment — no body needed, plan ID is in the
  // path, user comes from the JWT.
  // ============================================================
  Future<Map<String, dynamic>> payFullPlanByWallet({
    required int planId,
  }) async {
    try {
      print('=' * 80);
      print('💰 [PaymentRepo] ===== PAY FULL PLAN BY WALLET =====');
      print('💰 [PaymentRepo] planId: $planId');
      print('=' * 80);

      if (planId <= 0) {
        throw Exception('Invalid installment plan ID: $planId');
      }

      final url = ApiConstants.normalizeUrl(
        ApiConstants.payFullPlanByWallet(planId),
      );
      print('📡 [PaymentRepo] POST $url');
      print('📤 [PaymentRepo] Payload: <none — no body sent>');

      final response = await _apiClient.dio.post(
        url,
        options: Options(
          contentType: 'application/json',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('📥 [PaymentRepo] Status: ${response.statusCode}');
      print('📥 [PaymentRepo] Data: ${response.data}');

      _validateResponse(response);

      print('✅ [PaymentRepo] Full plan wallet payment call completed');
      print('=' * 80);

      return _unwrapInstallmentPaymentBody(response.data);
    } on DioException catch (e) {
      print('🔴 [PaymentRepo] Full plan wallet error: ${e.message}');
      print('🔴 [PaymentRepo] Request: ${e.requestOptions.method} '
          '${e.requestOptions.uri}');
      print('🔴 [PaymentRepo] Request payload sent: ${e.requestOptions.data}');
      if (e.response != null) {
        print('🔴 Status: ${e.response?.statusCode}');
        print('🔴 Data: ${e.response?.data}');
      }
      _handleDioError(e, 'Full Plan Wallet Payment');
      rethrow;
    } catch (e) {
      print('🔴 [PaymentRepo] Full plan wallet error: $e');
      rethrow;
    }
  }

  // ============================================================
  // 💰 SECURE GET WALLET BALANCE
  // ============================================================
  Future<Map<String, dynamic>> getWalletBalance(int userId) async {
    try {
      print('🔐 [Security] Getting secure wallet balance...');

      // ✅ SECURITY: Validate User
      final secureUserId = await _getSecureUserId(userId);
      print('✅ [Security] User authenticated: $secureUserId');

      print('💰 [PaymentRepo] ===== GET WALLET BALANCE =====');
      print('💰 [PaymentRepo] userId: $secureUserId');

      final url = ApiConstants.normalizeUrl(
        ApiConstants.walletBalance(secureUserId),
      );
      print('💰 [PaymentRepo] URL: $url');

      final response = await _apiClient.dio.get(
        url,
        options: Options(
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('💰 [PaymentRepo] Response status: ${response.statusCode}');
      print('💰 [PaymentRepo] Response data: ${response.data}');

      _validateResponse(response);

      // ✅ SECURITY: Verify response contains balance
      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      if (responseData is! Map<String, dynamic>) {
        throw Exception('Invalid response format');
      }

      if (!responseData.containsKey('balance')) {
        throw Exception('Balance missing from response');
      }

      print('✅ [Security] Wallet balance retrieved securely');
      return response.data;
    } on DioException catch (e) {
      print('🔴 [Security] Get wallet balance error: ${e.message}');
      if (e.response != null) {
        print('🔴 Response status: ${e.response?.statusCode}');
        print('🔴 Response data: ${e.response?.data}');
      }
      _handleDioError(e, 'Get Wallet Balance');
      rethrow;
    } catch (e) {
      print('🔴 [Security] Get wallet balance error: $e');
      rethrow;
    }
  }

  // ============================================================
  // 💰 SECURE GET WALLET TRANSACTIONS
  // ============================================================
  Future<Map<String, dynamic>> getWalletTransactions(
    int userId, {
    int page = 0,
    int size = 20,
  }) async {
    try {
      print('🔐 [Security] Getting secure wallet transactions...');

      // ✅ SECURITY: Validate User
      final secureUserId = await _getSecureUserId(userId);
      print('✅ [Security] User authenticated: $secureUserId');

      // ✅ SECURITY: Validate pagination
      if (page < 0) {
        throw Exception('Invalid page number');
      }
      if (size < 1 || size > 100) {
        throw Exception('Invalid page size');
      }

      print('💰 [PaymentRepo] ===== GET WALLET TRANSACTIONS =====');
      print('💰 [PaymentRepo] userId: $secureUserId');

      final url = ApiConstants.normalizeUrl(
        ApiConstants.walletTransactions(secureUserId, page: page, size: size),
      );
      print('💰 [PaymentRepo] URL: $url');

      final response = await _apiClient.dio.get(
        url,
        options: Options(
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ),
      );

      print('💰 [PaymentRepo] Response status: ${response.statusCode}');
      print('💰 [PaymentRepo] Response data: ${response.data}');

      _validateResponse(response);

      final responseData =
          response.data['response'] ?? response.data['data'] ?? response.data;
      if (responseData is! Map<String, dynamic>) {
        throw Exception('Invalid response format');
      }

      print('✅ [Security] Wallet transactions retrieved securely');
      return responseData is Map<String, dynamic>
          ? responseData
          : {'data': responseData};
    } on DioException catch (e) {
      print('🔴 [Security] Get wallet transactions error: ${e.message}');
      _handleDioError(e, 'Get Wallet Transactions');
      rethrow;
    } catch (e) {
      print('🔴 [Security] Get wallet transactions error: $e');
      rethrow;
    }
  }

  // ============================================================
  // 🛠️ HELPERS
  // ============================================================
  void _validateResponse(Response response) {
    if (response.statusCode == null ||
        response.statusCode! < 200 ||
        response.statusCode! >= 300) {
      final errorMessage = response.data['message'] ??
          response.data['error'] ??
          'Payment request failed (Status: ${response.statusCode})';
      throw errorMessage;
    }
  }

  void _log(String label, String url, Map<String, dynamic> payload,
      dynamic response) {
    // ✅ Security: Don't log sensitive data
    final safePayload = Map<String, dynamic>.from(payload);
    if (safePayload.containsKey('pin')) {
      safePayload['pin'] = '****';
    }
    if (safePayload.containsKey('bvn')) {
      safePayload['bvn'] = '***';
    }
    if (safePayload.containsKey('nin')) {
      safePayload['nin'] = '***';
    }

    print('💳 [$label] $url');
    print('📤 Payload: $safePayload');
    print('📥 Response: $response');
  }

  void _handleDioError(DioException e, String context) {
    print('❌ [PaymentRepo] $context error: ${e.message}');
    print('❌ Error type: ${e.type}');

    if (e.response != null) {
      print('❌ Response status: ${e.response?.statusCode}');
      print('❌ Response data: ${e.response?.data}');
    }

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
      final errorMessage = responseData?['message'] ??
          responseData?['error'] ??
          '$context failed (Status: ${e.response?.statusCode})';
      throw errorMessage;
    } else {
      throw e.message ?? 'Network error: ${e.type}';
    }
  }

  String get baseUrl => ApiConstants.baseUrl;
}
