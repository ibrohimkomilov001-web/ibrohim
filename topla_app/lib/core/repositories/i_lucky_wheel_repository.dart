/// Lucky Wheel repository interface
abstract class ILuckyWheelRepository {
  /// Barcha aktiv sovg'alar (baraban segmentlari)
  Future<List<LuckyWheelPrize>> getPrizes();

  /// Bugungi spin holati
  Future<LuckyWheelStatus> getStatus();

  /// Barabanni aylantirish
  Future<SpinResult> spin();

  /// Spin tarixi
  Future<List<SpinHistoryItem>> getHistory({int page, int limit});

  /// Foydalanuvchining promo kodlari
  Future<List<MyPromoCode>> getMyPromoCodes();

  /// Promo kodni tekshirish (foydalanuvchi qo'lda kiritganda)
  Future<Map<String, dynamic>> verifyPromoCode(String code);
}

/// Baraban segmenti modeli
class LuckyWheelPrize {
  final String id;
  final String nameUz;
  final String nameRu;
  final String
      type; // discount_percent, discount_fixed, free_delivery, physical_gift, nothing
  final String? value;
  final String color;
  final String? imageUrl;
  final int sortOrder;

  LuckyWheelPrize({
    required this.id,
    required this.nameUz,
    required this.nameRu,
    required this.type,
    this.value,
    required this.color,
    this.imageUrl,
    required this.sortOrder,
  });

  factory LuckyWheelPrize.fromJson(Map<String, dynamic> json) {
    return LuckyWheelPrize(
      id: json['id'] ?? '',
      nameUz: json['nameUz'] ?? '',
      nameRu: json['nameRu'] ?? '',
      type: json['type'] ?? 'nothing',
      value: json['value']?.toString(),
      color: json['color'] ?? '#666666',
      imageUrl: json['imageUrl'],
      sortOrder: json['sortOrder'] ?? 0,
    );
  }

  /// Sovg'a yutilganmi?
  bool get isWin => type != 'nothing';

  /// Sovg'a nomi (UZ)
  String get displayName => nameUz;
}

/// Bugungi spin holati
class LuckyWheelStatus {
  final bool canSpin;
  final TodaySpin? todaySpin;
  final DateTime? nextSpinAt;

  LuckyWheelStatus({
    required this.canSpin,
    this.todaySpin,
    this.nextSpinAt,
  });

  factory LuckyWheelStatus.fromJson(Map<String, dynamic> json) {
    return LuckyWheelStatus(
      canSpin: json['canSpin'] ?? false,
      todaySpin: json['todaySpin'] != null
          ? TodaySpin.fromJson(json['todaySpin'])
          : null,
      nextSpinAt: json['nextSpinAt'] != null
          ? DateTime.tryParse(json['nextSpinAt'])
          : null,
    );
  }
}

class TodaySpin {
  final String prizeType;
  final String prizeName;
  final String? promoCode;

  TodaySpin({
    required this.prizeType,
    required this.prizeName,
    this.promoCode,
  });

  factory TodaySpin.fromJson(Map<String, dynamic> json) {
    return TodaySpin(
      prizeType: json['prizeType'] ?? '',
      prizeName: json['prizeName'] ?? '',
      promoCode: json['promoCode'],
    );
  }
}

/// Spin natijasi
class SpinResult {
  final String id;
  final String prizeType;
  final String prizeName;
  final String? promoCode;
  final LuckyWheelPrize prize;
  final DateTime? nextSpinAt;

  SpinResult({
    required this.id,
    required this.prizeType,
    required this.prizeName,
    this.promoCode,
    required this.prize,
    this.nextSpinAt,
  });

  factory SpinResult.fromJson(Map<String, dynamic> json) {
    final spin = json['spin'] as Map<String, dynamic>;
    return SpinResult(
      id: spin['id'] ?? '',
      prizeType: spin['prizeType'] ?? '',
      prizeName: spin['prizeName'] ?? '',
      promoCode: spin['promoCode'],
      prize: LuckyWheelPrize.fromJson(spin['prize'] ?? {}),
      nextSpinAt: json['nextSpinAt'] != null
          ? DateTime.tryParse(json['nextSpinAt'])
          : null,
    );
  }

  bool get isWin => prizeType != 'nothing';
}

/// Spin tarix elementi
class SpinHistoryItem {
  final String id;
  final String prizeType;
  final String prizeName;
  final String? promoCode;
  final DateTime createdAt;
  final LuckyWheelPrize? prize;

  SpinHistoryItem({
    required this.id,
    required this.prizeType,
    required this.prizeName,
    this.promoCode,
    required this.createdAt,
    this.prize,
  });

  factory SpinHistoryItem.fromJson(Map<String, dynamic> json) {
    return SpinHistoryItem(
      id: json['id'] ?? '',
      prizeType: json['prizeType'] ?? '',
      prizeName: json['prizeName'] ?? '',
      promoCode: json['promoCode'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      prize: json['prize'] != null
          ? LuckyWheelPrize.fromJson(json['prize'])
          : null,
    );
  }

  bool get isWin => prizeType != 'nothing';
}

/// Foydalanuvchining promo kodi (Lucky Wheel + Referral)
class MyPromoCode {
  final String code;
  final String prizeType;
  final String? prizeName;
  final String? discountType; // percentage, fixed
  final double? discountValue;
  final double? minOrderAmount;
  final DateTime? expiresAt;
  final String status; // active, used, expired
  final bool isUsed;
  final bool isExpired;
  final DateTime? usedAt;
  final DateTime createdAt;
  final LuckyWheelPrize? prize;

  MyPromoCode({
    required this.code,
    required this.prizeType,
    this.prizeName,
    this.discountType,
    this.discountValue,
    this.minOrderAmount,
    this.expiresAt,
    required this.status,
    required this.isUsed,
    required this.isExpired,
    this.usedAt,
    required this.createdAt,
    this.prize,
  });

  factory MyPromoCode.fromJson(Map<String, dynamic> json) {
    return MyPromoCode(
      code: json['code'] ?? '',
      prizeType: json['prizeType'] ?? '',
      prizeName: json['prizeName'],
      discountType: json['discountType'],
      discountValue: json['discountValue'] != null
          ? (json['discountValue'] as num).toDouble()
          : null,
      minOrderAmount: json['minOrderAmount'] != null
          ? (json['minOrderAmount'] as num).toDouble()
          : null,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'])
          : null,
      status: json['status'] ?? 'active',
      isUsed: json['isUsed'] ?? false,
      isExpired: json['isExpired'] ?? false,
      usedAt: json['usedAt'] != null ? DateTime.tryParse(json['usedAt']) : null,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      prize: json['prize'] != null
          ? LuckyWheelPrize.fromJson(json['prize'])
          : null,
    );
  }

  bool get isActive => status == 'active';

  /// Qolgan kunlar
  int? get daysRemaining {
    if (expiresAt == null) return null;
    final diff = expiresAt!.difference(DateTime.now()).inDays;
    return diff < 0 ? 0 : diff;
  }

  /// Chegirma qiymati formatlangan
  String get formattedDiscount {
    if (prizeType == 'free_delivery') return 'Bepul yetkazish';
    if (discountType == 'percentage') return '${discountValue?.toInt() ?? 0}%';
    if (discountValue != null) {
      return '${discountValue!.toInt().toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} so\'m';
    }
    return '';
  }
}
