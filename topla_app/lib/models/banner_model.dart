/// Banner modeli
library;
import '../core/config/api_config.dart';

class BannerModel {
  final String id;
  final String? titleUz;
  final String? titleRu;
  final String? subtitleUz;
  final String? subtitleRu;
  final String imageUrl;
  final String actionType; // none, product, category, url
  final String? actionValue;
  final int sortOrder;
  final bool isActive;

  BannerModel({
    required this.id,
    this.titleUz,
    this.titleRu,
    this.subtitleUz,
    this.subtitleRu,
    required this.imageUrl,
    this.actionType = 'none',
    this.actionValue,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    final rawUrl = (json['image_url'] ?? json['imageUrl']) as String;
    // Agar nisbiy yo'l bo'lsa (/uploads/...), to'liq URL yasaymiz
    final fullUrl =
        rawUrl.startsWith('http') ? rawUrl : '${ApiConfig.baseUrl}$rawUrl';
    return BannerModel(
      id: json['id'] as String,
      titleUz: (json['title_uz'] ?? json['titleUz']) as String?,
      titleRu: (json['title_ru'] ?? json['titleRu']) as String?,
      subtitleUz: (json['subtitle_uz'] ?? json['subtitleUz']) as String?,
      subtitleRu: (json['subtitle_ru'] ?? json['subtitleRu']) as String?,
      imageUrl: fullUrl,
      actionType:
          (json['action_type'] ?? json['actionType']) as String? ?? 'none',
      actionValue: (json['action_value'] ?? json['actionValue']) as String?,
      sortOrder: (json['sort_order'] ?? json['sortOrder']) as int? ?? 0,
      isActive: (json['is_active'] ?? json['isActive']) as bool? ?? true,
    );
  }

  String? getTitle(String locale) {
    return locale == 'ru' ? titleRu : titleUz;
  }

  String? getSubtitle(String locale) {
    return locale == 'ru' ? subtitleRu : subtitleUz;
  }
}
