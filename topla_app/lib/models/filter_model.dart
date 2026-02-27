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

  /// Yetkazib berish muddati (soat)
  /// null = hammasi, 2 = 2 soat ichida, 24 = ertaga, 72 = 3 kun ichida
  final int? deliveryHours;

  /// Click yetkazib berish (tez yetkazib berish)
  final bool? isClickDelivery;

  /// Original mahsulot (sifat kafolati)
  final bool? isOriginal;

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
    this.deliveryHours,
    this.isClickDelivery,
    this.isOriginal,
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
      deliveryHours != null ||
      isClickDelivery != null ||
      isOriginal != null ||
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
    if (deliveryHours != null) count++;
    if (isClickDelivery == true) count++;
    if (isOriginal == true) count++;
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
    int? deliveryHours,
    bool? isClickDelivery,
    bool? isOriginal,
    Map<String, SelectedFilterValue>? attributes,
    String? selectedCategoryId,
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    bool clearMinRating = false,
    bool clearDeliveryHours = false,
    bool clearIsClickDelivery = false,
    bool clearIsOriginal = false,
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
      deliveryHours:
          clearDeliveryHours ? null : (deliveryHours ?? this.deliveryHours),
      isClickDelivery: clearIsClickDelivery
          ? null
          : (isClickDelivery ?? this.isClickDelivery),
      isOriginal: clearIsOriginal ? null : (isOriginal ?? this.isOriginal),
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

  /// Barcha filterlarni tozalash
  ProductFilter clear() => ProductFilter.empty();

  /// Faqat sortni saqlab qolgan holda tozalash
  ProductFilter clearFiltersOnly() {
    return ProductFilter(
      sortBy: sortBy,
      sortAscending: sortAscending,
    );
  }

  /// Sort options
  static const String sortByPopular = 'sold_count';
  static const String sortByPriceLow = 'price_asc';
  static const String sortByPriceHigh = 'price_desc';
  static const String sortByRating = 'rating';
  static const String sortByNewest = 'created_at';
  static const String sortByDiscount = 'discount';

  /// API query uchun filter map
  Map<String, dynamic> toQueryMap() {
    final map = <String, dynamic>{};

    if (minPrice != null) map['min_price'] = minPrice;
    if (maxPrice != null) map['max_price'] = maxPrice;
    if (minRating != null) map['min_rating'] = minRating;
    if (onlyInStock) map['in_stock'] = true;
    if (onlyWithDiscount) map['has_discount'] = true;
    if (brandIds.isNotEmpty) map['brand_ids'] = brandIds.toList();
    if (colorIds.isNotEmpty) map['color_ids'] = colorIds.toList();
    if (deliveryHours != null) map['delivery_hours'] = deliveryHours;
    if (isClickDelivery != null) map['is_click_delivery'] = isClickDelivery;
    if (isOriginal != null) map['is_original'] = isOriginal;
    if (selectedCategoryId != null) map['category_id'] = selectedCategoryId;

    // Kategoriya atributlari
    for (final entry in attributes.entries) {
      map.addAll(entry.value.toQueryMap());
    }

    return map;
  }

  @override
  String toString() {
    return 'ProductFilter(minPrice: $minPrice, maxPrice: $maxPrice, minRating: $minRating, '
        'onlyInStock: $onlyInStock, onlyWithDiscount: $onlyWithDiscount, '
        'sortBy: $sortBy, sortAscending: $sortAscending, brands: ${brandIds.length}, colors: ${colorIds.length}, '
        'deliveryHours: $deliveryHours, isClickDelivery: $isClickDelivery, isOriginal: $isOriginal, '
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
        other.deliveryHours == deliveryHours &&
        other.isClickDelivery == isClickDelivery &&
        other.isOriginal == isOriginal &&
        other.selectedCategoryId == selectedCategoryId;
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
      deliveryHours,
      isClickDelivery,
      isOriginal,
      selectedCategoryId,
    );
  }
}
