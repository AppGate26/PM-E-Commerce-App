import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/data/repositories/base_repository.dart';

class DeliveryFeeRepository extends BaseRepository {
  /// Calculates the real delivery fee for a given delivery destination.
  /// Matches the payload shape shown in Swagger for
  /// POST /api/checkout/calculate-delivery-fee
  Future<double> calculateDeliveryFee({
    required int userId,
    required String deliveryAddress,
    required int deliveryStateId,
    required int deliveryLgaId,
    int? deliveryWardId,
    String deliveryCountry = 'Nigeria',
  }) async {
    // ✅ Ward removed globally on the backend — we do NOT send this key
    // at all anymore (not even as null). Sending "deliveryWardId": null
    // was tripping a server-side `Assert.notNull` / `findById(null)`
    // call, which is what produced the "The given id must not be null"
    // 500 error. Omitting the key entirely avoids that code path.
    final payload = <String, dynamic>{
      'userId': userId,
      'deliveryAddress': deliveryAddress,
      'deliveryStateId': deliveryStateId,
      'deliveryLgaId': deliveryLgaId,
      'deliveryCountry': deliveryCountry,
      // Only include ward if it's ever actually populated again in future.
      if (deliveryWardId != null) 'deliveryWardId': deliveryWardId,
    };

    final url = ApiConstants.normalizeUrl(ApiConstants.calculateDeliveryFee);

    print('🚚 [DeliveryFee] ===== CALCULATING DELIVERY FEE =====');
    print('🚚 [DeliveryFee] URL: $url');
    print('🚚 [DeliveryFee] Payload: $payload');
    print('🚚 [DeliveryFee] Payload types: '
        '{userId: ${userId.runtimeType}, '
        'deliveryStateId: ${deliveryStateId.runtimeType}, '
        'deliveryLgaId: ${deliveryLgaId.runtimeType}, '
        'deliveryWardId: ${deliveryWardId?.runtimeType ?? "null (omitted)"}}');

    // 🔍 curl equivalent — hand this straight to backend / paste into
    // Postman to reproduce outside the app entirely.
    print('🚚 [DeliveryFee] Reproduce with:\n'
        'curl -X POST "$url" '
        '-H "Content-Type: application/json" '
        '-H "Accept: application/json" '
        '-H "Authorization: Bearer <your_token>" '
        "-d '${jsonEncode(payload)}'");

    try {
      final response = await apiClient.dio.post(
        url,
        data: payload,
        options: Options(
          contentType: 'application/json',
          headers: {'Accept': 'application/json'},
        ),
      );

      print('🟢 [DeliveryFee] Status: ${response.statusCode}');
      print('🟢 [DeliveryFee] Response data: ${response.data}');
      print(
          '🟢 [DeliveryFee] Response data type: ${response.data.runtimeType}');

      if (response.statusCode != null &&
          (response.statusCode! < 200 || response.statusCode! >= 300)) {
        final msg = (response.data is Map)
            ? (response.data['message'] ?? 'Failed to calculate delivery fee')
            : 'Failed to calculate delivery fee';
        throw msg;
      }

      final raw =
          response.data['data'] ?? response.data['response'] ?? response.data;

      print(
          '🟢 [DeliveryFee] Extracted "raw" field: $raw (${raw.runtimeType})');

      double fee = 0.0;
      if (raw is num) {
        fee = raw.toDouble();
      } else if (raw is Map) {
        fee = ((raw['deliveryFee'] ??
                raw['fee'] ??
                raw['amount'] ??
                raw['deliveryCost'] ??
                raw['cost'] ??
                0) as num)
            .toDouble();
      } else {
        print(
            '⚠️ [DeliveryFee] Unexpected response shape, defaulting fee to 0');
      }

      print('✅ [DeliveryFee] Calculated fee: ₦$fee');
      return fee;
    } on DioException catch (e) {
      print('🔴 [DeliveryFee] ===== REQUEST FAILED =====');
      print('🔴 [DeliveryFee] Payload sent: $payload');
      print('🔴 [DeliveryFee] Exception type: ${e.type}');
      print('🔴 [DeliveryFee] Message: ${e.message}');
      print('🔴 [DeliveryFee] Status code: ${e.response?.statusCode}');
      print('🔴 [DeliveryFee] Response data: ${e.response?.data}');
      print('🔴 [DeliveryFee] Response headers: ${e.response?.headers}');
      print('🔴 [DeliveryFee] Request path: ${e.requestOptions.path}');
      print('🔴 [DeliveryFee] Request data actually sent: '
          '${e.requestOptions.data}');
      print('🔴 [DeliveryFee] Request headers: ${e.requestOptions.headers}');

      // Pull out the server message specifically, since that's the
      // actionable part ("The given id must not be null" etc.)
      final serverMessage =
          (e.response?.data is Map) ? e.response?.data['message'] : null;
      if (serverMessage != null) {
        print('🔴 [DeliveryFee] Server-reported message: $serverMessage');
      }

      handleDioError(e, 'DeliveryFee');
      rethrow;
    } catch (e, stack) {
      print('🔴 [DeliveryFee] Non-Dio error: $e');
      print('🔴 [DeliveryFee] Stack: $stack');
      rethrow;
    }
  }
}
