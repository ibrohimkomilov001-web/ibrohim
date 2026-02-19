import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../core/services/api_client.dart';
import '../main.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Handle background messages
  debugPrint('Background message: ${message.messageId}');
}

/// Push notification service
class PushNotificationService {
  static final PushNotificationService _instance =
      PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  // Notification channels
  static const AndroidNotificationChannel _orderChannel =
      AndroidNotificationChannel(
    'orders_channel',
    'Buyurtmalar',
    description: 'Buyurtma holati haqida bildirishnomalar',
    importance: Importance.high,
    playSound: true,
  );

  static const AndroidNotificationChannel _promoChannel =
      AndroidNotificationChannel(
    'promo_channel',
    'Aksiyalar',
    description: 'Chegirmalar va aksiyalar haqida bildirishnomalar',
    importance: Importance.defaultImportance,
  );

  static const AndroidNotificationChannel _generalChannel =
      AndroidNotificationChannel(
    'general_channel',
    'Umumiy',
    description: 'Umumiy bildirishnomalar',
    importance: Importance.defaultImportance,
  );

  /// Initialize push notifications
  Future<void> initialize() async {
    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus != AuthorizationStatus.authorized) {
      debugPrint('User declined push notifications');
      return;
    }

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Get FCM token
    _fcmToken = await _messaging.getToken();
    debugPrint('FCM Token received (length: ${_fcmToken?.length ?? 0})');

    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_onTokenRefresh);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background message taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Check if app was opened from notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageOpenedApp(initialMessage);
    }

    // Save token to server
    await _saveTokenToServer();
  }

  Future<void> _initializeLocalNotifications() async {
    // Android settings
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channels for Android
    final androidPlugin =
        _localNotifications.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(_orderChannel);
      await androidPlugin.createNotificationChannel(_promoChannel);
      await androidPlugin.createNotificationChannel(_generalChannel);
    }
  }

  void _onTokenRefresh(String token) {
    _fcmToken = token;
    _saveTokenToServer();
  }

  Future<void> _saveTokenToServer() async {
    if (_fcmToken == null) return;

    try {
      final api = ApiClient();
      if (!api.hasToken) return;

      await api.post('/auth/fcm-token', body: {
        'fcmToken': _fcmToken,
        'platform': _getPlatform(),
      });
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  String _getPlatform() {
    // Platform ni aniqlash
    // Flutter Web uchun 'web', iOS uchun 'ios', boshqa hollarda 'android'
    try {
      if (identical(0, 0.0)) {
        // Web platformada
        return 'web';
      }
    } catch (_) {}
    // defaultTargetPlatform orqali aniqlash
    return defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    // Show local notification
    _showLocalNotification(
      title: notification.title ?? 'TOPLA',
      body: notification.body ?? '',
      payload: jsonEncode(message.data),
      channelId: _getChannelForType(message.data['type']),
    );
  }

  void _handleMessageOpenedApp(RemoteMessage message) {
    debugPrint('Message opened app: ${message.data}');
    _navigateFromNotification(message.data);
  }

  void _onNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!) as Map<String, dynamic>;
        _navigateFromNotification(data);
      } catch (e) {
        debugPrint('Error parsing notification payload: $e');
      }
    }
  }

  void _navigateFromNotification(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    debugPrint('Navigate from notification: type=$type, id=$id');

    final navigator = ToplaApp.navigatorKey.currentState;
    if (navigator == null) {
      debugPrint('Navigator not ready, skipping notification navigation');
      return;
    }

    switch (type) {
      case 'order':
      case 'order_status':
        navigator.pushNamed('/orders');
        break;
      case 'return':
      case 'return_status':
        navigator.pushNamed('/returns');
        break;
      case 'promo':
      case 'sale':
        // Ana sahifaga o'tish (aksiyalar tab'iga)
        navigator.pushNamed('/main');
        break;
      case 'referral':
        navigator.pushNamed('/invite');
        break;
      case 'chat':
      case 'message':
        navigator.pushNamed('/help');
        break;
      default:
        // Noma'lum turdagi bildirishnoma — asosiy sahifaga
        navigator.pushNamed('/main');
        break;
    }
  }

  String _getChannelForType(String? type) {
    switch (type) {
      case 'order':
      case 'order_status':
        return _orderChannel.id;
      case 'promo':
      case 'sale':
        return _promoChannel.id;
      default:
        return _generalChannel.id;
    }
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
    String? channelId,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      channelId ?? _generalChannel.id,
      channelId == _orderChannel.id
          ? _orderChannel.name
          : channelId == _promoChannel.id
              ? _promoChannel.name
              : _generalChannel.name,
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: const Color(0xFF3B82F6),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('Subscribed to topic: $topic');
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('Unsubscribed from topic: $topic');
  }

  /// Show local notification (for testing or custom use)
  Future<void> showNotification({
    required String title,
    required String body,
    String? type,
    Map<String, dynamic>? data,
  }) async {
    await _showLocalNotification(
      title: title,
      body: body,
      payload: data != null ? jsonEncode(data) : null,
      channelId: _getChannelForType(type),
    );
  }

  /// Clear FCM token on logout
  Future<void> clearToken() async {
    if (_fcmToken == null) return;

    final api = ApiClient();
    if (api.hasToken && _fcmToken != null) {
      try {
        // Token is removed server-side via /auth/logout
      } catch (e) {
        debugPrint('Error clearing FCM token: $e');
      }
    }

    await _messaging.deleteToken();
    _fcmToken = null;
  }
}

/// Notification types
class NotificationTypes {
  static const String orderCreated = 'order_created';
  static const String orderConfirmed = 'order_confirmed';
  static const String orderShipped = 'order_shipped';
  static const String orderDelivered = 'order_delivered';
  static const String orderCancelled = 'order_cancelled';
  static const String promoNew = 'promo_new';
  static const String flashSale = 'flash_sale';
  static const String newProduct = 'new_product';
  static const String review = 'review';
  static const String message = 'message';
}

/// Topics for FCM
class NotificationTopics {
  static const String allUsers = 'all_users';
  static const String promos = 'promos';
  static const String news = 'news';

  static String vendor(String vendorId) => 'vendor_$vendorId';
  static String user(String userId) => 'user_$userId';
}
