import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/presentation/widgets/login_required_screen.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.lightBackground,
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const LoginRequiredScreen(title: 'Account'),
      data: (user) {
        if (user == null || user.token == null || user.token!.isEmpty) {
          return const LoginRequiredScreen(title: 'Account');
        }
        return const _AccountContent();
      },
    );
  }
}

class _AccountContent extends StatelessWidget {
  const _AccountContent();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      resizeToAvoidBottomInset: true, // ✅ This helps with keyboard
      body: SafeArea(
        child: Column(
          children: [
            // Header Section - Fixed height
            Container(
              height: 60,
              width: double.infinity,
              color: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Text(
                    'Account',
                    style: TextStyle(
                      color: AppColors.textLight,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: AppColors.blueBackground,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.textLight.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: const Icon(
                        Icons.close,
                        color: AppColors.textLight,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Menu Items Section - Expanded with SingleChildScrollView
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight,
                      ),
                      child: IntrinsicHeight(
                        child: Column(
                          children: [
                            const SizedBox(height: 8),
                            _AccountMenuItem(
                              icon: Icons.person_outline,
                              title: 'My Profile',
                              onTap: () {
                                context.push(AppRoutes.profile);
                              },
                            ),
                            const SizedBox(height: 12),
                            _AccountMenuItem(
                              icon: Icons.receipt_long_outlined,
                              title: 'Orders',
                              onTap: () {
                                context.push(AppRoutes.history);
                              },
                            ),
                            const SizedBox(height: 12),
                            _AccountMenuItem(
                              icon: Icons.check_circle_outline,
                              title: 'Verification Centre',
                              onTap: () {
                                context.push(AppRoutes.verificationCentre);
                              },
                            ),
                            const SizedBox(height: 12),
                            _AccountMenuItem(
                              icon: Icons.account_balance_outlined,
                              title: 'Bank',
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Bank screen coming soon'),
                                    backgroundColor: AppColors.blueBackground,
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 12),
                            _AccountMenuItem(
                              icon: Icons.account_balance_wallet_outlined,
                              title: 'Wallet',
                              onTap: () {
                                context.push(AppRoutes.pmWallet);
                              },
                            ),
                            const SizedBox(height: 12),
                            _AccountMenuItem(
                              icon: Icons.star_outline,
                              title: 'Default Rating',
                              onTap: () {
                                context.push(AppRoutes.defaultRatings);
                              },
                            ),
                            const SizedBox(height: 12),
                            _AccountMenuItem(
                              icon: Icons.shopping_cart_outlined,
                              title: 'Cart',
                              onTap: () {
                                context.push(AppRoutes.cart);
                              },
                            ),
                            // Add extra space at bottom for keyboard
                            const SizedBox(height: 20),
                          ],
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
    );
  }
}

class _AccountMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _AccountMenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.whiteBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.grey[200]!,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: AppColors.blueBackground,
              size: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  color: Color(0xFF757575),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: Colors.grey[400],
              size: 20,
            ),
          ],
        ),
      ),
    );
    
  }
}
