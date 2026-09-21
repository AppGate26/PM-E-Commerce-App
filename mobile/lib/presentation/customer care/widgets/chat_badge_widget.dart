import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/provider/chat_provider.dart';

class ChatBadgeWidget extends ConsumerStatefulWidget {
  const ChatBadgeWidget({super.key});

  @override
  ConsumerState<ChatBadgeWidget> createState() => _ChatBadgeWidgetState();
}

class _ChatBadgeWidgetState extends ConsumerState<ChatBadgeWidget> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final countNotifier = ref.read(chatCountProvider.notifier);
      countNotifier.fetchChatCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    final countState = ref.watch(chatCountProvider);

    int unreadCount = 0;
    bool isLoading = false;

    countState.when(
      data: (data) {
        unreadCount = data.unread;
        debugPrint('🔵 CHAT BADGE: Unread count: $unreadCount');
      },
      loading: () {
        isLoading = true;
        debugPrint('⏳ CHAT BADGE: Loading...');
      },
      error: (error, stack) {
        debugPrint('❌ CHAT BADGE: Error: $error');
      },
    );

    debugPrint('🔵 CHAT BADGE: Building with unread count: $unreadCount');
    debugPrint('🔵 CHAT BADGE: Loading: $isLoading');

    return Stack(
      children: [
        const Icon(
          Icons.chat_bubble_outline,
          color: Colors.white,
        ),
        if (unreadCount > 0)
          Positioned(
            right: -6,
            top: -6,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(
                minWidth: 16,
                minHeight: 16,
              ),
              child: Text(
                unreadCount > 99 ? '99+' : unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}



