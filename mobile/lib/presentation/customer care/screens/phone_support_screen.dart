import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import '../../customer care/data/provider/call_provider.dart';
import 'dart:async';

class PhoneSupportScreen extends ConsumerStatefulWidget {
  const PhoneSupportScreen({super.key});

  @override
  ConsumerState<PhoneSupportScreen> createState() => _PhoneSupportScreenState();
}

class _PhoneSupportScreenState extends ConsumerState<PhoneSupportScreen> {
  bool _isCallActive = false;
  String _callStatus = 'Ready to call';
  String _callDuration = '00:00';
  Timer? _callTimer;
  String? _activeCallId;
  String? _activePhoneNumber;
  final bool _isLoading = false;

  final List<PhoneNumber> _phoneNumbers = [
    PhoneNumber(label: 'Support Hotline', number: '+1 (555) 123-4567'),
    PhoneNumber(label: 'Technical Support', number: '+1 (555) 234-5678'),
    PhoneNumber(label: 'Billing Inquiries', number: '+1 (555) 345-6789'),
  ];

  @override
  void initState() {
    super.initState();
    debugPrint('🔵 PHONE SUPPORT SCREEN: Initializing');

    // Load queue and incoming calls
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final queueNotifier = ref.read(callQueueProvider.notifier);
      queueNotifier.fetchQueue();

      final incomingNotifier = ref.read(incomingCallsProvider.notifier);
      incomingNotifier.fetchIncoming();
    });
  }

  @override
  void dispose() {
    _callTimer?.cancel();
    super.dispose();
  }

  void _startCallTimer() {
    int seconds = 0;
    _callTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || !_isCallActive) {
        timer.cancel();
        return;
      }
      seconds++;
      setState(() {
        final minutes = (seconds ~/ 60).toString().padLeft(2, '0');
        final secs = (seconds % 60).toString().padLeft(2, '0');
        _callDuration = '$minutes:$secs';
      });
    });
  }

  Future<void> _makeCall(String phoneNumber) async {
    debugPrint('🔵 PHONE SUPPORT SCREEN: Making call to $phoneNumber');

    // Check if we have an active call ID from queue
    final queueState = ref.read(callQueueProvider);
    String? callId; // ← This is nullable

    queueState.when(
      data: (calls) {
        if (calls.isNotEmpty) {
          callId = calls.first.callId; // ← This is String? (nullable)
        }
      },
      loading: () {},
      error: (_, __) {},
    );

    setState(() {
      _isCallActive = true;
      _callStatus = 'Calling...';
      _activePhoneNumber = phoneNumber;
      _activeCallId = callId;
    });

    // ✅ FIX: Check if callId is not null before using it
    if (callId != null) {
      debugPrint('🔵 PHONE SUPPORT SCREEN: Accepting call via API: $callId');
      final actionNotifier = ref.read(callActionProvider.notifier);
      final result = await actionNotifier
          .acceptCall(callId!); // ← Add ! to assert non-null

      if (result != null) {
        debugPrint('✅ PHONE SUPPORT SCREEN: Call accepted: ${result.callId}');
        setState(() {
          _callStatus = 'Connected';
        });
        _startCallTimer();
      } else {
        debugPrint('❌ PHONE SUPPORT SCREEN: Failed to accept call');
        setState(() {
          _isCallActive = false;
          _callStatus = 'Failed to connect';
          _activeCallId = null;
        });
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            setState(() {
              _callStatus = 'Ready to call';
            });
          }
        });
      }
    } else {
      // Simulate call without API (fallback)
      debugPrint('🔵 PHONE SUPPORT SCREEN: No call ID - simulating call');
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _callStatus = 'Connected';
          });
          _startCallTimer();
        }
      });
    }
  }

  Future<void> _endCall({String? complain, String? comment}) async {
    debugPrint('🔵 PHONE SUPPORT SCREEN: Ending call');

    if (_activeCallId != null) {
      debugPrint(
          '🔵 PHONE SUPPORT SCREEN: Ending call via API: $_activeCallId');
      final actionNotifier = ref.read(callActionProvider.notifier);
      await actionNotifier.endCall(
        callId: _activeCallId!,
        complain: complain,
        comment: comment,
      );
    }

    _callTimer?.cancel();
    setState(() {
      _isCallActive = false;
      _callStatus = 'Call ended';
      _callDuration = '00:00';
      _activeCallId = null;
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _callStatus = 'Ready to call';
        });
      }
    });
  }

  void _showPhoneDialog(String phoneNumber) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Make a Call'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.phone,
              size: 48,
              color: AppColors.blueBackground,
            ),
            const SizedBox(height: 12),
            Text(
              'Call $phoneNumber?',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This will connect you to our support team.',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _makeCall(phoneNumber);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.blueBackground,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Call Now',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final queueState = ref.watch(callQueueProvider);
    final incomingState = ref.watch(incomingCallsProvider);
    final actionState = ref.watch(callActionProvider);
    final isActionLoading = actionState.isLoading;

    // Get queue count
    int queueCount = 0;
    queueState.when(
      data: (calls) {
        queueCount = calls.length;
        debugPrint('🔵 PHONE SUPPORT: Queue count: $queueCount');
      },
      loading: () {},
      error: (_, __) {},
    );

    // Get incoming count
    int incomingCount = 0;
    incomingState.when(
      data: (calls) {
        incomingCount = calls.length;
        debugPrint('🔵 PHONE SUPPORT: Incoming count: $incomingCount');
      },
      loading: () {},
      error: (_, __) {},
    );

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        title: const Text(
          'Phone Support',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.history, color: Colors.white),
                onPressed: () {
                  // Navigate to call history
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Call history coming soon!'),
                      backgroundColor: AppColors.blueBackground,
                    ),
                  );
                },
              ),
              if (queueCount > 0)
                Positioned(
                  right: 4,
                  top: 4,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 14,
                      minHeight: 14,
                    ),
                    child: Text(
                      queueCount > 99 ? '99+' : queueCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Call Status Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.blueBackground.withOpacity(0.9),
                  AppColors.blueBackground,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.blueBackground.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Status Icon
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isCallActive ? Icons.call : Icons.phone,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _isCallActive ? 'Call in Progress' : 'Ready to Connect',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _callStatus,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                  ),
                ),
                if (_isCallActive) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.timer,
                          color: Colors.white.withOpacity(0.8),
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _callDuration,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (_isCallActive) ...[
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Mute button
                      _buildCallActionButton(
                        icon: Icons.mic,
                        label: 'Mute',
                        onTap: () {},
                      ),
                      const SizedBox(width: 20),
                      // End call button
                      _buildCallActionButton(
                        icon: Icons.call_end,
                        label: 'End Call',
                        onTap: () => _endCall(),
                        isEndCall: true,
                      ),
                      const SizedBox(width: 20),
                      // Speaker button
                      _buildCallActionButton(
                        icon: Icons.volume_up,
                        label: 'Speaker',
                        onTap: () {},
                      ),
                    ],
                  ),
                ],
                // Queue info
                if (queueCount > 0 && !_isCallActive)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.queue,
                            color: Colors.white.withOpacity(0.8),
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$queueCount call${queueCount > 1 ? 's' : ''} in queue',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Phone Numbers List
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Contact Numbers',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[800],
                        ),
                      ),
                      if (incomingCount > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red[50],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '$incomingCount incoming',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.red[700],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _phoneNumbers.length,
                    itemBuilder: (context, index) {
                      final phone = _phoneNumbers[index];
                      final isActiveCall =
                          _isCallActive && _activePhoneNumber == phone.number;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isActiveCall
                              ? AppColors.blueBackground.withOpacity(0.1)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isActiveCall
                                ? AppColors.blueBackground
                                : Colors.grey[200]!,
                            width: isActiveCall ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.blueBackground.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.phone,
                              color: isActiveCall
                                  ? AppColors.blueBackground
                                  : AppColors.blueBackground,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            phone.label,
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                            ),
                          ),
                          subtitle: Text(
                            phone.number,
                            style: TextStyle(
                              color: isActiveCall
                                  ? AppColors.blueBackground
                                  : Colors.grey[600],
                              fontSize: 13,
                              fontWeight: isActiveCall
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                          trailing: isActiveCall
                              ? Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.green[100],
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.call,
                                        color: Colors.green[700],
                                        size: 14,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Active',
                                        style: TextStyle(
                                          color: Colors.green[700],
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : ElevatedButton(
                                  onPressed: _isCallActive || isActionLoading
                                      ? null
                                      : () => _showPhoneDialog(phone.number),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.blueBackground,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    disabledBackgroundColor: Colors.grey[300],
                                  ),
                                  child: isActionLoading
                                      ? const SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text(
                                          'Call',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Quick Support Info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              border: Border(
                top: BorderSide(
                  color: Colors.grey[200]!,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildQuickInfoItem(
                  icon: Icons.access_time,
                  label: '24/7 Support',
                ),
                _buildQuickInfoItem(
                  icon: Icons.verified,
                  label: 'Verified Agents',
                ),
                _buildQuickInfoItem(
                  icon: Icons.message,
                  label: 'Live Chat',
                  onTap: () {
                    context.pop();
                    context.push(AppRoutes.liveChat);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isEndCall = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isEndCall ? Colors.red : Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isEndCall ? Colors.white : Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickInfoItem({
    required IconData icon,
    required String label,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: AppColors.blueBackground,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class PhoneNumber {
  final String label;
  final String number;

  PhoneNumber({required this.label, required this.number});
}
