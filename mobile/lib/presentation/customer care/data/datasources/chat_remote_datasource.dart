import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/chat_model.dart';

class ChatRemoteDataSource {
  final Dio _dio;
  
  ChatRemoteDataSource() : _dio = ApiClient().dio;
  
  // ============================================================
  // GET/CREATE MY CONVERSATION
  // ============================================================
  Future<Chat> getMyChat() async {
    debugPrint('📤 CHAT API: GET /api/support/chats/mine');
    debugPrint('📤 CHAT API: Fetching my conversation...');

    try {
      final response = await _dio.get(ApiConstants.myChat);

      debugPrint('✅ CHAT API: Status: ${response.statusCode}');
      debugPrint('✅ CHAT API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<Chat>.fromJson(
          data,
          (jsonData) => Chat.fromJson(jsonData),
        );

        if (responseObj.data == null) {
          throw Exception('No conversation data returned');
        }

        debugPrint('✅ CHAT API: Retrieved my conversation (id: ${responseObj.data!.id})');
        return responseObj.data!;
      } else {
        debugPrint('❌ CHAT API: Error: ${response.statusCode}');
        throw Exception('Failed to load conversation: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CHAT API: Dio Error: ${e.message}');
      debugPrint('❌ CHAT API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CHAT API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }
  
  // ============================================================
  // GET CHAT COUNT
  // ============================================================
  Future<ChatCount> getChatCount() async {
    debugPrint('📤 CHAT API: GET /api/support/chats/count');
    debugPrint('📤 CHAT API: Fetching chat count...');
    
    try {
      final response = await _dio.get(ApiConstants.chatsCount);
      
      debugPrint('✅ CHAT API: Status: ${response.statusCode}');
      debugPrint('✅ CHAT API: Response: ${response.data}');
      
      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<ChatCount>.fromJson(
          data,
          (jsonData) => ChatCount.fromJson(jsonData),
        );
        
        debugPrint('✅ CHAT API: Chat count: ${responseObj.data?.toString()}');
        return responseObj.data ?? ChatCount(total: 0, unread: 0, active: 0, resolved: 0);
      } else {
        debugPrint('❌ CHAT API: Error: ${response.statusCode}');
        throw Exception('Failed to load chat count: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CHAT API: Dio Error: ${e.message}');
      debugPrint('❌ CHAT API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CHAT API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }
  
  // ============================================================
  // GET MY CHAT MESSAGES
  // ============================================================
  Future<List<Message>> getMyChatMessages() async {
    debugPrint('📤 CHAT API: GET /api/support/chats/mine/messages');
    debugPrint('📤 CHAT API: Fetching my chat history...');

    try {
      final response = await _dio.get(ApiConstants.myChatMessages);

      debugPrint('✅ CHAT API: Status: ${response.statusCode}');
      debugPrint('✅ CHAT API: Response: ${response.data}');
      
      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<Message>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData.map((item) => Message.fromJson(item)).toList();
            }
            return [];
          },
        );
        
        debugPrint('✅ CHAT API: Retrieved ${responseObj.data?.length ?? 0} messages');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ CHAT API: Error: ${response.statusCode}');
        throw Exception('Failed to load messages: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CHAT API: Dio Error: ${e.message}');
      debugPrint('❌ CHAT API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CHAT API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }
  
  // ============================================================
  // SEND MESSAGE (as the customer)
  // ============================================================
  Future<Message> sendMessage({
    required String message,
    String? attachmentUrl,
  }) async {
    debugPrint('📤 CHAT API: POST /api/support/chats/mine/messages');
    debugPrint('📤 CHAT API: Sending message: "$message"');
    debugPrint('📤 CHAT API: Attachment: ${attachmentUrl ?? 'none'}');

    try {
      final requestBody = {
        'message': message,
        'attachmentUrl': attachmentUrl,
      };

      debugPrint('📤 CHAT API: Request body: $requestBody');

      final response = await _dio.post(
        ApiConstants.myChatMessages,
        data: requestBody,
      );

      debugPrint('✅ CHAT API: Status: ${response.statusCode}');
      debugPrint('✅ CHAT API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<Message>.fromJson(
          data,
          (jsonData) => Message.fromJson(jsonData),
        );

        debugPrint('✅ CHAT API: Message sent successfully');
        return responseObj.data ?? Message(
          id: 0,
          chatId: 0,
          senderId: 0,
          senderType: 'customer',
          senderName: 'You',
          content: message,
          attachmentUrl: attachmentUrl,
          isRead: false,
          timestamp: DateTime.now(),
          status: 'sent',
        );
      } else {
        debugPrint('❌ CHAT API: Error: ${response.statusCode}');
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ CHAT API: Dio Error: ${e.message}');
      debugPrint('❌ CHAT API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ CHAT API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }
  
  // ============================================================
  // ERROR HANDLING
  // ============================================================
  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      debugPrint('❌ CHAT API: Error response data: $data');
      
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