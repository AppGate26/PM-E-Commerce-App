import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/branch_model.dart';

class BranchRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Branch>> getBranches() async {
    try {
      print('🏪 [BranchRepository] Fetching branches...');

      // Try API first
      final response = await _apiClient.dio.get(
        '/api/branches',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('🏪 [BranchRepository] Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> branchesData = [];

        if (data['response'] is List) {
          branchesData = data['response'] as List<dynamic>;
        } else if (data['data'] is List) {
          branchesData = data['data'] as List<dynamic>;
        } else if (data is List) {
          branchesData = data;
        } else if (data['content'] is List) {
          branchesData = data['content'] as List<dynamic>;
        }

        if (branchesData.isNotEmpty) {
          final branches = branchesData
              .map((json) => Branch.fromJson(json as Map<String, dynamic>))
              .toList();

          // ✅ Remove duplicates by ID using Set
          final uniqueBranches =
              branches.fold<List<Branch>>([], (list, branch) {
            if (!list.any((b) => b.id == branch.id)) {
              list.add(branch);
            }
            return list;
          });

          print(
              '✅ [BranchRepository] Found ${uniqueBranches.length} unique branches from API');

          // ✅ If API returns branches, use them (don't mix with hardcoded)
          if (uniqueBranches.isNotEmpty) {
            return uniqueBranches;
          }
        }
      }

      // ✅ Fallback to hardcoded branches
      print('⚠️ [BranchRepository] Using hardcoded branches');
      return _getHardcodedBranches();
    } on DioException catch (e) {
      print('❌ [BranchRepository] API error: ${e.message}');
      return _getHardcodedBranches();
    } catch (e) {
      print('❌ [BranchRepository] Unexpected error: $e');
      return _getHardcodedBranches();
    }
  }

  List<Branch> _getHardcodedBranches() {
    return [
      Branch(
        id: 1,
        name: 'Main Branch - Akpapa',
        address: '27, Lagos Street, Ikeja',
        phone: '08012345678',
        email: 'main@store.com',
        stateId: 1,
        lgaId: 1,
        wardId: 1,
        isActive: true,
      ),
      Branch(
        id: 2,
        name: 'Branch 2 - Abuja',
        address: '28, Abuja Road, Garki',
        phone: '08098765432',
        email: 'branch2@store.com',
        stateId: 2,
        lgaId: 2,
        wardId: 2,
        isActive: true,
      ),
      Branch(
        id: 3,
        name: 'Branch 3 - Port Harcourt',
        address: '29, Port Harcourt, Rumuokwuta',
        phone: '08056789012',
        email: 'branch3@store.com',
        stateId: 3,
        lgaId: 3,
        wardId: 3,
        isActive: true,
      ),
    ];
  }

  Future<Branch?> getBranchById(int id) async {
    try {
      final branches = await getBranches();
      return branches.firstWhere((b) => b.id == id);
    } catch (e) {
      print('❌ [BranchRepository] Failed to get branch: $e');
      return null;
    }
  }
}
