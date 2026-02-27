/// Mahsulot modeli
class ProductModel {
  final String id;
  final String nameUz;
  final String nameRu;
  final String? descriptionUz;
  final String? descriptionRu;
  final double price;
  final double? oldPrice;
  final String? categoryId;
  final String? subcategoryId;
  final String? shopId;
  final List<String> images;
  final int stock;
  final int soldCount;
  final double rating;
  final int reviewCount;
  final bool isActive;
  final bool isFeatured;
  final int? cashbackPercent;
  final DateTime? createdAt;
  // Do'kon ma'lumotlari (backend'dan kelgan raw data)
  final Map<String, dynamic>? shopData;
  // Moderatsiya uchun
  final String? moderationStatus;
  final String? rejectionReason;

  ProductModel({
    required this.id,
    required this.nameUz,
    required this.nameRu,
    this.descriptionUz,
    this.descriptionRu,
    required this.price,
    this.oldPrice,
    this.categoryId,
    this.subcategoryId,
    this.shopId,
    this.images = const [],
    this.stock = 0,
    this.soldCount = 0,
    this.rating = 0,
    this.reviewCount = 0,
    this.isActive = true,
    this.isFeatured = false,
    this.cashbackPercent = 0,
    this.createdAt,
    this.shopData,
    this.moderationStatus,
    this.rejectionReason,
  });

  /// Xavfsiz num parse — backend string yoki num qaytarishi mumkin
  static double _parseDouble(dynamic value, [double fallback = 0]) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static int _parseInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] as String,
      nameUz:
          (json['nameUz'] ?? json['name_uz'] ?? json['name'] ?? '') as String,
      nameRu:
          (json['nameRu'] ?? json['name_ru'] ?? json['name'] ?? '') as String,
      descriptionUz: (json['descriptionUz'] ??
          json['description_uz'] ??
          json['description']) as String?,
      descriptionRu: (json['descriptionRu'] ??
          json['description_ru'] ??
          json['description']) as String?,
      price: _parseDouble(json['price']),
      oldPrice: (json['oldPrice'] ??
                  json['old_price'] ??
                  json['originalPrice']) !=
              null
          ? _parseDouble(
              json['oldPrice'] ?? json['old_price'] ?? json['originalPrice'])
          : null,
      categoryId: (json['categoryId'] ?? json['category_id']) as String?,
      subcategoryId:
          (json['subcategoryId'] ?? json['subcategory_id']) as String?,
      shopId: (json['shopId'] ??
          json['shop_id'] ??
          (json['shop'] is Map ? json['shop']['id'] : null)) as String?,
      shopData: json['shop'] is Map<String, dynamic>
          ? json['shop'] as Map<String, dynamic>
          : null,
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      stock: _parseInt(json['stock']),
      soldCount: _parseInt(
          json['salesCount'] ?? json['sold_count'] ?? json['soldCount']),
      rating: _parseDouble(json['rating']),
      reviewCount: _parseInt(json['reviewCount'] ?? json['review_count']),
      isActive: (json['isActive'] ?? json['is_active']) as bool? ?? true,
      isFeatured: (json['isFeatured'] ?? json['is_featured']) as bool? ?? false,
      cashbackPercent: _parseInt(json['discountPercent'] ??
          json['cashback_percent'] ??
          json['cashbackPercent']),
      createdAt: (json['createdAt'] ?? json['created_at']) != null
          ? DateTime.tryParse(
              (json['createdAt'] ?? json['created_at']).toString())
          : null,
      moderationStatus:
          (json['moderationStatus'] ?? json['moderation_status']) as String?,
      rejectionReason:
          (json['rejectionReason'] ?? json['rejection_reason']) as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': nameUz,
      'description': descriptionUz,
      'price': price,
      'originalPrice': oldPrice,
      'categoryId': categoryId,
      'subcategoryId': subcategoryId,
      'shopId': shopId,
      'images': images,
      'stock': stock,
      'isActive': isActive,
      'isFeatured': isFeatured,
    };
  }

  /// Til bo'yicha nom olish
  String getName(String locale) {
    if (locale == 'ru' && nameRu.isNotEmpty) return nameRu;
    return nameUz;
  }

  /// Til bo'yicha tavsif olish
  String? getDescription(String locale) {
    return locale == 'ru' ? descriptionRu : descriptionUz;
  }

  /// Chegirma foizi
  int get discountPercent {
    if (oldPrice == null || oldPrice! <= price) return 0;
    return ((oldPrice! - price) / oldPrice! * 100).round();
  }

  /// Birinchi rasm
  String? get firstImage => images.isNotEmpty ? images.first : null;

  /// Omborda bormi
  bool get inStock => stock > 0;

  /// Tilga mos nom (default Uzbek)
  String get name => nameUz;

  /// Birinchi rasm URL
  String? get imageUrl => firstImage;

  /// Asl narx (oldPrice)
  double? get originalPrice => oldPrice;

  /// Map formatiga aylantirish (ProductDetailScreen uchun)
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': nameUz,
      'name_uz': nameUz,
      'name_ru': nameRu,
      'description': descriptionUz,
      'description_uz': descriptionUz,
      'description_ru': descriptionRu,
      'price': price.toInt(),
      'oldPrice': oldPrice?.toInt(),
      'discount': discountPercent,
      'image': firstImage ?? '',
      'images': images,
      'rating': rating,
      'sold': soldCount,
      'cashback': cashbackPercent,
      'stock': stock,
      'category_id': categoryId,
      'shopId': shopId,
      'shop_id': shopId,
      'shop': shopData ??
          (shopId != null ? {'id': shopId, 'name': '', 'logoUrl': null} : null),
    };
  }
}
