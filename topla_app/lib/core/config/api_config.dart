import 'package:flutter/foundation.dart';

/// API konfiguratsiya fayli
///
/// Backend server manzili va sozlamalari
///
/// Build command:
/// flutter run --dart-define=API_BASE_URL=http://localhost:3000
/// flutter run --dart-define=API_BASE_URL=https://api.topla.uz (production)
class ApiConfig {
  ApiConfig._();

  /// API Base URL
  /// Debug modda: localhost (adb reverse bilan ishlaydi)
  /// Release modda: production server
  static String get baseUrl {
    const url = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (url.isNotEmpty) return url;

    // Release buildda production URL, debug da localhost
    if (kReleaseMode) {
      return 'https://api.topla.uz';
    }

    // adb reverse tcp:3001 tcp:3001 bilan localhost ishlaydi
    // Emulator va real qurilma uchun bir xil
    return 'http://localhost:3001';
  }

  /// API versiya prefix
  static String get apiPrefix => '/api/v1';

  /// To'liq API URL
  static String get apiUrl => '$baseUrl$apiPrefix';

  /// WebSocket URL
  static String get wsUrl {
    final url = baseUrl.replaceFirst('http', 'ws');
    return url;
  }

  /// Timeout (millisekundlarda)
  static const int connectTimeout = 15000;
  static const int receiveTimeout = 30000;

  /// Retry sozlamalari
  static const int maxRetries = 3;
  static const int retryDelay = 1000; // ms
}
