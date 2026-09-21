// lib/data/providers/installment_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/installment_models.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/installment_repository.dart';

final installmentRepositoryProvider = Provider<InstallmentRepository>((ref) {
  return InstallmentRepository();
});

final installmentCalculateProvider = NotifierProvider<InstallmentCalculateNotifier, AsyncValue<InstallmentPlan?>>(() {
  return InstallmentCalculateNotifier();
});

final installmentPayProvider = NotifierProvider<InstallmentPayNotifier, AsyncValue<void>>(() {
  return InstallmentPayNotifier();
});

final userInstallmentsProvider = NotifierProvider<UserInstallmentsNotifier, AsyncValue<List<UserInstallment>>>(
  () => UserInstallmentsNotifier(),
);

final upcomingInstallmentsProvider = NotifierProvider<UpcomingInstallmentsNotifier, AsyncValue<List<InstallmentSchedule>>>(
  () => UpcomingInstallmentsNotifier(),
);

class InstallmentCalculateNotifier extends Notifier<AsyncValue<InstallmentPlan?>> {
  @override
  AsyncValue<InstallmentPlan?> build() {
    return const AsyncValue.data(null);
  }

  InstallmentRepository get _repo => ref.read(installmentRepositoryProvider);

  Future<void> calculate(InstallmentCalculateRequest request) async {
    state = const AsyncValue.loading();
    try {
      print('💳 [INSTALLMENT PROVIDER] ========== CALCULATE INSTALLMENT ==========');
      print('💳 [INSTALLMENT PROVIDER] Request object received');
      print('💳 [INSTALLMENT PROVIDER] orderId: ${request.orderId}');
      print('💳 [INSTALLMENT PROVIDER] userId: ${request.userId}');
      print('💳 [INSTALLMENT PROVIDER] productId: ${request.productId}');
      print('💳 [INSTALLMENT PROVIDER] productPrice: ${request.productPrice}');
      print('💳 [INSTALLMENT PROVIDER] frequency: ${request.frequency}');
      print('💳 [INSTALLMENT PROVIDER] durationInMonths: ${request.durationInMonths}');
      
      final requestJson = request.toJson();
      print('💳 [INSTALLMENT PROVIDER] Request.toJson() in provider: $requestJson');
      print('💳 [INSTALLMENT PROVIDER] Calling repository...');
      
      final plan = await _repo.calculateInstallment(request);
      
      print('💳 [INSTALLMENT PROVIDER] ✅ Plan calculated successfully!');
      print('💳 [INSTALLMENT PROVIDER] Plan ID: ${plan.planId}');
      print('💳 [INSTALLMENT PROVIDER] Total Amount: ${plan.totalAmount}');
      print('💳 [INSTALLMENT PROVIDER] Schedule items: ${plan.schedule.length}');
      print('💳 [INSTALLMENT PROVIDER] ===========================================');
      state = AsyncValue.data(plan);
    } catch (e, st) {
      print('💳 [INSTALLMENT PROVIDER] ❌ Error calculating: $e');
      print('💳 [INSTALLMENT PROVIDER] Error type: ${e.runtimeType}');
      print('💳 [INSTALLMENT PROVIDER] Stack trace: $st');
      state = AsyncValue.error(e, st);
    }
  }

  void clear() {
    state = const AsyncValue.data(null);
  }
}

class InstallmentPayNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() {
    return const AsyncValue.data(null);
  }

  InstallmentRepository get _repo => ref.read(installmentRepositoryProvider);

  Future<bool> pay(int installmentId) async {
    state = const AsyncValue.loading();
    try {
      print('💳 [INSTALLMENT PROVIDER] Paying installment: installmentId=$installmentId');
      
      await _repo.payInstallment(installmentId);
      
      print('💳 [INSTALLMENT PROVIDER] Installment paid successfully');
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      print('💳 [INSTALLMENT PROVIDER] Error paying installment: $e');
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

class UserInstallmentsNotifier extends Notifier<AsyncValue<List<UserInstallment>>> {
  @override
  AsyncValue<List<UserInstallment>> build() {
    return const AsyncValue.data([]);
  }

  InstallmentRepository get _repo => ref.read(installmentRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    return user?.id;
  }

  Future<void> loadUserInstallments() async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      print('💳 [INSTALLMENT PROVIDER] Loading user installments: userId=$userId');
      final installments = await _repo.getUserInstallments(userId);
      print('💳 [INSTALLMENT PROVIDER] Loaded ${installments.length} user installments');
      state = AsyncValue.data(installments);
    } catch (e, st) {
      print('💳 [INSTALLMENT PROVIDER] Error loading user installments: $e');
      state = AsyncValue.error(e, st);
    }
  }
}

class UpcomingInstallmentsNotifier extends Notifier<AsyncValue<List<InstallmentSchedule>>> {
  @override
  AsyncValue<List<InstallmentSchedule>> build() {
    return const AsyncValue.data([]);
  }

  InstallmentRepository get _repo => ref.read(installmentRepositoryProvider);

  int? get _userId {
    final authState = ref.read(authProvider);
    final user = authState.hasValue ? authState.value : null;
    return user?.id;
  }

  Future<void> loadUpcomingInstallments() async {
    final userId = _userId;
    if (userId == null || userId == 0) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    try {
      print('💳 [INSTALLMENT PROVIDER] Loading upcoming installments: userId=$userId');
      final schedule = await _repo.getUserUpcomingInstallments(userId);
      print('💳 [INSTALLMENT PROVIDER] Loaded ${schedule.length} upcoming installments');
      state = AsyncValue.data(schedule);
    } catch (e, st) {
      print('💳 [INSTALLMENT PROVIDER] Error loading upcoming installments: $e');
      state = AsyncValue.error(e, st);
    }
  }
}

