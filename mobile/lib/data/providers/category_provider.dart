// data/providers/category_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/category_model.dart';
import 'package:pm_e_commerce_app/data/repositories/category_repository.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  return CategoryRepository();
});

final categoriesProvider = NotifierProvider<CategoriesNotifier, AsyncValue<List<CategoryModel>>>(() {
  return CategoriesNotifier();
});

class CategoriesNotifier extends Notifier<AsyncValue<List<CategoryModel>>> {
  @override
  AsyncValue<List<CategoryModel>> build() {
    return const AsyncValue.loading();
  }

  CategoryRepository get _repo => ref.read(categoryRepositoryProvider);

  Future<void> fetchCategories() async {
    state = const AsyncValue.loading();
    try {
      final categories = await _repo.getCategories();
      state = AsyncValue.data(categories);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}