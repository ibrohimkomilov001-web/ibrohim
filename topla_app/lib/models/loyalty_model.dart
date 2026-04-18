/// Loyalty tizimi modellari

/// Loyalty daraja
enum LoyaltyTier {
  bronze,
  silver,
  gold,
  platinum;

  static LoyaltyTier fromString(String value) {
    return LoyaltyTier.values.firstWhere(
      (e) => e.name == value,
      orElse: () => LoyaltyTier.bronze,
    );
  }

  String get nameUz {
    switch (this) {
      case LoyaltyTier.bronze:
        return 'Bronza';
      case LoyaltyTier.silver:
        return 'Kumush';
      case LoyaltyTier.gold:
        return 'Oltin';
      case LoyaltyTier.platinum:
        return 'Platinum';
    }
  }

  String get nameRu {
    switch (this) {
      case LoyaltyTier.bronze:
        return 'Бронза';
      case LoyaltyTier.silver:
        return 'Серебро';
      case LoyaltyTier.gold:
        return 'Золото';
      case LoyaltyTier.platinum:
        return 'Платинум';
    }
  }
}

/// Ball harakati turi
enum PointAction {
  purchase,
  review,
  referral,
  dailyLogin,
  firstOrder,
  birthday,
  wheelSpin,
  redeem,
  expire,
  adminAdjust;

  static PointAction fromString(String value) {
    switch (value) {
      case 'daily_login':
        return PointAction.dailyLogin;
      case 'first_order':
        return PointAction.firstOrder;
      case 'wheel_spin':
        return PointAction.wheelSpin;
      case 'admin_adjust':
        return PointAction.adminAdjust;
      default:
        return PointAction.values.firstWhere(
          (e) => e.name == value,
          orElse: () => PointAction.purchase,
        );
    }
  }

  String get nameUz {
    switch (this) {
      case PointAction.purchase:
        return 'Xarid';
      case PointAction.review:
        return 'Sharh';
      case PointAction.referral:
        return 'Taklif';
      case PointAction.dailyLogin:
        return 'Kundalik kirish';
      case PointAction.firstOrder:
        return 'Birinchi buyurtma';
      case PointAction.birthday:
        return 'Tug\'ilgan kun';
      case PointAction.wheelSpin:
        return 'Omad g\'ildiragi';
      case PointAction.redeem:
        return 'Sarflash';
      case PointAction.expire:
        return 'Muddati tugdi';
      case PointAction.adminAdjust:
        return 'Admin';
    }
  }

  String get nameRu {
    switch (this) {
      case PointAction.purchase:
        return 'Покупка';
      case PointAction.review:
        return 'Отзыв';
      case PointAction.referral:
        return 'Приглашение';
      case PointAction.dailyLogin:
        return 'Ежедневный вход';
      case PointAction.firstOrder:
        return 'Первый заказ';
      case PointAction.birthday:
        return 'День рождения';
      case PointAction.wheelSpin:
        return 'Колесо удачи';
      case PointAction.redeem:
        return 'Списание';
      case PointAction.expire:
        return 'Истёк';
      case PointAction.adminAdjust:
        return 'Админ';
    }
  }
}

/// Loyalty hisob modeli
class LoyaltyAccount {
  final String id;
  final String userId;
  final LoyaltyTier tier;
  final int totalPoints;
  final int availablePoints;
  final int lifetimePoints;
  final DateTime? lastDailyLogin;
  final DateTime createdAt;
  final List<LoyaltyPointLog> pointLogs;
  final TierProgress? tierProgress;
  final Map<String, List<String>>? tierBenefits;

  LoyaltyAccount({
    required this.id,
    required this.userId,
    this.tier = LoyaltyTier.bronze,
    this.totalPoints = 0,
    this.availablePoints = 0,
    this.lifetimePoints = 0,
    this.lastDailyLogin,
    required this.createdAt,
    this.pointLogs = const [],
    this.tierProgress,
    this.tierBenefits,
  });

  factory LoyaltyAccount.fromJson(Map<String, dynamic> json) {
    return LoyaltyAccount(
      id: json['id'] as String? ?? '',
      userId: (json['userId'] ?? json['user_id'] ?? '') as String,
      tier: LoyaltyTier.fromString(json['tier'] as String? ?? 'bronze'),
      totalPoints: (json['totalPoints'] ?? json['total_points'] ?? 0) as int,
      availablePoints:
          (json['availablePoints'] ?? json['available_points'] ?? 0) as int,
      lifetimePoints:
          (json['lifetimePoints'] ?? json['lifetime_points'] ?? 0) as int,
      lastDailyLogin: (json['lastDailyLogin'] ?? json['last_daily_login']) !=
              null
          ? DateTime.tryParse(
              (json['lastDailyLogin'] ?? json['last_daily_login']).toString())
          : null,
      createdAt: DateTime.tryParse(
              (json['createdAt'] ?? json['created_at'] ?? '').toString()) ??
          DateTime.now(),
      pointLogs: json['pointLogs'] != null
          ? (json['pointLogs'] as List)
              .map((e) => LoyaltyPointLog.fromJson(e))
              .toList()
          : [],
      tierProgress: json['tierProgress'] != null
          ? TierProgress.fromJson(json['tierProgress'])
          : null,
      tierBenefits: json['tierBenefits'] != null
          ? (json['tierBenefits'] as Map<String, dynamic>).map(
              (key, value) => MapEntry(
                key,
                (value as List).map((e) => e.toString()).toList(),
              ),
            )
          : null,
    );
  }
}

/// Daraja progressi
class TierProgress {
  final String? nextTier;
  final int? nextThreshold;
  final int progress;

  TierProgress({
    this.nextTier,
    this.nextThreshold,
    required this.progress,
  });

  factory TierProgress.fromJson(Map<String, dynamic> json) {
    return TierProgress(
      nextTier: json['nextTier'] as String?,
      nextThreshold: json['nextThreshold'] as int?,
      progress: (json['progress'] ?? 0) as int,
    );
  }
}

/// Ball log yozuvi
class LoyaltyPointLog {
  final String id;
  final String accountId;
  final PointAction action;
  final int points;
  final String? description;
  final String? orderId;
  final DateTime createdAt;

  LoyaltyPointLog({
    required this.id,
    required this.accountId,
    required this.action,
    required this.points,
    this.description,
    this.orderId,
    required this.createdAt,
  });

  factory LoyaltyPointLog.fromJson(Map<String, dynamic> json) {
    return LoyaltyPointLog(
      id: json['id'] as String? ?? '',
      accountId: (json['accountId'] ?? json['account_id'] ?? '') as String,
      action: PointAction.fromString(json['action'] as String? ?? 'purchase'),
      points: (json['points'] ?? 0) as int,
      description: json['description'] as String?,
      orderId: (json['orderId'] ?? json['order_id']) as String?,
      createdAt: DateTime.tryParse(
              (json['createdAt'] ?? json['created_at'] ?? '').toString()) ??
          DateTime.now(),
    );
  }

  bool get isEarned => points > 0;
}
