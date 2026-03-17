import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/utils/app_logger.dart';

/// Xavfsiz ma'lumotlarni saqlash uchun servis
///
/// Tokenlar, parollar, maxfiy kalitlar uchun ishlatiladi
class SecureStorageService {
  static const _tag = 'SecureStorage';

  SecureStorageService();

  // Android uchun encrypted shared preferences
  // iOS uchun Keychain
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      sharedPreferencesName: 'topla_secure_prefs',
      preferencesKeyPrefix: 'topla_',
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
      accountName: 'topla_app',
    ),
  );

  // ==================== KEYS ====================
  static const String _keyAuthToken = 'auth_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUserRole = 'user_role';
  static const String _keyBiometricEnabled = 'biometric_enabled';
  static const String _keyPinCode = 'pin_code';
  static const String _keyLastLoginTime = 'last_login_time';

  // ==================== AUTH TOKENS ====================

  /// Auth token saqlash
  Future<void> saveAuthToken(String token) async {
    try {
      await _storage.write(key: _keyAuthToken, value: token);
    } catch (e) {
      AppLogger.e(_tag, 'saveAuthToken error', e);
    }
  }

  /// Auth token olish
  Future<String?> getAuthToken() async {
    try {
      return await _storage.read(key: _keyAuthToken);
    } catch (e) {
      AppLogger.e(_tag, 'getAuthToken error', e);
      return null;
    }
  }

  /// Refresh token saqlash
  Future<void> saveRefreshToken(String token) async {
    try {
      await _storage.write(key: _keyRefreshToken, value: token);
    } catch (e) {
      AppLogger.e(_tag, 'saveRefreshToken error', e);
    }
  }

  /// Refresh token olish
  Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _keyRefreshToken);
    } catch (e) {
      AppLogger.e(_tag, 'getRefreshToken error', e);
      return null;
    }
  }

  // ==================== USER INFO ====================

  /// User ID saqlash
  Future<void> saveUserId(String id) async {
    try {
      await _storage.write(key: _keyUserId, value: id);
    } catch (e) {
      AppLogger.e(_tag, 'saveUserId error', e);
    }
  }

  /// User ID olish
  Future<String?> getUserId() async {
    try {
      return await _storage.read(key: _keyUserId);
    } catch (e) {
      AppLogger.e(_tag, 'getUserId error', e);
      return null;
    }
  }

  /// User role saqlash
  Future<void> saveUserRole(String role) async {
    try {
      await _storage.write(key: _keyUserRole, value: role);
    } catch (e) {
      AppLogger.e(_tag, 'saveUserRole error', e);
    }
  }

  /// User role olish
  Future<String?> getUserRole() async {
    try {
      return await _storage.read(key: _keyUserRole);
    } catch (e) {
      AppLogger.e(_tag, 'getUserRole error', e);
      return null;
    }
  }

  // ==================== BIOMETRIC & PIN ====================

  /// Biometric yoqilganligini saqlash
  Future<void> setBiometricEnabled(bool enabled) async {
    try {
      await _storage.write(
        key: _keyBiometricEnabled,
        value: enabled.toString(),
      );
    } catch (e) {
      AppLogger.e(_tag, 'setBiometricEnabled error', e);
    }
  }

  /// Biometric yoqilganligini olish
  Future<bool> isBiometricEnabled() async {
    try {
      final value = await _storage.read(key: _keyBiometricEnabled);
      return value == 'true';
    } catch (e) {
      AppLogger.e(_tag, 'isBiometricEnabled error', e);
      return false;
    }
  }

  /// PIN kod saqlash (hash qilingan)
  Future<void> savePinCode(String pinHash) async {
    try {
      await _storage.write(key: _keyPinCode, value: pinHash);
    } catch (e) {
      AppLogger.e(_tag, 'savePinCode error', e);
    }
  }

  /// PIN kod olish
  Future<String?> getPinCode() async {
    try {
      return await _storage.read(key: _keyPinCode);
    } catch (e) {
      AppLogger.e(_tag, 'getPinCode error', e);
      return null;
    }
  }

  // ==================== SESSION ====================

  /// Oxirgi login vaqtini saqlash
  Future<void> saveLastLoginTime() async {
    try {
      await _storage.write(
        key: _keyLastLoginTime,
        value: DateTime.now().toIso8601String(),
      );
    } catch (e) {
      AppLogger.e(_tag, 'saveLastLoginTime error', e);
    }
  }

  /// Oxirgi login vaqtini olish
  Future<DateTime?> getLastLoginTime() async {
    try {
      final value = await _storage.read(key: _keyLastLoginTime);
      if (value != null) {
        return DateTime.tryParse(value);
      }
      return null;
    } catch (e) {
      AppLogger.e(_tag, 'getLastLoginTime error', e);
      return null;
    }
  }

  /// Session muddati tugaganligini tekshirish (30 daqiqa)
  Future<bool> isSessionExpired(
      {Duration timeout = const Duration(minutes: 30)}) async {
    final lastLogin = await getLastLoginTime();
    if (lastLogin == null) return true;

    return DateTime.now().difference(lastLogin) > timeout;
  }

  // ==================== CLEAR ====================

  /// Barcha auth ma'lumotlarini o'chirish (logout)
  Future<void> clearAuthData() async {
    try {
      await _storage.delete(key: _keyAuthToken);
      await _storage.delete(key: _keyRefreshToken);
      await _storage.delete(key: _keyUserId);
      await _storage.delete(key: _keyUserRole);
      await _storage.delete(key: _keyLastLoginTime);
    } catch (e) {
      AppLogger.e(_tag, 'clearAuthData error', e);
    }
  }

  /// Barcha ma'lumotlarni o'chirish (app reset)
  Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      AppLogger.e(_tag, 'clearAll error', e);
    }
  }

  // ==================== GENERIC ====================

  /// Umumiy saqlash
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      AppLogger.e(_tag, 'write error', e);
    }
  }

  /// Umumiy o'qish
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      AppLogger.e(_tag, 'read error', e);
      return null;
    }
  }

  /// Umumiy o'chirish
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      AppLogger.e(_tag, 'delete error', e);
    }
  }

  /// Kalit mavjudligini tekshirish
  Future<bool> containsKey(String key) async {
    try {
      return await _storage.containsKey(key: key);
    } catch (e) {
      AppLogger.e(_tag, 'containsKey error', e);
      return false;
    }
  }
}
