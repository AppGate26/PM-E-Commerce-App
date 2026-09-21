import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: AppColors.textLight,
                    ),
                    onPressed: () => context.pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Terms & Conditions',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textLight,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48), // Balance the back button
                ],
              ),
            ),

            // Content Section
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: AppColors.whiteBackground,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSection(
                        title: '1. Agreement to Terms & Scope',
                        content:
                            'Welcome to PM Marketing Hub. These General Terms and Conditions of Sale ("Terms") govern your use of our website, pmmmarketinghub.com ("the Site"), and your purchase of products from us. By creating an account, browsing the Site, or placing an order, you agree to be bound by these Terms in their entirety.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '2. Privacy Policy',
                        content:
                            'Your privacy is important to us. Our Privacy Policy is a separate document that explains how we collect, use, and protect your personal data, including information related to your BVN and payment details. By agreeing to these Terms, you also acknowledge and agree to our Privacy Policy.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '3. Orders & Pricing',
                        content:
                            '3.1. Order Acceptance: Your placement of an order constitutes an offer to purchase. A binding contract is formed only when we dispatch the product to you. We reserve the right, at our sole discretion, to reject or cancel any order for any reason, including but not limited to stock limitations or suspicion of fraudulent activity.\n\n3.2. Pricing & Errors: We strive for accuracy in all product listings. In the event of a significant pricing or typographical error, we will contact you. You will have the option to either purchase the product at its correct price or cancel the order for a full refund of any amount already paid.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '4. Customer Account & Responsibilities',
                        content:
                            'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information and to notify us immediately of any unauthorized use of your account.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '5. Delivery & Acceptance',
                        content:
                            '5.1. Zones & Timelines: Delivery is restricted to the zones specified on our Site. All delivery timelines are good-faith estimates, not guarantees.\n\n5.2. Final Acceptance: It is your responsibility to inspect the product upon delivery. Your acceptance of the item from our delivery agent serves as your final, unconditional confirmation that the product is correct, free from physical damage, and in good working order. Once accepted, the sale is final, and the product cannot be returned.\n\n5.3. Force Majeure: We shall not be liable for delivery delays caused by events beyond our reasonable control, including but not limited to acts of God, public holidays, civil unrest, labour strikes, or natural disasters.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '6. Prohibited Uses of the Site',
                        content:
                            'You agree not to use the Site for any unlawful purpose or to engage in any of the following prohibited activities:\n\n• Attempting to breach the security or authentication measures of the Site.\n• Using any automated process (e.g., "scraping") to collect information from the Site.\n• Interfering with the proper working of the Site.\n• Uploading any malicious code, viruses, or worms.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '7. Intellectual Property',
                        content:
                            'All content included on the Site, such as text, graphics, logos, images, and software, is the property of PM Marketing Hub or its suppliers and is protected by Nigerian and international copyright laws. You may not reproduce, distribute, or otherwise use any such content without our express written permission.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '8. Manufacturer\'s Warranty',
                        content:
                            'All products sold on the Site are covered by the official manufacturer\'s warranty. PM Marketing Hub facilitates warranty claims as a service but provides no separate or additional warranty.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '9. Limitation of Liability',
                        content:
                            'To the maximum extent permitted by law, PM Marketing Hub, its directors, and its employees shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our products or Site. In all circumstances, our maximum liability for any claim is strictly limited to the total purchase price of the product in question.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '10. Indemnification',
                        content:
                            'You agree to indemnify, defend, and hold harmless PM Marketing Hub from any and all claims, liabilities, expenses, and damages, including reasonable legal fees, arising out of your use of the Site or your breach of these Terms.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '11. Governing Law & Dispute Resolution',
                        content:
                            '11.1. Governing Law: These Terms and any dispute arising from them shall be governed by the laws of the Federal Republic of Nigeria.\n\n11.2. Dispute Resolution: The parties agree to first attempt to resolve any dispute amicably. If unresolved after thirty (30) days, the dispute shall be referred to mediation before proceeding to a court of competent jurisdiction in Enugu State, Nigeria.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: '12. General Provisions',
                        content:
                            '12.1. Severability: If any provision of these Terms is deemed unlawful or unenforceable, that provision shall be severed, and the remaining provisions will continue in full force and effect.\n\n12.2. Entire Agreement: These Terms, along with our Privacy Policy and the "Pay Small Small" Instalment Purchase Agreement (where applicable), constitute the entire agreement between you and PM Marketing Hub and supersede all prior communications and proposals.',
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required String content,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.blueBackground,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          content,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF666666),
            height: 1.6,
          ),
        ),
      ],
    );
  }
}
