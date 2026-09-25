// lib/presentation/delivery/screens/delivery_home_screen.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/services/storage_service.dart';
import 'package:pm_e_commerce_app/core/services/secure_credentials_service.dart';
import 'package:pm_e_commerce_app/core/services/shared_preference_service.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/repositories/delivery_agent_repository.dart';
import 'package:pm_e_commerce_app/presentation/delivery/delivery_session.dart';
import 'package:pm_e_commerce_app/presentation/delivery/widgets/bottom_navbar.dart';

class DeliveryHomeScreen extends StatefulWidget {
  const DeliveryHomeScreen({super.key});

  @override
  State<DeliveryHomeScreen> createState() => _DeliveryHomeScreenState();
}

class _DeliveryHomeScreenState extends State<DeliveryHomeScreen> {
  int _selectedIndex = 1;   // Home is the default screen
  String _agentName = 'USER';
  int _unreadNotifications = 0;
  int _unreadChat = 0;
  Timer? _badgeTimer;
  final DeliveryAgentRepository _repo = DeliveryAgentRepository();

  @override
  void initState() {
    super.initState();
    _loadAgentName();
    _refreshBadges();
    // No push service is configured, so new assignments/messages are picked up by polling.
    _badgeTimer = Timer.periodic(const Duration(seconds: 30), (_) => _refreshBadges());
  }

  @override
  void dispose() {
    _badgeTimer?.cancel();
    super.dispose();
  }

