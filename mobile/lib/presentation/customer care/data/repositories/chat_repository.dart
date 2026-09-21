import 'package:flutter/foundation.dart';
import '../datasources/chat_remote_datasource.dart';
import '../models/chat_model.dart';

class ChatRepository {
  final ChatRemoteDataSource _remoteDataSource;
  
  ChatRepository() : _remoteDataSource = ChatRemoteDataSource();
  
  // ============================================================
  // GET/CREATE MY CONVERSATION
  // ============================================================
  Future<Chat> getMyChat() async {
    debugPrint('📦 CHAT REPOSITORY: getMyChat() called');
    try {
      final chat = await _remoteDataSource.getMyChat();
      debugPrint('✅ CHAT REPOSITORY: Retrieved my conversation (id: ${chat.id})');
      return chat;
    } catch (e) {
      debugPrint('❌ CHAT REPOSITORY: Failed to get my conversation: $e');
      rethrow;
    }
  }
  
  // ============================================================
  // GET CHAT COUNT
  // ============================================================
  Future<ChatCount> getChatCount() async {
    debugPrint('📦 CHAT REPOSITORY: getChatCount() called');
    try {
      final count = await _remoteDataSource.getChatCount();
      debugPrint('✅ CHAT REPOSITORY: Chat count: ${count.toString()}');
      return count;
    } catch (e) {
      debugPrint('❌ CHAT REPOSITORY: Failed to get chat count: $e');
      rethrow;
    }
  }
  
  // ============================================================
  // GET MY CHAT MESSAGES
  // ============================================================
  Future<List<Message>> getMyChatMessages() async {
    debugPrint('📦 CHAT REPOSITORY: getMyChatMessages() called');
    try {
      final messages = await _remoteDataSource.getMyChatMessages();
      debugPrint('✅ CHAT REPOSITORY: Retrieved ${messages.length} messages');
      return messages;
    } catch (e) {
      debugPrint('❌ CHAT REPOSITORY: Failed to get chat messages: $e');
      rethrow;
    }
  }

  // ============================================================
  // SEND MESSAGE (as the customer)
  // ============================================================
  Future<Message> sendMessage({
    required String message,
    String? attachmentUrl,
  }) async {
    debugPrint('📦 CHAT REPOSITORY: sendMessage() called');
    debugPrint('📦 CHAT REPOSITORY: Message: "$message"');

    try {
      final sentMessage = await _remoteDataSource.sendMessage(
        message: message,
        attachmentUrl: attachmentUrl,
      );
      debugPrint('✅ CHAT REPOSITORY: Message sent successfully');
      return sentMessage;
    } catch (e) {
      debugPrint('❌ CHAT REPOSITORY: Failed to send message: $e');
      rethrow;
    }
  }
}