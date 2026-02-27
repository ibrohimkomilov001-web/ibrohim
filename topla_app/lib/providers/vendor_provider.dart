import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../models/models.dart';

/// Vendor holati uchun Provider
class VendorProvider extends ChangeNotifier {
  final IVendorRepository _vendorRepo;

  VendorProvider(this._vendorRepo);

  // State
  ShopModel? _shop;
  VendorStats? _stats;
  List<ProductModel> _products = [];
  bool _isLoading = false;
  bool _isProductsLoading = false;
  String? _error;
  bool _isInitialized = false;

  // Getters
  ShopModel? get shop => _shop;
  VendorStats? get stats => _stats;
  List<ProductModel> get products => _products;
  bool get isLoading => _isLoading;
  bool get isProductsLoading => _isProductsLoading;
  String? get error => _error;
  bool get hasShop => _shop != null;
  bool get isInitialized => _isInitialized;

  /// Birinchi marta do'konni yuklash (agar hali yuklanmagan bo'lsa)
  Future<void> ensureLoaded() async {
    if (!_isInitialized) await loadShop();
  }

  Future<void> loadShop() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _shop = await _vendorRepo.getMyShop();
      _isInitialized = true;
      if (_shop != null) {
        await Future.wait([
          loadStats(),
          loadProducts(),
        ]);
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadStats() async {
    try {
      _stats = await _vendorRepo.getMyStats();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  Future<void> loadProducts({String? moderationStatus}) async {
    _isProductsLoading = true;
    notifyListeners();

    try {
      _products = await _vendorRepo.getMyProducts(
        moderationStatus: moderationStatus,
      );
    } catch (e) {
      _error = e.toString();
    }

    _isProductsLoading = false;
    notifyListeners();
  }

  // ==================== SHOP ====================

  Future<ShopModel> createShop({
    required String name,
    String? description,
    String? logoUrl,
    String? phone,
    String? email,
    String? address,
    String? city,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _shop = await _vendorRepo.createShop(
        name: name,
        description: description,
        logoUrl: logoUrl,
        phone: phone,
        email: email,
        address: address,
        city: city,
      );
      return _shop!;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateShop({
    String? name,
    String? description,
    String? logoUrl,
    String? bannerUrl,
    String? phone,
    String? email,
    String? address,
    String? city,
  }) async {
    if (_shop == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _shop = await _vendorRepo.updateShop(
        shopId: _shop!.id,
        name: name,
        description: description,
        logoUrl: logoUrl,
        bannerUrl: bannerUrl,
        phone: phone,
        email: email,
        address: address,
        city: city,
      );
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ==================== PRODUCTS ====================

  Future<ProductModel> createProduct({
    required String nameUz,
    required String nameRu,
    String? descriptionUz,
    String? descriptionRu,
    required double price,
    double? oldPrice,
    required String categoryId,
    List<String>? images,
    int stock = 0,
    int? cashbackPercent,
  }) async {
    try {
      final product = await _vendorRepo.createProduct(
        nameUz: nameUz,
        nameRu: nameRu,
        descriptionUz: descriptionUz,
        descriptionRu: descriptionRu,
        price: price,
        oldPrice: oldPrice,
        categoryId: categoryId,
        images: images,
        stock: stock,
        cashbackPercent: cashbackPercent,
      );
      await loadProducts();
      return product;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateProduct({
    required String productId,
    String? nameUz,
    String? nameRu,
    String? descriptionUz,
    String? descriptionRu,
    double? price,
    double? oldPrice,
    String? categoryId,
    List<String>? images,
    int? stock,
    int? cashbackPercent,
  }) async {
    try {
      await _vendorRepo.updateProduct(
        productId: productId,
        nameUz: nameUz,
        nameRu: nameRu,
        descriptionUz: descriptionUz,
        descriptionRu: descriptionRu,
        price: price,
        oldPrice: oldPrice,
        categoryId: categoryId,
        images: images,
        stock: stock,
        cashbackPercent: cashbackPercent,
      );
      await loadProducts();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteProduct(String productId) async {
    try {
      await _vendorRepo.deleteProduct(productId);
      await loadProducts();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // ==================== ORDERS ====================

  Future<List<OrderModel>> getMyOrders({String? status}) async {
    try {
      return await _vendorRepo.getMyOrders(status: status);
    } catch (e) {
      _error = e.toString();
      return [];
    }
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus status) async {
    try {
      await _vendorRepo.updateOrderStatus(orderId, status);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  // ==================== PAYOUTS ====================

  Future<List<PayoutModel>> getMyPayouts({PayoutStatus? status}) async {
    try {
      return await _vendorRepo.getMyPayouts(status: status);
    } catch (e) {
      _error = e.toString();
      return [];
    }
  }

  Future<PayoutModel> requestPayout({
    required double amount,
    required String bankName,
    required String accountNumber,
    required String accountHolder,
    String? notes,
  }) async {
    try {
      return await _vendorRepo.requestPayout(
        amount: amount,
        bankName: bankName,
        accountNumber: accountNumber,
        accountHolder: accountHolder,
        notes: notes,
      );
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }
}
