import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/repositories/i_order_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Order repository - Node.js backend implementation
class ApiOrderRepositoryImpl implements IOrderRepository {
  final ApiClient _api;

  Timer? _pollTimer;
  final _ordersController = StreamController<List<OrderModel>>.broadcast();

  ApiOrderRepositoryImpl(this._api);

  @override
  Future<List<OrderModel>> getOrders({String? status}) async {
    final params = <String, dynamic>{};
    if (status != null) params['status'] = status;

    final response = await _api.get('/orders', queryParams: params);
    return response
        .nestedList('orders')
        .map((e) => OrderModel.fromJson(e))
        .toList();
  }

  @override
  Future<OrderModel?> getOrderById(String id) async {
    try {
      final response = await _api.get('/orders/$id');
      return OrderModel.fromJson(response.dataMap);
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  @override
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
  }) async {
    // Backend creates order from cart - sends selected items with productId & quantity
    final body = <String, dynamic>{
      'paymentMethod': paymentMethod,
      'deliveryMethod': deliveryMethod ?? 'courier',
    };

    // Courier uchun manzil
    if ((deliveryMethod ?? 'courier') == 'courier' && addressId.isNotEmpty) {
      body['addressId'] = addressId;
    }

    // Pickup point uchun
    if (pickupPointId != null) {
      body['pickupPointId'] = pickupPointId;
    }

    // Tanlangan mahsulotlarni yuborish (backend faqat shu items'larni buyurtma qiladi)
    if (items.isNotEmpty) {
      body['items'] = items
          .map((item) => {
                'productId': item['product_id'] ?? item['productId'],
                'quantity': item['quantity'],
              })
          .toList();
    }
    if (scheduledDate != null) {
      body['deliveryDate'] = scheduledDate.toIso8601String();
    }
    if (scheduledTimeSlot != null) {
      body['deliveryTimeSlot'] = scheduledTimeSlot;
    }
    if (comment != null) {
      body['note'] = comment;
    }
    if (recipientName != null) {
      body['recipientName'] = recipientName;
    }
    if (recipientPhone != null) {
      body['recipientPhone'] = recipientPhone;
    }

    final response = await _api.post('/orders', body: body);
    return OrderModel.fromJson(response.dataMap);
  }

  @override
  Future<void> cancelOrder(String orderId) async {
    await _api.post('/orders/$orderId/cancel');
  }

  @override
  Future<void> updatePaymentStatus(String orderId, String status) async {
    // Backend handles payment status via /payments/transactions
    // This is a no-op since payment status is updated through payment flow
  }

  @override
  Stream<List<OrderModel>> watchOrders() {
    // Polling orqali buyurtmalarni kuzatish (har 10 sekund)
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      try {
        final orders = await getOrders();
        _ordersController.add(orders);
      } catch (e) {
        debugPrint('Orders poll error: $e');
      }
    });

    // Dastlabki yuklash
    getOrders()
        .then((orders) => _ordersController.add(orders))
        .catchError((_) {});

    return _ordersController.stream;
  }

  void dispose() {
    _pollTimer?.cancel();
    _ordersController.close();
  }
}
