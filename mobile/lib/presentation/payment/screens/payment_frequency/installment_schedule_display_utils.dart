import 'package:pm_e_commerce_app/data/models/installment_models.dart';

class InstallmentDisplayUtils {
  static List<InstallmentSchedule> buildDisplaySchedule(InstallmentPlan plan) {
    final count = plan.durationInMonths > 0 ? plan.durationInMonths : 1;

    final totalMinorUnits = (plan.totalAmount * 100).round();
    final baseAmountMinorUnits = totalMinorUnits ~/ count;
    final remainderMinorUnits = totalMinorUnits % count;

    int runningTotalMinorUnits = 0;
    final firstDueDate =
        plan.schedule.isNotEmpty ? plan.schedule.first.dateDue : DateTime.now();

    return List.generate(count, (index) {
      final amountMinorUnits =
          baseAmountMinorUnits + (index < remainderMinorUnits ? 1 : 0);
      runningTotalMinorUnits += amountMinorUnits;

      final dueDate = index < plan.schedule.length
          ? plan.schedule[index].dateDue
          : _generateDueDate(
              firstDueDate,
              plan.frequency,
              index,
            );

      return InstallmentSchedule(
        installmentId: index + 1,
        dateDue: dueDate,
        amountToPay: (amountMinorUnits / 100).toDouble(),
        cumulative: (runningTotalMinorUnits / 100).toDouble(),
      );
    });
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
