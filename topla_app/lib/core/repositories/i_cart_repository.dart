import '../../models/models.dart';

/// Savat operatsiyalari uchun interface
abstract class ICartRepository {
  /// Savatni olish
  Future<List<CartItemModel>> getCart();

  /// Savatga qo'shish
  Future<void> addToCart(String productId, {int quantity = 1, String? variantId});

  /// Savat miqdorini yangilash
  Future<void> updateCartQuantity(String productId, int quantity);

  /// Savatdan o'chirish
  Future<void> removeFromCart(String productId);

  /// Savatni tozalash
  Future<void> clearCart();

  /// Savat stream (realtime)
  Stream<List<CartItemModel>> watchCart();

  /// Promo kodni tekshirish
  Future<Map<String, dynamic>?> validatePromoCode(String code);
}
