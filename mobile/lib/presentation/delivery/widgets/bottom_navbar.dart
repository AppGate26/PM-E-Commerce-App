import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class DeliveryBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const DeliveryBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(
            context: context,
            icon: Icons.home_outlined,
            index: 0,
            route: AppRoutes.pendingDeliveries,
          ),
          _buildNavItem(
            context: context,
            icon: Icons.grid_view,
            index: 1,
            route: AppRoutes.deliveryHome,
          ),
          _buildNavItem(
            context: context,
            icon: Icons.local_shipping_outlined,
            index: 2,
            route: AppRoutes.newDelivery,
            hasPlus: true,
          ),
          _buildNavItem(
            context: context,
            icon: Icons.history,
            index: 3,
            route: AppRoutes.deliveryHistory,
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required BuildContext context,
    required IconData icon,
    required int index,
    required String route,
    bool hasPlus = false,
  }) {
    final bool isActive = currentIndex == index;

    return GestureDetector(
      onTap: () {
        onTap(index);
        context.go(route);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.lightBlueBackground : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          children: [
            Icon(
              icon,
              color: isActive ? AppColors.blueBackground : const Color(0xFF999999),
              size: 26,
            ),
            if (hasPlus)
              Positioned(
                right: -2,
                top: -2,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.blueBackground, width: 1.5),
                  ),
                  child: const Icon(Icons.add, size: 12, color: AppColors.blueBackground),
                ),
              ),
          ],
        ),
      ),
    );
  }
}