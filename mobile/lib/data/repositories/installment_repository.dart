// lib/data/repositories/installment_repository.dart
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';

class InstallmentRepository {
  final ApiClient _apiClient = ApiClient();

  Future<InstallmentPlan> calculateInstallment(
      InstallmentCalculateRequest request) async {
    try {
      print('✅ [API 1] Calculate Installment - Starting');
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.calculateInstallment);
      final requestBody = request.toJson();

      print(
          '💳 [INSTALLMENT REPO] ========== CALCULATE INSTALLMENT REQUEST ==========');
      print('💳 [INSTALLMENT REPO] URL: POST $normalizedUrl');
      print(
          '💳 [INSTALLMENT REPO] Request Object: orderId=${request.orderId}, userId=${request.userId}, productId=${request.productId}');
      print(
          '💳 [INSTALLMENT REPO] Request Object: productPrice=${request.productPrice}, frequency=${request.frequency}, durationInMonths=${request.durationInMonths}');
      print('💳 [INSTALLMENT REPO] Request JSON (toJson()): $requestBody');
      print(
          '💳 [INSTALLMENT REPO] Request JSON Type: ${requestBody.runtimeType}');
      print(
          '💳 [INSTALLMENT REPO] ===================================================');

      // Verify the data before sending (requestBody is always a Map from toJson())
      print('💳 [INSTALLMENT REPO] Verifying request body before sending...');
      print(
          '💳 [INSTALLMENT REPO] All keys in request body: ${requestBody.keys.toList()}');
      print('💳 [INSTALLMENT REPO] userId in body: ${requestBody['userId']}');
      print(
          '💳 [INSTALLMENT REPO] productId in body: ${requestBody['productId']}');
      print(
          '💳 [INSTALLMENT REPO] productPrice in body: ${requestBody['productPrice']}');
      print(
          '💳 [INSTALLMENT REPO] frequency in body: ${requestBody['frequency']}');
      print(
          '💳 [INSTALLMENT REPO] durationInMonths in body: ${requestBody['durationInMonths']}');

      final response =
          await _postJsonPreferPlain(normalizedUrl, requestBody);

      print(
          '💳 [API RESPONSE] POST Calculate Installment - Status: ${response.statusCode}');
      print('💳 [API RESPONSE] Response Type: ${response.data.runtimeType}');

      final plan =
          await _parsePlanResponse(response, 'Calculate Installment');
      print('✅ [API 1] Calculate Installment - Working Fine');
      return plan;
    } on DioException catch (e) {
      throw _describeDioException(e, 'INSTALLMENT REPO');
    } catch (e) {
      print('💳 [INSTALLMENT REPO] General Error: $e');
      print('💳 [INSTALLMENT REPO] Error Type: ${e.runtimeType}');

      // Handle FormatException specifically (JSON parsing errors)
      if (e is FormatException) {
        print(
            '💳 [INSTALLMENT REPO] FormatException detected - likely due to circular references in response');
        throw 'Failed to parse server response. Please try again.';
      }

      rethrow;
    }
  }

  // ============================================================
  // ✅ CREATE INSTALLMENT PLAN — persists the plan the user committed to
  // (after previewing it via calculateInstallment) so we get back a real,
  // database-backed planId to use when creating the order post-payment.
  // Backend: POST /api/installments
  // ============================================================
  Future<InstallmentPlan> createInstallmentPlan({
    required int userId,
    required String frequency,
    required int durationInMonths,
    String? fulfillmentType,
    String? deliveryAddress,
    int? deliveryStateId,
    int? deliveryLgaId,
  }) async {
    try {
      print('✅ [API 1b] Create Installment Plan - Starting');
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.installments);
      // The delivery destination has to travel with the plan: without it the backend
      // prices delivery at 0, yet still charges the order's real delivery fee with the
      // down payment — so the customer was quoted less than they were charged.
      final requestBody = <String, dynamic>{
        'userId': userId,
        'frequency': frequency.toUpperCase(),
        'durationInMonths': durationInMonths,
        if (fulfillmentType != null) 'fulfillmentType': fulfillmentType,
        if (deliveryAddress != null) 'deliveryAddress': deliveryAddress,
        if (deliveryStateId != null) 'deliveryStateId': deliveryStateId,
        if (deliveryLgaId != null) 'deliveryLgaId': deliveryLgaId,
      };

      print('💳 [INSTALLMENT REPO] URL: POST $normalizedUrl');
      print('💳 [INSTALLMENT REPO] Request JSON: $requestBody');

      final response =
          await _postJsonPreferPlain(normalizedUrl, requestBody);

      print(
          '💳 [API RESPONSE] POST Create Installment Plan - Status: ${response.statusCode}');

      final plan =
          await _parsePlanResponse(response, 'Create Installment Plan');
      print(
          '✅ [API 1b] Create Installment Plan - Working Fine, planId=${plan.planId}');
      return plan;
    } on DioException catch (e) {
      throw _describeDioException(e, 'INSTALLMENT REPO');
    } catch (e) {
      print('💳 [INSTALLMENT REPO] General Error: $e');
      if (e is FormatException) {
        throw 'Failed to parse server response. Please try again.';
      }
      rethrow;
    }
  }

  /// Posts JSON, preferring a raw-string response (to sidestep circular
  /// references some installment endpoints return), falling back to the
  /// default JSON decoding if the plain request itself fails.
  Future<Response> _postJsonPreferPlain(
      String url, Map<String, dynamic> body) async {
    try {
      return await _apiClient.dio.post(
        url,
        data: body,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          responseType: ResponseType.plain,
        ),
      );
    } catch (e) {
      print('💳 [API RESPONSE] Plain response failed, trying JSON: $e');
      return await _apiClient.dio.post(
        url,
        data: body,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
    }
  }

  /// Shared response handling for the calculate/create installment plan
  /// endpoints — both return the same plan-shaped payload.
  Future<InstallmentPlan> _parsePlanResponse(
      Response response, String logLabel) async {
    // Accept both 200 and 201 as success status codes
    if (response.statusCode == null ||
        (response.statusCode! < 200 || response.statusCode! >= 300)) {
      String errorMessage = 'Failed to $logLabel (Status: ${response.statusCode})';
      if (response.data is String) {
        try {
          final errorMap = jsonDecode(response.data as String) as Map;
          errorMessage = errorMap['message'] ?? errorMessage;
        } catch (_) {}
      } else if (response.data is Map) {
        errorMessage = (response.data as Map)['message'] ?? errorMessage;
      }
      throw errorMessage;
    }

    // Parse response - handle both string and Map responses
    Map<String, dynamic> responseData;
    try {
      Map<String, dynamic> parsedResponse;

        if (response.data is String) {
          // Parse JSON string - extract only plan data, ignore nested installments to avoid circular references
          print(
              '💳 [API RESPONSE] Parsing JSON string response (extracting plan data only)...');
          final jsonString = response.data as String;

          // Strategy: Extract field values using regex - don't parse JSON at all
          // The JSON is malformed due to circular references, so we extract fields manually
          print(
              '💳 [API RESPONSE] Extracting plan fields using regex (avoiding JSON parse)...');

          // Helper function to extract field value from JSON string using regex
          String? extractFieldValue(String jsonStr, String fieldName) {
            // Try string value first: "fieldName":"value"
            final stringPattern = RegExp('"$fieldName"\\s*:\\s*"([^"]*)"');
            final stringMatch = stringPattern.firstMatch(jsonStr);
            if (stringMatch != null) return stringMatch.group(1);

            // Try numeric/boolean/null values: "fieldName":value
            final valuePattern =
                RegExp('"$fieldName"\\s*:\\s*([^,}\\]]+?)(?=\\s*[,}])');
            final valueMatch = valuePattern.firstMatch(jsonStr);
            if (valueMatch != null) {
              final value = valueMatch.group(1)?.trim();
              if (value != null && value != 'null') return value;
            }
            return null;
          }

          // Extract all plan fields we need (only from the "data" object, before "installments")
          // Find the data object start
          final dataStart = jsonString.indexOf('"data":{');
          final installmentsStart = jsonString.indexOf(
              ',"installments":[', dataStart != -1 ? dataStart : 0);
          final searchEnd =
              installmentsStart != -1 ? installmentsStart : jsonString.length;
          final dataSection = dataStart != -1
              ? jsonString.substring(dataStart, searchEnd)
              : jsonString;

          // 🔎 REAL installment rows — the backend sends these in the
          // "installments" array as flat objects ({"id":591,"installmentNumber":1,
          // "amountDue":19250.0,"dueDate":"2026-09-30","status":"PENDING",...}).
          // We can't jsonDecode the whole response (circular refs deeper in the
          // payload break that), so we split just this array into its top-level
          // objects by brace-balance and regex-extract the safe scalar fields
          // out of each one — giving us the real database id instead of the
          // fake sequential id (i+1) the model falls back to when no
          // installments survive parsing.
          List<Map<String, dynamic>> extractedInstallments = [];
          if (installmentsStart != -1) {
            final arrayOpenIndex =
                installmentsStart + ',"installments":['.length;
            final objectStrings =
                _splitTopLevelJsonObjects(jsonString, arrayOpenIndex);
            extractedInstallments = objectStrings.map((obj) {
              final status = extractFieldValue(obj, 'status');
              return <String, dynamic>{
                'id': int.tryParse(extractFieldValue(obj, 'id') ?? ''),
                'installmentNumber':
                    int.tryParse(extractFieldValue(obj, 'installmentNumber') ?? ''),
                'amountDue':
                    double.tryParse(extractFieldValue(obj, 'amountDue') ?? ''),
                'amountPaid':
                    double.tryParse(extractFieldValue(obj, 'amountPaid') ?? ''),
                'dueDate': extractFieldValue(obj, 'dueDate'),
                'paidDate': extractFieldValue(obj, 'paidDate'),
                'status': status,
                'isPaid': status == 'PAID' || status == 'COMPLETED',
                'daysOverdue':
                    int.tryParse(extractFieldValue(obj, 'daysOverdue') ?? ''),
              };
            }).toList();
            print(
                '🔎 [INSTALLMENT REPO] REAL installment ids parsed from backend = '
                '${extractedInstallments.map((m) => m['id']).toList()}');
          } else {
            print(
                '🔎 [INSTALLMENT REPO] No "installments" array found in response at all — backend may not be returning installment rows on create.');
          }

          final planData = <String, dynamic>{
            'id':
                int.tryParse(extractFieldValue(dataSection, 'id') ?? '0') ?? 0,
            'orderId': int.tryParse(
                    extractFieldValue(dataSection, 'orderId') ?? '0') ??
                0,
            'userId':
                int.tryParse(extractFieldValue(dataSection, 'userId') ?? '0') ??
                    0,
            'productId': int.tryParse(
                    extractFieldValue(dataSection, 'productId') ?? '0') ??
                0,
            // ✅ FIX — these two fields were never being extracted before, so
            // productPrice/productName always fell back to 0.0 / 'Product' in the model.
            'productPrice': double.tryParse(
                    extractFieldValue(dataSection, 'productPrice') ?? '0') ??
                0.0,
            'productName': extractFieldValue(dataSection, 'productName'),
            'totalAmount': double.tryParse(
                    extractFieldValue(dataSection, 'totalAmount') ?? '0') ??
                0.0,
            'insuranceAmount': double.tryParse(
                    extractFieldValue(dataSection, 'insuranceAmount') ?? '0') ??
                0.0,
            'grandTotal': double.tryParse(
                    extractFieldValue(dataSection, 'grandTotal') ?? '0') ??
                0.0,
            'downPayment': double.tryParse(
                    extractFieldValue(dataSection, 'downPayment') ?? '0') ??
                0.0,
            'remainingBalance': double.tryParse(
                    extractFieldValue(dataSection, 'remainingBalance') ??
                        '0') ??
                0.0,
            'installmentAmount': double.tryParse(
                    extractFieldValue(dataSection, 'installmentAmount') ??
                        '0') ??
                0.0,
            'frequency': extractFieldValue(dataSection, 'frequency') ?? 'DAILY',
            'numberOfInstallments': int.tryParse(
                    extractFieldValue(dataSection, 'numberOfInstallments') ??
                        '0') ??
                0,
            'completedInstallments': int.tryParse(
                    extractFieldValue(dataSection, 'completedInstallments') ??
                        '0') ??
                0,
            'status': extractFieldValue(dataSection, 'status') ?? 'ACTIVE',
            'startDate': extractFieldValue(dataSection, 'startDate'),
            'nextPaymentDate':
                extractFieldValue(dataSection, 'nextPaymentDate'),
            'completionDate': extractFieldValue(dataSection, 'completionDate'),
            'earlyShipmentEligible':
                extractFieldValue(dataSection, 'earlyShipmentEligible') ==
                    'true',
            'installments': extractedInstallments,
          };

// ✅ Diagnostic — confirms in your console whether the backend is actually
// sending these fields at all, or whether they're genuinely absent.
          print(
              '🧾 [INSTALLMENT REPO] productPrice extracted = ${planData['productPrice']}');
          print(
              '🧾 [INSTALLMENT REPO] productName extracted  = ${planData['productName']}');
          if (planData['productPrice'] == 0.0) {
            print(
                '🔴 [INSTALLMENT REPO] ⚠️ productPrice came back as 0 — either the '
                'backend response truly has no "productPrice" field in the data '
                'section, or its exact key name differs (check Swagger response '
                'schema for POST /api/installments/calculate).');
          }
          // Build clean response structure
          parsedResponse = {
            'status': 201,
            'message': 'Installment plan created successfully',
            'data': planData,
          };

          print(
              '💳 [API RESPONSE] ✅ Successfully extracted plan data using regex');
          print(
              '💳 [API RESPONSE] Plan ID: ${planData['id']}, Installments: ${planData['numberOfInstallments']}, Amount: ${planData['installmentAmount']}');
        } else if (response.data is Map) {
          parsedResponse = response.data as Map<String, dynamic>;
        } else {
          throw 'Invalid response format: expected String or Map, got ${response.data.runtimeType}';
        }

        // Extract data from nested response structure: {status: 201, message: "...", data: {...}}
        if (parsedResponse.containsKey('data')) {
          final dataValue = parsedResponse['data'];
          responseData = dataValue is Map<String, dynamic>
              ? dataValue
              : Map<String, dynamic>.from(dataValue as Map);
          print(
              '💳 [API RESPONSE] Extracted data from response.data[\'data\']');
        } else if (parsedResponse.containsKey('response')) {
          final responseValue = parsedResponse['response'];
          responseData = responseValue is Map<String, dynamic>
              ? responseValue
              : Map<String, dynamic>.from(responseValue as Map);
          print(
              '💳 [API RESPONSE] Extracted data from response.data[\'response\']');
        } else {
          responseData = parsedResponse;
          print('💳 [API RESPONSE] Using response.data directly');
        }

        // Curate the installments array down to safe scalar fields instead of
        // deleting it. The String-parsed path above already hands us a clean
        // list (id/dueDate/amountDue/status only), but the plain-Map response
        // path (response.data is Map, no regex extraction) still carries the
        // raw backend objects here — flatten those the same way so we never
        // lose the real database installment id, while still avoiding any
        // deeply-nested/circular fields the raw objects might carry.
        if (responseData.containsKey('installments')) {
          final rawInstallments = responseData['installments'];
          if (rawInstallments is List) {
            final curated = rawInstallments.map((item) {
              if (item is! Map) return <String, dynamic>{};
              final status = item['status'];
              return <String, dynamic>{
                'id': item['id'] ?? item['installmentId'],
                'installmentNumber': item['installmentNumber'],
                'amountDue': item['amountDue'],
                'amountPaid': item['amountPaid'],
                'dueDate': item['dueDate'],
                'paidDate': item['paidDate'],
                'status': status,
                'isPaid': status == 'PAID' || status == 'COMPLETED',
                'daysOverdue': item['daysOverdue'],
              };
            }).toList();
            print(
                '🔎 [INSTALLMENT REPO] REAL installment ids from backend (Map response) = '
                '${curated.map((m) => m['id']).toList()}');
            responseData['installments'] = curated;
          }
        }

        // Ensure we have the necessary fields to generate installments
        print('💳 [API RESPONSE] Plan data extracted:');
        print(
            '  - numberOfInstallments: ${responseData['numberOfInstallments']}');
        print('  - installmentAmount: ${responseData['installmentAmount']}');
        print('  - downPayment: ${responseData['downPayment']}');
        print('  - startDate: ${responseData['startDate']}');
        print('  - frequency: ${responseData['frequency']}');
      } catch (e) {
        print('💳 [API RESPONSE] Error extracting/cleaning response data: $e');
        if (e is FormatException) {
          throw 'Failed to parse server response. The response may be too large. Please try again.';
        }
        rethrow;
      }

      print('💳 [API RESPONSE] Parsing InstallmentPlan from cleaned data');
      final plan = InstallmentPlan.fromJson(responseData);
      print('💳 [API RESPONSE] ✅ Installment plan parsed successfully!');
      print(
          '💳 [API RESPONSE] Plan ID: ${plan.planId}, Total: ${plan.totalAmount}, Schedule items: ${plan.schedule.length}');
      return plan;
  }

  /// Splits the body of a JSON array (starting right after its opening `[`)
  /// into its top-level `{...}` object substrings, respecting string
  /// literals so braces inside quoted values don't throw off the count.
  /// Stops at the array's closing `]`. Used to pull individual installment
  /// objects out of a response we can't safely jsonDecode as a whole.
  List<String> _splitTopLevelJsonObjects(String source, int startIndex) {
    final objects = <String>[];
    int depth = 0;
    int objectStart = -1;
    bool inString = false;
    bool escape = false;

    for (int i = startIndex; i < source.length; i++) {
      final c = source[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (c == '\\') {
          escape = true;
        } else if (c == '"') {
          inString = false;
        }
        continue;
      }
      if (c == '"') {
        inString = true;
        continue;
      }
      if (c == '{') {
        if (depth == 0) objectStart = i;
        depth++;
      } else if (c == '}') {
        depth--;
        if (depth == 0 && objectStart != -1) {
          objects.add(source.substring(objectStart, i + 1));
          objectStart = -1;
        }
      } else if (c == ']' && depth == 0) {
        break;
      }
    }
    return objects;
  }

  /// Builds a user-friendly error message from a DioException, shared by the
  /// calculate/create installment plan endpoints.
  String _describeDioException(DioException e, String tag) {
    print('💳 [$tag] ========== DIO EXCEPTION ==========');
    print('💳 [$tag] Error Type: ${e.type}');
    print('💳 [$tag] Error Message: ${e.message}');
    print('💳 [$tag] Status Code: ${e.response?.statusCode}');
    print('💳 [$tag] Response Data: ${e.response?.data}');
    print('💳 [$tag] Request Data Sent: ${e.requestOptions.data}');
    print('💳 [$tag] Request URL: ${e.requestOptions.uri}');
    print('💳 [$tag] Error Stack Trace: ${e.stackTrace}');

    // Handle different DioException types
    String errorMessage = 'An unexpected error occurred. Please try again.';

    // Check for network/connection errors
    if (e.type == DioExceptionType.connectionTimeout) {
      errorMessage =
          'Connection timeout. Please check your internet connection and try again.';
    } else if (e.type == DioExceptionType.receiveTimeout) {
      errorMessage = 'Request timeout. Please try again.';
    } else if (e.type == DioExceptionType.sendTimeout) {
      errorMessage =
          'Send timeout. Please check your connection and try again.';
    } else if (e.type == DioExceptionType.connectionError) {
      errorMessage =
          'Cannot connect to server. Please check your internet connection.';
    } else if (e.type == DioExceptionType.unknown) {
      // For unknown errors, try to get more details
      if (e.error != null) {
        print('💳 [$tag] Underlying error: ${e.error}');
        errorMessage = 'Network error: ${e.error}';
      } else if (e.message != null && e.message!.isNotEmpty) {
        errorMessage = e.message!;
      }
    }

    // Try to extract error message from response
    if (e.response != null && e.response!.data != null) {
      final responseData = e.response!.data;
      print('💳 [$tag] Full Response Data: $responseData');

      if (responseData is Map) {
        if (responseData.containsKey('message')) {
          errorMessage = responseData['message'].toString();
        } else if (responseData.containsKey('error')) {
          errorMessage = responseData['error'].toString();
        }

        // Check for validation errors
        if (responseData.containsKey('response') &&
            responseData['response'] is Map) {
          final responseMap = responseData['response'] as Map;
          final errors = responseMap.entries
              .map((entry) => '${entry.key}: ${entry.value}')
              .join(', ');
          if (errors.isNotEmpty) {
            errorMessage = '$errorMessage ($errors)';
          }
        }
      } else if (responseData is String) {
        errorMessage = responseData;
      }
    }

    print('💳 [$tag] Final Error Message: $errorMessage');
    print('💳 [$tag] ===================================');
    return errorMessage;
  }

  Future<void> payInstallment(int installmentId) async {
    try {
      print('✅ [API 2] Pay Installment - Starting');
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.payInstallment(installmentId));
      print('💳 [API REQUEST] POST $normalizedUrl');

      final response = await _apiClient.dio.post(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print(
          '💳 [API RESPONSE] POST Pay Installment - Status: ${response.statusCode}');
      print('💳 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to pay installment';
        throw errorMessage;
      }
      print('💳 [API RESPONSE] Installment paid successfully');
      print('✅ [API 2] Pay Installment - Working Fine');
    } on DioException catch (e) {
      print('💳 [API ERROR] DioException: ${e.message}');
      print('💳 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💳 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<InstallmentPlan> getInstallmentPlan(int planId) async {
    try {
      print('✅ [API 3] Get Installment Plan - Starting');
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.getInstallmentPlan(planId));
      print('💳 [API REQUEST] GET $normalizedUrl');

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
          '💳 [API RESPONSE] GET Installment Plan - Status: ${response.statusCode}');
      print('💳 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch installment plan';
        throw errorMessage;
      }

      final plan = InstallmentPlan.fromJson(response.data);
      print('💳 [API RESPONSE] Plan fetched: planId=${plan.planId}');
      print('✅ [API 3] Get Installment Plan - Working Fine');
      return plan;
    } on DioException catch (e) {
      print('💳 [API ERROR] DioException: ${e.message}');
      print('💳 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💳 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<List<InstallmentSchedule>> getInstallmentSchedule(int planId) async {
    try {
      print('✅ [API 4] Get Installment Schedule - Starting');
      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.getInstallmentSchedule(planId));
      print('💳 [API REQUEST] GET $normalizedUrl');

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
          '💳 [API RESPONSE] GET Installment Schedule - Status: ${response.statusCode}');
      print('💳 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch installment schedule';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      List<InstallmentSchedule> schedule = [];

      if (responseData is List) {
        schedule = responseData
            .map((json) => InstallmentSchedule.fromJson(json))
            .toList();
      } else if (responseData is Map && responseData['schedule'] != null) {
        schedule = (responseData['schedule'] as List)
            .map((json) => InstallmentSchedule.fromJson(json))
            .toList();
      }

      print(
          '💳 [API RESPONSE] Schedule fetched: ${schedule.length} installments');
      print('✅ [API 4] Get Installment Schedule - Working Fine');
      return schedule;
    } on DioException catch (e) {
      print('💳 [API ERROR] DioException: ${e.message}');
      print('💳 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💳 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<List<UserInstallment>> getUserInstallments(int userId) async {
    try {
      print('✅ [API 5] Get User Installments - Starting');
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.getUserInstallments(userId));
      print('💳 [API REQUEST] GET $normalizedUrl');

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
          '💳 [API RESPONSE] GET User Installments - Status: ${response.statusCode}');
      print('💳 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch user installments';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      List<UserInstallment> installments = [];

      if (responseData is List) {
        installments =
            responseData.map((json) => UserInstallment.fromJson(json)).toList();
      } else if (responseData is Map && responseData['content'] != null) {
        installments = (responseData['content'] as List)
            .map((json) => UserInstallment.fromJson(json))
            .toList();
      }

      print(
          '💳 [API RESPONSE] User installments fetched: ${installments.length} plans');
      print('✅ [API 5] Get User Installments - Working Fine');
      return installments;
    } on DioException catch (e) {
      print('💳 [API ERROR] DioException: ${e.message}');
      print('💳 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💳 [API ERROR] General: $e');
      rethrow;
    }
  }

  Future<List<InstallmentSchedule>> getUserUpcomingInstallments(
      int userId) async {
    try {
      print('✅ [API 6] Get User Upcoming Installments - Starting');
      final normalizedUrl = ApiConstants.normalizeUrl(
          ApiConstants.getUserUpcomingInstallments(userId));
      print('💳 [API REQUEST] GET $normalizedUrl');

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
          '💳 [API RESPONSE] GET Upcoming Installments - Status: ${response.statusCode}');
      print('💳 [API RESPONSE] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch upcoming installments';
        throw errorMessage;
      }

      final responseData =
          response.data['data'] ?? response.data['response'] ?? response.data;
      List<InstallmentSchedule> schedule = [];

      if (responseData is List) {
        schedule = responseData
            .map((json) => InstallmentSchedule.fromJson(json))
            .toList();
      } else if (responseData is Map && responseData['content'] != null) {
        schedule = (responseData['content'] as List)
            .map((json) => InstallmentSchedule.fromJson(json))
            .toList();
      }

      print(
          '💳 [API RESPONSE] Upcoming installments fetched: ${schedule.length} items');
      print('✅ [API 6] Get User Upcoming Installments - Working Fine');
      return schedule;
    } on DioException catch (e) {
      print('💳 [API ERROR] DioException: ${e.message}');
      print('💳 [API ERROR] Response: ${e.response?.data}');
      throw _handleDioError(e);
    } catch (e) {
      print('💳 [API ERROR] General: $e');
      rethrow;
    }
  }

  String _handleDioError(DioException e) {
    if (e.response != null) {
      final statusCode = e.response!.statusCode;
      final message = e.response!.data['message'] ??
          e.response!.data['error'] ??
          'Request failed with status $statusCode';
      return message.toString();
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    } else if (e.type == DioExceptionType.connectionError) {
      return 'No internet connection. Please check your network.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
