/// Savat elementi modeli
class CartItemModel {
  final String id;
  final String userId;
  final String productId;
  final String? variantId;
  final int quantity;
  final ProductInfo? product;

  CartItemModel({
    required this.id,
    required this.userId,
    required this.productId,
    this.variantId,
    this.quantity = 1,
    this.product,
  });

  CartItemModel copyWith({
    String? id,
    String? userId,
    String? productId,
    String? variantId,
    int? quantity,
    ProductInfo? product,
  }) {
    return CartItemModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      productId: productId ?? this.productId,
      variantId: variantId ?? this.variantId,
      quantity: quantity ?? this.quantity,
      product: product ?? this.product,
    );
  }

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    final productData = json['product'] ?? json['products'];
    return CartItemModel(
      id: json['id'] as String? ?? '',
      userId: (json['user_id'] ?? json['userId']) as String? ?? '',
      productId: (json['product_id'] ?? json['productId']) as String? ?? '',
      variantId: (json['variant_id'] ?? json['variantId']) as String?,
      quantity: json['quantity'] as int? ?? 1,
      product: productData != null
          ? ProductInfo.fromJson(productData as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'product_id': productId,
        'variant_id': variantId,
        'quantity': quantity,
        'product': product?.toJson(),
      };

  double get total => (product?.price ?? 0) * quantity;
}

/// Mahsulot qisqa ma'lumoti (savat uchun)
class ProductInfo {
  final String id;
  final String nameUz;
  final String nameRu;
  final double price;
  final double? oldPrice;
  final List<String> images;
  final int stock;

  ProductInfo({
    required this.id,
    required this.nameUz,
    required this.nameRu,
    required this.price,
    this.oldPrice,
    this.images = const [],
    this.stock = 0,
  });

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }

  static int? _toInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v);
    return null;
  }

  factory ProductInfo.fromJson(Map<String, dynamic> json) {
    return ProductInfo(
      id: json['id'] as String? ?? '',
      nameUz: (json['name_uz'] ?? json['nameUz'] ?? json['name']) as String? ??
          'Nomsiz mahsulot',
      nameRu: (json['name_ru'] ?? json['nameRu'] ?? json['name']) as String? ??
          'Без названия',
      price: _toDouble(json['price']) ?? 0.0,
      oldPrice: _toDouble(
          json['old_price'] ?? json['oldPrice'] ?? json['originalPrice']),
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      stock: _toInt(json['stock']) ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name_uz': nameUz,
        'name_ru': nameRu,
        'price': price,
        'old_price': oldPrice,
        'images': images,
        'stock': stock,
      };

  String getName(String locale) => locale == 'ru' ? nameRu : nameUz;
  String? get firstImage => images.isNotEmpty ? images.first : null;
}
