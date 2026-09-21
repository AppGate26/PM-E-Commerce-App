import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import '../models/call_model.dart';
import '../repositories/call_repository.dart';

// ============================================================
// PROVIDER DEFINITIONS
// ============================================================
final callRepositoryProvider = Provider<CallRepository>((ref) {
  print('🔄 CALL PROVIDER: callRepositoryProvider created');
  return CallRepository();
});

// ============================================================
// CALL QUEUE PROVIDER
// ============================================================
final callQueueProvider = NotifierProvider<CallQueueNotifier, AsyncValue<List<Call>>>(() {
  return CallQueueNotifier();
});

// ============================================================
// INCOMING CALLS PROVIDER
// ============================================================
final incomingCallsProvider = NotifierProvider<IncomingCallsNotifier, AsyncValue<List<Call>>>(() {
  return IncomingCallsNotifier();
});

// ============================================================
// CALL LOGS PROVIDER
// ============================================================
final callLogsProvider = NotifierProvider<CallLogsNotifier, AsyncValue<List<CallLog>>>(() {
  return CallLogsNotifier();
});

// ============================================================
// CALL ACTION PROVIDER (Accept/Decline/End)
// ============================================================
final callActionProvider = NotifierProvider<CallActionNotifier, AsyncValue<Call?>>(() {
  return CallActionNotifier();
});

// ============================================================
// CALL QUEUE NOTIFIER
// ============================================================
class CallQueueNotifier extends Notifier<AsyncValue<List<Call>>> {
  @override
  AsyncValue<List<Call>> build() {
    print('🔄 CALL QUEUE NOTIFIER: Initialized');
    Future.microtask(() => fetchQueue());
    return const AsyncValue.loading();
  }

  CallRepository get _repo => ref.read(callRepositoryProvider);

  Future<void> fetchQueue() async {
    print('🔄 CALL QUEUE NOTIFIER: fetchQueue() called');
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ CALL QUEUE NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ CALL QUEUE NOTIFIER: Fetching queued calls...');
      final calls = await _repo.getCallsInQueue();
      print('✅ CALL QUEUE NOTIFIER: Loaded ${calls.length} queued calls');
      state = AsyncValue.data(calls);
    } catch (e, st) {
      print('❌ CALL QUEUE NOTIFIER: Failed to load queue: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshQueue() async {
    print('🔄 CALL QUEUE NOTIFIER: refreshQueue() called');
    await fetchQueue();
  }
}

// ============================================================
// INCOMING CALLS NOTIFIER
// ============================================================
class IncomingCallsNotifier extends Notifier<AsyncValue<List<Call>>> {
  @override
  AsyncValue<List<Call>> build() {
    print('🔄 INCOMING CALLS NOTIFIER: Initialized');
    Future.microtask(() => fetchIncoming());
    return const AsyncValue.loading();
  }

  CallRepository get _repo => ref.read(callRepositoryProvider);

  Future<void> fetchIncoming() async {
    print('🔄 INCOMING CALLS NOTIFIER: fetchIncoming() called');
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ INCOMING CALLS NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ INCOMING CALLS NOTIFIER: Fetching incoming calls...');
      final calls = await _repo.getIncomingCalls();
      print('✅ INCOMING CALLS NOTIFIER: Loaded ${calls.length} incoming calls');
      state = AsyncValue.data(calls);
    } catch (e, st) {
      print('❌ INCOMING CALLS NOTIFIER: Failed to load incoming calls: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshIncoming() async {
    print('🔄 INCOMING CALLS NOTIFIER: refreshIncoming() called');
    await fetchIncoming();
  }
}

// ============================================================
// CALL LOGS NOTIFIER
// ============================================================
class CallLogsNotifier extends Notifier<AsyncValue<List<CallLog>>> {
  int _currentPage = 0;
  bool _hasMore = true;
  List<CallLog> _allLogs = [];
  String? _filterStatus;

  @override
  AsyncValue<List<CallLog>> build() {
    print('🔄 CALL LOGS NOTIFIER: Initialized');
    Future.microtask(() => fetchLogs());
    return const AsyncValue.loading();
  }

  CallRepository get _repo => ref.read(callRepositoryProvider);

