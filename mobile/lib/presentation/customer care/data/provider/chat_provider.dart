import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import '../models/chat_model.dart';
import '../repositories/chat_repository.dart';

// ============================================================
// PROVIDER DEFINITIONS
// ============================================================
final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  print('🔄 CHAT PROVIDER: chatRepositoryProvider created');
  return ChatRepository();
});

// ============================================================
// MY CHAT PROVIDER (get/create my conversation)
// ============================================================
final myChatProvider = NotifierProvider<MyChatNotifier, AsyncValue<Chat>>(() {
  return MyChatNotifier();
});

// ============================================================
// CHAT MESSAGES PROVIDER
// ============================================================
final chatMessagesProvider = NotifierProvider<ChatMessagesNotifier, AsyncValue<List<Message>>>(() {
  return ChatMessagesNotifier();
});

// ============================================================
// CHAT COUNT PROVIDER
// ============================================================
final chatCountProvider = NotifierProvider<ChatCountNotifier, AsyncValue<ChatCount>>(() {
  return ChatCountNotifier();
});

// ============================================================
// SEND MESSAGE PROVIDER
// ============================================================
final sendMessageProvider = NotifierProvider<SendMessageNotifier, AsyncValue<Message?>>(() {
  return SendMessageNotifier();
});

// ============================================================
// MY CHAT NOTIFIER (get/create my conversation)
// ============================================================
class MyChatNotifier extends Notifier<AsyncValue<Chat>> {
  @override
  AsyncValue<Chat> build() {
    print('🔄 MY CHAT NOTIFIER: Initialized');
    Future.microtask(() => fetchMyChat());
    return const AsyncValue.loading();
  }

  ChatRepository get _repo => ref.read(chatRepositoryProvider);

  Future<void> fetchMyChat() async {
    print('🔄 MY CHAT NOTIFIER: fetchMyChat() called');
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ MY CHAT NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ MY CHAT NOTIFIER: User authenticated, fetching conversation');
      final chat = await _repo.getMyChat();
      print('✅ MY CHAT NOTIFIER: Loaded conversation (id: ${chat.id})');
      state = AsyncValue.data(chat);
    } catch (e, st) {
      print('❌ MY CHAT NOTIFIER: Failed to load conversation: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshMyChat() async {
    print('🔄 MY CHAT NOTIFIER: refreshMyChat() called');
    await fetchMyChat();
  }
}

// ============================================================
// CHAT MESSAGES NOTIFIER
// ============================================================
class ChatMessagesNotifier extends Notifier<AsyncValue<List<Message>>> {
  @override
  AsyncValue<List<Message>> build() {
    print('🔄 CHAT MESSAGES NOTIFIER: Initialized');
    return const AsyncValue.data([]);
  }

  ChatRepository get _repo => ref.read(chatRepositoryProvider);

  Future<void> loadMessages() async {
    print('🔄 CHAT MESSAGES NOTIFIER: loadMessages() called');
    state = const AsyncValue.loading();

    try {
      final authState = ref.read(authProvider);
      final user = authState.value;

      if (user == null || user.id == 0) {
        print('❌ CHAT MESSAGES NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      print('✅ CHAT MESSAGES NOTIFIER: Fetching my chat history');
      final messages = await _repo.getMyChatMessages();
      print('✅ CHAT MESSAGES NOTIFIER: Loaded ${messages.length} messages');
      state = AsyncValue.data(messages);
    } catch (e, st) {
      print('❌ CHAT MESSAGES NOTIFIER: Failed to load messages: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshMessages() async {
    print('🔄 CHAT MESSAGES NOTIFIER: refreshMessages() called');
    await loadMessages();
  }

  void clearMessages() {
    print('🔄 CHAT MESSAGES NOTIFIER: clearMessages() called');
    state = const AsyncValue.data([]);
  }
}

// ============================================================
// CHAT COUNT NOTIFIER
// ============================================================
class ChatCountNotifier extends Notifier<AsyncValue<ChatCount>> {
  @override
  AsyncValue<ChatCount> build() {
    print('🔄 CHAT COUNT NOTIFIER: Initialized');
    Future.microtask(() => fetchChatCount());
    return const AsyncValue.loading();
  }

  ChatRepository get _repo => ref.read(chatRepositoryProvider);

  Future<void> fetchChatCount() async {
    print('🔄 CHAT COUNT NOTIFIER: fetchChatCount() called');
    state = const AsyncValue.loading();
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        print('❌ CHAT COUNT NOTIFIER: User not authenticated');
        state = AsyncValue.data(ChatCount(total: 0, unread: 0, active: 0, resolved: 0));
        return;
      }

      final count = await _repo.getChatCount();
      print('✅ CHAT COUNT NOTIFIER: Loaded chat count: ${count.toString()}');
      state = AsyncValue.data(count);
    } catch (e, st) {
      print('❌ CHAT COUNT NOTIFIER: Failed to load chat count: $e');
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshCount() async {
    print('🔄 CHAT COUNT NOTIFIER: refreshCount() called');
    await fetchChatCount();
  }
}

// ============================================================
// SEND MESSAGE NOTIFIER
// ============================================================
class SendMessageNotifier extends Notifier<AsyncValue<Message?>> {
  @override
  AsyncValue<Message?> build() {
    print('🔄 SEND MESSAGE NOTIFIER: Initialized');
    return const AsyncValue.data(null);
  }

  ChatRepository get _repo => ref.read(chatRepositoryProvider);

  Future<Message?> sendMessage({
    required String message,
    String? attachmentUrl,
  }) async {
    print('🔄 SEND MESSAGE NOTIFIER: sendMessage() called');
    print('📤 SEND MESSAGE NOTIFIER: Message: "$message"');
    print('📤 SEND MESSAGE NOTIFIER: Attachment: ${attachmentUrl ?? 'none'}');
    
    state = const AsyncValue.loading();
    
    try {
      final authState = ref.read(authProvider);
      final user = authState.value;
      
      if (user == null || user.id == 0) {
        print('❌ SEND MESSAGE NOTIFIER: User not authenticated');
        throw 'User not authenticated';
      }

      if (message.trim().isEmpty && (attachmentUrl == null || attachmentUrl.isEmpty)) {
        print('❌ SEND MESSAGE NOTIFIER: Empty message');
        throw 'Message cannot be empty';
      }

      print('✅ SEND MESSAGE NOTIFIER: Sending message...');
      final sentMessage = await _repo.sendMessage(
        message: message.trim(),
        attachmentUrl: attachmentUrl,
      );

      print('✅ SEND MESSAGE NOTIFIER: Message sent successfully');
      state = AsyncValue.data(sentMessage);

      // Refresh messages after sending
      final messagesNotifier = ref.read(chatMessagesProvider.notifier);
      await messagesNotifier.loadMessages();
      
      // Refresh chat count
      final countNotifier = ref.read(chatCountProvider.notifier);
      await countNotifier.fetchChatCount();
      
      return sentMessage;
    } catch (e, st) {
      print('❌ SEND MESSAGE NOTIFIER: Failed to send message: $e');
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  void reset() {
    print('🔄 SEND MESSAGE NOTIFIER: reset() called');
    state = const AsyncValue.data(null);
  }
}