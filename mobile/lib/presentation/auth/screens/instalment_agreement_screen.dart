import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';

class InstalmentAgreementScreen extends StatelessWidget {
  const InstalmentAgreementScreen({super.key});

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
                      '"Pay Small Small" Agreement',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textLight,
                        fontSize: 18,
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
                      const Text(
                        '"PAY SMALL SMALL" INSTALMENT PURCHASE AGREEMENT',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.blueBackground,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildSection(
                        title: 'Preamble: Conditional Authorization for Direct Debit',
                        content:
                            'By accepting this agreement, you acknowledge that the "Pay Small Small" plan is a credit facility. You expressly and irrevocably authorize PM Marketing Hub and/or its designated payment partners to place a Global Standing Instruction (GSI) or equivalent direct debit mandate on all bank accounts linked to your Bank Verification Number (BVN).\n\nThis authorization is conditional. The direct debit mandate will ONLY be activated if a Secondary Recovery Event occurs, as defined in Section 4.3 of this agreement.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: 'Section 1: The Agreement',
                        content:
                            'This agreement governs the purchase of the product [Product Name, SKU, Serial Number] ("the Product") for the total price of [Total Price]. You agree to pay a 50% down payment of [Down Payment Amount] and the remaining balance of [Balance Amount] over a [Number of Months]-month period.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: 'Section 2: Ownership & Your Obligations',
                        content:
                            '2.1. Title of Ownership: PM Marketing Hub remains the sole legal owner of the Product until the final instalment is paid.\n\n2.2. Duty of Care: You are the custodian of the Product. If the Product is lost, stolen, or damaged during the instalment period, you remain fully liable for paying all outstanding instalments. This is a contract to pay for the Product\'s value, and its condition after delivery does not waive your payment obligation.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: 'Section 3: Default',
                        content:
                            'You will be in Default if you miss two (2) monthly instalment payments. Upon entering Default, this agreement is considered breached, and the entire remaining balance becomes immediately due and payable.',
                      ),
                      const SizedBox(height: 24),
                      _buildSection(
                        title: 'Section 4: Consequences of Default & Recovery Process',
                        content:
                            '4.1. Primary Action - Physical Recovery:\n\nUpon Default, our primary and immediate course of action will be to dispatch our authorized recovery team to peacefully repossess the Product from your registered address. You agree to facilitate this process.\n\nUpon successful recovery, a Default and Recovery Fee (equivalent to 25% of the Product\'s total original value) will be applied. Your refund will be calculated as: Total Amount You Have Paid minus the Default and Recovery Fee.\n\n4.2. Secondary Recovery Events:\n\nThe following situations are defined as Secondary Recovery Events:\n\na) Our recovery team makes reasonable, documented attempts to repossess the Product, but you obstruct, evade, or otherwise make the recovery impossible.\nb) You have relocated from your registered address without notice, and the Product cannot be located.\nc) The Product is recovered but has sustained significant damage beyond normal wear and tear.\nd) In the unfortunate event of the customer\'s passing, preventing a standard recovery.\n\n4.3. Secondary Action - Direct Debit Activation:\n\nIf and only if a Secondary Recovery Event (as defined in 4.2) occurs, we will activate the Direct Debit mandate you authorized in the Preamble.\n\nWe will use this mandate to recover the full outstanding balance from any and all of your bank accounts linked to your BVN.\n\n4.4. Reservation of Legal Rights:\n\nActivating either the Primary or Secondary recovery action does not waive our right to pursue further legal action to recover all owed sums, costs of recovery, and compensation for damages.',
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
            fontSize: 16,
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
