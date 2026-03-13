import 'category_filter_attribute.dart';

/// Mahsulotlar uchun filter modeli
/// Bu model barcha filter parametrlarini saqlaydi
/// Uzum-style professional filtering uchun kengaytirilgan
class ProductFilter {
  // === Asosiy filterlar ===
  final double? minPrice;
  final double? maxPrice;
  final double? minRating;
  final bool onlyInStock;
  final bool onlyWithDiscount;
  final String? sortBy;
  final bool sortAscending;

  // === Yangi Uzum-style filterlar ===
  /// Tanlangan brendlar
  final Set<String> brandIds;

  /// Tanlangan ranglar
  final Set<String> colorIds;

  /// Tanlangan o'lchamlar
  final Set<String> sizeIds;

  /// Yetkazib berish muddati (soat)
  /// null = hammasi, 2 = 2 soat ichida, 24 = ertaga, 72 = 3 kun ichida
  final int? deliveryHours;

  /// Yetkazish usuli
  /// null = Muhim emas, 'courier' = Kuryer, 'pickup_point' = Topshirish punktiga, 'pickup' = Olib ketish
  final String? deliveryType;

  /// Click yetkazib berish (tez yetkazib berish)
  final bool? isClickDelivery;

  /// Original mahsulot (sifat kafolati)
  final bool? isOriginal;

  /// WOW narx (katta chegirmali maxsus narx)
  final bool? isWowPrice;

  /// Tanlangan do'konlar
  final Set<String> shopIds;

  /// Kategoriyaga xos atributlar
  /// Key: attribute_key (masalan: 'ram', 'storage', 'screen_size')
  /// Value: SelectedFilterValue (tanlangan qiymatlar)
  final Map<String, SelectedFilterValue> attributes;

  /// Tanlangan kategoriya ID (subkategoriya)
  final String? selectedCategoryId;

  const ProductFilter({
    this.minPrice,
    this.maxPrice,
    this.minRating,
    this.onlyInStock = false,
    this.onlyWithDiscount = false,
    this.sortBy,
    this.sortAscending = true,
    this.brandIds = const {},
    this.colorIds = const {},
    this.sizeIds = const {},
    this.deliveryHours,
    this.deliveryType,
    this.isClickDelivery,
    this.isOriginal,
    this.isWowPrice,
    this.shopIds = const {},
    this.attributes = const {},
    this.selectedCategoryId,
  });

  /// Default filter - hech qanday filter yo'q
  factory ProductFilter.empty() => const ProductFilter();

  /// Filter faolmi yoki yo'qmi
  bool get hasActiveFilters =>
      minPrice != null ||
      maxPrice != null ||
      minRating != null ||
      onlyInStock ||
      onlyWithDiscount ||
      brandIds.isNotEmpty ||
      colorIds.isNotEmpty ||
      sizeIds.isNotEmpty ||
      deliveryHours != null ||
      deliveryType != null ||
      isClickDelivery != null ||
      isOriginal != null ||
      isWowPrice != null ||
      shopIds.isNotEmpty ||
      attributes.values.any((v) => v.hasValue);

  /// Faol filterlar soni
  int get activeFilterCount {
    int count = 0;
    if (minPrice != null || maxPrice != null) count++;
    if (minRating != null) count++;
    if (onlyInStock) count++;
    if (onlyWithDiscount) count++;
    if (brandIds.isNotEmpty) count++;
    if (colorIds.isNotEmpty) count++;
    if (sizeIds.isNotEmpty) count++;
    if (deliveryHours != null) count++;
    if (deliveryType != null) count++;
    if (isClickDelivery == true) count++;
    if (isOriginal == true) count++;
    if (isWowPrice == true) count++;
    if (shopIds.isNotEmpty) count++;
    count += attributes.values.where((v) => v.hasValue).length;
    return count;
  }

