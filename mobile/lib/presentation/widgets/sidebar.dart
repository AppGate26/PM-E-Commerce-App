import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';

class Sidebar extends ConsumerWidget {
  final VoidCallback onClose;

  const Sidebar({
    super.key,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: MediaQuery.of(context).size.width * 0.75,
      height: double.infinity,
      color: AppColors.whiteBackground,
      child: Column(
        children: [
          // Header Section
          Container(
            height: 60,
            width: double.infinity,
            color: AppColors.blueBackground,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(
                    Icons.close,
                    color: AppColors.textLight,
                  ),
                  onPressed: onClose,
                ),
              ],
            ),
          ),

          // Menu Items Section
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _MenuItem(
                  icon: Icons.person_outline,
                  title: 'Account',
                  onTap: () {
                    context.push(AppRoutes.account);
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.share_outlined,
                  title: 'Socials',
                  onTap: () {
                    context.push(AppRoutes.socials);
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.description_outlined,
                  title: 'T & Cs',
                  onTap: () {
                    context.push(AppRoutes.termsConditions);
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.notifications_none_outlined,
                  title: 'Notification',
                  onTap: () {
                    context.push(AppRoutes.notifications);
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.contact_phone_outlined,
                  title: 'Contact us',
                  onTap: () {
                    context.push(AppRoutes.customerCare);
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.language_outlined,
                  title: 'Visit Website',
                  onTap: () {
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'PM Wallet',
                  onTap: () {
                    context.push(AppRoutes.pmWallet);
                    onClose();
                  },
                ),
                _MenuItem(
                  icon: Icons.logout,
                  title: 'Logout',
                  iconColor: Colors.red,
                  textColor: Colors.red,
                  onTap: () {
                    onClose();
                    _showLogoutDialog(context, ref);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(
                Icons.logout,
                color: Colors.red,
                size: 28,
              ),
              const SizedBox(width: 12),
              const Text(
                'Logout',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
              ),
            ],
          ),
          content: const Text(
            'Are you sure you want to logout?',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.grey[600],
              ),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);

                // Show loading indicator
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.blueBackground,
                    ),
                  ),
                );

                // Perform logout
                await ref.read(authProvider.notifier).logout();

                // Close loading dialog
                if (context.mounted) {
                  Navigator.pop(context);
                }

                // Show success snackbar
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Logged out successfully'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }

                // Navigate to login screen
                if (context.mounted) {
                  context.go(AppRoutes.login);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Confirm',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? textColor;

  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: Color(0xFFE0E0E0),
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 24,
              color: iconColor ?? AppColors.blueBackground,
            ),
            const SizedBox(width: 16),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                color: textColor ?? const Color(0xFF757575),
                fontWeight: FontWeight.w400,
              ),
            ),

            // Add this temporary button somewhere in your app (like Profile screen)
          ],
        ),
      ),
    );
  }
}

class _LogoutMenuItem extends StatelessWidget {
  final VoidCallback onTap;

  const _LogoutMenuItem({
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: Color(0xFFE0E0E0),
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.logout,
              size: 24,
              color: AppColors.blueBackground,
            ),
            const SizedBox(width: 16),
            const Text(
              'Logout',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF757575),
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
