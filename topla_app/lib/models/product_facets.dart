/// Fasetli filtr ma'lumotlari
/// Kategoriya bo'yicha brendlar, ranglar, o'lchamlar va ularning mahsulot sonlari
class ProductFacets {
  final List<BrandFacet> brands;
  final List<ColorFacet> colors;
  final List<SizeFacet> sizes;
  final List<AttributeFacet> attributes;
  final PriceRange priceRange;
  final int discountCount;
  final int inStockCount;
  final int totalCount;

  const ProductFacets({
    this.brands = const [],
    this.colors = const [],
    this.sizes = const [],
    this.attributes = const [],
    this.priceRange = const PriceRange(),
    this.discountCount = 0,
    this.inStockCount = 0,
    this.totalCount = 0,
  });

  factory ProductFacets.fromJson(Map<String, dynamic> json) {
    return ProductFacets(
      brands: (json['brands'] as List<dynamic>?)
              ?.map((e) => BrandFacet.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      colors: (json['colors'] as List<dynamic>?)
              ?.map((e) => ColorFacet.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      sizes: (json['sizes'] as List<dynamic>?)
              ?.map((e) => SizeFacet.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      attributes: (json['attributes'] as List<dynamic>?)
              ?.map((e) => AttributeFacet.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      priceRange: PriceRange.fromJson(
          json['priceRange'] as Map<String, dynamic>? ?? {}),
      discountCount: json['discountCount'] as int? ?? 0,
      inStockCount: json['inStockCount'] as int? ?? 0,
      totalCount: json['totalCount'] as int? ?? 0,
    );
  }

  static const empty = ProductFacets();
}

class BrandFacet {
  final String id;
  final String name;
  final String? logoUrl;
  final int count;

  const BrandFacet({
    required this.id,
    required this.name,
    this.logoUrl,
    this.count = 0,
  });

  factory BrandFacet.fromJson(Map<String, dynamic> json) {
    return BrandFacet(
      id: json['id'] as String,
      name: json['name'] as String,
      logoUrl: json['logoUrl'] as String?,
      count: json['count'] as int? ?? 0,
    );
  }
}

class ColorFacet {
  final String id;
  final String nameUz;
  final String? nameRu;
  final String hexCode;
  final int count;

  const ColorFacet({
    required this.id,
    required this.nameUz,
    this.nameRu,
    required this.hexCode,
    this.count = 0,
  });

  String getName(String locale) {
    if (locale == 'ru' && nameRu != null && nameRu!.isNotEmpty) return nameRu!;
    return nameUz;
  }

  factory ColorFacet.fromJson(Map<String, dynamic> json) {
    return ColorFacet(
      id: json['id'] as String,
      nameUz: json['nameUz'] as String? ?? '',
      nameRu: json['nameRu'] as String?,
      hexCode: json['hexCode'] as String? ?? '#000000',
      count: json['count'] as int? ?? 0,
    );
  }
}

class SizeFacet {
  final String id;
  final String nameUz;
  final String? nameRu;
  final int count;

  const SizeFacet({
    required this.id,
    required this.nameUz,
    this.nameRu,
    this.count = 0,
  });

  String getName(String locale) {
    if (locale == 'ru' && nameRu != null && nameRu!.isNotEmpty) return nameRu!;
    return nameUz;
  }

  factory SizeFacet.fromJson(Map<String, dynamic> json) {
    return SizeFacet(
      id: json['id'] as String,
      nameUz: json['nameUz'] as String? ?? '',
      nameRu: json['nameRu'] as String?,
      count: json['count'] as int? ?? 0,
    );
  }
}

class PriceRange {
  final double min;
  final double max;
  final double avg;

  const PriceRange({this.min = 0, this.max = 0, this.avg = 0});

  factory PriceRange.fromJson(Map<String, dynamic> json) {
    return PriceRange(
      min: (json['min'] as num?)?.toDouble() ?? 0,
      max: (json['max'] as num?)?.toDouble() ?? 0,
      avg: (json['avg'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Atribut facet — Yandex Market style
/// Har bir atribut uchun qiymatlar va ularning product soni
class AttributeFacet {
  final String id;
  final String key;
  final String nameUz;
  final String? nameRu;
  final String type; // chips, range, toggle, color, radio
  final String? unit;
  final int productCount;
  // Range type uchun
  final double? rangeMin;
  final double? rangeMax;
  // Chips/radio/color type uchun
  final List<AttributeValueFacet> values;

  const AttributeFacet({
    required this.id,
    required this.key,
    required this.nameUz,
    this.nameRu,
    required this.type,
    this.unit,
    this.productCount = 0,
    this.rangeMin,
    this.rangeMax,
    this.values = const [],
  });

  String getName(String locale) {
    if (locale == 'ru' && nameRu != null && nameRu!.isNotEmpty) return nameRu!;
    return nameUz;
  }

  factory AttributeFacet.fromJson(Map<String, dynamic> json) {
    return AttributeFacet(
      id: json['id'] as String,
      key: json['key'] as String,
      nameUz: json['nameUz'] as String? ?? '',
      nameRu: json['nameRu'] as String?,
      type: json['type'] as String? ?? 'chips',
      unit: json['unit'] as String?,
      productCount: json['productCount'] as int? ?? 0,
      rangeMin: (json['rangeMin'] as num?)?.toDouble(),
      rangeMax: (json['rangeMax'] as num?)?.toDouble(),
      values: (json['values'] as List<dynamic>?)
              ?.map((e) =>
                  AttributeValueFacet.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class AttributeValueFacet {
  final String value;
  final int count;

  const AttributeValueFacet({required this.value, this.count = 0});

  factory AttributeValueFacet.fromJson(Map<String, dynamic> json) {
    return AttributeValueFacet(
      value: json['value'] as String,
      count: json['count'] as int? ?? 0,
    );
  }
}
