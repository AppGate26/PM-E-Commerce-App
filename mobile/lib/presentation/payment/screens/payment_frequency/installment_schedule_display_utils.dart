import 'package:pm_e_commerce_app/data/models/installment_models.dart';

class InstallmentDisplayUtils {
  /// How many payments a plan actually has, matching the backend exactly
  /// (InstallmentService.calculateNumberOfInstallments): a 3-month WEEKLY plan is
  /// 13 payments, not 3.
  ///
  /// This screen used to divide by durationInMonths for every frequency, so a
  /// weekly or daily plan advertised roughly 4x / 30x the amount the server would
  /// actually charge — and on the wallet path the customer confirmed one figure
  /// and had a different one debited.
  ///
  /// Counted on the real calendar from [from] (today) to [from] + months, like
  /// the backend: a 3-month WEEKLY plan is 13 full weeks, a 1-month DAILY plan
  /// is the number of days until the same date next month.
  static int periodsFor(String frequency, int durationInMonths,
      {DateTime? from}) {
    final months = durationInMonths > 0 ? durationInMonths : 1;
    final now = from ?? DateTime.now();
    final start = DateTime.utc(now.year, now.month, now.day);
    final end = _addMonthsClamped(start, months);
    final days = end.difference(start).inDays;
    final int periods;
    switch (frequency.toUpperCase()) {
      case 'DAILY':
        periods = days;
        break;
      case 'WEEKLY':
        periods = days ~/ 7;
        break;
      case 'MONTHLY':
      default:
        periods = months;
    }
    return periods > 0 ? periods : 1;
  }

  /// Same month arithmetic as Java's LocalDate.plusMonths: the day is clamped to
  /// the target month's length (Jan 31 + 1 month = Feb 28/29), where Dart's
  /// DateTime constructor would roll over into March.
  static DateTime _addMonthsClamped(DateTime date, int months) {
    final monthIndex = date.month - 1 + months;
    final year = date.year + monthIndex ~/ 12;
    final month = monthIndex % 12 + 1;
    final lastDay = DateTime.utc(year, month + 1, 0).day;
    return DateTime.utc(year, month, date.day > lastDay ? lastDay : date.day);
  }

  /// The schedule to show. The server's own schedule wins whenever it sent one —
  /// it is the schedule the customer will actually be charged against.
  static List<InstallmentSchedule> buildDisplaySchedule(InstallmentPlan plan) {
    if (plan.schedule.isNotEmpty) {
      return plan.schedule;
    }

    // plan.durationInMonths already holds the server's payment count; only
    // derive it from months when the customer's chosen months are known.
    final count = plan.selectedMonths != null
        ? periodsFor(plan.frequency, plan.selectedMonths!)
        : (plan.durationInMonths > 0 ? plan.durationInMonths : 1);

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
