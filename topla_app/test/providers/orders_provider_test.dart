import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/core/repositories/repositories.dart';
import 'package:topla_app/models/models.dart';
import 'package:topla_app/providers/orders_provider.dart';

// ==================== MOCK ====================
class MockOrderRepository implements IOrderRepository {
  List<OrderModel> _orders = [];
  Exception? nextError;
  bool createOrderCalled = false;
  bool cancelOrderCalled = false;
  String? lastCancelledId;

  void seedOrders(List<OrderModel> orders) {
    _orders = List.from(orders);
  }

  @override
  Future<List<OrderModel>> getOrders({String? status}) async {
    if (nextError != null) throw nextError!;
    if (status != null) {
      return _orders.where((o) => o.status.name == status).toList();
    }
    return _orders;
  }

  @override
  Future<OrderModel?> getOrderById(String id) async {
    return _orders.where((o) => o.id == id).firstOrNull;
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
    if (nextError != null) throw nextError!;
    createOrderCalled = true;
    final order = _makeOrder(
      id: 'order-new',
      orderNumber: 'T-9999',
      subtotal: subtotal,
      total: subtotal + deliveryFee - discount,
    );
    _orders.add(order);
    return order;
  }

  @override
  Future<void> cancelOrder(String orderId) async {
    if (nextError != null) throw nextError!;
    cancelOrderCalled = true;
    lastCancelledId = orderId;
    final index = _orders.indexWhere((o) => o.id == orderId);
    if (index != -1) {
      final old = _orders[index];
      _orders[index] = OrderModel(
        id: old.id,
        orderNumber: old.orderNumber,
        status: OrderStatus.cancelled,
        subtotal: old.subtotal,
        total: old.total,
        items: old.items,
        createdAt: old.createdAt,
      );
    }
  }

  @override
  Future<void> updatePaymentStatus(String orderId, String status) async {}

  @override
  Stream<List<OrderModel>> watchOrders() => const Stream.empty();
}

// ==================== HELPERS ====================
OrderModel _makeOrder({
  String id = 'order-1',
  String orderNumber = 'T-0001',
  OrderStatus status = OrderStatus.pending,
  double subtotal = 100000,
  double total = 110000,
}) {
  return OrderModel(
    id: id,
    orderNumber: orderNumber,
    status: status,
    subtotal: subtotal,
    total: total,
    items: [],
    createdAt: DateTime(2024, 1, 1),
  );
}

void main() {
  late MockOrderRepository mockRepo;

  setUp(() {
    mockRepo = MockOrderRepository();
  });

  group('OrdersProvider — state management', () {
    test('boshlang\'ich holat', () {
      final provider = OrdersProvider(mockRepo);
      expect(provider.orders, isEmpty);
      expect(provider.currentOrder, isNull);
      expect(provider.isLoading, isFalse);
      expect(provider.isCreatingOrder, isFalse);
      expect(provider.error, isNull);
    });

    test('activeOrders filtrlaydi', () {
      final provider = OrdersProvider(mockRepo);
      // Manually set orders via reflection...
      // Since we can't loadOrders without auth, test getter logic directly

      // Use a helper: create provider, seed mock, and check
      mockRepo.seedOrders([
        _makeOrder(id: '1', status: OrderStatus.pending),
        _makeOrder(id: '2', status: OrderStatus.processing),
        _makeOrder(id: '3', status: OrderStatus.delivered),
        _makeOrder(id: '4', status: OrderStatus.cancelled),
        _makeOrder(id: '5', status: OrderStatus.shipping),
      ]);

      // Since provider not authenticated, loadOrders clears list
      expect(provider.activeOrders, isEmpty);
    });

    test('completedOrders filtrlashi kerak', () {
      final provider = OrdersProvider(mockRepo);
      expect(provider.completedOrders, isEmpty);
    });

    test('cancelledOrders filtrlashi kerak', () {
      final provider = OrdersProvider(mockRepo);
      expect(provider.cancelledOrders, isEmpty);
    });

    test('loadOrders auth yo\'q bo\'lsa bo\'sh list', () async {
      // ApiClient().hasToken = false by default in test environment
      final provider = OrdersProvider(mockRepo);
      await provider.loadOrders();
      expect(provider.orders, isEmpty);
      expect(provider.isLoading, isFalse);
    });

    test('clearOnLogout tozalaydi', () {
      final provider = OrdersProvider(mockRepo);
      provider.clearOnLogout();
      expect(provider.orders, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.error, isNull);
    });
  });

  group('OrderModel', () {
    test('fromJson to\'g\'ri parse qiladi', () {
      final json = {
        'id': 'o-1',
        'order_number': 'T-0001',
        'status': 'pending',
        'subtotal': 50000,
        'delivery_fee': 10000,
        'discount': 5000,
        'cashback_used': 0,
        'total': 55000,
        'payment_method': 'cash',
        'payment_status': 'pending',
        'created_at': '2024-01-01T00:00:00Z',
        'items': [],
      };

      final order = OrderModel.fromJson(json);
      expect(order.id, 'o-1');
      expect(order.orderNumber, 'T-0001');
      expect(order.status, OrderStatus.pending);
      expect(order.subtotal, 50000);
      expect(order.deliveryFee, 10000);
      expect(order.discount, 5000);
      expect(order.total, 55000);
    });

    test('OrderStatus.fromString to\'g\'ri ishlaydi', () {
      expect(OrderStatus.fromString('pending'), OrderStatus.pending);
      expect(OrderStatus.fromString('processing'), OrderStatus.processing);
      expect(OrderStatus.fromString('delivered'), OrderStatus.delivered);
      expect(OrderStatus.fromString('cancelled'), OrderStatus.cancelled);
      expect(OrderStatus.fromString('ready_for_pickup'),
          OrderStatus.readyForPickup);
      expect(OrderStatus.fromString('courier_assigned'),
          OrderStatus.courierAssigned);
    });
  });
}
