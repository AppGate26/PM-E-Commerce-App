import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/models/chat_model.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/networks/api_client.dart';
import '../models/call_model.dart';

class CallRemoteDataSource {
  final Dio _dio;

  CallRemoteDataSource() : _dio = ApiClient().dio;

  // ============================================================
  // GET CALLS IN QUEUE
  // ============================================================
  Future<List<Call>> getCallsInQueue() async {
    debugPrint('📤 CALL API: GET /api/support/calls/queue');
    debugPrint('📤 CALL API: Fetching calls in queue...');

    try {
      final response = await _dio.get(ApiConstants.callsQueue);

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<Call>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData.map((item) => Call.fromJson(item)).toList();
            }
            return [];
          },
        );

        debugPrint('✅ CALL API: Retrieved ${responseObj.data?.length ?? 0} queued calls');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to load queued calls: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // GET INCOMING CALLS
  // ============================================================
  Future<List<Call>> getIncomingCalls() async {
    debugPrint('📤 CALL API: GET /api/support/calls/incoming');
    debugPrint('📤 CALL API: Fetching incoming calls...');

    try {
      final response = await _dio.get(ApiConstants.callsIncoming);

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<Call>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData.map((item) => Call.fromJson(item)).toList();
            }
            return [];
          },
        );

        debugPrint('✅ CALL API: Retrieved ${responseObj.data?.length ?? 0} incoming calls');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to load incoming calls: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // ACCEPT CALL
  // ============================================================
  Future<Call> acceptCall(String callId) async {
    debugPrint('📤 CALL API: POST /api/support/calls/$callId/accept');
    debugPrint('📤 CALL API: Accepting call: $callId');

    try {
      final response = await _dio.post(ApiConstants.callAccept(callId));

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<Call>.fromJson(
          data,
          (jsonData) => Call.fromJson(jsonData),
        );

        debugPrint('✅ CALL API: Call accepted successfully');
        return responseObj.data ?? Call(
          id: 0,
          callId: callId,
          customerName: 'Unknown',
          customerPhone: '',
          status: 'active',
          timestamp: DateTime.now(),
        );
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to accept call: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // DECLINE CALL
  // ============================================================
  Future<Call> declineCall(String callId) async {
    debugPrint('📤 CALL API: POST /api/support/calls/$callId/decline');
    debugPrint('📤 CALL API: Declining call: $callId');

    try {
      final response = await _dio.post(ApiConstants.callDecline(callId));

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<Call>.fromJson(
          data,
          (jsonData) => Call.fromJson(jsonData),
        );

        debugPrint('✅ CALL API: Call declined successfully');
        return responseObj.data ?? Call(
          id: 0,
          callId: callId,
          customerName: 'Unknown',
          customerPhone: '',
          status: 'declined',
          timestamp: DateTime.now(),
        );
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to decline call: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // END CALL
  // ============================================================
  Future<Call> endCall({
    required String callId,
    String? complain,
    String? comment,
  }) async {
    debugPrint('📤 CALL API: POST /api/support/calls/$callId/end');
    debugPrint('📤 CALL API: Ending call: $callId');
    debugPrint('📤 CALL API: Complain: $complain, Comment: $comment');

    try {
      final requestBody = EndCallRequest(
        complain: complain,
        comment: comment,
      );

      debugPrint('📤 CALL API: Request body: ${requestBody.toJson()}');

      final response = await _dio.post(
        ApiConstants.callEnd(callId),
        data: requestBody.toJson(),
      );

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<Call>.fromJson(
          data,
          (jsonData) => Call.fromJson(jsonData),
        );

        debugPrint('✅ CALL API: Call ended successfully');
        return responseObj.data ?? Call(
          id: 0,
          callId: callId,
          customerName: 'Unknown',
          customerPhone: '',
          status: 'ended',
          timestamp: DateTime.now(),
        );
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to end call: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // GET CALL LOGS
  // ============================================================
  Future<List<CallLog>> getCallLogs({
    String? status,
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📤 CALL API: GET /api/support/call-log?status=$status&page=$page&size=$size');
    debugPrint('📤 CALL API: Fetching call logs...');

    try {
      final queryParams = {
        'page': page,
        'size': size,
        if (status != null) 'status': status,
      };

      final response = await _dio.get(
        ApiConstants.callLog,
        queryParameters: queryParams,
      );

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<CallLog>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData.map((item) => CallLog.fromJson(item)).toList();
            }
            return [];
          },
        );

        debugPrint('✅ CALL API: Retrieved ${responseObj.data?.length ?? 0} call logs');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to load call logs: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // GET MISSED CALLS
  // ============================================================
  Future<List<CallLog>> getMissedCalls({
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📤 CALL API: GET /api/support/call-log/missed?page=$page&size=$size');
    debugPrint('📤 CALL API: Fetching missed calls...');

    try {
      final response = await _dio.get(
        ApiConstants.callLogMissed,
        queryParameters: {
          'page': page,
          'size': size,
        },
      );

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<CallLog>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData.map((item) => CallLog.fromJson(item)).toList();
            }
            return [];
          },
        );

        debugPrint('✅ CALL API: Retrieved ${responseObj.data?.length ?? 0} missed calls');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to load missed calls: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // GET RECEIVED CALLS
  // ============================================================
  Future<List<CallLog>> getReceivedCalls({
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📤 CALL API: GET /api/support/call-log/received?page=$page&size=$size');
    debugPrint('📤 CALL API: Fetching received calls...');

    try {
      final response = await _dio.get(
        ApiConstants.callLogReceived,
        queryParameters: {
          'page': page,
          'size': size,
        },
      );

      debugPrint('✅ CALL API: Status: ${response.statusCode}');
      debugPrint('✅ CALL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<CallLog>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData.map((item) => CallLog.fromJson(item)).toList();
            }
            return [];
          },
        );

        debugPrint('✅ CALL API: Retrieved ${responseObj.data?.length ?? 0} received calls');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ CALL API: Error: ${response.statusCode}');
        throw Exception('Failed to load received calls: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CALL API: Dio Error: ${e.message}');
      debugPrint('❌ CALL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CALL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================
  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      debugPrint('❌ CALL API: Error response data: $data');

      if (data is Map<String, dynamic>) {
        if (data.containsKey('message')) {
          return data['message'].toString();
        }
        if (data.containsKey('error')) {
          return data['error'].toString();
        }
      }
      return 'Something went wrong. Please try again.';
    } else if (error.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet.';
    } else if (error.type == DioExceptionType.receiveTimeout) {
      return 'Server timeout. Please try again.';
    } else if (error.type == DioExceptionType.connectionError) {
      return 'No internet connection. Please check your network.';
    } else if (error.type == DioExceptionType.cancel) {
      return 'Request was cancelled.';
    } else {
      return error.message ?? 'An unexpected error occurred.';
    }
  }
}