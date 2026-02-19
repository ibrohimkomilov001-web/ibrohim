/// Color option model - Rang variantlari
/// Qora, Oq, Ko'k va h.k.
class ColorOption {
  final String id;
  final String nameUz;
  final String? nameRu;
  final String hexCode;
  final int sortOrder;
  final int productCount; // Ushbu rangdagi mahsulotlar soni

  const ColorOption({
    required this.id,
    required this.nameUz,
    this.nameRu,
    required this.hexCode,
    this.sortOrder = 0,
    this.productCount = 0,
  });

  String getName(String locale) {
    if (locale == 'ru' && nameRu != null && nameRu!.isNotEmpty) {
      return nameRu!;
    }
    return nameUz;
  }

  /// Hex kodini Color obyektiga aylantirish
  int get colorValue {
    String hex = hexCode.replaceAll('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex'; // Add opacity
    }
    return int.parse(hex, radix: 16);
  }

  factory ColorOption.fromJson(Map<String, dynamic> json) {
    return ColorOption(
      id: json['id'] as String,
      nameUz:
          (json['nameUz'] ?? json['name_uz'] ?? json['name'] ?? '') as String,
      nameRu: (json['nameRu'] ?? json['name_ru']) as String?,
      hexCode: (json['hexCode'] ?? json['hex_code'] ?? '#000000') as String,
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
      'hex_code': hexCode,
      'sort_order': sortOrder,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ColorOption && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'ColorOption(id: $id, name: $nameUz, hex: $hexCode)';
}
