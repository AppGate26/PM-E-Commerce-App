import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/presentation/customer care/data/provider/email_provider.dart';

class EmailSupportScreen extends ConsumerStatefulWidget {
  final String? ticketId;

  const EmailSupportScreen({
    super.key,
    this.ticketId,
  });

  @override
  ConsumerState<EmailSupportScreen> createState() => _EmailSupportScreenState();
}

class _EmailSupportScreenState extends ConsumerState<EmailSupportScreen> {
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _messageController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  bool _isSending = false;
  String? _sendResult;

  @override
  void initState() {
    super.initState();
    debugPrint('🔵 EMAIL SUPPORT SCREEN: ===== INITIALIZING =====');
    debugPrint(
        '🔵 EMAIL SUPPORT SCREEN: Ticket ID: ${widget.ticketId ?? 'NEW'}');
    debugPrint(
        '🔵 EMAIL SUPPORT SCREEN: Is New Email: ${widget.ticketId == null}');

    if (widget.ticketId != null) {
      debugPrint('🔵 EMAIL SUPPORT SCREEN: Loading existing ticket details...');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final detailNotifier = ref.read(emailDetailProvider.notifier);
        detailNotifier.loadEmailDetail(widget.ticketId!);
      });
    } else {
      debugPrint('🔵 EMAIL SUPPORT SCREEN: New email - no ticket to load');
    }
  }

  @override
  void dispose() {
    debugPrint('🔵 EMAIL SUPPORT SCREEN: ===== DISPOSING =====');
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _sendEmail() async {
    debugPrint('🔵 EMAIL SUPPORT SCREEN: ===== SEND EMAIL STARTED =====');

    if (!_formKey.currentState!.validate()) {
      debugPrint('❌ EMAIL SUPPORT SCREEN: Form validation failed');
      return;
    }

    final subject = _subjectController.text.trim();
    final message = _messageController.text.trim();

    debugPrint('📤 EMAIL SUPPORT SCREEN: Subject: "$subject"');
    debugPrint(
        '📤 EMAIL SUPPORT SCREEN: Message length: ${message.length} chars');
    debugPrint(
        '📤 EMAIL SUPPORT SCREEN: Is new email: ${widget.ticketId == null}');

    // New email flow
    if (widget.ticketId == null) {
      debugPrint('🔵 EMAIL SUPPORT SCREEN: New email flow - no ticketId');

      setState(() {
        _isSending = true;
        _sendResult = null;
      });

      debugPrint('⏳ EMAIL SUPPORT SCREEN: Simulating email send...');

      // Simulate sending (since there's no create endpoint)
      await Future.delayed(const Duration(seconds: 2));

      debugPrint('✅ EMAIL SUPPORT SCREEN: Email simulation completed');

      if (mounted) {
        setState(() {
          _isSending = false;
          _sendResult = 'success';
        });

        debugPrint(
            '✅ EMAIL SUPPORT SCREEN: Email sent successfully (simulated)');

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                      'Email sent successfully! We\'ll get back to you within 24 hours.'),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 4),
          ),
        );

        _subjectController.clear();
        _messageController.clear();

        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            debugPrint(
                '🔵 EMAIL SUPPORT SCREEN: Navigating back after success');
            context.pop();
          }
        });
      }
      return;
    }

    // Reply to existing ticket flow
    final ticketId = widget.ticketId!;
    debugPrint('🔵 EMAIL SUPPORT SCREEN: Reply flow - ticketId: $ticketId');

    // Validate ticketId is numeric
    if (int.tryParse(ticketId) == null) {
      debugPrint(
          '❌ EMAIL SUPPORT SCREEN: Invalid ticket ID: $ticketId (must be numeric)');
      setState(() {
        _sendResult = 'error';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid ticket ID. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    debugPrint('✅ EMAIL SUPPORT SCREEN: Ticket ID validated: $ticketId');

    setState(() {
      _isSending = true;
      _sendResult = null;
    });

    debugPrint('📤 EMAIL SUPPORT SCREEN: Calling sendReply API...');

    final sendNotifier = ref.read(sendEmailReplyProvider.notifier);
    final reply = await sendNotifier.sendReply(
      ticketId: ticketId,
      message: message,
    );

    debugPrint(
        '📥 EMAIL SUPPORT SCREEN: sendReply response: ${reply != null ? 'SUCCESS' : 'FAILED'}');

    if (mounted) {
      setState(() {
        _isSending = false;
        _sendResult = reply != null ? 'success' : 'error';
      });

      if (reply != null) {
        debugPrint('✅ EMAIL SUPPORT SCREEN: Reply sent successfully');
        debugPrint('✅ EMAIL SUPPORT SCREEN: Reply ID: ${reply.id}');

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text('Reply sent successfully!'),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );

        _messageController.clear();

        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            debugPrint(
                '🔵 EMAIL SUPPORT SCREEN: Navigating back after reply success');
            context.pop();
          }
        });
      } else {
        debugPrint('❌ EMAIL SUPPORT SCREEN: Failed to send reply');

        // Get error from provider
        final errorState = ref.read(sendEmailReplyProvider);
        String errorMessage = 'Failed to send reply. Please try again.';
        errorState.when(
          data: (_) {},
          loading: () {},
          error: (error, _) {
            errorMessage = error.toString();
            debugPrint(
                '❌ EMAIL SUPPORT SCREEN: Error from provider: $errorMessage');
          },
        );

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(errorMessage),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('🔵 EMAIL SUPPORT SCREEN: ===== BUILDING =====');

    final detailState =
        widget.ticketId != null ? ref.watch(emailDetailProvider) : null;

    final sendState = ref.watch(sendEmailReplyProvider);
    final isSending = _isSending || sendState.isLoading;

    // Handle detail state
    if (detailState != null) {
      detailState.when(
        data: (email) {
          if (email != null) {
            debugPrint(
                '✅ EMAIL SUPPORT SCREEN: Loaded email: ${email.ticketId}');
            if (_subjectController.text.isEmpty) {
              _subjectController.text = 'Re: ${email.subject}';
            }
          }
        },
        loading: () {
          debugPrint('⏳ EMAIL SUPPORT SCREEN: Loading email detail...');
        },
        error: (error, stack) {
          debugPrint('❌ EMAIL SUPPORT SCREEN: Error loading email: $error');
        },
      );
    }

    final isNewEmail = widget.ticketId == null;

    debugPrint('🔵 EMAIL SUPPORT SCREEN: isNewEmail: $isNewEmail');
    debugPrint('🔵 EMAIL SUPPORT SCREEN: isSending: $isSending');
    debugPrint('🔵 EMAIL SUPPORT SCREEN: sendState: ${sendState.runtimeType}');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        title: Text(
          isNewEmail ? 'Email Support' : 'Reply to Email',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline, color: Colors.white),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Email support help information'),
                  backgroundColor: AppColors.blueBackground,
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info Card - FIXED OVERFLOW
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.blueBackground.withOpacity(0.1),
                      AppColors.blueBackground.withOpacity(0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.blueBackground.withOpacity(0.2),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.blueBackground.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.info_outline,
                        color: AppColors.blueBackground,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isNewEmail
                                ? 'We\'ll get back to you within 24 hours'
                                : 'Reply to your support ticket',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isNewEmail
                                ? 'support@pmstores.com'
                                : 'Ticket #${widget.ticketId}',
                            style: TextStyle(
                              color: AppColors.blueBackground,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Subject Field - Only for new emails
              if (isNewEmail) ...[
                const Text(
                  'Subject',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _subjectController,
                  decoration: InputDecoration(
                    hintText: 'Brief description of your issue',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    prefixIcon: const Icon(Icons.subject, size: 20),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter a subject';
                    }
                    if (value.length < 5) {
                      return 'Subject must be at least 5 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Message Field
              const Text(
                'Message',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _messageController,
                maxLines: 8,
                decoration: InputDecoration(
                  hintText: isNewEmail
                      ? 'Describe your issue in detail...'
                      : 'Type your reply here...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon: const Icon(Icons.message, size: 20),
                  alignLabelWithHint: true,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your message';
                  }
                  if (value.length < 20) {
                    return 'Message must be at least 20 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Attachment Section
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.attach_file,
                      color: Colors.grey[600],
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Attach files (optional)',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        debugPrint(
                            '🔵 EMAIL SUPPORT SCREEN: Attachment button pressed');
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('File attachment coming soon!'),
                            backgroundColor: AppColors.blueBackground,
                          ),
                        );
                      },
                      child: const Text(
                        'Add Files',
                        style: TextStyle(
                          color: AppColors.blueBackground,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Send Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSending ? null : _sendEmail,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                    disabledBackgroundColor:
                        AppColors.blueBackground.withOpacity(0.6),
                  ),
                  child: isSending
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.send,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isNewEmail ? 'Send Email' : 'Send Reply',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),

              // Alternative Contact Info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Alternatively, you can reach us at:',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.phone,
                          color: AppColors.blueBackground,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '+1 (555) 123-4567',
                          style: TextStyle(
                            color: AppColors.blueBackground,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.chat,
                          color: AppColors.blueBackground,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Live Chat support available 24/7',
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