  /// Yangi filter bilan copy
  ProductFilter copyWith({
    double? minPrice,
    double? maxPrice,
    double? minRating,
    bool? onlyInStock,
    bool? onlyWithDiscount,
    String? sortBy,
    bool? sortAscending,
    Set<String>? brandIds,
    Set<String>? colorIds,
    Set<String>? sizeIds,
    int? deliveryHours,
    String? deliveryType,
    bool? isClickDelivery,
    bool? isOriginal,
    bool? isWowPrice,
    Set<String>? shopIds,
    Map<String, SelectedFilterValue>? attributes,
    String? selectedCategoryId,
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    bool clearMinRating = false,
    bool clearDeliveryHours = false,
    bool clearDeliveryType = false,
    bool clearIsClickDelivery = false,
    bool clearIsOriginal = false,
    bool clearIsWowPrice = false,
    bool clearSelectedCategoryId = false,
  }) {
    return ProductFilter(
      minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      minRating: clearMinRating ? null : (minRating ?? this.minRating),
      onlyInStock: onlyInStock ?? this.onlyInStock,
      onlyWithDiscount: onlyWithDiscount ?? this.onlyWithDiscount,
      sortBy: sortBy ?? this.sortBy,
      sortAscending: sortAscending ?? this.sortAscending,
      brandIds: brandIds ?? this.brandIds,
      colorIds: colorIds ?? this.colorIds,
      sizeIds: sizeIds ?? this.sizeIds,
      deliveryHours:
          clearDeliveryHours ? null : (deliveryHours ?? this.deliveryHours),
      deliveryType:
          clearDeliveryType ? null : (deliveryType ?? this.deliveryType),
      isClickDelivery: clearIsClickDelivery
          ? null
          : (isClickDelivery ?? this.isClickDelivery),
      isOriginal: clearIsOriginal ? null : (isOriginal ?? this.isOriginal),
      isWowPrice: clearIsWowPrice ? null : (isWowPrice ?? this.isWowPrice),
      shopIds: shopIds ?? this.shopIds,
      attributes: attributes ?? this.attributes,
      selectedCategoryId: clearSelectedCategoryId
          ? null
          : (selectedCategoryId ?? this.selectedCategoryId),
    );
  }

  /// Atribut qo'shish/yangilash
  ProductFilter withAttribute(String key, SelectedFilterValue value) {
    final newAttributes = Map<String, SelectedFilterValue>.from(attributes);
    if (value.hasValue) {
      newAttributes[key] = value;
    } else {
      newAttributes.remove(key);
    }
    return copyWith(attributes: newAttributes);
  }

  /// Atributni olib tashlash
  ProductFilter withoutAttribute(String key) {
    final newAttributes = Map<String, SelectedFilterValue>.from(attributes);
    newAttributes.remove(key);
    return copyWith(attributes: newAttributes);
  }

  /// Brend qo'shish
  ProductFilter withBrand(String brandId) {
    return copyWith(brandIds: {...brandIds, brandId});
  }

  /// Brendni olib tashlash
  ProductFilter withoutBrand(String brandId) {
    return copyWith(brandIds: brandIds.where((id) => id != brandId).toSet());
  }

  /// Rang qo'shish
  ProductFilter withColor(String colorId) {
    return copyWith(colorIds: {...colorIds, colorId});
  }

  /// Rangni olib tashlash
  ProductFilter withoutColor(String colorId) {
    return copyWith(colorIds: colorIds.where((id) => id != colorId).toSet());
  }

  /// O'lcham qo'shish
  ProductFilter withSize(String sizeId) {
    return copyWith(sizeIds: {...sizeIds, sizeId});
  }

  /// O'lchamni olib tashlash
  ProductFilter withoutSize(String sizeId) {
    return copyWith(sizeIds: sizeIds.where((id) => id != sizeId).toSet());
  }

  /// Do'kon qo'shish
  ProductFilter withShop(String shopId) {
    return copyWith(shopIds: {...shopIds, shopId});
  }

  /// Do'konni olib tashlash
  ProductFilter withoutShop(String shopId) {
    return copyWith(shopIds: shopIds.where((id) => id != shopId).toSet());
  }

  /// Barcha filterlarni tozalash
  ProductFilter clear() => ProductFilter.empty();

  /// Faqat sortni saqlab qolgan holda tozalash
  ProductFilter clearFiltersOnly() {
    return ProductFilter(
      sortBy: sortBy,
      sortAscending: sortAscending,
    );
  }

  /// Sort options (backend enum bilan mos)
  static const String sortByPopular = 'popular';
  static const String sortByPriceLow = 'price_asc';
  static const String sortByPriceHigh = 'price_desc';
  static const String sortByRating = 'rating';
  static const String sortByNewest = 'newest';
  static const String sortByDiscount = 'discount';

