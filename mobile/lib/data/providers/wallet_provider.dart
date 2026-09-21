import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/wallet_models.dart';
import 'package:pm_e_commerce_app/data/providers/auth_provider.dart';
import 'package:pm_e_commerce_app/data/repositories/wallet_repository.dart';

final walletRepositoryProvider = Provider<WalletRepository>((ref) => WalletRepository());

final walletStateProvider = NotifierProvider<WalletNotifier, AsyncValue<WalletBalance>>(
  () => WalletNotifier(),
);

final walletTransactionsProvider =
    NotifierProvider<WalletTransactionsNotifier, AsyncValue<List<WalletTransaction>>>(
  () => WalletTransactionsNotifier(),
);

final walletTransferProvider = NotifierProvider<WalletTransferNotifier, AsyncValue<void>>(
  () => WalletTransferNotifier(),
);

class WalletNotifier extends Notifier<AsyncValue<WalletBalance>> {
  @override
  AsyncValue<WalletBalance> build() => const AsyncValue.loading();

  WalletRepository get _repo => ref.read(walletRepositoryProvider);

  Future<void> loadBalance() async {
    final userId = _userId;
    if (userId == null) {
      state = AsyncValue.error('User not authenticated', StackTrace.current);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final balance = await _repo.getBalance(userId);
      state = AsyncValue.data(balance);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  int? get _userId {
    final authState = ref.read(authProvider);
    return authState.hasValue ? authState.value?.id : null;
  }
}

class WalletTransactionsNotifier extends Notifier<AsyncValue<List<WalletTransaction>>> {
  @override
  AsyncValue<List<WalletTransaction>> build() => const AsyncValue.loading();

  WalletRepository get _repo => ref.read(walletRepositoryProvider);

  Future<void> loadTransactions() async {
    final userId = _userId;
    if (userId == null) {
      state = AsyncValue.error('User not authenticated', StackTrace.current);
      return;
    }

    state = const AsyncValue.loading();
    try {
      final txs = await _repo.getTransactions(userId);
      state = AsyncValue.data(txs);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  int? get _userId {
    final authState = ref.read(authProvider);
    return authState.hasValue ? authState.value?.id : null;
  }
}

class WalletTransferNotifier extends Notifier<AsyncValue<void>> {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  WalletRepository get _repo => ref.read(walletRepositoryProvider);

  Future<bool> transfer(WalletTransferRequest request, double availableBalance) async {
    if (request.amount > availableBalance) {
      state = AsyncValue.error('Insufficient balance', StackTrace.current);
      return false;
    }

    state = const AsyncValue.loading();
    try {
      await _repo.transferFunds(request);
      state = const AsyncValue.data(null);
      // Refresh balance & tx list
      await ref.read(walletStateProvider.notifier).loadBalance();
      await ref.read(walletTransactionsProvider.notifier).loadTransactions();
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}
