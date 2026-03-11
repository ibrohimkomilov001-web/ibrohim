// Category filter attribute model
// Har bir kategoriya uchun filtr xususiyatlari
// Masalan: Smartfonlar -> RAM, Xotira hajmi, Ekran o'lchami
//
// Filter types:
// - range: Min/Max qiymatlar (narx, ekran o'lchami)
// - chips: Ko'p tanlov (RAM: 4GB, 8GB, 16GB)
// - toggle: Ha/Yo'q (NFC, Dual SIM)
// - color: Ranglar tanlash
// - radio: Bitta tanlov (Jins: Erkak/Ayol)
library;

enum FilterType {
  range,
  chips,
  toggle,
  color,
  radio,
}

/// Filter opsiyasi - chips/radio uchun
class FilterOption {
  final String value;
  final String labelUz;
  final String? labelRu;
  final int productCount;

  const FilterOption({
    required this.value,
    required this.labelUz,
    this.labelRu,
    this.productCount = 0,
  });

  /// Convenience getter for label (uses Uzbek by default)
  String get label => labelUz;

  String getLabel(String locale) {
    if (locale == 'ru' && labelRu != null && labelRu!.isNotEmpty) {
      return labelRu!;
    }
    return labelUz;
  }

  factory FilterOption.fromJson(Map<String, dynamic> json) {
    return FilterOption(
      value: json['value']?.toString() ?? '',
      labelUz: json['label_uz'] as String? ??
          json['label'] as String? ??
          json['value']?.toString() ??
          '',
      labelRu: json['label_ru'] as String?,
      productCount: json['product_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'value': value,
      'label_uz': labelUz,
      'label_ru': labelRu,
    };
  }
}

/// Range filter uchun min/max qiymatlar
class RangeFilterConfig {
  final double? minValue;
  final double? maxValue;
  final double? step;
  final String? unit;

  const RangeFilterConfig({
    this.minValue,
    this.maxValue,
    this.step,
    this.unit,
  });

  factory RangeFilterConfig.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const RangeFilterConfig();
    return RangeFilterConfig(
      minValue: (json['min'] as num?)?.toDouble(),
      maxValue: (json['max'] as num?)?.toDouble(),
      step: (json['step'] as num?)?.toDouble(),
      unit: json['unit'] as String?,
    );
  }
}

/// Kategoriya filter atributi
class CategoryFilterAttribute {
  final String id;
  final String categoryId;
  final String attributeKey;
  final String attributeNameUz;
  final String? attributeNameRu;
  final FilterType filterType;
  final List<FilterOption> options;
  final RangeFilterConfig? rangeConfig;
  final String? unit;
  final int sortOrder;
  final bool hasHelpInfo;

  const CategoryFilterAttribute({
    required this.id,
    required this.categoryId,
    required this.attributeKey,
    required this.attributeNameUz,
    this.attributeNameRu,
    required this.filterType,
    this.options = const [],
    this.rangeConfig,
    this.unit,
    this.sortOrder = 0,
    this.hasHelpInfo = false,
  });

  /// Convenience getter for name (uses Uzbek by default)
  String get name => attributeNameUz;

  /// Convenience getter for hasHelp
  bool get hasHelp => hasHelpInfo;

  String getName(String locale) {
    if (locale == 'ru' &&
        attributeNameRu != null &&
        attributeNameRu!.isNotEmpty) {
      return attributeNameRu!;
    }
    return attributeNameUz;
  }

