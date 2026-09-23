import 'package:pm_e_commerce_app/data/models/installment_models.dart';

class InstallmentDisplayUtils {
  /// How many payments a plan actually has, matching the backend exactly
  /// (InstallmentService.calculateNumberOfInstallments): a 3-month WEEKLY plan is
  /// 12 payments, not 3.
  ///
  /// This screen used to divide by durationInMonths for every frequency, so a
  /// weekly or daily plan advertised roughly 4x / 30x the amount the server would
  /// actually charge — and on the wallet path the customer confirmed one figure
  /// and had a different one debited.
  static int periodsFor(String frequency, int durationInMonths) {
    final months = durationInMonths > 0 ? durationInMonths : 1;
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        return months * 30;
      case 'WEEKLY':
        return months * 4;
      case 'MONTHLY':
      default:
        return months;
    }
  }

  /// The schedule to show. The server's own schedule wins whenever it sent one —
  /// it is the schedule the customer will actually be charged against.
  static List<InstallmentSchedule> buildDisplaySchedule(InstallmentPlan plan) {
    if (plan.schedule.isNotEmpty) {
      return plan.schedule;
    }

    final count = periodsFor(plan.frequency, plan.durationInMonths);

    final totalMinorUnits = (plan.totalAmount * 100).round();
    final baseAmountMinorUnits = totalMinorUnits ~/ count;
    final remainderMinorUnits = totalMinorUnits % count;

    int runningTotalMinorUnits = 0;
    final firstDueDate = DateTime.now();

    return List.generate(count, (index) {
      final amountMinorUnits =
          baseAmountMinorUnits + (index < remainderMinorUnits ? 1 : 0);
      runningTotalMinorUnits += amountMinorUnits;

      return InstallmentSchedule(
        installmentId: index + 1,
        dateDue: _generateDueDate(firstDueDate, plan.frequency, index),
        amountToPay: (amountMinorUnits / 100).toDouble(),
        cumulative: (runningTotalMinorUnits / 100).toDouble(),
      );
    });
  }

  /// What the customer pays up front: the first installment plus the delivery
  /// fee, which is never financed across the plan and is collected in full with
  /// payment #1 (PaymentGatewayService.resolveOrderChargeAmount does the same sum
  /// server-side). Showing the installment alone under-quoted the first charge.
  static double firstPaymentAmount(InstallmentPlan plan) {
    final schedule = buildDisplaySchedule(plan);
    final firstInstallment =
        schedule.isNotEmpty ? schedule.first.amountToPay : plan.totalAmount;
    return firstInstallment + (plan.deliveryFee ?? 0);
  }

  static DateTime _generateDueDate(
      DateTime startDate, String frequency, int index) {
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        return startDate.add(Duration(days: index));
      case 'WEEKLY':
        return startDate.add(Duration(days: index * 7));
      case 'MONTHLY':
        return DateTime(startDate.year, startDate.month + index, startDate.day);
      default:
        return startDate.add(Duration(days: index));
    }
  }
}
