import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:http/http.dart' as http;

class LocationService {
  // 👉 Paste your real Google Maps API key here
  static const String _googleApiKey =
      'AIzaSyCRHTVNREdsEVBZE-p3hpAeVS8pOjp7fac'; 

  /// Get current GPS position
  static Future<Position?> getCurrentPosition() async {
    debugPrint(
        '📍 [LocationService] Checking if location service is enabled...');

    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('❌ [LocationService] Location services are DISABLED');
      return null;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    debugPrint('📍 [LocationService] Current permission status: $permission');

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      debugPrint('📍 [LocationService] Permission after request: $permission');

      if (permission == LocationPermission.denied) {
        debugPrint('❌ [LocationService] User denied location permission');
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('❌ [LocationService] Location permission permanently denied');
      return null;
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      debugPrint('✅ [LocationService] Position obtained');
      debugPrint('   → Latitude : ${position.latitude}');
      debugPrint('   → Longitude: ${position.longitude}');

      return position;
    } catch (e) {
      debugPrint('❌ [LocationService] Failed to get position: $e');
      return null;
    }
  }

  /// Convert coordinates → human readable address
  /// First tries Google Geocoding API (reliable), then falls back to platform geocoder
  static Future<String?> getAddressFromLatLng(double lat, double lng) async {
    // 1. Try Google Geocoding API first (recommended)
    try {
      debugPrint('📍 [LocationService] Trying Google Geocoding API...');

      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/geocode/json'
        '?latlng=$lat,$lng'
        '&key=$_googleApiKey',
      );

      final response = await http.get(url).timeout(const Duration(seconds: 10));

      debugPrint(
          '📍 [LocationService] Google Geocode status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['status'] == 'OK' && data['results'].isNotEmpty) {
          final address = data['results'][0]['formatted_address'] as String;
          debugPrint('✅ [LocationService] Google address: $address');
          return address;
        } else {
          debugPrint(
              '⚠️ [LocationService] Google Geocode status: ${data['status']}');
        }
      }
    } catch (e) {
      debugPrint('⚠️ [LocationService] Google Geocoding failed: $e');
    }

    // 2. Fallback to platform geocoder
    try {
      debugPrint('📍 [LocationService] Falling back to platform geocoder...');
      final placemarks = await placemarkFromCoordinates(lat, lng);

      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        final address = [
          place.street,
          place.subLocality,
          place.locality,
          place.administrativeArea,
          place.country,
        ].where((part) => part != null && part.trim().isNotEmpty).join(', ');

        debugPrint('✅ [LocationService] Platform address: $address');
        return address;
      }
    } catch (e) {
      debugPrint('❌ [LocationService] Platform geocoder also failed: $e');
    }

    return null;
  }
}
