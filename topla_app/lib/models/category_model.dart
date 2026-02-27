/// Kategoriya modeli
class CategoryModel {
  final String id;
  final String nameUz;
  final String nameRu;
  final String? icon;
  final String? imageUrl;
  final String? parentId;
  final int sortOrder;
  final bool isActive;
  final List<CategoryModel> subcategories;

  CategoryModel({
    required this.id,
    required this.nameUz,
    required this.nameRu,
    this.icon,
    this.imageUrl,
    this.parentId,
    this.sortOrder = 0,
    this.isActive = true,
    this.subcategories = const [],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    // Parse nested subcategories if present
    final subcatsJson = json['subcategories'] as List<dynamic>?;
    final subcats = subcatsJson
            ?.map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return CategoryModel(
      id: (json['id'] as String?) ?? '',
      nameUz:
          (json['name_uz'] ?? json['nameUz'] ?? json['name'] ?? '') as String,
      nameRu:
          (json['name_ru'] ?? json['nameRu'] ?? json['name'] ?? '') as String,
      icon: json['icon'] as String?,
      imageUrl: (json['image_url'] ?? json['imageUrl']) as String?,
      parentId: (json['parent_id'] ?? json['parentId'] ?? json['categoryId'])
          as String?,
      sortOrder: (json['sort_order'] ?? json['sortOrder']) as int? ?? 0,
      isActive: (json['is_active'] ?? json['isActive']) as bool? ?? true,
      subcategories: subcats,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nameUz': nameUz,
      'nameRu': nameRu,
      'icon': icon,
      'imageUrl': imageUrl,
      'parentId': parentId,
      'sortOrder': sortOrder,
      'isActive': isActive,
    };
  }

  /// Til bo'yicha nom olish
  String getName(String locale) {
    return locale == 'ru' ? nameRu : nameUz;
  }
}
