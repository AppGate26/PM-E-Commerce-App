import 'package:flutter/foundation.dart';
import '../datasources/call_remote_datasource.dart';
import '../models/call_model.dart';

class CallRepository {
  final CallRemoteDataSource _remoteDataSource;

  CallRepository() : _remoteDataSource = CallRemoteDataSource();

  // ============================================================
  // GET CALLS IN QUEUE
  // ============================================================
  Future<List<Call>> getCallsInQueue() async {
    debugPrint('📦 CALL REPOSITORY: getCallsInQueue() called');
    try {
      final calls = await _remoteDataSource.getCallsInQueue();
      debugPrint('✅ CALL REPOSITORY: Retrieved ${calls.length} queued calls');
      return calls;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to get queued calls: $e');
      rethrow;
    }
  }

  // ============================================================
  // GET INCOMING CALLS
  // ============================================================
  Future<List<Call>> getIncomingCalls() async {
    debugPrint('📦 CALL REPOSITORY: getIncomingCalls() called');
    try {
      final calls = await _remoteDataSource.getIncomingCalls();
      debugPrint('✅ CALL REPOSITORY: Retrieved ${calls.length} incoming calls');
      return calls;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to get incoming calls: $e');
      rethrow;
    }
  }

  // ============================================================
  // ACCEPT CALL
  // ============================================================
  Future<Call> acceptCall(String callId) async {
    debugPrint('📦 CALL REPOSITORY: acceptCall() called for: $callId');
    try {
      final call = await _remoteDataSource.acceptCall(callId);
      debugPrint('✅ CALL REPOSITORY: Call accepted successfully');
      return call;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to accept call: $e');
      rethrow;
    }
  }

  // ============================================================
  // DECLINE CALL
  // ============================================================
  Future<Call> declineCall(String callId) async {
    debugPrint('📦 CALL REPOSITORY: declineCall() called for: $callId');
    try {
      final call = await _remoteDataSource.declineCall(callId);
      debugPrint('✅ CALL REPOSITORY: Call declined successfully');
      return call;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to decline call: $e');
      rethrow;
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
    debugPrint('📦 CALL REPOSITORY: endCall() called for: $callId');
    try {
      final call = await _remoteDataSource.endCall(
        callId: callId,
        complain: complain,
        comment: comment,
      );
      debugPrint('✅ CALL REPOSITORY: Call ended successfully');
      return call;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to end call: $e');
      rethrow;
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
    debugPrint('📦 CALL REPOSITORY: getCallLogs() called');
    try {
      final logs = await _remoteDataSource.getCallLogs(
        status: status,
        page: page,
        size: size,
      );
      debugPrint('✅ CALL REPOSITORY: Retrieved ${logs.length} call logs');
      return logs;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to get call logs: $e');
      rethrow;
    }
  }

  // ============================================================
  // GET MISSED CALLS
  // ============================================================
  Future<List<CallLog>> getMissedCalls({
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📦 CALL REPOSITORY: getMissedCalls() called');
    try {
      final logs = await _remoteDataSource.getMissedCalls(page: page, size: size);
      debugPrint('✅ CALL REPOSITORY: Retrieved ${logs.length} missed calls');
      return logs;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to get missed calls: $e');
      rethrow;
    }
  }

  // ============================================================
  // GET RECEIVED CALLS
  // ============================================================
  Future<List<CallLog>> getReceivedCalls({
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📦 CALL REPOSITORY: getReceivedCalls() called');
    try {
      final logs = await _remoteDataSource.getReceivedCalls(page: page, size: size);
      debugPrint('✅ CALL REPOSITORY: Retrieved ${logs.length} received calls');
      return logs;
    } catch (e) {
      debugPrint('❌ CALL REPOSITORY: Failed to get received calls: $e');
      rethrow;
    }
  }
}