import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/core/repositories/i_cart_repository.dart';
import 'package:topla_app/models/models.dart';

/// Mock cart repository for testing
class MockCartRepository implements ICartRepository {
  final List<CartItemModel> _items = [];
  final _controller = StreamController<List<CartItemModel>>.broadcast();
  int _idCounter = 0;

  final Map<String, ProductInfo> _products = {
    'product-1': ProductInfo(
      id: 'product-1',
      nameUz: 'Test Mahsulot 1',
      nameRu: 'Тест Продукт 1',
      price: 10000,
      oldPrice: 12000,
      images: ['https://example.com/image1.jpg'],
      stock: 100,
    ),
    'product-2': ProductInfo(
      id: 'product-2',
      nameUz: 'Test Mahsulot 2',
      nameRu: 'Тест Продукт 2',
      price: 25000,
      images: ['https://example.com/image2.jpg'],
      stock: 50,
    ),
    'product-3': ProductInfo(
      id: 'product-3',
      nameUz: 'Test Mahsulot 3',
      nameRu: 'Тест Продукт 3',
      price: 5000,
      stock: 200,
    ),
  };

  @override
  Future<List<CartItemModel>> getCart() async {
    await Future.delayed(const Duration(milliseconds: 10));
    return List.from(_items);
  }

  @override
  Future<void> addToCart(String productId,
      {int quantity = 1, String? variantId}) async {
    await Future.delayed(const Duration(milliseconds: 10));

    // Check if item already exists
    final existingIndex =
        _items.indexWhere((item) => item.productId == productId);

    if (existingIndex >= 0) {
      // Update quantity
      final existing = _items[existingIndex];
      _items[existingIndex] = CartItemModel(
        id: existing.id,
        userId: existing.userId,
        productId: existing.productId,
        quantity: existing.quantity + quantity,
        product: existing.product,
      );
    } else {
      // Add new item
      _idCounter++;
      final newItem = CartItemModel(
        id: 'cart-item-$_idCounter',
        userId: 'test-user',
        productId: productId,
        quantity: quantity,
        product: _products[productId],
      );
      _items.add(newItem);
    }

    _controller.add(List.from(_items));
  }

  @override
  Future<void> updateCartQuantity(String cartItemId, int quantity) async {
    await Future.delayed(const Duration(milliseconds: 10));

    final index = _items.indexWhere((item) => item.id == cartItemId);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        final existing = _items[index];
        _items[index] = CartItemModel(
          id: existing.id,
          userId: existing.userId,
          productId: existing.productId,
          quantity: quantity,
          product: existing.product,
        );
      }
      _controller.add(List.from(_items));
    }
  }

  @override
  Future<void> removeFromCart(String cartItemId) async {
    await Future.delayed(const Duration(milliseconds: 10));
    _items.removeWhere((item) => item.id == cartItemId);
    _controller.add(List.from(_items));
  }

  @override
  Future<void> clearCart() async {
    await Future.delayed(const Duration(milliseconds: 10));
    _items.clear();
    _controller.add([]);
  }

  @override
  Stream<List<CartItemModel>> watchCart() {
    return _controller.stream;
  }

  @override
  Future<Map<String, dynamic>?> validatePromoCode(String code) async {
    await Future.delayed(const Duration(milliseconds: 10));
    // Mock promo codes for testing
    if (code.toUpperCase() == 'DISCOUNT10') {
      return {
        'id': 'promo-1',
        'code': 'DISCOUNT10',
        'discount_type': 'percent',
        'discount_value': 10,
        'min_order_amount': null,
        'max_discount': 50000,
      };
    }
    if (code.toUpperCase() == 'FIXED5000') {
      return {
        'id': 'promo-2',
        'code': 'FIXED5000',
        'discount_type': 'fixed',
        'discount_value': 5000,
        'min_order_amount': 20000,
        'max_discount': null,
      };
    }
    return null;
  }

  // Helper method for cleanup
  void dispose() {
    _controller.close();
  }

  // Helper for testing
  void reset() {
    _items.clear();
    _idCounter = 0;
  }
}

void main() {
  late MockCartRepository cartRepo;

  setUp(() {
    cartRepo = MockCartRepository();
  });

  tearDown(() {
    cartRepo.dispose();
  });

  group('CartRepository Tests', () {
    test('getCart returns empty list initially', () async {
      final items = await cartRepo.getCart();
      expect(items, isEmpty);
    });

    test('addToCart adds item to cart', () async {
      await cartRepo.addToCart('product-1', quantity: 2);

      final items = await cartRepo.getCart();

      expect(items.length, equals(1));
      expect(items.first.productId, equals('product-1'));
      expect(items.first.quantity, equals(2));
      expect(items.first.product, isNotNull);
      expect(items.first.product!.price, equals(10000));
    });

    test('addToCart with same product increases quantity', () async {
      await cartRepo.addToCart('product-1', quantity: 2);
      await cartRepo.addToCart('product-1', quantity: 3);

      final items = await cartRepo.getCart();

      expect(items.length, equals(1));
      expect(items.first.quantity, equals(5));
    });

    test('updateCartQuantity updates item quantity', () async {
      await cartRepo.addToCart('product-1', quantity: 2);
      final items = await cartRepo.getCart();

      await cartRepo.updateCartQuantity(items.first.id, 10);

      final updatedItems = await cartRepo.getCart();
      expect(updatedItems.first.quantity, equals(10));
    });

    test('updateCartQuantity with 0 removes item', () async {
      await cartRepo.addToCart('product-1', quantity: 2);
      final items = await cartRepo.getCart();

      await cartRepo.updateCartQuantity(items.first.id, 0);

      final updatedItems = await cartRepo.getCart();
      expect(updatedItems, isEmpty);
    });

    test('removeFromCart removes item', () async {
      await cartRepo.addToCart('product-1');
      await cartRepo.addToCart('product-2');

      final items = await cartRepo.getCart();
      expect(items.length, equals(2));

      await cartRepo.removeFromCart(items.first.id);

      final updatedItems = await cartRepo.getCart();
      expect(updatedItems.length, equals(1));
    });

    test('clearCart removes all items', () async {
      await cartRepo.addToCart('product-1');
      await cartRepo.addToCart('product-2');
      await cartRepo.addToCart('product-3');

      await cartRepo.clearCart();

      final items = await cartRepo.getCart();
      expect(items, isEmpty);
    });

    test('watchCart emits updates', () async {
      final emissions = <List<CartItemModel>>[];
      final subscription = cartRepo.watchCart().listen(emissions.add);

      await cartRepo.addToCart('product-1');
      await cartRepo.addToCart('product-2');

      await Future.delayed(const Duration(milliseconds: 100));

      expect(emissions.length, greaterThanOrEqualTo(2));

      await subscription.cancel();
    });

    test('cart item total calculates correctly', () async {
      await cartRepo.addToCart('product-1', quantity: 3);

      final items = await cartRepo.getCart();
      final item = items.first;

      // 10000 * 3 = 30000
      expect(item.total, equals(30000));
    });

    test('multiple products in cart', () async {
      await cartRepo.addToCart('product-1', quantity: 2);
      await cartRepo.addToCart('product-2', quantity: 1);
      await cartRepo.addToCart('product-3', quantity: 5);

      final items = await cartRepo.getCart();

      expect(items.length, equals(3));

      // Calculate total
      double total = 0;
      for (final item in items) {
        total += item.total;
      }

      // (10000 * 2) + (25000 * 1) + (5000 * 5) = 20000 + 25000 + 25000 = 70000
      expect(total, equals(70000));
    });
  });
}
