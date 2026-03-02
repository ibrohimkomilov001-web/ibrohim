import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Nominatim (OpenStreetMap) reverse geocoding xizmati
/// geocoding paketi O'zbekiston uchun noto'g'ri natijalar beradi,
/// shuning uchun to'g'ridan-to'g'ri Nominatim API ishlatamiz
class NominatimService {
  static const String _baseUrl = 'https://nominatim.openstreetmap.org';

  /// Koordinatalardan manzil olish (reverse geocoding)
  static Future<NominatimResult> reverseGeocode({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final uri = Uri.parse(
        '$_baseUrl/reverse?format=json&lat=$latitude&lon=$longitude'
        '&zoom=18&addressdetails=1&accept-language=uz,ru',
      );

      final response = await http.get(
        uri,
        headers: {
          'User-Agent': 'TOPLA-App/1.0 (topla.uz)',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return NominatimResult.fromJson(data);
      } else {
        debugPrint('Nominatim xatolik: ${response.statusCode}');
        return NominatimResult.empty(latitude, longitude);
      }
    } catch (e) {
      debugPrint('Nominatim reverse geocoding xato: $e');
      return NominatimResult.empty(latitude, longitude);
    }
  }

  /// Manzil qidirish (forward geocoding)
  static Future<List<NominatimSearchResult>> search(String query) async {
    try {
      final uri = Uri.parse(
        '$_baseUrl/search?format=json&q=${Uri.encodeComponent(query)}'
        '&countrycodes=uz&limit=5&addressdetails=1&accept-language=uz,ru',
      );

      final response = await http.get(
        uri,
        headers: {
          'User-Agent': 'TOPLA-App/1.0 (topla.uz)',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((e) => NominatimSearchResult.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Nominatim search xato: $e');
      return [];
    }
  }
}

/// Reverse geocoding natijasi
class NominatimResult {
  final String displayName;
  final String? road;
  final String? houseNumber;
  final String? neighbourhood;
  final String? suburb;
  final String? city;
  final String? district;
  final String? state;
  final String? country;
  final double latitude;
  final double longitude;

  NominatimResult({
    required this.displayName,
    this.road,
    this.houseNumber,
    this.neighbourhood,
    this.suburb,
    this.city,
    this.district,
    this.state,
    this.country,
    required this.latitude,
    required this.longitude,
  });

  factory NominatimResult.fromJson(Map<String, dynamic> json) {
    final address = json['address'] as Map<String, dynamic>? ?? {};

    return NominatimResult(
      displayName: json['display_name'] ?? '',
      road: address['road'] ?? address['street'],
      houseNumber: address['house_number'],
      neighbourhood: address['neighbourhood'] ?? address['quarter'],
      suburb: address['suburb'] ?? address['city_district'],
      city: address['city'] ?? address['town'] ?? address['village'],
      district: address['county'] ?? address['district'],
      state: address['state'],
      country: address['country'],
      latitude: double.tryParse(json['lat']?.toString() ?? '') ?? 0,
      longitude: double.tryParse(json['lon']?.toString() ?? '') ?? 0,
    );
  }

  factory NominatimResult.empty(double lat, double lon) {
    return NominatimResult(
      displayName: '${lat.toStringAsFixed(6)}, ${lon.toStringAsFixed(6)}',
      latitude: lat,
      longitude: lon,
    );
  }

  /// O'zbek tilidagi qisqa manzil formatlash
  String get shortAddress {
    final parts = <String>[];

    // 1. Viloyat (state)
    if (state != null && state!.isNotEmpty && state != country) {
      parts.add(state!);
    }

    // 2. Tuman (district/county)
    if (district != null && district!.isNotEmpty && district != state) {
      parts.add(district!);
    }

    // 3. Shahar/Qishloq (city/town/village)
    if (city != null && city!.isNotEmpty && city != district && city != state) {
      parts.add(city!);
    }

    // 4. Mahalla
    if (suburb != null && suburb!.isNotEmpty && suburb != city) {
      parts.add(suburb!);
    } else if (neighbourhood != null &&
        neighbourhood!.isNotEmpty &&
        neighbourhood != city &&
        neighbourhood != suburb) {
      parts.add(neighbourhood!);
    }

    // 5. Ko'cha
    if (road != null && road!.isNotEmpty) {
      parts.add(road!);
    }

    // 6. Uy raqami
    if (houseNumber != null && houseNumber!.isNotEmpty) {
      parts.add(houseNumber!);
    }

    if (parts.isEmpty) {
      return displayName.length > 60
          ? '${displayName.substring(0, 60)}...'
          : displayName;
    }

    return parts.join(', ');
  }

  /// Strukturalangan manzil - viloyat, tuman, shahar alohida
  String get structuredAddress {
    final parts = <String>[];

    // 1. Viloyat
    if (state != null && state!.isNotEmpty && state != country) {
      parts.add(state!);
    }

    // 2. Tuman
    if (district != null && district!.isNotEmpty && district != state) {
      parts.add(district!);
    }

    // 3. Shahar/Qishloq
    if (city != null && city!.isNotEmpty && city != district && city != state) {
      parts.add(city!);
    }

    // 4. Mahalla
    if (suburb != null && suburb!.isNotEmpty && suburb != city) {
      parts.add(suburb!);
    } else if (neighbourhood != null &&
        neighbourhood!.isNotEmpty &&
        neighbourhood != city) {
      parts.add(neighbourhood!);
    }

    // 5. Ko'cha va uy
    if (road != null && road!.isNotEmpty) {
      String roadPart = road!;
      if (houseNumber != null && houseNumber!.isNotEmpty) {
        roadPart += ', ${houseNumber!}';
      }
      parts.add(roadPart);
    }

    if (parts.isEmpty) {
      return displayName.length > 80
          ? '${displayName.substring(0, 80)}...'
          : displayName;
    }

    return parts.join(', ');
  }
}

/// Qidiruv natijasi
class NominatimSearchResult {
  final String displayName;
  final double latitude;
  final double longitude;

  NominatimSearchResult({
    required this.displayName,
    required this.latitude,
    required this.longitude,
  });

  factory NominatimSearchResult.fromJson(Map<String, dynamic> json) {
    return NominatimSearchResult(
      displayName: json['display_name'] ?? '',
      latitude: double.tryParse(json['lat']?.toString() ?? '') ?? 0,
      longitude: double.tryParse(json['lon']?.toString() ?? '') ?? 0,
    );
  }
}
