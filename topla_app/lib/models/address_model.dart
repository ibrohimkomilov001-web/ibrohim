/// Manzil modeli
class AddressModel {
  final String id;
  final String? userId;
  final String title;
  final String address;
  final String? apartment;
  final String? entrance;
  final String? floor;
  final String? intercom;
  final double? latitude;
  final double? longitude;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime updatedAt;

  AddressModel({
    required this.id,
    this.userId,
    required this.title,
    required this.address,
    this.apartment,
    this.entrance,
    this.floor,
    this.intercom,
    this.latitude,
    this.longitude,
    this.isDefault = false,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] ?? '',
      userId: (json['user_id'] ?? json['userId']) as String? ?? '',
      title: json['name'] ?? json['title'] ?? 'Uy',
      address: json['fullAddress'] ??
          json['full_address'] ??
          json['street'] ??
          json['address'] ??
          '',
      apartment: json['apartment'] as String?,
      entrance: json['entrance'] as String?,
      floor: json['floor'] as String?,
      latitude: json['latitude'] != null
          ? (json['latitude'] as num).toDouble()
          : null,
      longitude: json['longitude'] != null
          ? (json['longitude'] as num).toDouble()
          : null,
      isDefault: (json['is_default'] ?? json['isDefault']) as bool? ?? false,
      createdAt: (json['created_at'] ?? json['createdAt']) != null
          ? DateTime.parse((json['created_at'] ?? json['createdAt']))
          : DateTime.now(),
      updatedAt: (json['updated_at'] ?? json['updatedAt']) != null
          ? DateTime.parse((json['updated_at'] ?? json['updatedAt']))
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'name': title,
      'fullAddress': address,
      'latitude': latitude ?? 0.0,
      'longitude': longitude ?? 0.0,
      'isDefault': isDefault,
    };
    if (apartment != null && apartment!.isNotEmpty) {
      map['apartment'] = apartment;
    }
    if (entrance != null && entrance!.isNotEmpty) {
      map['entrance'] = entrance;
    }
    if (floor != null && floor!.isNotEmpty) {
      map['floor'] = floor;
    }
    return map;
  }

  AddressModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? address,
    String? apartment,
    String? entrance,
    String? floor,
    String? intercom,
    double? latitude,
    double? longitude,
    bool? isDefault,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AddressModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      address: address ?? this.address,
      apartment: apartment ?? this.apartment,
      entrance: entrance ?? this.entrance,
      floor: floor ?? this.floor,
      intercom: intercom ?? this.intercom,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Ikon olish
  String get iconType {
    switch (title.toLowerCase()) {
      case 'uy':
      case 'home':
        return 'home';
      case 'ish':
      case 'work':
        return 'work';
      default:
        return 'other';
    }
  }

  /// To'liq manzil
  String get fullAddress {
    final parts = <String>[address];
    if (apartment != null && apartment!.isNotEmpty) {
      parts.add('kv. $apartment');
    }
    if (entrance != null && entrance!.isNotEmpty) {
      parts.add('$entrance-kirish');
    }
    if (floor != null && floor!.isNotEmpty) {
      parts.add('$floor-qavat');
    }
    return parts.join(', ');
  }
}
