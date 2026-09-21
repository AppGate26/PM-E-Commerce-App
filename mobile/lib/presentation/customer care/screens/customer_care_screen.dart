import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/provider/chat_provider.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/provider/email_provider.dart';
import 'package:pm_e_commerce_app/presentation/customer%20care/data/provider/call_provider.dart';

class CustomerCareScreen extends ConsumerStatefulWidget {
  const CustomerCareScreen({super.key});

  @override
  ConsumerState<CustomerCareScreen> createState() => _CustomerCareScreenState();
}

class _CustomerCareScreenState extends ConsumerState<CustomerCareScreen>
    with SingleTickerProviderStateMixin {
  bool _isLiveChatLoading = false;
  bool _isEmailLoading = false;
  bool _isPhoneLoading = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    debugPrint('🔵 CUSTOMER CARE SCREEN: Initializing');

    // Load all counts when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAllCounts();
    });
  }

  Future<void> _loadAllCounts() async {
    debugPrint('🔵 CUSTOMER CARE SCREEN: Loading all counts...');
    setState(() {
      _isLoading = true;
    });

    try {
      // Load chat count
      final chatCountNotifier = ref.read(chatCountProvider.notifier);
      await chatCountNotifier.fetchChatCount();
      debugPrint('✅ CUSTOMER CARE SCREEN: Chat count loaded');

      // Load email list (to get count)
      final emailListNotifier = ref.read(emailListProvider.notifier);
      await emailListNotifier.fetchEmails(page: 0, size: 1);
      debugPrint('✅ CUSTOMER CARE SCREEN: Email count loaded');

      // Load call queue
      final callQueueNotifier = ref.read(callQueueProvider.notifier);
      await callQueueNotifier.fetchQueue();
      debugPrint('✅ CUSTOMER CARE SCREEN: Call queue loaded');

      // Load incoming calls
      final incomingNotifier = ref.read(incomingCallsProvider.notifier);
      await incomingNotifier.fetchIncoming();
      debugPrint('✅ CUSTOMER CARE SCREEN: Incoming calls loaded');
    } catch (e) {
      debugPrint('❌ CUSTOMER CARE SCREEN: Error loading counts: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      debugPrint('✅ CUSTOMER CARE SCREEN: All counts loaded');
    }
  }

  Future<void> _refreshCounts() async {
    debugPrint('🔄 CUSTOMER CARE SCREEN: Refreshing counts...');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Refreshing support counts...'),
        backgroundColor: AppColors.blueBackground,
        duration: Duration(seconds: 1),
      ),
    );
    await _loadAllCounts();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Support counts refreshed!'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Watch all providers
    final chatCountState = ref.watch(chatCountProvider);
    final emailListState = ref.watch(emailListProvider);
    final callQueueState = ref.watch(callQueueProvider);
    final incomingCallsState = ref.watch(incomingCallsProvider);

    // Extract counts
    int chatCount = 0;
    int unreadChatCount = 0;
    chatCountState.when(
      data: (count) {
        chatCount = count.total;
        unreadChatCount = count.unread;
        debugPrint(
            '🔵 CUSTOMER CARE: Chat count: total=$chatCount, unread=$unreadChatCount');
      },
      loading: () {
        debugPrint('⏳ CUSTOMER CARE: Chat count loading...');
      },
      error: (error, _) {
        debugPrint('❌ CUSTOMER CARE: Chat count error: $error');
      },
    );

    int emailCount = 0;
    emailListState.when(
      data: (emails) {
        emailCount = emails.length;
        debugPrint('🔵 CUSTOMER CARE: Email count: $emailCount');
      },
      loading: () {
        debugPrint('⏳ CUSTOMER CARE: Email count loading...');
      },
      error: (error, _) {
        debugPrint('❌ CUSTOMER CARE: Email count error: $error');
      },
    );

    int callQueueCount = 0;
    callQueueState.when(
      data: (calls) {
        callQueueCount = calls.length;
        debugPrint('🔵 CUSTOMER CARE: Call queue count: $callQueueCount');
      },
      loading: () {
        debugPrint('⏳ CUSTOMER CARE: Call queue loading...');
      },
      error: (error, _) {
        debugPrint('❌ CUSTOMER CARE: Call queue error: $error');
      },
    );

    int incomingCallCount = 0;
    incomingCallsState.when(
      data: (calls) {
        incomingCallCount = calls.length;
        debugPrint(
            '🔵 CUSTOMER CARE: Incoming calls count: $incomingCallCount');
      },
      loading: () {
        debugPrint('⏳ CUSTOMER CARE: Incoming calls loading...');
      },
      error: (error, _) {
        debugPrint('❌ CUSTOMER CARE: Incoming calls error: $error');
      },
    );

    // Check if any error occurred
    bool hasError = chatCountState.hasError ||
        emailListState.hasError ||
        callQueueState.hasError ||
        incomingCallsState.hasError;

    debugPrint(
        '🔵 CUSTOMER CARE SCREEN: Building with counts - Chat: $chatCount, Email: $emailCount, Queue: $callQueueCount, Incoming: $incomingCallCount');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 1,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Customer Care',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
          color: AppColors.blueBackground,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Logout functionality coming soon.'),
                  backgroundColor: AppColors.blueBackground,
                ),
              );
            },
            color: AppColors.blueBackground,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshCounts,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
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
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Always supporting our customers',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'across chat, email and phone channels',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _isLoading
                                ? Colors.orange
                                : AppColors.blueBackground,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              if (_isLoading)
                                const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                ),
                              if (_isLoading) const SizedBox(width: 8),
                              Text(
                                _isLoading
                                    ? 'Loading counts...'
                                    : 'Support counts loaded',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        GestureDetector(
                          onTap: _refreshCounts,
                          child: const Icon(
                            Icons.refresh,
                            color: AppColors.blueBackground,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Show warning if there's an error
                    if (hasError)
                      Row(
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            color: Colors.orange[700],
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Some support counts could not be loaded.',
                            style: TextStyle(
                              color: Colors.orange[700],
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Live Chat Section with Badge
              _buildSupportCard(
                icon: Icons.chat_bubble_outline,
                title: 'LIVE CHAT',
                subtitle: 'Respond to a client on live chat',
                buttonText: 'Open Live Chat Desk',
                isLoading: _isLiveChatLoading,
                onPressed: () {
                  setState(() {
                    _isLiveChatLoading = true;
                  });
                  Future.delayed(const Duration(milliseconds: 500), () {
                    if (mounted) {
                      setState(() {
                        _isLiveChatLoading = false;
                      });
                      context.push(AppRoutes.liveChat);
                    }
                  });
                },
                backgroundColor: Colors.green[50]!,
                iconColor: Colors.green[700]!,
                badgeCount: unreadChatCount,
                badgeLabel:
                    unreadChatCount > 0 ? '$unreadChatCount unread' : null,
              ),
              const SizedBox(height: 16),

              // Email Support Section with Badge
              _buildSupportCard(
                icon: Icons.email_outlined,
                title: 'E-MAIL SUPPORT',
                subtitle: 'Respond to client issues via email support',
                buttonText: 'Open Email Support Desk',
                isLoading: _isEmailLoading,
                onPressed: () {
                  setState(() {
                    _isEmailLoading = true;
                  });
                  Future.delayed(const Duration(milliseconds: 500), () {
                    if (mounted) {
                      setState(() {
                        _isEmailLoading = false;
                      });
                      context.push(AppRoutes.emailSupport);
                    }
                  });
                },
                backgroundColor: Colors.blue[50]!,
                iconColor: Colors.blue[700]!,
                badgeCount: emailCount,
                badgeLabel: emailCount > 0 ? '$emailCount tickets' : null,
              ),
              const SizedBox(height: 16),

              // Phone Support Section with Badge
              _buildSupportCard(
                icon: Icons.phone_outlined,
                title: 'PHONE SUPPORT',
                subtitle: 'Respond to clients via phone support',
                buttonText: 'Manage Incoming And Queued Calls',
                isLoading: _isPhoneLoading,
                onPressed: () {
                  setState(() {
                    _isPhoneLoading = true;
                  });
                  Future.delayed(const Duration(milliseconds: 500), () {
                    if (mounted) {
                      setState(() {
                        _isPhoneLoading = false;
                      });
                      context.push(AppRoutes.phoneSupport);
                    }
                  });
                },
                backgroundColor: Colors.purple[50]!,
                iconColor: Colors.purple[700]!,
                badgeCount: callQueueCount + incomingCallCount,
                badgeLabel: (callQueueCount + incomingCallCount) > 0
                    ? '$callQueueCount queue, $incomingCallCount incoming'
                    : null,
              ),

              const SizedBox(height: 30),

              // Footer
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Support command center',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        'DD',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Dev Dark',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSupportCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required String buttonText,
    required bool isLoading,
    required VoidCallback onPressed,
    required Color backgroundColor,
    required Color iconColor,
    int badgeCount = 0,
    String? badgeLabel,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: badgeCount > 0
              ? AppColors.blueBackground.withOpacity(0.3)
              : Colors.grey[200]!,
          width: badgeCount > 0 ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: backgroundColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Stack(
                  children: [
                    Icon(
                      icon,
                      color: iconColor,
                      size: 24,
                    ),
                    if (badgeCount > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Text(
                            badgeCount > 99 ? '99+' : badgeCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                        if (badgeLabel != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.blueBackground.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              badgeLabel,
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.blueBackground,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isLoading ? null : onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blueBackground,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
                disabledBackgroundColor:
                    AppColors.blueBackground.withOpacity(0.6),
              ),
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      buttonText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
