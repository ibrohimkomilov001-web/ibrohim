import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../core/services/api_client.dart';
import '../models/models.dart';

/// Savat holati uchun Provider
class CartProvider extends ChangeNotifier {
  final ICartRepository _cartRepo;

  final ApiClient _api;

  CartProvider(this._cartRepo) : _api = ApiClient() {
    _init();
  }

  // State
  List<CartItemModel> _items = [];
  bool _isLoading = false;
  String? _error;
  StreamSubscription? _cartSubscription;

  // Getters
  List<CartItemModel> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isEmpty => _items.isEmpty;
  int get itemCount => _items.length;
  int get totalQuantity => _items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _items.fold(0, (sum, item) => sum + item.total);
  // Dynamic delivery fee from backend (zone-based)
  double _deliveryFee = 0;
  double get deliveryFee => _deliveryFee;
  double get total => subtotal + deliveryFee;

  // Delivery info from backend
  String? _deliveryTimeDisplay;
  String? get deliveryTimeDisplay => _deliveryTimeDisplay;
  double _freeDeliveryThreshold = 0;
  double get freeDeliveryThreshold => _freeDeliveryThreshold;
  bool get isFreeDelivery =>
      _freeDeliveryThreshold > 0 && subtotal >= _freeDeliveryThreshold;

  /// Yetkazish narxini yangilash (backend hisoblab beradi)
  void setDeliveryFee(double fee) {
    _deliveryFee = fee;
    notifyListeners();
  }

  /// Backend'dan yetkazish narxi va vaqtini olish (zone-based)
  Future<void> fetchDeliveryInfo({
    String? addressId,
    String deliveryMethod = 'courier',
    String? scheduledDate,
    String? scheduledTimeSlot,
  }) async {
    try {
      final params = <String, String>{
        'deliveryMethod': deliveryMethod,
        'subtotal': subtotal.toStringAsFixed(0),
      };
      if (addressId != null) params['addressId'] = addressId;
      if (scheduledDate != null) params['scheduledDate'] = scheduledDate;
      if (scheduledTimeSlot != null)
        params['scheduledTimeSlot'] = scheduledTimeSlot;

      final queryStr =
          params.entries.map((e) => '${e.key}=${e.value}').join('&');
      final response = await _api.get('/orders/delivery-info?$queryStr');

      if (response != null && response['data'] != null) {
        final data = response['data'];
        final fee = (data['deliveryFee'] as num?)?.toDouble() ?? 0;
        _freeDeliveryThreshold =
            (data['freeDeliveryThreshold'] as num?)?.toDouble() ?? 0;
        _deliveryTimeDisplay =
            data['deliveryEstimate']?['displayText'] as String?;

        // Free delivery threshold check
        if (data['isFreeDelivery'] == true) {
          _deliveryFee = 0;
        } else {
          _deliveryFee = fee;
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('fetchDeliveryInfo error: $e');
      // Fallback — keep current fee
    }
  }

  /// Foydalanuvchi tizimga kirganmi
  bool get isAuthenticated => _api.hasToken;

  void _init() {
    if (!isAuthenticated) return; // Auth yo'q bo'lsa yuklamaslik
    loadCart();
    _startRealtimeSubscription();
  }

  /// Foydalanuvchi tizimga kirgandan keyin qayta yuklash
  void initAfterLogin() {
    if (!isAuthenticated) return;
    loadCart();
    _startRealtimeSubscription();
  }

  /// Public method to start realtime subscription (for main screen)
  void startRealtimeSubscription() {
    _startRealtimeSubscription();
  }

  /// Public method to stop realtime subscription
  void stopRealtimeSubscription() {
    _cartSubscription?.cancel();
    _cartSubscription = null;
  }

  void _startRealtimeSubscription() {
    _cartSubscription?.cancel();
    _cartSubscription = _cartRepo.watchCart().listen(
      (cartItems) {
        // watchCart() already calls getCart() with product joins
        _items = cartItems;
        debugPrint('🛒 Cart realtime: ${_items.length} items loaded');
        notifyListeners();
      },
      onError: (e) {
        debugPrint('🛒 Cart stream error: $e');
        _error = e.toString();
        notifyListeners();
      },
    );
  }

  Future<void> loadCart() async {
    if (!isAuthenticated) {
      _items = [];
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _items = await _cartRepo.getCart();
      debugPrint(
          '🛒 loadCart: ${_items.length} items, products: ${_items.where((i) => i.product != null).length}');
    } catch (e) {
      debugPrint('🛒 loadCart error: $e');
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addToCart(String productId,
      {int quantity = 1, String? variantId}) async {
    try {
      await _cartRepo.addToCart(productId,
          quantity: quantity, variantId: variantId);
      // Manually reload to ensure cart updates immediately
      try {
        _items = await _cartRepo.getCart();
        debugPrint('🛒 addToCart: ${_items.length} items after reload');
        notifyListeners();
      } catch (e) {
        debugPrint('🛒 addToCart reload error: $e');
        // Reload failed but item was added - try loading again
        await loadCart();
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('🛒 addToCart error: $e');
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateQuantity(String productId, int quantity) async {
    // Optimistic update: immediately update locally
    final index = _items.indexWhere((item) => item.productId == productId);
    if (index != -1) {
      _items[index] = _items[index].copyWith(quantity: quantity);
      notifyListeners();
    }
    try {
      await _cartRepo.updateCartQuantity(productId, quantity);
      // Realtime subscription will sync
    } catch (e) {
      // Revert on error
      try {
        _items = await _cartRepo.getCart();
        notifyListeners();
      } catch (e) {
        debugPrint('Cart revert error: $e');
      }
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> removeFromCart(String productId) async {
    // Optimistic: remove locally first
    final removedItems = List<CartItemModel>.from(_items);
    _items.removeWhere((item) => item.productId == productId);
    notifyListeners();
    try {
      await _cartRepo.removeFromCart(productId);
      // Realtime subscription will sync
    } catch (e) {
      // Revert on error
      _items = removedItems;
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> clearCart() async {
    try {
      await _cartRepo.clearCart();
      _items = [];
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Promo kodni tekshirish
  Future<Map<String, dynamic>?> validatePromoCode(String code) async {
    try {
      return await _cartRepo.validatePromoCode(code);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Logout bo'lganda barcha ma'lumotlarni tozalash
  void clearOnLogout() {
    _cartSubscription?.cancel();
    _cartSubscription = null;
    _items = [];
    _isLoading = false;
    _deliveryFee = 0;
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _cartSubscription?.cancel();
    super.dispose();
  }
}