  Future<void> _refreshBadges() async {
    final riderId = await currentRiderId();
    int notifications = _unreadNotifications;
    int chat = _unreadChat;
    try {
      if (riderId != null) {
        notifications = await _repo.getUnreadNotificationCount(riderId);
      }
    } catch (_) {}
    try {
      chat = await _repo.getChatUnreadCount();
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _unreadNotifications = notifications;
      _unreadChat = chat;
    });
  }

  Future<void> _openAndRefresh(String route) async {
    _badgeTimer?.cancel();
    await context.push(route);
    if (!mounted) return;
    _refreshBadges();
    _badgeTimer = Timer.periodic(const Duration(seconds: 30), (_) => _refreshBadges());
  }

  Future<void> _loadAgentName() async {
    try {
      print('🚚 [DeliveryHome] Loading agent name...');
      final userData = await StorageService.getUserData();
      if (userData != null) {
        final userJson = jsonDecode(userData);
        final name = userJson['name'] as String?;
        print('🔍 [DeliveryHome] Found name in storage: $name');
        if (name != null && name.isNotEmpty && name != 'USER') {
          setState(() {
            _agentName = name.toUpperCase();
          });
          print('✅ [DeliveryHome] Agent name loaded: $_agentName');
        } else {
          print('⚠️ [DeliveryHome] Name is null or empty, using default: USER');
          setState(() {
            _agentName = 'USER';
          });
        }
      } else {
        print('❌ [DeliveryHome] No user data found in storage');
        setState(() {
          _agentName = 'USER';
        });
      }
    } catch (e) {
      print('❌ [DeliveryHome] Error loading agent name: $e');
      setState(() {
        _agentName = 'USER';
      });
    }
  }

  void _onNavTap(int index) {
    setState(() => _selectedIndex = index);

    switch (index) {
      case 0:
        context.go(AppRoutes.pendingDeliveries);
        break;
      case 1:
        context.go(AppRoutes.deliveryHome);
        break;
      case 2:
        context.go(AppRoutes.newDelivery);
        break;
      case 3:
        context.go(AppRoutes.deliveryHistory);
        break;
    }
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Logo
           Row(
            children: [
               Image.asset(
              'assets/images/logo-blue.png',
              height: 48,
            ),
            const SizedBox(height: 16),

            SizedBox(width: 5,),
            const Text(
              'DO YOU WANT TO\nLOG OUT?',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.blueBackground,
                letterSpacing: 1.0,
              ),
            ),
            ],
           ),
            const SizedBox(height: 24),

            // Buttons Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // YES
                ElevatedButton(
                  onPressed: () async {
                    print('🚚 [DeliveryHome] Logging out...');
                    // Clear storage
                    try {
                      await StorageService.removeToken();
                      await SecureCredentialsService.disable();
                      await SharedPreferenceService.clearBiometricPromptSeen();
                      print('✅ [DeliveryHome] Storage cleared');
                    } catch (e) {
                      print('❌ [DeliveryHome] Error clearing storage: $e');
                    }
                    Navigator.pop(context);
                    context.go(AppRoutes.login);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blueBackground,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  ),
                  child: const Text(
                    'YES',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),

                // NO
                OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.blueBackground, width: 2),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  ),
                  child: const Text(
                    'NO',
                    style: TextStyle(color: AppColors.blueBackground, fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ─────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              color: AppColors.blueBackground,
              child: Row(
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    height: 40,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _agentName == 'USER' ? 'WELCOME USER' : 'WELCOME $_agentName',
                      style: const TextStyle(
                        color: AppColors.textLight,
                        fontSize: 18,
                        letterSpacing: 0.8,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _badgeIcon(
                    icon: Icons.notifications_none,
                    count: _unreadNotifications,
                    onTap: () => _openAndRefresh(AppRoutes.deliveryNotifications),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(top: 32, bottom: 24),
                child: Column(
                  children: [

                    // ── Menu Buttons ───────────────────────────────────────
                    _buildMenuButton(
                      label: 'PENDING DELIVERIES',
                      isHighlighted: true,
                      onTap: () => context.go(AppRoutes.pendingDeliveries),
                    ),
                    const SizedBox(height: 20),

                    _buildMenuButton(
                      label: 'NEW DELIVERY',
                      onTap: () => context.go(AppRoutes.newDelivery),
                    ),
                    const SizedBox(height: 20),

                    _buildMenuButton(
                      label: 'DELIVERY HISTORY',
                      onTap: () => context.go(AppRoutes.deliveryHistory),
                    ),
                    const SizedBox(height: 20),

                    _buildMenuButton(
                      label: 'NOTIFICATIONS',
                      badge: _unreadNotifications,
                      onTap: () => _openAndRefresh(AppRoutes.deliveryNotifications),
                    ),
                    const SizedBox(height: 20),

                    _buildMenuButton(
                      label: 'CHAT WITH DISPATCH',
                      badge: _unreadChat,
                      onTap: () => _openAndRefresh(AppRoutes.deliveryChatList),
                    ),
                    const SizedBox(height: 20),

                    _buildMenuButton(
                      label: 'LOG OUT',
                      isLogout: true,
                      onTap: _showLogoutDialog, // Now shows popup
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      bottomNavigationBar: DeliveryBottomNavBar(
        currentIndex: _selectedIndex,
        onTap: _onNavTap,
      ),
    );
  }

  Widget _badgeIcon({required IconData icon, required int count, required VoidCallback onTap}) {
    return IconButton(
      onPressed: onTap,
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon, color: Colors.white, size: 28),
          if (count > 0)
            Positioned(
              right: -4,
              top: -4,
              child: _countBubble(count),
            ),
        ],
      ),
    );
  }

  Widget _countBubble(int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      constraints: const BoxConstraints(minWidth: 18),
      decoration: BoxDecoration(
        color: AppColors.red,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        count > 99 ? '99+' : '$count',
        textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildMenuButton({
    required String label,
    bool isHighlighted = false,
    bool isLogout = false,
    int badge = 0,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: AppColors.whiteBackground,
            borderRadius: BorderRadius.circular(12),
            border: isHighlighted
                ? Border.all(color: AppColors.blueBackground, width: 2)
                : null,
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isLogout
                      ? AppColors.red
                      : (isHighlighted
                          ? AppColors.blueBackground
                          : const Color(0xFF555555)),
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.0,
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 8),
                _countBubble(badge),
              ],
            ],
          ),
        ),
      ),
    );
  }
}