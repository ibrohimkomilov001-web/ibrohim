import '../../models/models.dart';

/// Buyurtma operatsiyalari uchun interface
abstract class IOrderRepository {
  /// Buyurtmalarni olish
  Future<List<OrderModel>> getOrders({String? status});

  /// Bitta buyurtmani olish
  Future<OrderModel?> getOrderById(String id);

  /// Buyurtma yaratish
  Future<OrderModel?> createOrder({
    required String addressId,
    required String paymentMethod,
    required String deliveryTime,
    DateTime? scheduledDate,
    String? scheduledTimeSlot,
    String? comment,
    String? recipientName,
    String? recipientPhone,
    String? deliveryMethod,
    String? pickupPointId,
    required List<Map<String, dynamic>> items,
    required double subtotal,
    required double deliveryFee,
    double discount = 0,
    double cashbackUsed = 0,
  });

  /// Buyurtmani bekor qilish
  Future<void> cancelOrder(String orderId);

  /// To'lov holatini yangilash
  Future<void> updatePaymentStatus(String orderId, String status);

  /// Buyurtma stream (realtime)
  Stream<List<OrderModel>> watchOrders();
}