  /// API query uchun filter map (backend param nomlari bilan)
  Map<String, dynamic> toQueryMap() {
    final map = <String, dynamic>{};

    if (minPrice != null) map['minPrice'] = minPrice;
    if (maxPrice != null) map['maxPrice'] = maxPrice;
    if (minRating != null) map['minRating'] = minRating;
    if (onlyInStock) map['inStock'] = true;
    if (onlyWithDiscount) map['hasDiscount'] = true;
    if (sortBy != null) map['sortBy'] = sortBy;
    if (brandIds.isNotEmpty) map['brandIds'] = brandIds.join(',');
    if (colorIds.isNotEmpty) map['colorIds'] = colorIds.join(',');
    if (sizeIds.isNotEmpty) map['sizeIds'] = sizeIds.join(',');
    if (shopIds.isNotEmpty) map['shopIds'] = shopIds.join(',');
    if (isWowPrice == true) map['isWowPrice'] = true;
    if (deliveryHours != null) map['deliveryHours'] = deliveryHours;
    if (deliveryType != null) map['deliveryType'] = deliveryType;
    if (selectedCategoryId != null) map['categoryId'] = selectedCategoryId;

    // Dynamic category attributes → "ram:8GB,16GB;screen_size_min:6;screen_size_max:17"
    if (attributes.isNotEmpty) {
      final parts = <String>[];
      for (final entry in attributes.entries) {
        final val = entry.value;
        if (!val.hasValue) continue;
        final qm = val.toQueryMap();
        for (final kv in qm.entries) {
          if (kv.value is List) {
            parts.add('${kv.key}:${(kv.value as List).join(',')}');
          } else {
            parts.add('${kv.key}:${kv.value}');
          }
        }
      }
      if (parts.isNotEmpty) {
        map['attributes'] = parts.join(';');
      }
    }

    return map;
  }

  @override
  String toString() {
    return 'ProductFilter(minPrice: $minPrice, maxPrice: $maxPrice, minRating: $minRating, '
        'onlyInStock: $onlyInStock, onlyWithDiscount: $onlyWithDiscount, '
        'sortBy: $sortBy, sortAscending: $sortAscending, brands: ${brandIds.length}, colors: ${colorIds.length}, '
        'deliveryHours: $deliveryHours, deliveryType: $deliveryType, isClickDelivery: $isClickDelivery, isOriginal: $isOriginal, isWowPrice: $isWowPrice, shops: ${shopIds.length}, '
        'attributes: ${attributes.length})';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ProductFilter &&
        other.minPrice == minPrice &&
        other.maxPrice == maxPrice &&
        other.minRating == minRating &&
        other.onlyInStock == onlyInStock &&
        other.onlyWithDiscount == onlyWithDiscount &&
        other.sortBy == sortBy &&
        other.sortAscending == sortAscending &&
        _setEquals(other.brandIds, brandIds) &&
        _setEquals(other.colorIds, colorIds) &&
        _setEquals(other.sizeIds, sizeIds) &&
        other.deliveryHours == deliveryHours &&
        other.deliveryType == deliveryType &&
        other.isClickDelivery == isClickDelivery &&
        other.isOriginal == isOriginal &&
        other.isWowPrice == isWowPrice &&
        _setEquals(other.shopIds, shopIds) &&
        other.selectedCategoryId == selectedCategoryId &&
        _mapEquals(other.attributes, attributes);
  }

  static bool _mapEquals(
      Map<String, SelectedFilterValue> a, Map<String, SelectedFilterValue> b) {
    if (a.length != b.length) return false;
    for (final key in a.keys) {
      if (!b.containsKey(key)) return false;
      final aVal = a[key]!;
      final bVal = b[key]!;
      if (aVal.attributeKey != bVal.attributeKey ||
          aVal.filterType != bVal.filterType ||
          aVal.minValue != bVal.minValue ||
          aVal.maxValue != bVal.maxValue ||
          aVal.toggleValue != bVal.toggleValue ||
          !_setEquals(aVal.selectedValues, bVal.selectedValues)) {
        return false;
      }
    }
    return true;
  }

  static bool _setEquals<T>(Set<T> a, Set<T> b) {
    if (a.length != b.length) return false;
    for (final item in a) {
      if (!b.contains(item)) return false;
    }
    return true;
  }

  @override
  int get hashCode {
    return Object.hash(
      minPrice,
      maxPrice,
      minRating,
      onlyInStock,
      onlyWithDiscount,
      sortBy,
      sortAscending,
      Object.hashAll(brandIds),
      Object.hashAll(colorIds),
      Object.hashAll(sizeIds),
      deliveryHours,
      deliveryType,
      isClickDelivery,
      isOriginal,
      isWowPrice,
      Object.hashAll(shopIds),
      selectedCategoryId,
      Object.hashAll(attributes.keys),
    );
  }
}
