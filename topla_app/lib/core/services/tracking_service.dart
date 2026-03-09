import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/api_client.dart';

/// Yandex Go uslubida real-time kuryer kuzatish servisi
/// Socket.IO o'rniga HTTP polling ishlatadi (qo'shimcha paket kerak emas)
class TrackingService {
  static final TrackingService _instance = TrackingService._();
  factory TrackingService() => _instance;
  TrackingService._();

  final ApiClient _api = ApiClient();

  // Tracking streams
  final _courierLocationController =
      StreamController<CourierLocation>.broadcast();
  final _orderStatusController =
      StreamController<OrderStatusUpdate>.broadcast();
  final _deliveryOfferController = StreamController<DeliveryOffer>.broadcast();

  // Active tracking
  Timer? _locationPollingTimer;
  Timer? _statusPollingTimer;
  Timer? _offerPollingTimer;

  String? _lastKnownStatus;

  // ==================== STREAMS ====================

  /// Kuryerning joylashuvi (mijoz kuzatayotganda)
  Stream<CourierLocation> get courierLocationStream =>
      _courierLocationController.stream;

  /// Buyurtma statusi o'zgarganda
  Stream<OrderStatusUpdate> get orderStatusStream =>
      _orderStatusController.stream;

  /// Kuryer uchun yangi yetkazish takliflari
  Stream<DeliveryOffer> get deliveryOfferStream =>
      _deliveryOfferController.stream;

  // ==================== CUSTOMER TRACKING ====================

  /// Buyurtmani real-time kuzatishni boshlash (mijoz uchun)
  void startTrackingOrder(String orderId) {
    stopTracking();
    _lastKnownStatus = null;

    // Poll kuryer joylashuvi har 3 soniyada
    _locationPollingTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => _pollCourierLocation(orderId),
    );

    // Poll buyurtma statusi har 5 soniyada
    _statusPollingTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _pollOrderStatus(orderId),
    );

    // Darhol birinchi so'rov
    _pollCourierLocation(orderId);
    _pollOrderStatus(orderId);
  }

  Future<void> _pollCourierLocation(String orderId) async {
    try {
      final res = await _api.get('/courier/track/$orderId');
      final data = res.data as Map<String, dynamic>?;
      if (data != null) {
        _courierLocationController.add(CourierLocation(
          latitude: (data['latitude'] as num).toDouble(),
          longitude: (data['longitude'] as num).toDouble(),
          speed: (data['speed'] as num?)?.toDouble(),
          heading: (data['heading'] as num?)?.toDouble(),
          updatedAt:
              DateTime.tryParse(data['updatedAt'] ?? '') ?? DateTime.now(),
        ));
      }
    } catch (e) {
      debugPrint('pollCourierLocation error: $e');
    }
  }

  Future<void> _pollOrderStatus(String orderId) async {
    try {
      final res = await _api.get('/orders/$orderId');
      final data = res.data as Map<String, dynamic>?;
      if (data != null) {
        final status = data['status'] as String?;
        if (status != null && status != _lastKnownStatus) {
          _lastKnownStatus = status;
          _orderStatusController.add(OrderStatusUpdate(
            orderId: orderId,
            status: status,
            updatedAt:
                DateTime.tryParse(data['updatedAt'] ?? '') ?? DateTime.now(),
          ));
        }
      }
    } catch (e) {
      debugPrint('pollOrderStatus error: $e');
    }
  }

  // ==================== COURIER MODE ====================

  /// Kuryerning GPS joylashuvini jo'natish (kuryer ilovasida)
  Future<void> sendCourierLocation({
    required double latitude,
    required double longitude,
    double? speed,
    double? heading,
  }) async {
    try {
      await _api.post('/courier/location', body: {
        'latitude': latitude,
        'longitude': longitude,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
      });
    } catch (e) {
      debugPrint('Joylashuv yuborishda xato: $e');
    }
  }

  /// Yangi buyurtma takliflarini kuzatishni boshlash (kuryer uchun)
  void startListeningForOffers() {
    _offerPollingTimer?.cancel();

    _offerPollingTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _pollDeliveryOffers(),
    );
    _pollDeliveryOffers();
  }

  Future<void> _pollDeliveryOffers() async {
    try {
      final res = await _api.get('/courier/available-orders');
      final list = res.data as List? ?? [];
      for (final item in list) {
        final offer = item as Map<String, dynamic>;
        _deliveryOfferController.add(DeliveryOffer(
          assignmentId: offer['id']?.toString() ?? '',
          orderId: offer['orderId']?.toString() ?? '',
          pickupAddress: offer['pickupAddress'] as String? ?? '',
          deliveryAddress: offer['deliveryAddress'] as String? ?? '',
          distance: (offer['distance'] as num?)?.toDouble() ?? 0,
          estimatedEarning:
              (offer['estimatedEarning'] as num?)?.toDouble() ?? 0,
          expiresAt: DateTime.tryParse(offer['expiresAt'] ?? ''),
        ));
      }
    } catch (e) {
      debugPrint('pollDeliveryOffers error: $e');
    }
  }

  // ==================== LIFECYCLE ====================

  /// Barcha kuzatishni to'xtatish
  void stopTracking() {
    _locationPollingTimer?.cancel();
    _statusPollingTimer?.cancel();
    _locationPollingTimer = null;
    _statusPollingTimer = null;
    _lastKnownStatus = null;
  }

  /// Kuryer takliflarini to'xtatish
  void stopListeningForOffers() {
    _offerPollingTimer?.cancel();
    _offerPollingTimer = null;
  }

  /// Hammasini tozalash
  void dispose() {
    stopTracking();
    stopListeningForOffers();
    _courierLocationController.close();
    _orderStatusController.close();
    _deliveryOfferController.close();
  }
}

// ==================== DATA MODELS ====================

class CourierLocation {
  final double latitude;
  final double longitude;
  final double? speed;
  final double? heading;
  final DateTime updatedAt;

  const CourierLocation({
    required this.latitude,
    required this.longitude,
    this.speed,
    this.heading,
    required this.updatedAt,
  });
}

class OrderStatusUpdate {
  final String orderId;
  final String status;
  final DateTime updatedAt;

  const OrderStatusUpdate({
    required this.orderId,
    required this.status,
    required this.updatedAt,
  });

  /// Foydalanuvchiga ko'rsatiladigan matn
  String get displayText {
    switch (status) {
      case 'pending':
        return 'Buyurtma kutilmoqda';
      case 'processing':
        return 'Tayyorlanmoqda';
      case 'ready_for_pickup':
        return 'Olib ketishga tayyor';
      case 'courier_assigned':
        return 'Kuryer tayinlandi';
      case 'courier_picked_up':
        return 'Kuryer oldi';
      case 'shipping':
        return 'Yetkazilmoqda';
      case 'delivered':
        return 'Yetkazildi';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return status;
    }
  }
}

class DeliveryOffer {
  final String assignmentId;
  final String orderId;
  final String pickupAddress;
  final String deliveryAddress;
  final double distance;
  final double estimatedEarning;
  final DateTime? expiresAt;

  const DeliveryOffer({
    required this.assignmentId,
    required this.orderId,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.distance,
    required this.estimatedEarning,
    this.expiresAt,
  });

  /// Taklif muddati tugaganmi?
  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
}
