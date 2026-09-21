import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/product_model.dart';
import 'package:pm_e_commerce_app/data/repositories/product_repository.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository();
});

final paymentFlowProductProvider =
    NotifierProvider<PaymentFlowProductNotifier, Map<String, dynamic>?>(
        PaymentFlowProductNotifier.new);

class PaymentFlowProductNotifier extends Notifier<Map<String, dynamic>?> {
  @override
  Map<String, dynamic>? build() => null;

  void setProduct(Map<String, dynamic>? product) => state = product;
}

final productsProvider =
    NotifierProvider<ProductsNotifier, AsyncValue<List<ProductModel>>>(() {
  return ProductsNotifier();
});

final searchSuggestionsProvider = NotifierProvider<SearchSuggestionsNotifier,
    AsyncValue<List<ProductModel>>>(() {
  return SearchSuggestionsNotifier();
});

final productByIdProvider = NotifierProvider.family<ProductByIdNotifier,
    AsyncValue<ProductModel?>, int>((int productId) {
  return ProductByIdNotifier(productId);
});

final productsByCategoryProvider = NotifierProvider.family<
    ProductsByCategoryNotifier,
    AsyncValue<List<ProductModel>>,
    int>((int categoryId) {
  return ProductsByCategoryNotifier(categoryId);
});

class ProductsNotifier extends Notifier<AsyncValue<List<ProductModel>>> {
  @override
  AsyncValue<List<ProductModel>> build() {
    return const AsyncValue.data([]);
  }

  ProductRepository get _repo => ref.read(productRepositoryProvider);

  Future<void> fetchProducts({String? search}) async {
    state = const AsyncValue.loading();
    try {
      final products = await _repo.getAllProducts(search: search);
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> filterByPrice(
      {double? minPrice, double? maxPrice, int? categoryId}) async {
    state = const AsyncValue.loading();
    try {
      final products = await _repo.filterProductsByPrice(
        minPrice: minPrice,
        maxPrice: maxPrice,
        categoryId: categoryId,
      );
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class SearchSuggestionsNotifier
    extends Notifier<AsyncValue<List<ProductModel>>> {
  @override
  AsyncValue<List<ProductModel>> build() {
    return const AsyncValue.data([]);
  }

  ProductRepository get _repo => ref.read(productRepositoryProvider);

  Future<void> search(String query) async {
    state = const AsyncValue.loading();
    try {
      final products = await _repo.getAllProducts(search: query);
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void clear() {
    state = const AsyncValue.data([]);
  }
}

class ProductByIdNotifier extends Notifier<AsyncValue<ProductModel?>> {
  final int productId;

  ProductByIdNotifier(this.productId);

  @override
  AsyncValue<ProductModel?> build() {
    Future.microtask(() => fetchProduct());
    return const AsyncValue.loading();
  }

  ProductRepository get _repo => ref.read(productRepositoryProvider);

  Future<void> fetchProduct() async {
    state = const AsyncValue.loading();
    try {
      final product = await _repo.getProductById(productId);
      state = AsyncValue.data(product);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class ProductsByCategoryNotifier
    extends Notifier<AsyncValue<List<ProductModel>>> {
  final int categoryId;

  ProductsByCategoryNotifier(this.categoryId);

  @override
  AsyncValue<List<ProductModel>> build() {
    Future.microtask(() => fetchProductsByCategory());
    return const AsyncValue.loading();
  }

  ProductRepository get _repo => ref.read(productRepositoryProvider);

  Future<void> fetchProductsByCategory({String? search}) async {
    state = const AsyncValue.loading();
    try {
      final products =
          await _repo.getProductsByCategory(categoryId, search: search);
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
