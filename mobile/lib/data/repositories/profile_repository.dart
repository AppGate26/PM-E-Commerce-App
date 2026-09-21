// lib/data/repositories/profile_repository.dart
import 'package:dio/dio.dart';
import 'package:pm_e_commerce_app/core/constants/api_constants.dart';
import 'package:pm_e_commerce_app/core/networks/api_client.dart';
import 'package:pm_e_commerce_app/data/models/user_profile_model.dart';

class LocationModel {
  final int id;
  final String name;

  const LocationModel({
    required this.id,
    required this.name,
  });

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      id: json['id'] is String ? int.tryParse(json['id']) ?? 0 : json['id'] ?? 0,
      name: json['name'] ?? '',
    );
  }
}

class ProfileRepository {
  final ApiClient _apiClient = ApiClient();

  Future<UserProfileModel> getUserProfile() async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.userProfile);

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [GET Profile] Status: ${response.statusCode}');
      print('📥 [GET Profile] Full Response: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch profile';
        throw errorMessage;
      }

      final responseData = response.data['response'];
      if (responseData == null) {
        throw 'Invalid response format: missing response field';
      }

      print('✅ [GET Profile] Parsed response data: $responseData');
      print('🔍 [GET Profile] Extracted IDs - stateId: ${responseData['stateId'] ?? responseData['state']}, lgaId: ${responseData['lgaId'] ?? responseData['lga']}, wardId: ${responseData['wardId'] ?? responseData['ward']}');
      
      final profile = UserProfileModel.fromJson(responseData);
      print('✅ [GET Profile] Created UserProfileModel - stateId: ${profile.stateId}, lgaId: ${profile.lgaId}, wardId: ${profile.wardId}');
      return profile;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<UserProfileModel> updateUserProfile(UserProfileModel userProfile) async {
    try {
      // Use the new update endpoint with userId in the path
      final updateUrl = '${ApiConstants.updateUserProfile}/${userProfile.id}';
      final normalizedUrl = ApiConstants.normalizeUrl(updateUrl);
      final payload = userProfile.toJson();

      final response = await _apiClient.dio.put(
        normalizedUrl,
        data: payload,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📤 [PUT Update Profile] URL: $normalizedUrl');
      print('📤 [PUT Update Profile] Payload: $payload');
      print('📤 [PUT Update Profile] Payload IDs - stateId: ${payload['stateId']}, lgaId: ${payload['lgaId']}, wardId: ${payload['wardId']}');
      
      print('📥 [PUT Update Profile] Status: ${response.statusCode}');
      print('📥 [PUT Update Profile] Full Response: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to update profile';
        throw errorMessage;
      }

      final responseData = response.data['response'];
      if (responseData == null) {
        throw 'Invalid response format: missing response field';
      }

      print('✅ [PUT Update Profile] Parsed response data: $responseData');
      print('🔍 [PUT Update Profile] Extracted IDs - stateId: ${responseData['stateId'] ?? responseData['state']}, lgaId: ${responseData['lgaId'] ?? responseData['lga']}, wardId: ${responseData['wardId'] ?? responseData['ward']}');
      
      final updatedProfile = UserProfileModel.fromJson(responseData);
      print('✅ [PUT Update Profile] Created UserProfileModel - stateId: ${updatedProfile.stateId}, lgaId: ${updatedProfile.lgaId}, wardId: ${updatedProfile.wardId}');
      return updatedProfile;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<LocationModel>> getStates() async {
    try {
      final normalizedUrl = ApiConstants.normalizeUrl(ApiConstants.states);
      print('➡️ [States] Fetching from $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [States Response] Status: ${response.statusCode}');
      print('📥 [States Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch states';
        throw errorMessage;
      }

      final list = response.data['response'] as List<dynamic>?;
      if (list == null) throw 'Invalid response format: missing response list';

      final states = list.map((e) => LocationModel.fromJson(e)).toList();
      print('✅ [GET States] Parsed ${states.length} states');
      print('📋 [GET States] State List: ${states.map((s) => '${s.id}:${s.name}').join(', ')}');
      return states;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<LocationModel>> getLgasByStateId(int stateId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.lgasByState(stateId));
      print('➡️ [LGAs] Fetching for stateId=$stateId from $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [LGAs Response] Status: ${response.statusCode}');
      print('📥 [LGAs Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch LGAs';
        throw errorMessage;
      }

      final list = response.data['response'] as List<dynamic>?;
      if (list == null) throw 'Invalid response format: missing response list';

      final lgas = list.map((e) => LocationModel.fromJson(e)).toList();
      print('✅ [GET LGAs] Parsed ${lgas.length} LGAs for stateId=$stateId');
      print('📋 [GET LGAs] LGA List: ${lgas.map((l) => '${l.id}:${l.name}').join(', ')}');
      return lgas;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<LocationModel>> getWardsByLgaId(int lgaId) async {
    try {
      final normalizedUrl =
          ApiConstants.normalizeUrl(ApiConstants.wardsByLga(lgaId));
      print('➡️ [GET Wards] Fetching for lgaId=$lgaId from $normalizedUrl');

      final response = await _apiClient.dio.get(
        normalizedUrl,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      print('📥 [GET Wards Response] Status: ${response.statusCode}');
      print('📥 [GET Wards Response] Data: ${response.data}');

      if (response.statusCode != 200) {
        final errorMessage =
            response.data['message'] ?? 'Failed to fetch wards';
        throw errorMessage;
      }

      final list = response.data['response'] as List<dynamic>?;
      if (list == null) throw 'Invalid response format: missing response list';

      final wards = list.map((e) => LocationModel.fromJson(e)).toList();
      print('✅ [GET Wards] Parsed ${wards.length} wards for lgaId=$lgaId');
      print('📋 [GET Wards] Ward List: ${wards.map((w) => '${w.id}:${w.name}').join(', ')}');
      return wards;
    } on DioException catch (e) {
      print('❌ [GET Wards] DioException for lgaId=$lgaId: ${_handleDioError(e)}');
      throw _handleDioError(e);
    } catch (e) {
      print('❌ [GET Wards] Exception for lgaId=$lgaId: $e');
      rethrow;
    }
  }

  String _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    } else if (e.type == DioExceptionType.receiveTimeout) {
      return 'Request timeout. Please try again.';
    } else if (e.type == DioExceptionType.sendTimeout) {
      return 'Send timeout. Please check your connection.';
    } else if (e.type == DioExceptionType.connectionError) {
      return 'Cannot connect to server. Please check your internet connection.';
    }

    if (e.response != null) {
      final responseData = e.response?.data;

      if (responseData != null && responseData['response'] != null) {
        final validationErrors =
            responseData['response'] as Map<String, dynamic>?;
        if (validationErrors != null && validationErrors.isNotEmpty) {
          final errorMessages = validationErrors.entries
              .map((e) => '${e.key}: ${e.value}')
              .join('\n');
          return errorMessages;
        }
      }

      final errorMessage = responseData?['message'] ??
          responseData?['error'] ??
          'Request failed (Status: ${e.response?.statusCode})';
      return errorMessage;
    } else {
      final errorMsg = e.message ?? 'Network error: ${e.type}';
      return errorMsg;
    }
  }
}