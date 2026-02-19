import '../core/services/api_client.dart';
import '../models/shop_model.dart';
import '../models/payout_model.dart';
import '../models/commission_model.dart';
import '../models/vendor_stats.dart';
import '../models/product_model.dart';
import '../models/order_model.dart';

/// Vendor (Do'kon egasi) servislar - Node.js API orqali
class VendorService {
  static final _api = ApiClient();

  // ==================== SHOP ====================

  /// Vendor o'z do'konini olish
  static Future<ShopModel?> getMyShop() async {
    try {
      final response = await _api.get('/vendor/shop');
      return ShopModel.fromJson(response.dataMap);
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  /// Yangi do'kon yaratish
  static Future<ShopModel> createShop({
    required String name,
    String? description,
    String? logoUrl,
    String? phone,
    String? email,
    String? address,
    String? city,
  }) async {
    final response = await _api.post('/vendor/shop', body: {
      'name': name,
      if (description != null) 'description': description,
      if (logoUrl != null) 'logoUrl': logoUrl,
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      if (address != null) 'address': address,
      if (city != null) 'city': city,
    });
    return ShopModel.fromJson(response.dataMap);
  }

  /// Do'konni yangilash
  static Future<ShopModel> updateShop({
    required String shopId,
    String? name,
    String? description,
    String? logoUrl,
    String? bannerUrl,
    String? phone,
    String? email,
    String? address,
    String? city,
  }) async {
    final updates = <String, dynamic>{};
    if (name != null) updates['name'] = name;
    if (description != null) updates['description'] = description;
    if (logoUrl != null) updates['logoUrl'] = logoUrl;
    if (bannerUrl != null) updates['bannerUrl'] = bannerUrl;
    if (phone != null) updates['phone'] = phone;
    if (email != null) updates['email'] = email;
    if (address != null) updates['address'] = address;
    if (city != null) updates['city'] = city;

    if (updates.isEmpty) {
      final current = await getMyShop();
      if (current == null) throw Exception('Do\'kon topilmadi');
      return current;
    }

    final response = await _api.put('/vendor/shop', body: updates);
    return ShopModel.fromJson(response.dataMap);
  }

  // ==================== PRODUCTS ====================

  /// Vendor mahsulotlarini olish
  static Future<List<ProductModel>> getMyProducts({
    String? moderationStatus,
    int limit = 50,
    int offset = 0,
  }) async {
    final params = <String, dynamic>{
      'limit': limit,
      'offset': offset,
    };
    if (moderationStatus != null) params['moderationStatus'] = moderationStatus;

    final response = await _api.get('/vendor/products', queryParams: params);
    return (response.nestedList('products'))
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  /// Yangi mahsulot qo'shish
  static Future<ProductModel> createProduct({
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
    final response = await _api.post('/vendor/products', body: {
      'name': nameUz,
      'nameRu': nameRu,
      if (descriptionUz != null) 'description': descriptionUz,
      if (descriptionRu != null) 'descriptionRu': descriptionRu,
      'price': price,
      if (oldPrice != null) 'originalPrice': oldPrice,
      'categoryId': categoryId,
      if (images != null) 'images': images,
      'stock': stock,
      if (cashbackPercent != null) 'cashbackPercent': cashbackPercent,
    });
    return ProductModel.fromJson(response.dataMap);
  }

  /// Mahsulotni yangilash
  static Future<ProductModel> updateProduct({
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
    final body = <String, dynamic>{};
    if (nameUz != null) body['name'] = nameUz;
    if (nameRu != null) body['nameRu'] = nameRu;
    if (descriptionUz != null) body['description'] = descriptionUz;
    if (descriptionRu != null) body['descriptionRu'] = descriptionRu;
    if (price != null) body['price'] = price;
    if (oldPrice != null) body['originalPrice'] = oldPrice;
    if (categoryId != null) body['categoryId'] = categoryId;
    if (images != null) body['images'] = images;
    if (stock != null) body['stock'] = stock;
    if (cashbackPercent != null) body['cashbackPercent'] = cashbackPercent;

    final response = await _api.put('/vendor/products/$productId', body: body);
    return ProductModel.fromJson(response.dataMap);
  }

  /// Mahsulotni o'chirish
  static Future<void> deleteProduct(String productId) async {
    await _api.delete('/vendor/products/$productId');
  }

  /// Mahsulotni qayta yuborish (moderatsiya uchun)
  static Future<void> resubmitProduct(String productId) async {
    await _api.put('/vendor/products/$productId', body: {'status': 'pending'});
  }

  // ==================== ORDERS ====================

  /// Vendor buyurtmalarini olish
  static Future<List<OrderModel>> getMyOrders({
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    final params = <String, dynamic>{
      'limit': limit,
      'offset': offset,
    };
    if (status != null) params['status'] = status;

    final response = await _api.get('/vendor/orders', queryParams: params);
    return (response.dataList).map((e) => OrderModel.fromJson(e)).toList();
  }

  /// Buyurtma statusini yangilash
  static Future<void> updateOrderStatus(String orderId, String status) async {
    await _api.put('/vendor/orders/$orderId/status', body: {
      'status': status,
    });
  }

  // ==================== PAYOUTS ====================

  /// Vendor to'lovlarini olish
  static Future<List<PayoutModel>> getMyPayouts({
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    final params = <String, dynamic>{
      'limit': limit,
      'offset': offset,
    };
    if (status != null) params['status'] = status;

    final response = await _api.get('/vendor/payouts', queryParams: params);
    return (response.dataList).map((e) => PayoutModel.fromJson(e)).toList();
  }

  /// To'lov so'rovi yaratish
  static Future<PayoutModel> requestPayout({
    required double amount,
    required String bankName,
    required String accountNumber,
    required String accountHolder,
    String? notes,
  }) async {
    final response = await _api.post('/vendor/payouts', body: {
      'amount': amount,
      'cardNumber': accountNumber,
    });
    return PayoutModel.fromJson(response.dataMap);
  }

  // ==================== COMMISSIONS ====================

  /// Komissiya tarixini olish
  static Future<List<CommissionModel>> getMyCommissions({
    int limit = 50,
    int offset = 0,
  }) async {
    final response = await _api.get(
      '/vendor/commissions',
      queryParams: {'limit': limit, 'offset': offset},
    );
    return (response.dataList).map((e) => CommissionModel.fromJson(e)).toList();
  }

  // ==================== STATS ====================

  /// Vendor statistikasi
  static Future<VendorStatsModel> getMyStats() async {
    final response = await _api.get('/vendor/stats');
    final data = response.dataMap;

    return VendorStatsModel(
      balance: (data['balance'] ?? 0).toDouble(),
      totalSales: (data['total_sales'] ?? data['totalSales'] ?? 0).toDouble(),
      totalOrders: data['total_orders'] ?? data['totalOrders'] ?? 0,
      totalProducts: data['total_products'] ?? data['totalProducts'] ?? 0,
      rating: (data['rating'] ?? 0).toDouble(),
      reviewCount: data['review_count'] ?? data['reviewCount'] ?? 0,
      todayOrders: data['today_orders'] ?? data['todayOrders'] ?? 0,
      todayRevenue:
          (data['today_revenue'] ?? data['todayRevenue'] ?? 0).toDouble(),
      monthlyRevenue:
          (data['monthly_revenue'] ?? data['monthlyRevenue'] ?? 0).toDouble(),
      monthlyCommission:
          (data['monthly_commission'] ?? data['monthlyCommission'] ?? 0)
              .toDouble(),
      monthlyOrders: data['monthly_orders'] ?? data['monthlyOrders'] ?? 0,
      activeProducts: data['active_products'] ?? data['activeProducts'] ?? 0,
      pendingProducts: data['pending_products'] ?? data['pendingProducts'] ?? 0,
      rejectedProducts:
          data['rejected_products'] ?? data['rejectedProducts'] ?? 0,
    );
  }

  // ==================== ANALYTICS ====================

  /// Vendor analitikasi
  static Future<Map<String, dynamic>> getAnalytics({
    String period = 'week',
  }) async {
    final response = await _api.get(
      '/vendor/analytics',
      queryParams: {'period': period},
    );
    return response.dataMap;
  }

  // ==================== IMAGE UPLOAD ====================

  /// Rasm yuklash
  static Future<String> uploadImage(
    String filePath,
    String fileName,
  ) async {
    final response = await _api.upload(
      '/upload/image',
      filePath: filePath,
      fieldName: 'image',
      fields: {'folder': 'shops'},
    );
    return response.dataMap['url'] as String;
  }
}
