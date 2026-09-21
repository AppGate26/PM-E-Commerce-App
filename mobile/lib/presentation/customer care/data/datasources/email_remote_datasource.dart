import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/models/chat_model.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/networks/api_client.dart';
import '../models/email_model.dart';

class EmailRemoteDataSource {
  final Dio _dio;

  EmailRemoteDataSource() : _dio = ApiClient().dio;

  // ============================================================
  // GET ALL EMAILS (Paginated)
  // ============================================================
  Future<List<EmailTicket>> getEmails({
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📤 EMAIL API: GET /api/support/emails?page=$page&size=$size');
    debugPrint('📤 EMAIL API: Fetching emails...');

    try {
      final response = await _dio.get(
        ApiConstants.supportEmails,
        queryParameters: {
          'page': page,
          'size': size,
        },
      );

      debugPrint('✅ EMAIL API: Status: ${response.statusCode}');
      debugPrint('✅ EMAIL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<List<EmailTicket>>.fromJson(
          data,
          (jsonData) {
            if (jsonData is List) {
              return jsonData
                  .map((item) => EmailTicket.fromJson(item))
                  .toList();
            }
            return [];
          },
        );

        debugPrint(
            '✅ EMAIL API: Retrieved ${responseObj.data?.length ?? 0} emails');
        return responseObj.data ?? [];
      } else {
        debugPrint('❌ EMAIL API: Error: ${response.statusCode}');
        throw Exception('Failed to load emails: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ EMAIL API: Dio Error: ${e.message}');
      debugPrint('❌ EMAIL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ EMAIL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // GET EMAIL BY TICKET ID
  // ============================================================
  Future<EmailTicket> getEmailByTicketId(String ticketId) async {
    debugPrint('📤 EMAIL API: GET /api/support/emails/$ticketId');
    debugPrint('📤 EMAIL API: Fetching email ticket: $ticketId');

    try {
      final response = await _dio.get(
        ApiConstants.supportEmailById(ticketId),
      );

      debugPrint('✅ EMAIL API: Status: ${response.statusCode}');
      debugPrint('✅ EMAIL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<EmailTicket>.fromJson(
          data,
          (jsonData) => EmailTicket.fromJson(jsonData),
        );

        debugPrint(
            '✅ EMAIL API: Retrieved email ticket: ${responseObj.data?.ticketId}');
        return responseObj.data ??
            EmailTicket(
              id: 0,
              ticketId: '',
              subject: '',
              message: '',
              customerName: '',
              customerEmail: '',
              status: 'open',
              priority: 'medium',
              createdAt: DateTime.now(),
            );
      } else {
        debugPrint('❌ EMAIL API: Error: ${response.statusCode}');
        throw Exception('Failed to load email ticket: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ EMAIL API: Dio Error: ${e.message}');
      debugPrint('❌ EMAIL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ EMAIL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // SEND EMAIL REPLY
  // ============================================================
  Future<EmailReply> sendEmailReply({
    required String ticketId,
    required String message,
    List<String> attachments = const [],
  }) async {
    debugPrint('📤 EMAIL API: POST /api/support/emails/$ticketId/reply');
    debugPrint('📤 EMAIL API: Sending reply for ticket: $ticketId');
    debugPrint('📤 EMAIL API: Message: "$message"');
    debugPrint('📤 EMAIL API: Attachments: ${attachments.length}');

    try {
      final requestBody = SendEmailReplyRequest(
        message: message,
        attachments: attachments,
      );

      debugPrint('📤 EMAIL API: Request body: ${requestBody.toJson()}');

      final response = await _dio.post(
        ApiConstants.supportEmailReply(ticketId),
        data: requestBody.toJson(),
      );

      debugPrint('✅ EMAIL API: Status: ${response.statusCode}');
      debugPrint('✅ EMAIL API: Response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        final responseObj = SupportApiResponse<EmailReply>.fromJson(
          data,
          (jsonData) => EmailReply.fromJson(jsonData),
        );

        debugPrint('✅ EMAIL API: Reply sent successfully');
        return responseObj.data ??
            EmailReply(
              id: 0,
              ticketId: int.tryParse(ticketId) ?? 0,
              message: message,
              senderName: 'You',
              senderEmail: '',
              senderType: 'customer',
              attachments: attachments,
              createdAt: DateTime.now(),
              isRead: true,
            );
      } else {
        debugPrint('❌ EMAIL API: Error: ${response.statusCode}');
        throw Exception('Failed to send reply: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('❌ EMAIL API: Dio Error: ${e.message}');
      debugPrint('❌ EMAIL API: Response: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      debugPrint('❌ EMAIL API: Unexpected Error: $e');
      throw Exception('An unexpected error occurred');
    }
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================
  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      debugPrint('❌ EMAIL API: Error response data: $data');

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
