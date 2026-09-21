import 'package:flutter/foundation.dart';
import '../datasources/email_remote_datasource.dart';
import '../models/email_model.dart';

class EmailRepository {
  final EmailRemoteDataSource _remoteDataSource;

  EmailRepository() : _remoteDataSource = EmailRemoteDataSource();

  // ============================================================
  // GET ALL EMAILS
  // ============================================================
  Future<List<EmailTicket>> getEmails({
    int page = 0,
    int size = 20,
  }) async {
    debugPrint('📦 EMAIL REPOSITORY: getEmails() called');
    debugPrint('📦 EMAIL REPOSITORY: Page: $page, Size: $size');
    try {
      final emails = await _remoteDataSource.getEmails(page: page, size: size);
      debugPrint('✅ EMAIL REPOSITORY: Retrieved ${emails.length} emails');
      return emails;
    } catch (e) {
      debugPrint('❌ EMAIL REPOSITORY: Failed to get emails: $e');
      rethrow;
    }
  }

  // ============================================================
  // GET EMAIL BY TICKET ID
  // ============================================================
  Future<EmailTicket> getEmailByTicketId(String ticketId) async {
    debugPrint('📦 EMAIL REPOSITORY: getEmailByTicketId() called for: $ticketId');
    try {
      final email = await _remoteDataSource.getEmailByTicketId(ticketId);
      debugPrint('✅ EMAIL REPOSITORY: Retrieved email ticket: ${email.ticketId}');
      return email;
    } catch (e) {
      debugPrint('❌ EMAIL REPOSITORY: Failed to get email ticket: $e');
      rethrow;
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
    debugPrint('📦 EMAIL REPOSITORY: sendEmailReply() called for ticket: $ticketId');
    debugPrint('📦 EMAIL REPOSITORY: Message: "$message"');

    try {
      final reply = await _remoteDataSource.sendEmailReply(
        ticketId: ticketId,
        message: message,
        attachments: attachments,
      );
      debugPrint('✅ EMAIL REPOSITORY: Reply sent successfully');
      return reply;
    } catch (e) {
      debugPrint('❌ EMAIL REPOSITORY: Failed to send reply: $e');
      rethrow;
    }
  }
}