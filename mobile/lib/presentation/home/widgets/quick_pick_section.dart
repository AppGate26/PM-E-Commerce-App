// presentation/home/widgets/quick_pick_section.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/providers/home_provider.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/quick_pick_card.dart';
import 'package:pm_e_commerce_app/presentation/home/widgets/quick_pick_shimmer.dart';

class QuickPickSection extends ConsumerWidget {
  const QuickPickSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quickPickState = ref.watch(quickPickProvider);

    return quickPickState.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section Header with "Quick Pick" title and "View All" button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          color: AppColors.blueBackground,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Quick Pick',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () {},
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.blueBackground,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            
            // Horizontal Product Cards
            SizedBox(
              height: 180,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                itemCount: items.length > 10 ? 10 : items.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return QuickPickCard(
                    product: item,
                    onTap: () {
                      // Navigate to product detail
                      // context.push(AppRoutes.productDetailScreen, extra: item.toCartFormat());
                    },
                  );
                },
              ),
            ),
          ],
        );
      },
      loading: () => const QuickPickShimmer(),
      error: (error, _) => const SizedBox.shrink(),
    );
  }
}