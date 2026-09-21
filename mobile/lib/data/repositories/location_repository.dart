import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/location_model.dart';

class LocationRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<LocationModel>> getStates() async {
    try {
      print('📍 [LocationRepository] Fetching states...');
      final response = await _apiClient.dio.get(
        ApiConstants.states,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📍 [LocationRepository] States response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> statesData = [];

        if (data['response'] is List) {
          statesData = data['response'] as List<dynamic>;
        } else if (data['data'] is List) {
          statesData = data['data'] as List<dynamic>;
        } else if (data is List) {
          statesData = data;
        }

        return statesData
            .map((json) => LocationModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('❌ [LocationRepository] Error fetching states: $e');
      return [];
    }
  }

  Future<List<LocationModel>> getLgasByStateId(int stateId) async {
    try {
      print('📍 [LocationRepository] Fetching LGAs for state: $stateId');
      final response = await _apiClient.dio.get(
        ApiConstants.lgasByState(stateId),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📍 [LocationRepository] LGAs response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> lgasData = [];

        if (data['response'] is List) {
          lgasData = data['response'] as List<dynamic>;
        } else if (data['data'] is List) {
          lgasData = data['data'] as List<dynamic>;
        } else if (data is List) {
          lgasData = data;
        }

        return lgasData
            .map((json) => LocationModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('❌ [LocationRepository] Error fetching LGAs: $e');
      return [];
    }
  }

  Future<List<LocationModel>> getWardsByLgaId(int lgaId) async {
    try {
      print('📍 [LocationRepository] Fetching wards for LGA: $lgaId');
      final response = await _apiClient.dio.get(
        ApiConstants.wardsByLga(lgaId),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📍 [LocationRepository] Wards response: ${response.data}');

      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> wardsData = [];

        if (data['response'] is List) {
          wardsData = data['response'] as List<dynamic>;
        } else if (data['data'] is List) {
          wardsData = data['data'] as List<dynamic>;
        } else if (data is List) {
          wardsData = data;
        }

        return wardsData
            .map((json) => LocationModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('❌ [LocationRepository] Error fetching wards: $e');
      return [];
    }
  }

  /// ✅ Resolves the first valid state → LGA → ward combo.
  /// Returns Map<String, int> where wardId is included ONLY if found.
  Future<Map<String, int>?> getFirstValidLocation() async {
    print('📍 [LocationRepository] Resolving a valid state/LGA/ward combo...');

    final states = await getStates();
    if (states.isEmpty) {
      print('❌ [LocationRepository] No states returned from API');
      return null;
    }
    final firstState = states.first;
    final stateId = int.tryParse(firstState.id.toString());
    if (stateId == null) {
      print(
          '❌ [LocationRepository] Could not parse state id: ${firstState.id}');
      return null;
    }
    print(
        '📍 [LocationRepository] Using stateId: $stateId (${firstState.name})');

    final lgas = await getLgasByStateId(stateId);
    if (lgas.isEmpty) {
      print('❌ [LocationRepository] No LGAs found for state $stateId');
      return null;
    }
    final firstLga = lgas.first;
    final lgaId = int.tryParse(firstLga.id.toString());
    if (lgaId == null) {
      print('❌ [LocationRepository] Could not parse LGA id: ${firstLga.id}');
      return null;
    }
    print('📍 [LocationRepository] Using lgaId: $lgaId (${firstLga.name})');

    // ✅ Try to get wards, but don't fail if empty
    final wards = await getWardsByLgaId(lgaId);

    // ✅ Build result with only state and LGA (ward is optional)
    final result = <String, int>{
      'stateId': stateId,
      'lgaId': lgaId,
    };

    // ✅ Only add wardId if wards exist and we can parse one
    if (wards.isNotEmpty) {
      final firstWard = wards.first;
      final wardId = int.tryParse(firstWard.id.toString());
      if (wardId != null) {
        result['wardId'] = wardId;
        print(
            '📍 [LocationRepository] Using wardId: $wardId (${firstWard.name})');
      } else {
        print(
            '⚠️ [LocationRepository] Could not parse ward id: ${firstWard.id}');
      }
    } else {
      print(
          '📍 [LocationRepository] No wards found - wardId will be omitted (optional)');
    }

    print('✅ [LocationRepository] Resolved -> $result');
    return result;
  }
}

