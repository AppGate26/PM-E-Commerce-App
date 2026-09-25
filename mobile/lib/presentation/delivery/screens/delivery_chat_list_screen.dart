// lib/presentation/delivery/screens/delivery_chat_list_screen.dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/delivery_messaging_model.dart';
import 'package:pm_e_commerce_app/data/providers/delivery_agent_provider.dart';

/// Who the rider can chat with: dispatch/admin staff (and anyone who has already messaged
/// them). Messages go through the same messenger the web Mail & Messenger page uses.
class DeliveryChatListScreen extends ConsumerStatefulWidget {
  const DeliveryChatListScreen({super.key});

  @override
  ConsumerState<DeliveryChatListScreen> createState() => _DeliveryChatListScreenState();
}

class _DeliveryChatListScreenState extends ConsumerState<DeliveryChatListScreen> {
  static const _refreshInterval = Duration(seconds: 15);

  List<ChatContact> _contacts = [];
  bool _isLoading = true;
  String? _error;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(_refreshInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }
    try {
      final contacts = await ref.read(deliveryAgentRepositoryProvider).getChatContacts();
      if (!mounted) return;
      setState(() {
        _contacts = contacts;
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        if (!silent) _error = e.toString();
      });
    }
  }

  Future<void> _openChat(ChatContact contact) async {
    await context.push(AppRoutes.deliveryChat, extra: {
      'contactUserId': contact.userId,
      'contactName': contact.name,
      'contactRole': contact.roleLabel,
    });
    // Reading the conversation clears its unread count.
    _load(silent: true);
  }

  String _formatTime(DateTime? date) {
    if (date == null) return '';
    final now = DateTime.now();
    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      return DateFormat('h:mm a').format(date);
    }
    return DateFormat('dd MMM').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        title: const Text(
          'Chat with Dispatch',
          style: TextStyle(fontWeight: FontWeight.w500, color: AppColors.textLight, fontSize: 18),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => context.canPop() ? context.pop() : context.go(AppRoutes.deliveryHome),
        ),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _contacts.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 120),
                            Center(
                              child: Text('No dispatch staff available to chat with',
                                  style: TextStyle(fontSize: 15, color: Colors.grey)),
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: _contacts.length,
                          separatorBuilder: (_, __) => const Divider(height: 1, indent: 76),
                          itemBuilder: (context, index) {
                            final c = _contacts[index];
                            final initials = c.name.trim().isEmpty
                                ? '?'
                                : c.name.trim().split(RegExp(r'\s+')).take(2).map((p) => p[0]).join().toUpperCase();
                            return ListTile(
                              tileColor: Colors.white,
                              onTap: () => _openChat(c),
                              leading: Stack(
                                children: [
                                  CircleAvatar(
                                    radius: 24,
                                    backgroundColor: AppColors.blueBackground,
                                    child: Text(initials, style: const TextStyle(color: Colors.white)),
                                  ),
                                  if (c.isOnline)
                                    Positioned(
                                      right: 0,
                                      bottom: 0,
                                      child: Container(
                                        width: 12,
                                        height: 12,
                                        decoration: BoxDecoration(
                                          color: Colors.green,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: Colors.white, width: 2),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              title: Text(
                                c.name,
                                style: TextStyle(
                                  fontWeight: c.unreadCount > 0 ? FontWeight.w700 : FontWeight.w500,
                                ),
                              ),
                              subtitle: Text(
                                c.lastMessage ?? c.roleLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(_formatTime(c.lastMessageAt),
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF888888))),
                                  if (c.unreadCount > 0) ...[
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.blueBackground,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text('${c.unreadCount}',
                                          style: const TextStyle(color: Colors.white, fontSize: 11)),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
