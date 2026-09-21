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
  });
}
