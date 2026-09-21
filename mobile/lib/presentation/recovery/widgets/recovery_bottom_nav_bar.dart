// lib/presentation/recovery/widgets/recovery_bottom_nav_bar.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class RecoveryBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const RecoveryBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) {
          onTap(index);
          switch (index) {
            case 0:
              context.go(AppRoutes.goodsToBeRecovered);
              break;
            case 1:
              context.go(AppRoutes.recoveryHome);
              break;
            case 2:
              context.go(AppRoutes.recoveryReport);
              break;
          }
        },
        selectedItemColor: AppColors.blueBackground,
        unselectedItemColor: const Color(0xFF999999),
        showSelectedLabels: true,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        elevation: 0,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          // LEFT: Goods
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined, size: 24),
            activeIcon: Icon(Icons.inventory_2, size: 24),
            label: 'Goods',
          ),

          // MIDDLE: Home
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined, size: 28),
            activeIcon: Icon(Icons.home, size: 28),
            label: 'Home',
          ),

          // RIGHT: Report
          BottomNavigationBarItem(
            icon: Icon(Icons.description_outlined, size: 24),
            activeIcon: Icon(Icons.description, size: 24),
            label: 'Report',
          ),
        ],
      ),
    );
  }
}