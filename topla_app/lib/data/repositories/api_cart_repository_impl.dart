import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/repositories/i_cart_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Cart repository - Node.js backend implementation
class ApiCartRepositoryImpl implements ICartRepository {
  final ApiClient _api;

  // Polling uchun
  Timer? _pollTimer;
  final _cartController = StreamController<List<CartItemModel>>.broadcast();

  ApiCartRepositoryImpl(this._api);

  @override
  Future<List<CartItemModel>> getCart() async {
    final response = await _api.get('/cart');
    final data = response.dataMap;
    final items = data['items'] as List<dynamic>? ?? response.dataList;
    return items.map((e) => CartItemModel.fromJson(e)).toList();
  }

  @override
  Future<void> addToCart(String productId, {int quantity = 1}) async {
    await _api.post('/cart', body: {
      'productId': productId,
      'quantity': quantity,
    });
  }

  @override
  Future<void> updateCartQuantity(String productId, int quantity) async {
    await _api.put('/cart/$productId', body: {'quantity': quantity});
  }

  @override
  Future<void> removeFromCart(String productId) async {
    await _api.delete('/cart/$productId');
  }

  @override
  Future<void> clearCart() async {
    await _api.delete('/cart');
  }

  @override
  Stream<List<CartItemModel>> watchCart() {
    // Polling orqali savat kuzatish (har 15 sekund)
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final cart = await getCart();
        _cartController.add(cart);
      } catch (e) {
        debugPrint('Cart poll error: $e');
      }
    });

    // Dastlabki qo'ng'iroq
    getCart().then((cart) => _cartController.add(cart)).catchError((_) {});

    return _cartController.stream;
  }

  @override
  Future<Map<String, dynamic>?> validatePromoCode(String code) async {
    try {
      final response =
          await _api.post('/promo-codes/verify', body: {'code': code});
      return response.dataMap;
    } on ApiException {
      return null;
    }
  }

  void dispose() {
    _pollTimer?.cancel();
    _cartController.close();
  }
}
