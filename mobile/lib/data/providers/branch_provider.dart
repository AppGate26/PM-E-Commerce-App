import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pm_e_commerce_app/data/models/branch_model.dart';
import 'package:pm_e_commerce_app/data/repositories/branch_repository.dart';

/// Repository Provider
final branchRepositoryProvider =
    Provider<BranchRepository>((ref) => BranchRepository());

/// Branch List Provider
final branchStateProvider =
    NotifierProvider<BranchNotifier, AsyncValue<List<Branch>>>(
  BranchNotifier.new,
);

/// Selected Branch Provider
final selectedBranchProvider =
    NotifierProvider<SelectedBranchNotifier, Branch?>(
  SelectedBranchNotifier.new,
);

/// Selected Branch Notifier
class SelectedBranchNotifier extends Notifier<Branch?> {
  @override
  Branch? build() => null;

  void selectBranch(Branch? branch) {
    state = branch;
  }

  void clearBranch() {
    state = null;
  }
}

/// Branch List Notifier
class BranchNotifier extends Notifier<AsyncValue<List<Branch>>> {
  @override
  AsyncValue<List<Branch>> build() {
    return const AsyncValue.loading();
  }

  BranchRepository get _repo => ref.read(branchRepositoryProvider);

  Future<void> loadBranches() async {
    state = const AsyncValue.loading();

    try {
      final branches = await _repo.getBranches();
      state = AsyncValue.data(branches);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refreshBranches() async {
    await loadBranches();
  }
}