  Future<void> fetchLogs({
    String? status,
    int page = 0,
    int size = 20,
  }) async {
    print('🔄 CALL LOGS NOTIFIER: fetchLogs() called');
    print('📤 CALL LOGS NOTIFIER: Status: $status, Page: $page, Size: $size');

    if (page == 0) {
      state = const AsyncValue.loading();
      _allLogs = [];
      _filterStatus = status;
    }

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ CALL LOGS NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ CALL LOGS NOTIFIER: Fetching call logs...');
      final logs = await _repo.getCallLogs(
        status: status,
        page: page,
        size: size,
      );
      print('✅ CALL LOGS NOTIFIER: Loaded ${logs.length} call logs');

      if (page == 0) {
        _allLogs = logs;
      } else {
        _allLogs.addAll(logs);
      }

      _currentPage = page;
      _hasMore = logs.length == size;

      state = AsyncValue.data(_allLogs);
      print('📊 CALL LOGS NOTIFIER: Total logs: ${_allLogs.length}, Has more: $_hasMore');
    } catch (e, st) {
      print('❌ CALL LOGS NOTIFIER: Failed to load call logs: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshLogs() async {
    print('🔄 CALL LOGS NOTIFIER: refreshLogs() called');
    _currentPage = 0;
    _hasMore = true;
    await fetchLogs(status: _filterStatus, page: 0);
  }

  Future<void> loadMoreLogs() async {
    print('🔄 CALL LOGS NOTIFIER: loadMoreLogs() called');
    if (!_hasMore || state.isLoading) {
      print('ℹ️ CALL LOGS NOTIFIER: No more logs to load or already loading');
      return;
    }
    await fetchLogs(status: _filterStatus, page: _currentPage + 1);
  }

  Future<void> filterByStatus(String? status) async {
    print('🔄 CALL LOGS NOTIFIER: filterByStatus() called: $status');
    _currentPage = 0;
    _hasMore = true;
    await fetchLogs(status: status, page: 0);
  }

  bool get hasMore => _hasMore;
  int get currentPage => _currentPage;
  String? get filterStatus => _filterStatus;
}

// ============================================================
// CALL ACTION NOTIFIER
// ============================================================
class CallActionNotifier extends Notifier<AsyncValue<Call?>> {
  @override
  AsyncValue<Call?> build() {
    print('🔄 CALL ACTION NOTIFIER: Initialized');
    return const AsyncValue.data(null);
  }

  CallRepository get _repo => ref.read(callRepositoryProvider);

  Future<Call?> acceptCall(String callId) async {
    print('🔄 CALL ACTION NOTIFIER: acceptCall() called for: $callId');
    state = const AsyncValue.loading();

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ CALL ACTION NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ CALL ACTION NOTIFIER: Accepting call...');
      final call = await _repo.acceptCall(callId);
      print('✅ CALL ACTION NOTIFIER: Call accepted');
      state = AsyncValue.data(call);

      // Refresh queue after accepting
      final queueNotifier = ref.read(callQueueProvider.notifier);
      await queueNotifier.refreshQueue();

      return call;
    } catch (e, st) {
      print('❌ CALL ACTION NOTIFIER: Failed to accept call: $e');
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  Future<Call?> declineCall(String callId) async {
    print('🔄 CALL ACTION NOTIFIER: declineCall() called for: $callId');
    state = const AsyncValue.loading();

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ CALL ACTION NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ CALL ACTION NOTIFIER: Declining call...');
      final call = await _repo.declineCall(callId);
      print('✅ CALL ACTION NOTIFIER: Call declined');
      state = AsyncValue.data(call);

      // Refresh queue after declining
      final queueNotifier = ref.read(callQueueProvider.notifier);
      await queueNotifier.refreshQueue();

      return call;
    } catch (e, st) {
      print('❌ CALL ACTION NOTIFIER: Failed to decline call: $e');
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  Future<Call?> endCall({
    required String callId,
    String? complain,
    String? comment,
  }) async {
    print('🔄 CALL ACTION NOTIFIER: endCall() called for: $callId');
    state = const AsyncValue.loading();

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ CALL ACTION NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ CALL ACTION NOTIFIER: Ending call...');
      final call = await _repo.endCall(
        callId: callId,
        complain: complain,
        comment: comment,
      );
      print('✅ CALL ACTION NOTIFIER: Call ended');
      state = AsyncValue.data(call);

      // Refresh queue after ending
      final queueNotifier = ref.read(callQueueProvider.notifier);
      await queueNotifier.refreshQueue();

      return call;
    } catch (e, st) {
      print('❌ CALL ACTION NOTIFIER: Failed to end call: $e');
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  void reset() {
    print('🔄 CALL ACTION NOTIFIER: reset() called');
    state = const AsyncValue.data(null);
  }
}