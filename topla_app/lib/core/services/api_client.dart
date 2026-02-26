import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

/// TOPLA Backend API Client
///
/// Barcha HTTP so'rovlar shu class orqali yuboriladi.
/// JWT token avtomatik qo'shiladi.
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final http.Client _client = http.Client();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  String? _accessToken;
  String? _refreshToken;
  String? _deviceName;
  String? _devicePlatform;

  /// Qurilma ma'lumotlarini yuklash
  Future<void> loadDeviceInfo() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final android = await deviceInfo.androidInfo;
        _deviceName = '${android.brand} ${android.model}';
        _devicePlatform = 'android';
      } else if (Platform.isIOS) {
        final ios = await deviceInfo.iosInfo;
        _deviceName = ios.utsname.machine;
        _devicePlatform = 'ios';
      } else {
        _deviceName = 'Unknown';
        _devicePlatform = 'web';
      }
    } catch (e) {
      _deviceName = 'Unknown';
      _devicePlatform = 'android';
    }
  }

  /// Qurilma nomi
  String get deviceName => _deviceName ?? 'Unknown';
  String get devicePlatform => _devicePlatform ?? 'android';

  /// Token'larni saqlash
  Future<void> setTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  /// Token'larni o'qish (app'ga qayta kirganda)
  Future<void> loadTokens() async {
    _accessToken = await _storage.read(key: 'access_token');
    _refreshToken = await _storage.read(key: 'refresh_token');
  }

  /// Token'larni o'chirish (logout)
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  /// Joriy access token
  String? get accessToken => _accessToken;

  /// Token mavjudmi
  bool get hasToken => _accessToken != null && _accessToken!.isNotEmpty;

  /// Headerlarni yasash
  Map<String, String> _headers({bool auth = true, bool json = true}) {
    final headers = <String, String>{};
    if (json) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    if (auth && _accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    // Qurilma ma'lumotlari
    if (_deviceName != null) {
      headers['X-Device-Name'] = _deviceName!;
    }
    if (_devicePlatform != null) {
      headers['X-Device-Platform'] = _devicePlatform!;
    }
    return headers;
  }

  /// To'liq URL yasash
  Uri _uri(String path, [Map<String, dynamic>? queryParams]) {
    final baseUrl = ApiConfig.apiUrl;
    final cleanPath = path.startsWith('/') ? path : '/$path';

    final queryString = <String, String>{};
    queryParams?.forEach((key, value) {
      if (value != null) {
        queryString[key] = value.toString();
      }
    });

    return Uri.parse('$baseUrl$cleanPath')
        .replace(queryParameters: queryString.isEmpty ? null : queryString);
  }

  // ==================== HTTP METHODS ====================

  /// GET so'rov
  Future<ApiResponse> get(
    String path, {
    Map<String, dynamic>? queryParams,
    bool auth = true,
  }) async {
    Future<ApiResponse> doGet() async {
      try {
        final response = await _client
            .get(_uri(path, queryParams), headers: _headers(auth: auth))
            .timeout(Duration(milliseconds: ApiConfig.receiveTimeout));
        return _handleResponse(response);
      } on SocketException {
        throw ApiException('Internet aloqasi yo\'q', statusCode: 0);
      } on TimeoutException {
        throw ApiException('So\'rov vaqti tugadi', statusCode: 408);
      }
    }

    return auth ? _withAutoRefresh(doGet) : doGet();
  }

  /// POST so'rov
  Future<ApiResponse> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    Future<ApiResponse> doPost() async {
      try {
        final response = await _client
            .post(
              _uri(path),
              headers: _headers(auth: auth),
              body: jsonEncode(body ?? {}),
            )
            .timeout(Duration(milliseconds: ApiConfig.receiveTimeout));
        return _handleResponse(response);
      } on SocketException {
        throw ApiException('Internet aloqasi yo\'q', statusCode: 0);
      } on TimeoutException {
        throw ApiException('So\'rov vaqti tugadi', statusCode: 408);
      }
    }

    return auth ? _withAutoRefresh(doPost) : doPost();
  }

  /// PUT so'rov
  Future<ApiResponse> put(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    Future<ApiResponse> doPut() async {
      try {
        final response = await _client
            .put(
              _uri(path),
              headers: _headers(auth: auth),
              body: body != null ? jsonEncode(body) : null,
            )
            .timeout(Duration(milliseconds: ApiConfig.receiveTimeout));
        return _handleResponse(response);
      } on SocketException {
        throw ApiException('Internet aloqasi yo\'q', statusCode: 0);
      } on TimeoutException {
        throw ApiException('So\'rov vaqti tugadi', statusCode: 408);
      }
    }

    return auth ? _withAutoRefresh(doPut) : doPut();
  }

  /// DELETE so'rov
  Future<ApiResponse> delete(
    String path, {
    bool auth = true,
  }) async {
    Future<ApiResponse> doDelete() async {
      try {
        final response = await _client
            .delete(_uri(path), headers: _headers(auth: auth, json: false))
            .timeout(Duration(milliseconds: ApiConfig.receiveTimeout));
        return _handleResponse(response);
      } on SocketException {
        throw ApiException('Internet aloqasi yo\'q', statusCode: 0);
      } on TimeoutException {
        throw ApiException('So\'rov vaqti tugadi', statusCode: 408);
      }
    }

    return auth ? _withAutoRefresh(doDelete) : doDelete();
  }

  /// Multipart (file upload)
  Future<ApiResponse> upload(
    String path, {
    required String filePath,
    String fieldName = 'file',
    Map<String, String>? fields,
    bool auth = true,
  }) async {
    try {
      final request = http.MultipartRequest('POST', _uri(path));

      if (auth && _accessToken != null) {
        request.headers['Authorization'] = 'Bearer $_accessToken';
      }

      request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));

      if (fields != null) {
        request.fields.addAll(fields);
      }

      final streamedResponse = await request
          .send()
          .timeout(Duration(milliseconds: ApiConfig.receiveTimeout * 2));
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Internet aloqasi yo\'q', statusCode: 0);
    } on TimeoutException {
      throw ApiException('Fayl yuklash vaqti tugadi', statusCode: 408);
    }
  }

  // ==================== RESPONSE HANDLING ====================

  ApiResponse _handleResponse(http.Response response) {
    Map<String, dynamic> body;
    try {
      body = response.body.isNotEmpty
          ? jsonDecode(response.body) as Map<String, dynamic>
          : <String, dynamic>{};
    } catch (e) {
      // Server HTML javob qaytargan bo'lishi mumkin (nginx xato sahifasi)
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(
          success: true,
          data: null,
          message: null,
          statusCode: response.statusCode,
        );
      }
      String errorMsg = 'Server xatosi';
      if (response.statusCode == 502) {
        errorMsg = 'Server vaqtincha ishlamayapti';
      }
      if (response.statusCode == 503) errorMsg = 'Server yuklanmoqda';
      if (response.statusCode == 504) errorMsg = 'Server javob bermayapti';
      if (response.statusCode == 413) errorMsg = 'So\'rov hajmi katta';
      throw ApiException(
        errorMsg,
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return ApiResponse(
        success: true,
        data: body['data'],
        message: body['message']?.toString(),
        statusCode: response.statusCode,
      );
    }

    final errorMessage = body['message']?.toString() ??
        body['error']?.toString() ??
        'Xatolik yuz berdi';

    throw ApiException(
      errorMessage,
      statusCode: response.statusCode,
      details: body,
    );
  }

  /// Auto-retry with token refresh for 401 errors
  Future<ApiResponse> _withAutoRefresh(
      Future<ApiResponse> Function() apiCall) async {
    try {
      return await apiCall();
    } on ApiException catch (e) {
      if (e.isUnauthorized && _refreshToken != null) {
        final refreshed = await refreshAccessToken();
        if (refreshed) {
          return await apiCall();
        }
      }
      rethrow;
    }
  }

  /// Token yangilash
  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await _client.post(
        _uri('/auth/refresh'),
        headers: _headers(auth: false),
        body: jsonEncode({'refreshToken': _refreshToken}),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        final data = body['data'] as Map<String, dynamic>;
        await setTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
        return true;
      }
    } catch (e) {
      debugPrint('Token refresh failed: $e');
    }

    await clearTokens();
    return false;
  }

  /// Client'ni yopish
  void dispose() {
    _client.close();
  }
}

// ==================== RESPONSE MODEL ====================

/// API javob modeli
class ApiResponse {
  final bool success;
  final dynamic data;
  final String? message;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    required this.statusCode,
  });

  /// Data'ni List sifatida olish
  List<dynamic> get dataList => data is List ? data as List<dynamic> : [];

  /// Data'ni Map sifatida olish
  Map<String, dynamic> get dataMap =>
      data is Map<String, dynamic> ? data as Map<String, dynamic> : {};

  /// Extract a nested list from data map by key (e.g., 'products', 'orders')
  /// Falls back to dataList if data is already a List
  List<dynamic> nestedList(String key) {
    if (data is Map<String, dynamic>) {
      final nested = (data as Map<String, dynamic>)[key];
      if (nested is List) return nested;
    }
    if (data is List) return data as List<dynamic>;
    return [];
  }
}

// ==================== EXCEPTION ====================

/// API xatosi
class ApiException implements Exception {
  final String message;
  final int statusCode;
  final Map<String, dynamic>? details;

  ApiException(this.message, {this.statusCode = 0, this.details});

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode >= 500;
  bool get isNetworkError => statusCode == 0;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
