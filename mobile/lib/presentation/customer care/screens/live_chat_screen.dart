import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/models/chat_model.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/provider/chat_provider.dart';

class LiveChatScreen extends ConsumerStatefulWidget {
  const LiveChatScreen({super.key});

  @override
  ConsumerState<LiveChatScreen> createState() => _LiveChatScreenState();
}

class _LiveChatScreenState extends ConsumerState<LiveChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeChat();
    });
  }

  Future<void> _initializeChat() async {
    final myChatNotifier = ref.read(myChatProvider.notifier);
    await myChatNotifier.fetchMyChat();

    final myChatState = ref.read(myChatProvider);
    myChatState.when(
      data: (_) {
        _loadMessages();
        setState(() => _isLoading = false);
      },
      error: (_, __) => setState(() => _isLoading = false),
      loading: () {},
    );

    _loadChatCount();
  }

  void _loadMessages() {
    ref.read(chatMessagesProvider.notifier).loadMessages();
  }

  void _loadChatCount() {
    ref.read(chatCountProvider.notifier).fetchChatCount();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final sendNotifier = ref.read(sendMessageProvider.notifier);
    sendNotifier
        .sendMessage(message: text)
        .then((sentMessage) {
      if (sentMessage == null) {
        _showSnackBar('Failed to send message. Please try again.', Colors.red);
        return;
      }
      _messageController.clear();
      _focusNode.unfocus();
      Future.delayed(const Duration(milliseconds: 150), _scrollToBottom);
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _showSnackBar(String message, Color backgroundColor) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(12),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messagesState = ref.watch(chatMessagesProvider);
    final sendState = ref.watch(sendMessageProvider);
    final countState = ref.watch(chatCountProvider);

    List<Message> messages = [];
    bool isLoadingMessages = false;
    String? errorMessage;

    messagesState.when(
      data: (data) => messages = data,
      loading: () => isLoadingMessages = true,
      error: (error, _) => errorMessage = error.toString(),
    );

    int unreadCount = 0;
    countState.when(
      data: (data) => unreadCount = data.unread,
      loading: () {},
      error: (_, __) {},
    );

    final isSending = sendState.isLoading;
    final hasMessages = messages.isNotEmpty;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: _buildAppBar(unreadCount),
      body: Column(
        children: [
          if (errorMessage != null && !_isLoading)
            _buildErrorBanner(errorMessage!),
          Expanded(
            child: _buildChatContent(
              messages: messages,
              isLoadingMessages: isLoadingMessages,
              hasMessages: hasMessages,
              isSending: isSending,
            ),
          ),
          _buildMessageInput(isSending),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(int unreadCount) {
    return AppBar(
      backgroundColor: AppColors.blueBackground,
      elevation: 0,
      toolbarHeight: 60,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
        onPressed: () => context.pop(),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.support_agent,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Live Chat',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              Text(
                _isLoading
                    ? 'Connecting...'
                    : 'Online • Typically replies in 2 min',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 9,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white, size: 22),
          onPressed: () {
            setState(() => _isLoading = true);
            _initializeChat();
          },
        ),
        Stack(
          alignment: Alignment.topRight,
          children: [
            IconButton(
              icon: const Icon(Icons.more_vert, color: Colors.white, size: 22),
              onPressed: () {},
            ),
            if (unreadCount > 0)
              Container(
                margin: const EdgeInsets.only(right: 4, top: 4),
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                child: Text(
                  unreadCount > 99 ? '99+' : unreadCount.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildErrorBanner(String errorMessage) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: Colors.red.shade50,
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red[700], size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              errorMessage,
              style: TextStyle(color: Colors.red[700], fontSize: 13),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          GestureDetector(
            onTap: () {
              setState(() => _isLoading = true);
              _initializeChat();
            },
            child: Icon(Icons.refresh, color: Colors.red[700], size: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildChatContent({
    required List<Message> messages,
    required bool isLoadingMessages,
    required bool hasMessages,
    required bool isSending,
  }) {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.blueBackground),
            SizedBox(height: 16),
            Text('Loading chat...', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    if (isLoadingMessages && messages.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.blueBackground),
            SizedBox(height: 16),
            Text('Loading messages...', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    if (!hasMessages) {
      return _buildEmptyState();
    }

    // Build a flat render list that interleaves date separators between
    // messages sent on different days — purely presentational, the
    // underlying `messages` list/order from the provider is untouched.
    final items = _buildRenderItems(messages, isSending);

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      itemCount: items.length,
      itemBuilder: (context, index) => items[index],
    );
  }

  /// Interleaves `_DateSeparator` widgets and the trailing typing indicator
  /// into the message list without mutating `messages` itself.
  List<Widget> _buildRenderItems(List<Message> messages, bool isSending) {
    final items = <Widget>[];
    DateTime? lastDate;

    for (final message in messages) {
      final messageDate = DateTime(
        message.timestamp.year,
        message.timestamp.month,
        message.timestamp.day,
      );
      if (lastDate == null || messageDate != lastDate) {
        items.add(_DateSeparator(date: messageDate));
        lastDate = messageDate;
      }

      final isFromUser = message.senderType == 'customer';
      final isSystem = message.senderType == 'system';
      items.add(_ChatBubble(
        message: message,
        isFromUser: isFromUser,
        isSystem: isSystem,
      ));
    }

    if (isSending) {
      items.add(const _TypingIndicator());
    }

    return items;
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.lightBlueBackground,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline,
                size: 48,
                color: AppColors.blueBackground.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Start a Conversation',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Our support team is ready to help',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.blueBackground.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: AppColors.blueBackground,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Type a message to get started',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.blueBackground,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            // Add some quick reply suggestions
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _buildQuickChip('I need help with my order'),
                _buildQuickChip('I have a complaint'),
                _buildQuickChip('I want to make a return'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickChip(String text) {
    return ActionChip(
      label: Text(
        text,
        style: const TextStyle(fontSize: 12),
      ),
      backgroundColor: Colors.white,
      side: BorderSide(color: AppColors.blueBackground.withOpacity(0.3)),
      onPressed: () {
        _messageController.text = text;
        _sendMessage();
      },
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
    );
  }

  Widget _buildMessageInput(bool isSending) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Attachment button
          Material(
            color: Colors.transparent,
            child: IconButton(
              icon: Icon(Icons.attach_file, color: Colors.grey[600], size: 22),
              onPressed: () {
                _showSnackBar(
                    'File attachment coming soon!', AppColors.blueBackground);
              },
              padding: const EdgeInsets.all(6),
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            ),
          ),
          // Message input
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.lightBackground,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade300, width: 1),
              ),
              child: TextField(
                controller: _messageController,
                focusNode: _focusNode,
                decoration: const InputDecoration(
                  hintText: 'Type your message...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 10),
                ),
                onSubmitted: (_) => _sendMessage(),
                enabled: !isSending,
                textInputAction: TextInputAction.send,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Send button
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: isSending ? null : _sendMessage,
              borderRadius: BorderRadius.circular(30),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color:
                      isSending ? Colors.grey[400] : AppColors.blueBackground,
                  shape: BoxShape.circle,
                ),
                child: isSending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(
                        Icons.send,
                        color: Colors.white,
                        size: 20,
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// DATE SEPARATOR — "Today" / "Yesterday" / formatted date, shown
// whenever a message's calendar day differs from the previous one.
// ============================================================
class _DateSeparator extends StatelessWidget {
  final DateTime date;

  const _DateSeparator({required this.date});

  String get _label {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    if (date == today) return 'Today';
    if (date == yesterday) return 'Yesterday';
    return DateFormat('MMM d, yyyy').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================
// PROFESSIONAL CHAT BUBBLE
//
// Sender identification, at a glance, comes from THREE consistent signals
// stacked together (never relying on just one):
//   1. Side of the screen (user = right, admin/system = left) — unchanged.
//   2. A small sender-label chip directly above every bubble ("You" for
//      the user, the agent's name for admin, "System" for system) — this
//      is the new addition the PM asked for.
//   3. Bubble treatment: user = solid AppColors.blueBackground fill;
//      admin = white fill with a subtle AppColors.blueBackground border
//      (previously borderless, which made it hard to distinguish from the
//      screen background); system = solid grey fill. No new colors were
//      introduced — everything here already existed in your palette.
// ============================================================
class _ChatBubble extends StatelessWidget {
  final Message message;
  final bool isFromUser;
  final bool isSystem;

  const _ChatBubble({
    required this.message,
    required this.isFromUser,
    this.isSystem = false,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final maxBubbleWidth = screenWidth * 0.78;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment:
            isFromUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isFromUser) ...[
            Container(
              margin: const EdgeInsets.only(right: 8),
              child: CircleAvatar(
                radius: 16,
                backgroundColor: isSystem
                    ? Colors.grey[200]
                    : AppColors.blueBackground.withOpacity(0.15),
                child: Icon(
                  isSystem ? Icons.info_outline : Icons.support_agent,
                  color: isSystem ? Colors.grey[600] : AppColors.blueBackground,
                  size: 18,
                ),
              ),
            ),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isFromUser
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                _SenderLabel(
                    isFromUser: isFromUser,
                    isSystem: isSystem,
                    message: message),
                const SizedBox(height: 3),
                Container(
                  constraints: BoxConstraints(maxWidth: maxBubbleWidth),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isFromUser
                        ? AppColors.blueBackground
                        : isSystem
                            ? Colors.grey[200]
                            : Colors.white,
                    border: !isFromUser && !isSystem
                        ? Border.all(
                            color: AppColors.blueBackground.withOpacity(0.12),
                            width: 1,
                          )
                        : null,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomLeft: !isFromUser && !isSystem
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                      bottomRight: isFromUser
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.content,
                        style: TextStyle(
                          color: isFromUser
                              ? Colors.white
                              : isSystem
                                  ? Colors.grey[700]
                                  : Colors.grey[900],
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                      if (message.attachmentUrl != null) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: isFromUser
                                ? Colors.white.withOpacity(0.15)
                                : Colors.grey[200],
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.attach_file,
                                size: 14,
                                color:
                                    isFromUser ? Colors.white70 : Colors.grey,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Attachment',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isFromUser
                                      ? Colors.white70
                                      : Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            DateFormat('hh:mm a').format(message.timestamp),
                            style: TextStyle(
                              color: isFromUser
                                  ? Colors.white.withOpacity(0.6)
                                  : Colors.grey[500],
                              fontSize: 9,
                            ),
                          ),
                          if (isFromUser && message.status != null) ...[
                            const SizedBox(width: 4),
                            Icon(
                              message.status == 'sent'
                                  ? Icons.check
                                  : message.status == 'delivered'
                                      ? Icons.done_all
                                      : message.status == 'read'
                                          ? Icons.done_all
                                          : Icons.warning,
                              size: 12,
                              color: message.status == 'read'
                                  ? Colors.green[300]
                                  : message.status == 'failed'
                                      ? Colors.red
                                      : Colors.white.withOpacity(0.5),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isFromUser) ...[
            Container(
              margin: const EdgeInsets.only(left: 8),
              child: CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.blueBackground.withOpacity(0.15),
                child: const Icon(
                  Icons.person,
                  color: AppColors.blueBackground,
                  size: 18,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Small label shown directly above every bubble so the sender is
/// unambiguous even before reading bubble color or position — "You" for
/// the customer, the agent's actual name for admin, "System" for system
/// notices. Uses only colors already in AppColors / Colors.grey.
class _SenderLabel extends StatelessWidget {
  final bool isFromUser;
  final bool isSystem;
  final Message message;

  const _SenderLabel({
    required this.isFromUser,
    required this.isSystem,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    if (isSystem) {
      return Padding(
        padding: const EdgeInsets.only(left: 2),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.info_outline, size: 12, color: Colors.grey[500]),
            const SizedBox(width: 4),
            Text(
              'System',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.grey[500],
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      );
    }

    if (isFromUser) {
      return Padding(
        padding: const EdgeInsets.only(right: 2),
        child: Text(
          'You',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Colors.grey[500],
            letterSpacing: 0.2,
          ),
        ),
      );
    }

    // Admin / support agent — the most important label to get right, so
    // it carries the brand color to visually anchor "this is support".
    return Padding(
      padding: const EdgeInsets.only(left: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            message.senderName,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.blueBackground,
              letterSpacing: 0.1,
            ),
          ),
          const SizedBox(width: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(
              color: AppColors.blueBackground.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Support',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: FontWeight.w700,
                color: AppColors.blueBackground.withOpacity(0.85),
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// TYPING INDICATOR WITH ANIMATION
// ============================================================
class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.blueBackground.withOpacity(0.15),
              child: const Icon(
                Icons.support_agent,
                color: AppColors.blueBackground,
                size: 18,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(
                color: AppColors.blueBackground.withOpacity(0.12),
                width: 1,
              ),
              borderRadius: BorderRadius.circular(16).copyWith(
                bottomLeft: const Radius.circular(4),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (index) {
                final delay = index * 0.2;
                return AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    final value = (_controller.value + delay) % 1.0;
                    final scale = 0.4 + (0.6 * value);
                    return Transform.scale(
                      scale: scale,
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: AppColors.blueBackground
                              .withOpacity(0.3 + (0.7 * value)),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  },
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
