/// Do'kon modeli
class ShopModel {
  final String id;
  final String ownerId;
  final String name;
  final String? slug;
  final String? description;
  final String? logoUrl;
  final String? bannerUrl;
  final String? phone;
  final String? email;
  final String? address;
  final String? city;
  final bool isVerified;
  final bool isActive;
  final DateTime? verifiedAt;
  final double commissionRate;
  final double balance;
  final double totalSales;
  final int totalOrders;
  final double rating;
  final int reviewCount;
  final int followersCount;
  final String? shopType;
  final DateTime createdAt;
  final DateTime? updatedAt;

  ShopModel({
    required this.id,
    required this.ownerId,
    required this.name,
    this.slug,
    this.description,
    this.logoUrl,
    this.bannerUrl,
    this.phone,
    this.email,
    this.address,
    this.city,
    this.isVerified = false,
    this.isActive = true,
    this.verifiedAt,
    this.commissionRate = 10.0,
    this.balance = 0.0,
    this.totalSales = 0.0,
    this.totalOrders = 0,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.followersCount = 0,
    this.shopType,
    required this.createdAt,
    this.updatedAt,
  });

  factory ShopModel.fromJson(Map<String, dynamic> json) {
    // Backend status enum → isVerified/isActive mapping
    final status = json['status'] as String?;
    final createdAtRaw = json['created_at'] ?? json['createdAt'];

    return ShopModel(
      id: json['id'] as String? ?? '',
      ownerId: (json['owner_id'] ?? json['ownerId']) as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'],
      description: json['description'],
      logoUrl: json['logo_url'] ?? json['logoUrl'],
      bannerUrl: json['banner_url'] ?? json['bannerUrl'],
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      city: json['city'],
      isVerified: json['is_verified'] ?? (status == 'active'),
      isActive: json['is_active'] ??
          json['isOpen'] ??
          (status != 'blocked' && status != 'inactive'),
      verifiedAt: json['verified_at'] != null
          ? DateTime.parse(json['verified_at'])
          : null,
      commissionRate:
          (json['commission_rate'] ?? json['commissionRate'] ?? 10.0)
              .toDouble(),
      balance: (json['balance'] ?? 0.0).toDouble(),
      totalSales: (json['total_sales'] ?? json['totalSales'] ?? 0.0).toDouble(),
      totalOrders: json['total_orders'] ?? json['totalOrders'] ??
          (json['_count'] != null ? json['_count']['orderItems'] ?? 0 : 0),
      rating: (json['rating'] ?? 0.0).toDouble(),
      reviewCount: json['review_count'] ?? json['reviewCount'] ?? 0,
      followersCount: json['followers_count'] ?? json['followersCount'] ??
          (json['_count'] != null ? json['_count']['followers'] ?? 0 : 0),
      shopType: json['shop_type'] ?? json['shopType'],
      createdAt:
          createdAtRaw != null ? DateTime.parse(createdAtRaw) : DateTime.now(),
      updatedAt: (json['updated_at'] ?? json['updatedAt']) != null
          ? DateTime.parse((json['updated_at'] ?? json['updatedAt']))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'logoUrl': logoUrl,
      'bannerUrl': bannerUrl,
      'phone': phone,
      'address': address,
    };
  }

  Map<String, dynamic> toInsertJson() {
    return {
      'name': name,
      'description': description,
      'logoUrl': logoUrl,
      'phone': phone,
      'address': address,
    };
  }

  ShopModel copyWith({
    String? name,
    String? slug,
    String? description,
    String? logoUrl,
    String? bannerUrl,
    String? phone,
    String? email,
    String? address,
    String? city,
    bool? isVerified,
    bool? isActive,
    double? commissionRate,
    double? balance,
  }) {
    return ShopModel(
      id: id,
      ownerId: ownerId,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      logoUrl: logoUrl ?? this.logoUrl,
      bannerUrl: bannerUrl ?? this.bannerUrl,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      city: city ?? this.city,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      verifiedAt: verifiedAt,
      commissionRate: commissionRate ?? this.commissionRate,
      balance: balance ?? this.balance,
      totalSales: totalSales,
      totalOrders: totalOrders,
      rating: rating,
      reviewCount: reviewCount,
      followersCount: followersCount,
      shopType: shopType,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  /// Formatted balance
  String get formattedBalance => '${balance.toStringAsFixed(0)} so\'m';
  String get formattedFollowers => _formatCount(followersCount);

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  String get formattedTotalSales => '${totalSales.toStringAsFixed(0)} so\'m';
  String get formattedRating => rating.toStringAsFixed(1);
  String get formattedTotalOrders => _formatCount(totalOrders);

  /// Marketda qancha vaqt (yil/oy)
  int get yearsOnMarket {
    return DateTime.now().difference(createdAt).inDays ~/ 365;
  }

  int get monthsOnMarket {
    return DateTime.now().difference(createdAt).inDays ~/ 30;
  }

  String get formattedTimeOnMarket {
    final years = yearsOnMarket;
    if (years >= 1) return '$years';
    final months = monthsOnMarket;
    return months > 0 ? '$months' : '1';
  }

  String get timeOnMarketSuffix {
    final years = yearsOnMarket;
    if (years >= 1) return years == 1 ? 'yil' : 'yil';
    return 'oy';
  }
}
