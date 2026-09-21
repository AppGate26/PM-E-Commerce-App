import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pm_e_commerce_app/core/routes/routes_name.dart';
import 'package:pm_e_commerce_app/core/theme/app_colors.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';

class InstallmentBreakDownDeliveryScreen extends StatefulWidget {
  const InstallmentBreakDownDeliveryScreen({super.key});

  @override
  State<InstallmentBreakDownDeliveryScreen> createState() =>
      _InstallmentBreakDownDeliveryScreenState();
}

class _InstallmentBreakDownDeliveryScreenState
    extends State<InstallmentBreakDownDeliveryScreen> {
  Map<String, dynamic> _extraData = {};
  InstallmentPlan? _plan;
  bool _extraRead = false;
  bool _termsAccepted = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_extraRead) {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      if (extra != null) {
        _extraData = Map<String, dynamic>.from(extra);
        _plan = extra['plan'] as InstallmentPlan?;
      }
      _extraRead = true;
      print(
          '💳 [INSTALLMENT BREAKDOWN DELIVERY] ===== didChangeDependencies =====');
      print(
          '💳 [INSTALLMENT BREAKDOWN DELIVERY] Plan received: planId=${_plan?.planId}');
      print('💳 [INSTALLMENT BREAKDOWN DELIVERY] Full extra data: $_extraData');

      if (_plan != null) {
        final plan = _plan!;
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] productName  = "${plan.productName}"');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] productPrice (raw from model) = ${plan.productPrice}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] insurance    = ${plan.insurance}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] deliveryFee  = ${plan.deliveryFee}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] totalAmount  = ${plan.totalAmount}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] frequency    = ${plan.frequency}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] duration     = ${plan.durationInMonths}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] schedule.length = ${plan.schedule.length}');
        print(
            '🟩 [INSTALLMENT BREAKDOWN DELIVERY] resolved displayProductPrice = ${_resolvedProductPrice(plan)}');

        // Log fulfillment details passed from the delivery form
        print(
            '🟦 [INSTALLMENT BREAKDOWN DELIVERY] deliveryAddress = ${_extraData['deliveryAddress']}');
        print(
            '🟦 [INSTALLMENT BREAKDOWN DELIVERY] deliveryState   = ${_extraData['deliveryState']}');
        print(
            '🟦 [INSTALLMENT BREAKDOWN DELIVERY] deliveryLga     = ${_extraData['deliveryLga']}');
        print(
            '🟦 [INSTALLMENT BREAKDOWN DELIVERY] deliveryPhone   = ${_extraData['deliveryPhone']}');
      } else {
        print('🔴 [INSTALLMENT BREAKDOWN DELIVERY] ⚠️ NO PLAN in extra!');
      }
    }
  }

  String _formatCurrency(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (match) => '${match[1]},',
        );
  }

  /// ✅ Safety-net fallback: if plan.productPrice is 0 (e.g. from a stale
  /// hot-reload or an inconsistent backend response), derive it from the
  /// known-good totalAmount and insurance/deliveryFee values instead —
  /// since totalAmount = productPrice + insurance + deliveryFee. This
  /// never overrides a valid non-zero productPrice.
  double _resolvedProductPrice(InstallmentPlan plan) {
    if (plan.productPrice > 0) {
      return plan.productPrice;
    }
    final fee = plan.deliveryFee ?? 0.0;
    final derived = plan.totalAmount - plan.insurance - fee;
    print(
        '🟡 [INSTALLMENT BREAKDOWN DELIVERY] productPrice was 0 — derived fallback '
        '= totalAmount(${plan.totalAmount}) - insurance(${plan.insurance}) - deliveryFee($fee) = $derived');
    return derived > 0 ? derived : 0.0;
  }

  String _insuranceLabel(InstallmentPlan plan) {
    final price = _resolvedProductPrice(plan);
    if (price <= 0 || plan.insurance <= 0) return 'Insurance';
    final pct = (plan.insurance / price) * 100;
    final pctStr = pct == pct.roundToDouble()
        ? pct.toStringAsFixed(0)
        : pct.toStringAsFixed(1);
    return 'Insurance ($pctStr%)';
  }

  String _durationUnitLabel(String frequency, int count) {
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        return count == 1 ? 'DAY' : 'DAYS';
      case 'WEEKLY':
        return count == 1 ? 'WEEK' : 'WEEKS';
      case 'MONTHLY':
        return count == 1 ? 'MONTH' : 'MONTHS';
      default:
        return count == 1 ? 'PAYMENT' : 'PAYMENTS';
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _plan;

    if (plan == null) {
      print(
          '🔴 [INSTALLMENT BREAKDOWN DELIVERY] build() -> showing MISSING PLAN state');
      return _buildMissingPlanState();
    }

    final displayProductPrice = _resolvedProductPrice(plan);
    final unitLabel = _durationUnitLabel(plan.frequency, plan.durationInMonths);

    print(
        '🔵 [INSTALLMENT BREAKDOWN DELIVERY] build() -> productName="${plan.productName}", '
        'displayProductPrice=$displayProductPrice, totalAmount=${plan.totalAmount}');
    print(
        '🔵 [INSTALLMENT BREAKDOWN DELIVERY] build() -> frequency=${plan.frequency}, '
        'count=${plan.durationInMonths}, unitLabel=$unitLabel');

    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon:
              const Icon(Icons.arrow_back_ios_new, color: AppColors.textLight),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Installment Breakdown',
          style: TextStyle(
            color: AppColors.textLight,
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 14),
              margin: const EdgeInsets.only(top: 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: AppColors.whiteBackground,
              ),
              child: Column(
                children: [
                  // ================= PLAN SUMMARY =================
                  Column(
                    children: [
                      Text(
                        'YOUR INSTALLMENT BREAKDOWN',
                        style: TextStyle(
                          color: AppColors.textBlue,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 30),
                      _buildItemRow('Item of Purchase', plan.productName),
                      const SizedBox(height: 20),
                      _buildItemRow(
                        'Price of Item',
                        '₦${_formatCurrency(displayProductPrice)}',
                      ),
                      const SizedBox(height: 20),
                      _buildItemRow(
                        _insuranceLabel(plan),
                        '₦${_formatCurrency(plan.insurance)}',
                      ),
                      if (plan.deliveryFee != null &&
                          plan.deliveryFee! > 0) ...[
                        const SizedBox(height: 20),
                        _buildItemRow(
                          'Delivery',
                          '₦${_formatCurrency(plan.deliveryFee!)}',
                        ),
                      ],
                      const SizedBox(height: 30),
                      Divider(color: AppColors.textBlue),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            vertical: 2, horizontal: 10),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total', style: TextStyle(fontSize: 16)),
                            Text(
                              '₦${_formatCurrency(plan.totalAmount)}',
                              style: const TextStyle(fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                      Divider(color: AppColors.textBlue),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ================= FULFILLMENT DETAILS =================
                  _buildFulfillmentCard(),

                  const SizedBox(height: 20),

                  // ================= DURATION NOTICE =================
                  Container(
                    width: double.infinity,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 2, vertical: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'YOU CHOSE TO SPREAD YOUR PAYMENT OVER '
                          '${plan.durationInMonths} $unitLabel',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.blueBackground,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'HERE IS THE PAYMENT BREAKDOWN',
                          style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ================= SCHEDULE TABLE =================
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.whiteBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 12, horizontal: 8),
                          decoration: BoxDecoration(
                            color: AppColors.blueBackground,
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(12),
                              topRight: Radius.circular(12),
                            ),
                          ),
                          child: const Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: Text('S/N',
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 10)),
                              ),
                              Expanded(
                                flex: 3,
                                child: Text('DATE DUE',
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 10)),
                              ),
                              Expanded(
                                flex: 4,
                                child: Text('AMOUNT',
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 10)),
                              ),
                              Expanded(
                                flex: 4,
                                child: Text('CUMULATIVE',
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 10)),
                              ),
                            ],
                          ),
                        ),
                        if (plan.schedule.isNotEmpty)
                          ...plan.schedule.asMap().entries.map((entry) {
                            final index = entry.key;
                            final schedule = entry.value;
                            final isHighlighted =
                                index == (plan.schedule.length / 2).floor();

                            if (isHighlighted) {
                              return Column(
                                children: [
                                  _buildTableRow(
                                    '${index + 1}',
                                    schedule.formattedDate,
                                    '₦${_formatCurrency(schedule.amountToPay)}',
                                    '₦${_formatCurrency(schedule.cumulative)}',
                                  ),
                                  Container(
                                    width: double.infinity,
                                    color: AppColors.lightBlueBackground,
                                    padding: const EdgeInsets.all(10),
                                    child: Text(
                                      'YOU CAN GET YOUR SHIPPMENT HERE',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.textBlue,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ],
                              );
                            }
                            return _buildTableRow(
                              '${index + 1}',
                              schedule.formattedDate,
                              '₦${_formatCurrency(schedule.amountToPay)}',
                              '₦${_formatCurrency(schedule.cumulative)}',
                            );
                          })
                        else
                          _buildTableRow('1', 'N/A', '₦0', '₦0'),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

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
                          value: _termsAccepted,
                          onChanged: (value) {
                            setState(() {
                              _termsAccepted = value ?? false;
                            });
                            print(
                                '🔵 [INSTALLMENT BREAKDOWN DELIVERY] Terms accepted: $_termsAccepted');
                          },
                          activeColor: AppColors.blueBackground,
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _termsAccepted = !_termsAccepted;
                              });
                            },
                            child: Text(
                              'I accept PM\'s Terms & Conditions',
                              style: TextStyle(
                                fontSize: 14,
                                color: _termsAccepted
                                    ? AppColors.blueBackground
                                    : Colors.grey,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ================= PROCEED BUTTON =================
                  Align(
                    alignment: Alignment.topRight,
                    child: SizedBox(
                      width: 180,
                      child: ElevatedButton(
                        onPressed: _termsAccepted ? () => _proceed(plan) : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _termsAccepted
                              ? AppColors.blueBackground
                              : Colors.grey.shade400,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Proceed to pay',
                            style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _proceed(InstallmentPlan plan) {
    print('🟢 [INSTALLMENT BREAKDOWN DELIVERY] "Proceed to pay" TAPPED');
    print(
        '🟢 [INSTALLMENT BREAKDOWN DELIVERY] Forwarding full data: $_extraData');

    final navExtra = {
      ..._extraData, // carries plan + all delivery fulfillment details forward
      'plan': plan,
      'isDelivery': true,
      'termsAccepted': true,
    };

    print(
        '📦 [INSTALLMENT BREAKDOWN DELIVERY] Final data pushed to payment breakdown: $navExtra');
    print(
        '📦 [INSTALLMENT BREAKDOWN DELIVERY] plan.totalAmount in pushed data = '
        '${(navExtra['plan'] as InstallmentPlan).totalAmount}');

    context.push(
      AppRoutes.paymentFreqBreakdownDelivery,
      extra: navExtra,
    );

    print(
        '🟢 [INSTALLMENT BREAKDOWN DELIVERY] Navigation to paymentFreqBreakdownDelivery fired.');
  }

  Widget _buildFulfillmentCard() {
    final address = _extraData['deliveryAddress']?.toString();
    final state = _extraData['deliveryState']?.toString();
    final lga = _extraData['deliveryLga']?.toString();
    final phone = _extraData['deliveryPhone']?.toString();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.lightBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_shipping_outlined,
                  size: 18, color: AppColors.blueBackground),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  'Delivery Details',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textBlue,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (address != null && address.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                'Address: $address',
                style: const TextStyle(fontSize: 12, color: Colors.black87),
              ),
            ),
          if ((state != null && state.isNotEmpty) ||
              (lga != null && lga.isNotEmpty))
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                'Location: ${[
                  lga,
                  state
                ].where((e) => e != null && e.isNotEmpty).join(', ')}',
                style: const TextStyle(fontSize: 12, color: Colors.black87),
              ),
            ),
          if (phone != null && phone.isNotEmpty)
            Text(
              'Phone: $phone',
              style: const TextStyle(fontSize: 12, color: Colors.black87),
            ),
          if ((address == null || address.isEmpty) &&
              (state == null || state.isEmpty) &&
              (lga == null || lga.isEmpty) &&
              (phone == null || phone.isEmpty))
            const Text(
              'No delivery details available.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
        ],
      ),
    );
  }

  /// ✅ FIX — overflow: label and value are now Flexible instead of
  /// unconstrained widths inside a spaceBetween Row, so a long product
  /// name never pushes the value off-screen.
  Widget _buildItemRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Flexible(
          flex: 5,
          child: Text(
            label,
            style: const TextStyle(fontSize: 14),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          flex: 5,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            overflow: TextOverflow.ellipsis,
            maxLines: 2,
          ),
        ),
      ],
    );
  }

  Widget _buildTableRow(
      String sn, String date, String amount, String cumulative) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.lightBackground, width: 1),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(sn,
                style: const TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.w500,
                    fontSize: 13)),
          ),
          Expanded(
            flex: 3,
            child: Text(date,
                style: const TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.w500,
                    fontSize: 12)),
          ),
          Expanded(
            flex: 4,
            child: Text(
              amount,
              style: const TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                  fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              cumulative,
              style: const TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                  fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissingPlanState() {
    return Scaffold(
      backgroundColor: AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: AppColors.blueBackground,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon:
              const Icon(Icons.arrow_back_ios_new, color: AppColors.textLight),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Installment Breakdown',
          style: TextStyle(
            color: AppColors.textLight,
            fontSize: 18,
            fontWeight: FontWeight.w500,
          ),
        ),
        centerTitle: true,
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
                'No installment plan data available. Please go back and try again.',
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
