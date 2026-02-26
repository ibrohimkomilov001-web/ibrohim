import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/services/api_client.dart';

/// Bildirishnomalar xizmati
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final ApiClient _api = ApiClient();

  static const String _notificationPermissionKey =
      'notification_permission_asked';

  /// Ruxsat so'ralganligini tekshirish
  Future<bool> isPermissionAsked() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_notificationPermissionKey) ?? false;
  }

  /// Ruxsat so'ralganligini belgilash
  Future<void> setPermissionAsked() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationPermissionKey, true);
  }

  /// Bildirishnoma ruxsatini so'rash
  Future<bool> requestPermission() async {
    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      await setPermissionAsked();

      return settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
    } catch (e) {
      debugPrint('Bildirishnoma ruxsati xatosi: $e');
      return false;
    }
  }

  /// Joriy ruxsat holatini olish
  Future<AuthorizationStatus> getPermissionStatus() async {
    final settings = await _messaging.getNotificationSettings();
    return settings.authorizationStatus;
  }

  /// FCM tokenini olish
  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      debugPrint('FCM token olishda xatolik: $e');
      return null;
    }
  }

  /// FCM tokenini bazaga saqlash
  Future<void> saveTokenToDatabase() async {
    try {
      final token = await getToken();
      if (token == null) return;

      if (!_api.hasToken) return;

      await _api.post('/auth/fcm-token', body: {
        'fcmToken': token,
        'platform': _api.devicePlatform,
      });

      debugPrint('✅ FCM token saqlandi: ${token.substring(0, 20)}...');
    } catch (e) {
      debugPrint('❌ FCM token saqlashda xatolik: $e');
    }
  }

  /// Token yangilanganda qayta saqlash
  void setupTokenRefreshListener() {
    _messaging.onTokenRefresh.listen((newToken) async {
      debugPrint('🔄 FCM token yangilandi');
      await saveTokenToDatabase();
    });
  }

  /// Foreground xabarlarni tinglash
  void setupForegroundListener(Function(RemoteMessage) onMessage) {
    FirebaseMessaging.onMessage.listen(onMessage);
  }

  /// Background xabar bosilganda
  void setupBackgroundTapListener(Function(RemoteMessage) onMessageTap) {
    FirebaseMessaging.onMessageOpenedApp.listen(onMessageTap);
  }

  /// Ilova yopiq holatda xabar orqali ochilganini tekshirish
  Future<RemoteMessage?> getInitialMessage() async {
    return await _messaging.getInitialMessage();
  }

  /// To'liq sozlash (login bo'lgandan keyin chaqirish kerak)
  Future<void> initialize() async {
    // Token ni bazaga saqlash
    await saveTokenToDatabase();

    // Token yangilanganda qayta saqlash
    setupTokenRefreshListener();
  }
}
