import 'user_role.dart';

/// Foydalanuvchi profili modeli
class UserProfile {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? fullName;
  final String? phone;
  final String? email;
  final String? avatarUrl;
  final DateTime? birthDate;
  final String? gender;
  final String? referralCode;
  final String? referredBy;
  final double cashbackBalance;
  final int totalOrders;
  final int couponsCount;
  final DateTime? createdAt;
  final UserRole role;

  UserProfile({
    required this.id,
    this.firstName,
    this.lastName,
    this.fullName,
    this.phone,
    this.email,
    this.avatarUrl,
    this.birthDate,
    this.gender,
    this.referralCode,
    this.referredBy,
    this.cashbackBalance = 0,
    this.totalOrders = 0,
    this.couponsCount = 0,
    this.createdAt,
    this.role = UserRole.user,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    var firstName = (json['first_name'] ?? json['firstName']) as String?;
    var lastName = (json['last_name'] ?? json['lastName']) as String?;
    // fullName ni first_name va last_name dan yasash yoki to'g'ridan-to'g'ri olish
    String? fullName = (json['full_name'] ?? json['fullName']) as String?;

    // Agar firstName/lastName yo'q bo'lsa, fullName dan ajratib olish
    if ((firstName == null || firstName.isEmpty) &&
        fullName != null &&
        fullName.isNotEmpty) {
      final parts = fullName.trim().split(RegExp(r'\s+'));
      firstName = parts.first;
      if (parts.length > 1) {
        lastName = parts.sublist(1).join(' ');
      }
    }

    if (fullName == null && (firstName != null || lastName != null)) {
      fullName = [firstName, lastName]
          .where((s) => s != null && s.isNotEmpty)
          .join(' ');
    }

    final createdAtRaw = json['created_at'] ?? json['createdAt'];
    final birthDateRaw = json['birth_date'] ?? json['birthDate'];

    return UserProfile(
      id: json['id'] as String,
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      avatarUrl: (json['avatar_url'] ?? json['avatarUrl']) as String?,
      birthDate: birthDateRaw != null ? DateTime.parse(birthDateRaw) : null,
      gender: json['gender'] as String?,
      referralCode: (json['referral_code'] ?? json['referralCode']) as String?,
      referredBy: (json['referred_by'] ?? json['referredBy']) as String?,
      cashbackBalance:
          (json['cashback_balance'] ?? json['cashbackBalance'] as num?)
                  ?.toDouble() ??
              0,
      totalOrders: (json['total_orders'] ?? json['totalOrders']) as int? ?? 0,
      couponsCount:
          (json['coupons_count'] ?? json['couponsCount']) as int? ?? 0,
      createdAt: createdAtRaw != null ? DateTime.parse(createdAtRaw) : null,
      role: UserRoleExtension.fromString(json['role'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName ??
          [firstName, lastName]
              .where((s) => s != null && s.isNotEmpty)
              .join(' '),
      'phone': phone,
      'email': email,
      'avatarUrl': avatarUrl,
    };
  }

  UserProfile copyWith({
    String? firstName,
    String? lastName,
    String? fullName,
    String? phone,
    String? email,
    String? avatarUrl,
    DateTime? birthDate,
    String? gender,
  }) {
    return UserProfile(
      id: id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      birthDate: birthDate ?? this.birthDate,
      gender: gender ?? this.gender,
      referralCode: referralCode,
      referredBy: referredBy,
      cashbackBalance: cashbackBalance,
      totalOrders: totalOrders,
      couponsCount: couponsCount,
      createdAt: createdAt,
      role: role,
    );
  }

  // Role helper methods
  bool get isAdmin => role.isAdmin;
  bool get isVendor => role.isVendor;
  bool get isSuperAdmin => role == UserRole.superAdmin;
  bool get canModerate => role.canModerate;
  bool get canManageShops => role.canManageShops;
}
