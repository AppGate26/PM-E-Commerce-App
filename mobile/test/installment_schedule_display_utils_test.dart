import 'package:flutter_test/flutter_test.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/presentation/payment/screens/payment_frequency/installment_schedule_display_utils.dart';

void main() {
  group('InstallmentDisplayUtils', () {
    test('splits the total across installments without underpaying', () {
      final plan = InstallmentPlan(
        planId: 1,
        userId: 7,
        productId: 10,
        productName: 'Phone',
        productPrice: 130000,
        insurance: 13000,
        totalAmount: 143000,
        frequency: 'MONTHLY',
        durationInMonths: 3,
        schedule: const [],
      );

      final displaySchedule =
          InstallmentDisplayUtils.buildDisplaySchedule(plan);

      expect(displaySchedule.length, 3);
      expect(displaySchedule.first.amountToPay, 47666.67);
      expect(displaySchedule[1].amountToPay, 47666.67);
      expect(displaySchedule.last.amountToPay, 47666.66);
      expect(displaySchedule.last.cumulative, 143000.0);
    });

    test('uses the full total when duration is missing', () {
      final plan = InstallmentPlan(
        planId: 2,
        userId: 7,
        productId: 10,
        productName: 'Watch',
        productPrice: 5000,
        insurance: 500,
        totalAmount: 5500,
        frequency: 'MONTHLY',
        durationInMonths: 0,
        schedule: const [],
      );

      final displaySchedule =
          InstallmentDisplayUtils.buildDisplaySchedule(plan);

      expect(displaySchedule.length, 1);
      expect(displaySchedule.first.amountToPay, 5500.0);
      expect(displaySchedule.first.cumulative, 5500.0);
    });

    test('counts periods on the real calendar, like the backend', () {
      final jan31 = DateTime(2026, 1, 31);
      // Jan 31 + 1 month clamps to Feb 28, not a flat 30 days.
      expect(InstallmentDisplayUtils.periodsFor('DAILY', 1, from: jan31), 28);
      expect(InstallmentDisplayUtils.periodsFor('MONTHLY', 1, from: jan31), 1);

      final apr1 = DateTime(2026, 4, 1);
      // Apr 1 -> Jul 1 is 91 days = 13 full weeks, not 3 x 4.
      expect(InstallmentDisplayUtils.periodsFor('WEEKLY', 3, from: apr1), 13);
      expect(InstallmentDisplayUtils.periodsFor('DAILY', 1, from: apr1), 30);
    });

    test('sends the chosen months, not the payment count, on create', () {
      final daily = InstallmentPlan(
        planId: 3,
        userId: 7,
        productId: 10,
        productName: 'Fan',
        productPrice: 30000,
        insurance: 0,
        totalAmount: 30000,
        frequency: 'DAILY',
        durationInMonths: 30, // payment count from the server
        schedule: const [],
        selectedMonths: 1,
        includeInsurance: false,
      );

      expect(daily.monthsForRequest, 1);
      expect(daily.copyWith(planId: 4).monthsForRequest, 1);
      expect(daily.copyWith(planId: 4).includeInsurance, isFalse);
    });
  });
}
