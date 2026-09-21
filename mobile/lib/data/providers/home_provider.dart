// data/providers/home_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/quick_pick_model.dart';
import 'package:pm_e_commerce_app/data/models/popular_product_model.dart';
import 'package:pm_e_commerce_app/data/repositories/home_repository.dart';

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  return HomeRepository();
});

final quickPickProvider = NotifierProvider<QuickPickNotifier, AsyncValue<List<QuickPickModel>>>(() {
  return QuickPickNotifier();
});

final popularProductsProvider = NotifierProvider<PopularProductsNotifier, AsyncValue<List<PopularProductModel>>>(() {
  return PopularProductsNotifier();
});

// data/providers/home_provider.dart

class QuickPickNotifier extends Notifier<AsyncValue<List<QuickPickModel>>> {
  @override
  AsyncValue<List<QuickPickModel>> build() {
    print('🔄 [QuickPickNotifier] Building...');
    return const AsyncValue.loading();
  }

  HomeRepository get _repo => ref.read(homeRepositoryProvider);

  Future<void> fetchQuickPick() async {
    print('🔄 [QuickPickNotifier] Fetching quick pick...');
    state = const AsyncValue.loading();
    try {
      final items = await _repo.getQuickPick();
      print('✅ [QuickPickNotifier] Received ${items.length} items');
      state = AsyncValue.data(items);
    } catch (e, st) {
      print('❌ [QuickPickNotifier] Error: $e');
      state = AsyncValue.error(e, st);
    }
  }
}
class PopularProductsNotifier extends Notifier<AsyncValue<List<PopularProductModel>>> {
  @override
  AsyncValue<List<PopularProductModel>> build() {
    return const AsyncValue.loading();
  }

  HomeRepository get _repo => ref.read(homeRepositoryProvider);

  Future<void> fetchPopularProducts() async {
    state = const AsyncValue.loading();
    try {
      final items = await _repo.getPopularProductsToday();
      state = AsyncValue.data(items);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}