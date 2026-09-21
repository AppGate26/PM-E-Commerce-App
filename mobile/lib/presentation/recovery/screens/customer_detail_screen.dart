// lib/presentation/recovery/screens/customer_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class CustomerDetailScreen extends StatelessWidget {
  const CustomerDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // AppBar - PERSONAL INFORMATION
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
              color: AppColors.blueBackground,
              child: Row(
                children: [
                  Image.asset('assets/images/logo.png',
                      height: 36, fit: BoxFit.contain),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'PERSONAL INFORMATION',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    iconSize: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 40),
                    onPressed: () {
                      context.go(AppRoutes.recoveryHome);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                children: [
                  _buildSectionTitle('Customer\'s Information'),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    avatarPath: 'assets/images/re.png',
                    fullName: 'Mojeed Shukurat',
                    homeAddress: '199, okokomaiko street, Agege, Lagos',
                    city: 'Agege',
                    phoneNumber: '08023441833',
                    emailAddress: 'ajayideborah@gmail.com',
                  ),

                  const SizedBox(height: 32),

                  // Guarantor Information
                  _buildSectionTitle('Guarantor Information'),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    avatarPath: 'assets/images/re.png',
                    fullName: 'Mojeed Shukurat',
                    homeAddress: '199, okokomaiko street, Agege, Lagos',
                    city: 'Agege',
                    phoneNumber: '08023441833',
                    emailAddress: 'ajayideborah@gmail.com',
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 14),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Color(0xFF333333),
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String avatarPath,
    required String fullName,
    required String homeAddress,
    required String city,
    required String phoneNumber,
    required String emailAddress,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left: Full Name Field
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Full Name',
                      style: TextStyle(fontSize: 12, color: Color(0xFF666666)),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.whiteBackground,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: const Color(0xFFE9ECEF), width: 1),
                      ),
                      child: Text(
                        fullName,
                        style: const TextStyle(
                            fontSize: 14, color: Color(0xFF333333)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Right: Avatar
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  avatarPath,
                  width: 80,
                  height: 60,
                  fit: BoxFit.contain,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Home Address
          _buildInfoRow('Home Address', homeAddress),
          const SizedBox(height: 12),

          // City
          _buildInfoRow('City', city),
          const SizedBox(height: 12),

          // Phone Number
          _buildInfoRow('Phone Number', phoneNumber),
          const SizedBox(height: 12),

          // Email Address
          _buildInfoRow('Email Address', emailAddress),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Color(0xFF666666)),
        ),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.whiteBackground,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE9ECEF), width: 1),
          ),
          child: Text(
            value,
            style: const TextStyle(fontSize: 14, color: Color(0xFF333333)),
          ),
        ),
      ],
    );
  }
}
