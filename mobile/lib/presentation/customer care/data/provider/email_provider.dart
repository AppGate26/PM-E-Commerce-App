import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import '../models/email_model.dart';
import '../repositories/email_repository.dart';

// ============================================================
// PROVIDER DEFINITIONS
// ============================================================
final emailRepositoryProvider = Provider<EmailRepository>((ref) {
  print('🔄 EMAIL PROVIDER: emailRepositoryProvider created');
  return EmailRepository ();
});

// ============================================================
// EMAIL LIST PROVIDER
// ============================================================
final emailListProvider = NotifierProvider<EmailListNotifier, AsyncValue<List<EmailTicket>>>(() {
  return EmailListNotifier();
});

// ============================================================
// EMAIL DETAIL PROVIDER
// ============================================================
final emailDetailProvider = NotifierProvider<EmailDetailNotifier, AsyncValue<EmailTicket?>>(() {
  return EmailDetailNotifier();
});

// ============================================================
// SEND EMAIL REPLY PROVIDER
// ============================================================
final sendEmailReplyProvider = NotifierProvider<SendEmailReplyNotifier, AsyncValue<EmailReply?>>(() {
  return SendEmailReplyNotifier();
});

// ============================================================
// EMAIL LIST NOTIFIER
// ============================================================
class EmailListNotifier extends Notifier<AsyncValue<List<EmailTicket>>> {
  int _currentPage = 0;
  bool _hasMore = true;
  List<EmailTicket> _allEmails = [];

  @override
  AsyncValue<List<EmailTicket>> build() {
    print('🔄 EMAIL LIST NOTIFIER: Initialized');
    Future.microtask(() => fetchEmails());
    return const AsyncValue.loading();
  }

  EmailRepository get _repo => ref.read(emailRepositoryProvider);

  Future<void> fetchEmails({int page = 0, int size = 20}) async {
    print('🔄 EMAIL LIST NOTIFIER: fetchEmails() called');
    print('📤 EMAIL LIST NOTIFIER: Page: $page, Size: $size');

    if (page == 0) {
      state = const AsyncValue.loading();
      _allEmails = [];
    }

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ EMAIL LIST NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ EMAIL LIST NOTIFIER: User authenticated, fetching emails');
      final emails = await _repo.getEmails(page: page, size: size);
      print('✅ EMAIL LIST NOTIFIER: Loaded ${emails.length} emails');

      if (page == 0) {
        _allEmails = emails;
      } else {
        _allEmails.addAll(emails);
      }

      _currentPage = page;
      _hasMore = emails.length == size;

      state = AsyncValue.data(_allEmails);
      print('📊 EMAIL LIST NOTIFIER: Total emails: ${_allEmails.length}, Has more: $_hasMore');
    } catch (e, st) {
      print('❌ EMAIL LIST NOTIFIER: Failed to load emails: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshEmails() async {
    print('🔄 EMAIL LIST NOTIFIER: refreshEmails() called');
    _currentPage = 0;
    _hasMore = true;
    await fetchEmails(page: 0);
  }

  Future<void> loadMoreEmails() async {
    print('🔄 EMAIL LIST NOTIFIER: loadMoreEmails() called');
    if (!_hasMore || state.isLoading) {
      print('ℹ️ EMAIL LIST NOTIFIER: No more emails to load or already loading');
      return;
    }
    await fetchEmails(page: _currentPage + 1);
  }

  bool get hasMore => _hasMore;
  int get currentPage => _currentPage;
}

// ============================================================
// EMAIL DETAIL NOTIFIER
// ============================================================
class EmailDetailNotifier extends Notifier<AsyncValue<EmailTicket?>> {
  String? _currentTicketId;

  @override
  AsyncValue<EmailTicket?> build() {
    print('🔄 EMAIL DETAIL NOTIFIER: Initialized');
    return const AsyncValue.data(null);
  }

  EmailRepository get _repo => ref.read(emailRepositoryProvider);

  Future<void> loadEmailDetail(String ticketId) async {
    print('🔄 EMAIL DETAIL NOTIFIER: loadEmailDetail() called for: $ticketId');
    _currentTicketId = ticketId;
    state = const AsyncValue.loading();

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ EMAIL DETAIL NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ EMAIL DETAIL NOTIFIER: Fetching email detail for $ticketId');
      final email = await _repo.getEmailByTicketId(ticketId);
      print('✅ EMAIL DETAIL NOTIFIER: Loaded email: ${email.ticketId}');
      state = AsyncValue.data(email);
    } catch (e, st) {
      print('❌ EMAIL DETAIL NOTIFIER: Failed to load email detail: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshDetail() async {
    print('🔄 EMAIL DETAIL NOTIFIER: refreshDetail() called');
    if (_currentTicketId != null) {
      await loadEmailDetail(_currentTicketId!);
    } else {
      print('⚠️ EMAIL DETAIL NOTIFIER: No ticket ID to refresh');
    }
  }

  void clearDetail() {
    print('🔄 EMAIL DETAIL NOTIFIER: clearDetail() called');
    _currentTicketId = null;
    state = const AsyncValue.data(null);
  }

  String? getCurrentTicketId() => _currentTicketId;
}

// ============================================================
// SEND EMAIL REPLY NOTIFIER
// ============================================================
class SendEmailReplyNotifier extends Notifier<AsyncValue<EmailReply?>> {
  @override
  AsyncValue<EmailReply?> build() {
    print('🔄 SEND EMAIL REPLY NOTIFIER: Initialized');
    return const AsyncValue.data(null);
  }

  EmailRepository get _repo => ref.read(emailRepositoryProvider);

  Future<EmailReply?> sendReply({
    required String ticketId,
    required String message,
    List<String> attachments = const [],
  }) async {
    print('🔄 SEND EMAIL REPLY NOTIFIER: sendReply() called');
    print('📤 SEND EMAIL REPLY NOTIFIER: Ticket ID: $ticketId');
    print('📤 SEND EMAIL REPLY NOTIFIER: Message: "$message"');
    print('📤 SEND EMAIL REPLY NOTIFIER: Attachments: ${attachments.length}');

    state = const AsyncValue.loading();

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ SEND EMAIL REPLY NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      if (message.trim().isEmpty) {
        print('❌ SEND EMAIL REPLY NOTIFIER: Empty message');
        throw 'Message cannot be empty';
      }

      print('✅ SEND EMAIL REPLY NOTIFIER: Sending reply...');
      final reply = await _repo.sendEmailReply(
        ticketId: ticketId,
        message: message.trim(),
        attachments: attachments,
      );

      print('✅ SEND EMAIL REPLY NOTIFIER: Reply sent successfully');
      state = AsyncValue.data(reply);

      // Refresh email detail after sending reply
      final detailNotifier = ref.read(emailDetailProvider.notifier);
      await detailNotifier.loadEmailDetail(ticketId);

      return reply;
    } catch (e, st) {
      print('❌ SEND EMAIL REPLY NOTIFIER: Failed to send reply: $e');
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  void reset() {
    print('🔄 SEND EMAIL REPLY NOTIFIER: reset() called');
    state = const AsyncValue.data(null);
  }
}