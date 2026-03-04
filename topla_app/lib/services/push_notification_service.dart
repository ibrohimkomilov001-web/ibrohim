import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
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

  /// Bildirishnoma ruxsatini so'rash (dialog uchun)
  Future<bool> requestPermissionOnly() async {
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

  // Vibratsiya pattern — [kutish, vibratsiya, pauza, vibratsiya]
  static final Int64List _vibrationPattern =
      Int64List.fromList([0, 400, 200, 400]);

  // Notification channels — tovush + vibratsiya + heads-up (Importance.max)
  static final AndroidNotificationChannel _orderChannel =
      AndroidNotificationChannel(
    'orders_channel',
    'Buyurtmalar',
    description: 'Buyurtma holati haqida bildirishnomalar',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    vibrationPattern: _vibrationPattern,
    enableLights: true,
    ledColor: const Color(0xFF3B82F6),
  );

  static final AndroidNotificationChannel _promoChannel =
      AndroidNotificationChannel(
    'promo_channel',
    'Aksiyalar',
    description: 'Chegirmalar va aksiyalar haqida bildirishnomalar',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    vibrationPattern: _vibrationPattern,
    enableLights: true,
    ledColor: const Color(0xFFFF1744),
  );

  static final AndroidNotificationChannel _generalChannel =
      AndroidNotificationChannel(
    'general_channel',
    'Umumiy',
    description: 'Umumiy bildirishnomalar',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    vibrationPattern: _vibrationPattern,
    enableLights: true,
    ledColor: const Color(0xFF4CAF50),
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
      // Eski channellarni o'chirib, yangi importance bilan qayta yaratish
      await androidPlugin.deleteNotificationChannel(_orderChannel.id);
      await androidPlugin.deleteNotificationChannel(_promoChannel.id);
      await androidPlugin.deleteNotificationChannel(_generalChannel.id);

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
    if (kIsWeb) return 'web';
    return defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    // Rasmni olish (FCM data yoki notification dan)
    final imageUrl =
        message.data['imageUrl'] as String? ?? notification.android?.imageUrl;

    // Show local notification
    _showLocalNotification(
      title: notification.title ?? 'TOPLA',
      body: notification.body ?? '',
      payload: jsonEncode(message.data),
      channelId: _getChannelForType(message.data['type']),
      imageUrl: imageUrl,
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
      case 'order_new':
      case 'order_confirmed':
      case 'order_processing':
      case 'order_ready':
      case 'order_assigned':
      case 'order_picked_up':
      case 'order_shipping':
      case 'order_delivered':
      case 'order_cancelled':
        navigator.pushNamed('/orders');
        break;
      case 'return':
      case 'return_status':
        navigator.pushNamed('/returns');
        break;
      case 'promo':
      case 'sale':
      case 'admin_broadcast':
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
        navigator.pushNamed('/main');
        break;
    }
  }

  /// Notification type ga qarab kanal tanlash (backend enum qiymatlari bilan mos)
  String _getChannelForType(String? type) {
    if (type == null) return _generalChannel.id;
    // Buyurtma turlarini tekshirish
    if (type.startsWith('order') || type == 'courier_new') {
      return _orderChannel.id;
    }
    // Aksiya/promo turlarini tekshirish
    if (type == 'promo' || type == 'sale' || type == 'promo_new') {
      return _promoChannel.id;
    }
    return _generalChannel.id;
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
    String? channelId,
    String? imageUrl,
  }) async {
    // Rasm URL ni to'liq qilish (relative → absolute)
    String? fullImageUrl = imageUrl;
    if (fullImageUrl != null && fullImageUrl.startsWith('/')) {
      fullImageUrl = 'https://topla.uz$fullImageUrl';
    }

    // Rasmni yuklash (agar mavjud bo'lsa)
    StyleInformation? styleInfo;
    if (fullImageUrl != null && fullImageUrl.isNotEmpty) {
      try {
        final response = await HttpClient().getUrl(Uri.parse(fullImageUrl));
        final httpResponse = await response.close();
        final bytes = await consolidateHttpClientResponseBytes(httpResponse);
        styleInfo = BigPictureStyleInformation(
          ByteArrayAndroidBitmap(bytes),
          contentTitle: title,
          summaryText: body,
          hideExpandedLargeIcon: true,
        );
      } catch (e) {
        debugPrint('Rasm yuklashda xatolik: $e');
        styleInfo = BigTextStyleInformation(body);
      }
    } else {
      styleInfo = BigTextStyleInformation(body);
    }

    final ch = channelId ?? _generalChannel.id;
    final chName = ch == _orderChannel.id
        ? _orderChannel.name
        : ch == _promoChannel.id
            ? _promoChannel.name
            : _generalChannel.name;

    final androidDetails = AndroidNotificationDetails(
      ch,
      chName,
      importance: Importance.max,
      priority: Priority.max,
      icon: '@mipmap/ic_launcher',
      color: const Color(0xFF3B82F6),
      styleInformation: styleInfo,
      ticker: title,
      playSound: true,
      enableVibration: true,
      vibrationPattern: _vibrationPattern,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.message,
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
