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
  /// it is the schedule the customer will actually be charged against. Any part
  /// of the plan's delivery fee its rows don't already carry (e.g. a preview
  /// from /installments/calculate, priced before the address was known) is
  /// spread over the first half of the payments, the same way the backend does.
  static List<InstallmentSchedule> buildDisplaySchedule(InstallmentPlan plan) {
    if (plan.schedule.isNotEmpty) {
      final alreadySpread = plan.schedule
          .fold<double>(0, (sum, s) => sum + (s.deliveryFeePortion ?? 0));
      return spreadDeliveryFee(
          plan.schedule, (plan.deliveryFee ?? 0) - alreadySpread);
    }

    // plan.durationInMonths already holds the server's payment count; only
    // derive it from months when the customer's chosen months are known.
    final count = plan.weeksForRequest != null
        ? plan.weeksForRequest!
        : plan.selectedMonths != null
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

  /// Index of the installment after which the item can be collected: the first
  /// row where the running total reaches 50% of the plan, matching the backend's
  /// "Minimum 50% required" rule (SalesService). Summed from amountToPay because
  /// the server schedule's cumulative field tracks amount paid so far (₦0 before
  /// checkout). A 4-payment plan -> after #2, 3 -> after #2, 6 -> after #3.
  static int shipmentReadyIndex(List<InstallmentSchedule> schedule) {
    if (schedule.isEmpty) return -1;
    final totalMinorUnits = schedule.fold<int>(
        0, (sum, s) => sum + (s.amountToPay * 100).round());
    int runningMinorUnits = 0;
    for (var i = 0; i < schedule.length; i++) {
      runningMinorUnits += (schedule[i].amountToPay * 100).round();
      if (runningMinorUnits * 2 >= totalMinorUnits) return i;
    }
    return schedule.length - 1;
  }

  /// How many leading payments make up the first half of a plan — the ones
  /// that carry the delivery fee. Matches the backend's
  /// InstallmentDeliveryFeeSpread.firstHalfCount: 4 -> 2, 5 -> 3, 1 -> 1.
  static int deliveryPaymentCount(int totalPayments) {
    final half = (totalPayments + 1) ~/ 2;
    return half > 0 ? half : 1;
  }

  /// Adds [deliveryFee] evenly to the payments in the first half of
  /// [schedule], e.g. a ₦100,000 item over 4 months with a ₦3,000 delivery fee
  /// pays ₦25,000 + ₦1,500 in months 1 and 2, then ₦25,000 in months 3 and 4.
  /// Kobo rounding leftover goes on payment #1, like the backend. Returns
  /// [schedule] unchanged when there is nothing to spread.
  static List<InstallmentSchedule> spreadDeliveryFee(
      List<InstallmentSchedule> schedule, double deliveryFee) {
    final feeMinorUnits = (deliveryFee * 100).round();
    if (schedule.isEmpty || feeMinorUnits <= 0) return schedule;

    final count = deliveryPaymentCount(schedule.length);
    final perPaymentMinorUnits = feeMinorUnits ~/ count;
    final leftoverMinorUnits = feeMinorUnits - perPaymentMinorUnits * count;

    double cumulative = 0;
    return List.generate(schedule.length, (index) {
      final row = schedule[index];
      final shareMinorUnits = index < count
          ? perPaymentMinorUnits + (index == 0 ? leftoverMinorUnits : 0)
          : 0;
      final share = shareMinorUnits / 100;
      final amount = row.amountToPay + share;
      cumulative += amount;
      return row.copyWith(
        amountToPay: amount,
        cumulative: cumulative,
        deliveryFeePortion: (row.deliveryFeePortion ?? 0) + share,
      );
    });
  }

  /// What the customer pays up front: payment #1, which already includes its
  /// share of the delivery fee (see [spreadDeliveryFee]) — the same amount
  /// PaymentGatewayService.resolveOrderChargeAmount charges server-side.
  static double firstPaymentAmount(InstallmentPlan plan) {
    final schedule = buildDisplaySchedule(plan);
    return schedule.isNotEmpty
        ? schedule.first.amountToPay
        : plan.totalAmount + (plan.deliveryFee ?? 0);
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