  factory CategoryFilterAttribute.fromJson(Map<String, dynamic> json) {
    final filterTypeStr =
        json['type'] as String? ?? json['filter_type'] as String? ?? 'chips';
    final filterType = FilterType.values.firstWhere(
      (e) => e.name == filterTypeStr,
      orElse: () => FilterType.chips,
    );

    // Options bo'lishi mumkin: backend'dan ["4GB", "8GB"] yoki [{value, label}] formatda
    List<FilterOption> options = [];
    if (json['options'] != null) {
      final optionsList = json['options'] as List<dynamic>;
      options = optionsList.map((e) {
        if (e is String) {
          return FilterOption(value: e, labelUz: e);
        }
        return FilterOption.fromJson(e as Map<String, dynamic>);
      }).toList();
    }
    // usedValues bo'lsa (backend'dan keladi) options bilan birlashtirish
    if (json['usedValues'] != null) {
      final usedValues = (json['usedValues'] as List<dynamic>).cast<String>();
      if (options.isEmpty) {
        options =
            usedValues.map((v) => FilterOption(value: v, labelUz: v)).toList();
      }
    }

    RangeFilterConfig? rangeConfig;
    if (filterType == FilterType.range) {
      rangeConfig = RangeFilterConfig(
        minValue: (json['rangeMin'] as num?)?.toDouble() ??
            (json['range_min'] as num?)?.toDouble(),
        maxValue: (json['rangeMax'] as num?)?.toDouble() ??
            (json['range_max'] as num?)?.toDouble(),
        unit: json['unit'] as String?,
      );
    }

    return CategoryFilterAttribute(
      id: json['id'] as String,
      categoryId:
          json['categoryId'] as String? ?? json['category_id'] as String? ?? '',
      attributeKey:
          json['key'] as String? ?? json['attribute_key'] as String? ?? '',
      attributeNameUz: json['nameUz'] as String? ??
          json['attribute_name_uz'] as String? ??
          '',
      attributeNameRu:
          json['nameRu'] as String? ?? json['attribute_name_ru'] as String?,
      filterType: filterType,
      options: options,
      rangeConfig: rangeConfig,
      unit: json['unit'] as String?,
      sortOrder: json['sortOrder'] as int? ?? json['sort_order'] as int? ?? 0,
      hasHelpInfo: json['has_help'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category_id': categoryId,
      'attribute_key': attributeKey,
      'attribute_name_uz': attributeNameUz,
      'attribute_name_ru': attributeNameRu,
      'filter_type': filterType.name,
      'options': options.map((e) => e.toJson()).toList(),
      'unit': unit,
      'sort_order': sortOrder,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CategoryFilterAttribute && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'CategoryFilterAttribute(id: $id, key: $attributeKey, type: $filterType)';
}

/// Tanlangan filter qiymatlari - UI state uchun
class SelectedFilterValue {
  final String attributeKey;
  final FilterType filterType;

  // Range uchun
  final double? minValue;
  final double? maxValue;

  // Chips/Radio/Color uchun
  final Set<String> selectedValues;

  // Toggle uchun
  final bool? toggleValue;

  const SelectedFilterValue({
    required this.attributeKey,
    required this.filterType,
    this.minValue,
    this.maxValue,
    this.selectedValues = const {},
    this.toggleValue,
  });

  bool get hasValue {
    switch (filterType) {
      case FilterType.range:
        return minValue != null || maxValue != null;
      case FilterType.chips:
      case FilterType.radio:
      case FilterType.color:
        return selectedValues.isNotEmpty;
      case FilterType.toggle:
        return toggleValue != null;
    }
  }

  SelectedFilterValue copyWith({
    double? minValue,
    double? maxValue,
    Set<String>? selectedValues,
    bool? toggleValue,
  }) {
    return SelectedFilterValue(
      attributeKey: attributeKey,
      filterType: filterType,
      minValue: minValue ?? this.minValue,
      maxValue: maxValue ?? this.maxValue,
      selectedValues: selectedValues ?? this.selectedValues,
      toggleValue: toggleValue ?? this.toggleValue,
    );
  }

  /// API query uchun map
  Map<String, dynamic> toQueryMap() {
    switch (filterType) {
      case FilterType.range:
        return {
          if (minValue != null) '${attributeKey}_min': minValue,
          if (maxValue != null) '${attributeKey}_max': maxValue,
        };
      case FilterType.chips:
      case FilterType.radio:
      case FilterType.color:
        if (selectedValues.isEmpty) return {};
        return {attributeKey: selectedValues.toList()};
      case FilterType.toggle:
        if (toggleValue == null) return {};
        return {attributeKey: toggleValue};
    }
  }

  @override
  String toString() =>
      'SelectedFilterValue(key: $attributeKey, type: $filterType, values: $selectedValues)';
}
