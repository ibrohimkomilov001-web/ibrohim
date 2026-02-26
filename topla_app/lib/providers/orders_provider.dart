import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../core/services/api_client.dart';
import '../models/models.dart';

/// Buyurtmalar holati uchun Provider
class OrdersProvider extends ChangeNotifier {
  final IOrderRepository _orderRepo;

  final ApiClient _api;

  OrdersProvider(this._orderRepo) : _api = ApiClient() {
    _init();
  }

  /// Foydalanuvchi tizimga kirganmi
  bool get isAuthenticated => _api.hasToken;

  // State
  List<OrderModel> _orders = [];
  OrderModel? _currentOrder;
  bool _isLoading = false;
  bool _isCreatingOrder = false;
  String? _error;
  StreamSubscription? _ordersSubscription;

  // Getters
  List<OrderModel> get orders => _orders;
  OrderModel? get currentOrder => _currentOrder;
  bool get isLoading => _isLoading;
  bool get isCreatingOrder => _isCreatingOrder;
  String? get error => _error;

  /// Faol (pending, confirmed, preparing, delivering) buyurtmalar
  List<OrderModel> get activeOrders => _orders
      .where((o) =>
          o.status != OrderStatus.delivered &&
          o.status != OrderStatus.cancelled)
      .toList();

  /// Bajarilgan buyurtmalar
  List<OrderModel> get completedOrders =>
      _orders.where((o) => o.status == OrderStatus.delivered).toList();

  /// Bekor qilingan buyurtmalar
  List<OrderModel> get cancelledOrders =>
      _orders.where((o) => o.status == OrderStatus.cancelled).toList();

  void _init() {
    if (!isAuthenticated) return; // Auth yo'q bo'lsa yuklamaslik
    loadOrders();
    _startRealtimeSubscription();
  }

  /// Foydalanuvchi tizimga kirgandan keyin qayta yuklash
  void initAfterLogin() {
    if (!isAuthenticated) return;
    loadOrders();
    _startRealtimeSubscription();
  }

  /// Public method to start realtime subscription
  void startRealtimeSubscription() {
    _startRealtimeSubscription();
  }

  /// Public method to stop realtime subscription
  void stopRealtimeSubscription() {
    _ordersSubscription?.cancel();
    _ordersSubscription = null;
  }

  void _startRealtimeSubscription() {
    _ordersSubscription?.cancel();
    _ordersSubscription = _orderRepo.watchOrders().listen(
      (orders) {
        _orders = orders;
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        notifyListeners();
      },
    );
  }

  Future<void> loadOrders({String? status}) async {
    if (!isAuthenticated) {
      _orders = [];
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _orders = await _orderRepo.getOrders(status: status);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

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
    _isCreatingOrder = true;
    _error = null;
    notifyListeners();

    try {
      _currentOrder = await _orderRepo.createOrder(
        addressId: addressId,
        paymentMethod: paymentMethod,
        deliveryTime: deliveryTime,
        scheduledDate: scheduledDate,
        scheduledTimeSlot: scheduledTimeSlot,
        comment: comment,
        recipientName: recipientName,
        recipientPhone: recipientPhone,
        deliveryMethod: deliveryMethod,
        pickupPointId: pickupPointId,
        items: items,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        cashbackUsed: cashbackUsed,
      );
      await loadOrders();
      return _currentOrder;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isCreatingOrder = false;
      notifyListeners();
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      await _orderRepo.cancelOrder(orderId);
      await loadOrders();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// To'lov holatini yangilash
  Future<bool> updatePaymentStatus(String orderId, String status) async {
    try {
      await _orderRepo.updatePaymentStatus(orderId, status);
      await loadOrders();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Bitta buyurtmani ID bo'yicha yuklash
  Future<OrderModel?> loadOrderById(String orderId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentOrder = await _orderRepo.getOrderById(orderId);
      return _currentOrder;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _ordersSubscription?.cancel();
    super.dispose();
  }
}
