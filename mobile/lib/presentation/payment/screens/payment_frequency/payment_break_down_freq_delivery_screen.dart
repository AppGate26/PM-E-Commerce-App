import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/data/repositories/installment_repository.dart';
import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/installment_schedule_display_utils.dart';

class PaymentBreakDownFreqDeliveryScreen extends ConsumerStatefulWidget {
  const PaymentBreakDownFreqDeliveryScreen({super.key});

  @override
  ConsumerState<PaymentBreakDownFreqDeliveryScreen> createState() =>
      _PaymentBreakDownFreqDeliveryScreenState();
}

class _PaymentBreakDownFreqDeliveryScreenState
    extends ConsumerState<PaymentBreakDownFreqDeliveryScreen> {
  bool isChecked = false;
  Map<String, dynamic> _extraData = {};

  /// Location ids arrive as either an int or a String depending on which screen
  /// put them in `extra`; the API wants a number.
  static int? _asId(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }
  InstallmentPlan? _plan;
  bool _extraRead = false;
  bool _isCreatingPlan = false;
  final InstallmentRepository _installmentRepository = InstallmentRepository();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_extraRead) {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      print(
          '🟦 [PAYMENT BREAKDOWN DELIVERY] ===== didChangeDependencies =====');
      print('🟦 [PAYMENT BREAKDOWN DELIVERY] Raw extra received: $extra');

      if (extra != null) {
        _extraData = Map<String, dynamic>.from(extra);
        _plan = extra['plan'] as InstallmentPlan?;
      }
      _extraRead = true;

      if (_plan == null) {
        print('🔴 [PAYMENT BREAKDOWN DELIVERY] ⚠️ NO PLAN found in extra!');
      } else {
        final plan = _plan!;
        print('🟩 [PAYMENT BREAKDOWN DELIVERY] ✅ Plan received:');
        print('🟩   planId       = ${plan.planId}');
        print('🟩   productName  = "${plan.productName}"');
        print('🟩   productPrice = ${plan.productPrice}');
        print('🟩   insurance    = ${plan.insurance}');
        print('🟩   deliveryFee  = ${plan.deliveryFee}');
        print('🟩   totalAmount  = ${plan.totalAmount}');
        print('🟩   frequency    = ${plan.frequency}');
        print('🟩   duration     = ${plan.durationInMonths}');
        print('🟩   schedule.length = ${plan.schedule.length}');
        print('🟦   deliveryAddress = ${_extraData['deliveryAddress']}');
        print('🟦   deliveryPhone   = ${_extraData['deliveryPhone']}');
      }
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showTermsAndConditions();
    });
  }

  // ============================================================
  // DYNAMIC DATA HELPERS
  // ============================================================

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]},',
        );
  }

  double _resolvedProductPrice(InstallmentPlan plan) {
    if (plan.productPrice > 0) return plan.productPrice;
    final fee = plan.deliveryFee ?? 0.0;
    final derived = plan.totalAmount - plan.insurance - fee;
    return derived > 0 ? derived : 0.0;
  }

  String _frequencyUnit(String frequency, {bool plural = true}) {
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        return plural ? 'days' : 'day';
      case 'WEEKLY':
        return plural ? 'weeks' : 'week';
      case 'MONTHLY':
        return plural ? 'months' : 'month';
      default:
        return plural ? 'payments' : 'payment';
    }
  }

  double _installmentAmount(InstallmentPlan plan) {
    final displaySchedule = InstallmentDisplayUtils.buildDisplaySchedule(plan);
    if (displaySchedule.isNotEmpty) {
      return displaySchedule.first.amountToPay;
    }
    return plan.totalAmount;
  }

  /// Same 50%-crossing logic as the pickup screen — fully derived from the
  /// real schedule, no hardcoded dates.
  String _shipmentWindowText(InstallmentPlan plan) {
    print('📅 [PAYMENT BREAKDOWN DELIVERY] Computing shipment window...');
    if (plan.schedule.isEmpty) {
      print(
          '📅 [PAYMENT BREAKDOWN DELIVERY] Schedule is empty — cannot compute window');
      return 'once 50% of your installment has been paid';
    }

    final threshold = plan.totalAmount * 0.5;
    print('📅 [PAYMENT BREAKDOWN DELIVERY] 50% threshold = $threshold '
        '(totalAmount=${plan.totalAmount})');

    int crossingIndex = -1;
    for (int i = 0; i < plan.schedule.length; i++) {
      print('📅   [$i] cumulative=${plan.schedule[i].cumulative} '
          'date=${plan.schedule[i].formattedDate}');
      if (plan.schedule[i].cumulative >= threshold) {
        crossingIndex = i;
        break;
      }
    }

    if (crossingIndex == -1) {
      print(
          '📅 [PAYMENT BREAKDOWN DELIVERY] ⚠️ 50% threshold never reached in schedule');
      final lastDate = plan.schedule.last.formattedDate;
      return 'between now and $lastDate';
    }

    final crossingDate = plan.schedule[crossingIndex].formattedDate;
    final startDate = crossingIndex > 0
        ? plan.schedule[crossingIndex - 1].formattedDate
        : (plan.createdAt != null
            ? '${plan.createdAt!.day}/${plan.createdAt!.month}/${plan.createdAt!.year}'
            : crossingDate);

    print('📅 [PAYMENT BREAKDOWN DELIVERY] ✅ Crossing at index $crossingIndex, '
        'window: $startDate to $crossingDate');

    if (startDate == crossingDate) {
      return 'by $crossingDate';
    }
    return 'between $startDate and $crossingDate';
  }

  // ============================================================
  // TERMS MODAL
  // ============================================================

  void _showTermsAndConditions() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.whiteBackground,
              borderRadius: BorderRadius.circular(16),
            ),
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.verified_outlined,
                          color: AppColors.blueBackground, size: 24),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Terms & Conditions Summary',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildTermItem(
                      '1. You must be consistent with your installment to have your item delivered before full payment.'),
                  const SizedBox(height: 12),
                  _buildTermItem(
                      '2. Your PM Profile must be properly filled with your legal names, ID, cards, profile pictures and other documents that we might require for you to have your item delivered before full payment.'),
                  const SizedBox(height: 12),
                  _buildTermItem(
                      '3. Product price and availability remain flexible until shipment is processed.'),
                  const SizedBox(height: 12),
                  _buildTermItem(
                      '4. Before delivery, we may do a quick card or bank check. You are free to start paying with any method you prefer.'),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      print(
                          '🔵 [PAYMENT BREAKDOWN DELIVERY] Terms modal: Instalment Agreement tapped');
                      Navigator.pop(context);
                      context.push(AppRoutes.instalmentAgreement);
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.grey.shade600,
                      padding: EdgeInsets.zero,
                      alignment: Alignment.centerLeft,
                    ),
                    child: const Text(
                      'Read "Pay Small Small" Instalment Agreement',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () {
                          print(
                              '🔵 [PAYMENT BREAKDOWN DELIVERY] Terms modal: See more tapped');
                          Navigator.pop(context);
                          context.push(AppRoutes.termsConditions);
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.grey.shade600,
                        ),
                        child: const Text('See more',
                            style: TextStyle(fontSize: 14)),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () {
                          print(
                              '🔵 [PAYMENT BREAKDOWN DELIVERY] Terms modal: Accept tapped');
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blueBackground,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                              vertical: 12, horizontal: 25),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Accept',
                            style: TextStyle(fontSize: 14)),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTermItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.circle, size: 5, color: AppColors.blueBackground),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.black87,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  // ============================================================
  // ACTION
  // ============================================================

  Future<void> _handlePayment() async {
    final plan = _plan;
    if (plan == null || plan.schedule.isEmpty) {
      print(
          '🔴 [PAYMENT BREAKDOWN DELIVERY] Cannot proceed — plan or schedule missing');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No installment plan available'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    print('🟢 [PAYMENT BREAKDOWN DELIVERY] "Make Payment" TAPPED');
    print('🟢 [PAYMENT BREAKDOWN DELIVERY] Terms accepted: $isChecked');

    setState(() => _isCreatingPlan = true);

    // The plan we've been showing so far only came from /api/installments/calculate,
    // a preview that was never persisted (planId is 0/placeholder). We must
    // create the real, database-backed plan now so we have a valid
    // installmentPlanId and real per-installment row ids to pay against.
    InstallmentPlan persistedPlan;
    try {
      print(
          '📡 [PAYMENT BREAKDOWN DELIVERY] Creating real installment plan before payment...');
      final createdPlan = await _installmentRepository.createInstallmentPlan(
        userId: plan.userId,
        frequency: plan.frequency,
        durationInMonths: plan.durationInMonths,
        // Carry the destination so the plan's delivery fee is priced server-side and
        // shown as part of the first payment, instead of quietly appearing on the charge.
        fulfillmentType: 'DELIVERY',
        deliveryAddress: _extraData['deliveryAddress']?.toString(),
        deliveryStateId: _asId(_extraData['deliveryStateId']),
        deliveryLgaId: _asId(_extraData['deliveryLgaId']),
      );
      persistedPlan = plan.copyWith(
        planId: createdPlan.planId,
        schedule: createdPlan.schedule,
      );
      print(
          '✅ [PAYMENT BREAKDOWN DELIVERY] Installment plan created: planId=${persistedPlan.planId}');
      print(
          '✅ [PAYMENT BREAKDOWN DELIVERY] First installment row id = '
          '${persistedPlan.schedule.isNotEmpty ? persistedPlan.schedule.first.installmentId : "N/A"}');
    } catch (e) {
      print(
          '🔴 [PAYMENT BREAKDOWN DELIVERY] Failed to create installment plan: $e');
      if (!mounted) return;
      setState(() => _isCreatingPlan = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not start installment plan: $e'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!mounted) return;
    setState(() => _isCreatingPlan = false);

    final navExtra = {
      ..._extraData, // carries forward everything: plan + delivery fulfillment details
      'plan': persistedPlan,
      'isDelivery': true,
    };

    print(
        '📦 [PAYMENT BREAKDOWN DELIVERY] Navigating to paymentOption with: $navExtra');
    print('📦 [PAYMENT BREAKDOWN DELIVERY] plan.totalAmount forwarded = '
        '${(navExtra['plan'] as InstallmentPlan).totalAmount}');

    context.push(
      AppRoutes.paymentOption,
      extra: navExtra,
    );

    print('🟢 [PAYMENT BREAKDOWN DELIVERY] Navigation to paymentOption fired.');
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    final plan = _plan;

    if (plan == null) {
      return _buildMissingPlanState();
    }

    final displayPrice = _resolvedProductPrice(plan);
    final installmentAmount = _installmentAmount(plan);
    final unit =
        _frequencyUnit(plan.frequency, plural: plan.durationInMonths != 1);
    final shipmentWindow = _shipmentWindowText(plan);
    final hasDeliveryFee = plan.deliveryFee != null && plan.deliveryFee! > 0;

    print(
        '🔵 [PAYMENT BREAKDOWN DELIVERY] build() -> productName="${plan.productName}", '
        'displayPrice=$displayPrice, installmentAmount=$installmentAmount, '
        'unit=$unit, count=${plan.durationInMonths}, deliveryFee=${plan.deliveryFee}');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Payment Breakdown',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 12),

                  // ================= PRODUCT CARD =================
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(25),
                        topRight: Radius.circular(25),
                        bottomLeft: Radius.circular(20),
                        bottomRight: Radius.circular(20),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          height: 160,
                          alignment: Alignment.center,
                          child: Container(
                            height: 90,
                            width: 90,
                            decoration: BoxDecoration(
                              color: AppColors.blueBackground.withOpacity(0.08),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.inventory_2_outlined,
                              size: 40,
                              color: AppColors.blueBackground,
                            ),
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.blueBackground,
                            borderRadius: const BorderRadius.only(
                              bottomLeft: Radius.circular(20),
                              bottomRight: Radius.circular(20),
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          child: Text(
                            plan.productName,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: AppColors.textLight,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),

                  // ================= PAYMENT INFO =================
                  Text(
                    'You will be paying ₦${_formatCurrency(installmentAmount)} '
                    'for ${plan.durationInMonths} consecutive $unit',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                  ),

                  const SizedBox(height: 30),

                  // ================= SHIPPING INFO =================
                  Text(
                    'Your item will be shipped after making 50% of your '
                    'installment $shipmentWindow',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black87,
                      height: 1.4,
                    ),
                  ),

                  if (hasDeliveryFee) ...[
                    const SizedBox(height: 24),
                    Text(
                      'A delivery fee of ₦${_formatCurrency(plan.deliveryFee!)} will be added',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black87,
                      ),
                    ),
                  ],

                  const SizedBox(height: 30),

                  // ================= AMOUNT SUMMARY CARD =================
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      children: [
                        _buildSummaryLine('Price of item', displayPrice),
                        const SizedBox(height: 8),
                        _buildSummaryLine('Insurance', plan.insurance),
                        if (hasDeliveryFee) ...[
                          const SizedBox(height: 8),
                          _buildSummaryLine('Delivery', plan.deliveryFee!),
                        ],
                        const Divider(height: 20),
                        _buildSummaryLine('Total amount', plan.totalAmount,
                            emphasize: true),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ================= TERMS CHECKBOX =================
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Row(
                      children: [
                        Checkbox(
                          value: isChecked,
                          onChanged: (value) {
                            setState(() {
                              isChecked = value ?? false;
                            });
                            print(
                                '💳 [PAYMENT BREAKDOWN DELIVERY] Terms accepted: $isChecked');
                          },
                          activeColor: AppColors.blueBackground,
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                isChecked = !isChecked;
                              });
                            },
                            child: Text(
                              'I accept PM\'s Terms & Conditions',
                              style: TextStyle(
                                fontSize: 14,
                                color: isChecked
                                    ? AppColors.blueBackground
                                    : Colors.grey,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (isChecked && _plan != null)
                          ? () async {
                              await _handlePayment();
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isChecked
                            ? AppColors.blueBackground
                            : Colors.grey.shade400,
                        foregroundColor: AppColors.textLight,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: isChecked ? 2 : 0,
                      ),
                      child: const Text(
                        'Make Payment',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryLine(String label, double value,
      {bool emphasize = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: emphasize ? 14 : 13,
            fontWeight: emphasize ? FontWeight.w600 : FontWeight.w400,
            color: emphasize ? AppColors.textBlue : Colors.grey,
          ),
        ),
        Text(
          '₦${_formatCurrency(value)}',
          style: TextStyle(
            fontSize: emphasize ? 16 : 13,
            fontWeight: FontWeight.w700,
            color: emphasize ? AppColors.blueBackground : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildMissingPlanState() {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline,
                  size: 48, color: AppColors.blueBackground),
              const SizedBox(height: 16),
              Text(
                'No installment plan was found. Please go back and try again.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textBlue,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => context.pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blueBackground,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Go Back',
                    style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
