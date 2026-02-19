/// Brand model - Brend ma'lumotlari
/// Samsung, Apple, Xiaomi va h.k.
class BrandModel {
  final String id;
  final String nameUz;
  final String? nameRu;
  final String slug;
  final String? logoUrl;
  final bool isActive;
  final int sortOrder;
  final int productCount; // Ushbu brenddagi mahsulotlar soni

  const BrandModel({
    required this.id,
    required this.nameUz,
    this.nameRu,
    required this.slug,
    this.logoUrl,
    this.isActive = true,
    this.sortOrder = 0,
    this.productCount = 0,
  });

  String getName(String locale) {
    if (locale == 'ru' && nameRu != null && nameRu!.isNotEmpty) {
      return nameRu!;
    }
    return nameUz;
  }

  factory BrandModel.fromJson(Map<String, dynamic> json) {
    return BrandModel(
      id: json['id'] as String,
      nameUz:
          (json['nameUz'] ?? json['name_uz'] ?? json['name'] ?? '') as String,
      nameRu: (json['nameRu'] ?? json['name_ru']) as String?,
      slug: (json['slug'] ?? json['id'] ?? '') as String,
      logoUrl: (json['logoUrl'] ?? json['logo_url']) as String?,
      isActive: (json['isActive'] ?? json['is_active']) as bool? ?? true,
      sortOrder: (json['sortOrder'] ?? json['sort_order']) as int? ?? 0,
      productCount: (json['productCount'] ??
              json['product_count'] ??
              json['_count']?['products']) as int? ??
          0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name_uz': nameUz,
      'name_ru': nameRu,
      'slug': slug,
      'logo_url': logoUrl,
      'is_active': isActive,
      'sort_order': sortOrder,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BrandModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'BrandModel(id: $id, name: $nameUz)';
}
