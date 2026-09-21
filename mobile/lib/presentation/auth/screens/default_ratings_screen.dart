import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class DefaultRatingsScreen extends StatelessWidget {
  const DefaultRatingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Current rating (20%)
    const int currentRating = 20;

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Header Section
            Container(
              height: 60,
              width: double.infinity,
              color: AppColors.blueBackground,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        const Icon(
                          Icons.shopping_cart_outlined,
                          color: AppColors.textLight,
                          size: 20,
                        ),
                        Positioned(
                          right: 4,
                          top: 4,
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: const BoxDecoration(
                              color: AppColors.textLight,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.email,
                              size: 8,
                              color: AppColors.blueBackground,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Default Ratings',
                    style: TextStyle(
                      color: AppColors.textLight,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(
                      Icons.close,
                      color: AppColors.textLight,
                    ),
                    onPressed: () => context.pop(),
                  ),
                ],
              ),
            ),

            // Content Section
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Current Rating Circle
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.red,
                          width: 8,
                        ),
                      ),
                      child: const Center(
                        child: Text(
                          '20%',
                          style: TextStyle(
                            color: AppColors.textLight,
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'You are not eligible for the loan purchase features.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFF333333),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Eligibility Levels
                    _buildEligibilityLevel(
                      percentage: 100,
                      title: 'Full Eligibility',
                      description:
                          'You are fully eligible for the loan purchase features',
                      color: Colors.green,
                      isReached: currentRating >= 100,
                      showLine: true,
                      lineColor: Colors.green,
                    ),
                    const SizedBox(height: 8),
                    _buildEligibilityLevel(
                      percentage: 75,
                      title: 'Semi-Eligibility',
                      description:
                          'You are eligible for a loan purchase of #1,000,000 - #5,000,000',
                      color: Colors.green,
                      isReached: currentRating >= 75,
                      showLine: true,
                      lineColor: Colors.orange,
                    ),
                    const SizedBox(height: 8),
                    _buildEligibilityLevel(
                      percentage: 50,
                      title: 'Partial Eligibility',
                      description:
                          'You are eligible for a loan purchase of #500,000 - #1,000,000',
                      color: Colors.orange,
                      isReached: currentRating >= 50,
                      showLine: true,
                      lineColor: Colors.red,
                    ),
                    const SizedBox(height: 8),
                    _buildEligibilityLevel(
                      percentage: 25,
                      title: 'Default Eligibility',
                      description:
                          'You are not eligible for the loan purchase features',
                      color: Colors.red,
                      isReached: currentRating >= 25,
                      showLine: false,
                      lineColor: Colors.transparent,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEligibilityLevel({
    required int percentage,
    required String title,
    required String description,
    required Color color,
    required bool isReached,
    required bool showLine,
    required Color lineColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Circle and Line Container
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: Colors.transparent,
                shape: BoxShape.circle,
                border: Border.all(
                  color: color,
                  width: 2,
                ),
              ),
            ),
            if (showLine)
              Container(
                width: 2,
                height: 60,
                color: lineColor,
              ),
          ],
        ),
        const SizedBox(width: 16),
        // Text Content
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    '$percentage%',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF333333),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF666666),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
