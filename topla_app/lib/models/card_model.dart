/// Saqlangan karta modeli
///
/// Bank tomonidan tokenizatsiya qilingan kartalar uchun.
/// Karta raqami to'liq saqlanmaydi, faqat masked versiya.
class SavedCardModel {
  final String id;
  final String userId;
  final String bindingId; // Bank tomonidan berilgan token
  final String maskedPan; // Masalan: 8600 **** **** 1234
  final CardType cardType;
  final String expiryDate; // MM/YY
  final bool isDefault;
  final DateTime createdAt;

  SavedCardModel({
    required this.id,
    required this.userId,
    required this.bindingId,
    required this.maskedPan,
    required this.cardType,
    required this.expiryDate,
    this.isDefault = false,
    required this.createdAt,
  });

  factory SavedCardModel.fromJson(Map<String, dynamic> json) {
    return SavedCardModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? json['user_id'] ?? '',
      bindingId: json['token'] ?? json['binding_id'] ?? json['bindingId'] ?? '',
      maskedPan:
          json['cardNumber'] ?? json['masked_pan'] ?? json['maskedPan'] ?? '',
      cardType: CardType.fromString(
          json['provider'] ?? json['card_type'] ?? json['cardType']),
      expiryDate: json['expiryDate'] ?? json['expiry_date'] ?? '',
      isDefault: json['isDefault'] ?? json['is_default'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'])
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'binding_id': bindingId,
      'masked_pan': maskedPan,
      'card_type': cardType.value,
      'expiry_date': expiryDate,
      'is_default': isDefault,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Karta raqamining oxirgi 4 raqami
  String get lastFourDigits {
    final digits = maskedPan.replaceAll(RegExp(r'[^\d]'), '');
    return digits.length >= 4 ? digits.substring(digits.length - 4) : digits;
  }

  /// Formatlangan karta raqami
  String get formattedNumber {
    return maskedPan;
  }

  /// Karta egasi ko'rinishi uchun qisqartma
  String get displayName {
    return '${cardType.displayName} •••• $lastFourDigits';
  }

  /// Muddati o'tganmi
  bool get isExpired {
    try {
      final parts = expiryDate.split('/');
      if (parts.length != 2) return false;

      final month = int.parse(parts[0]);
      final year = int.parse('20${parts[1]}');

      final expiry = DateTime(year, month + 1, 0); // Oyning oxirgi kuni
      return DateTime.now().isAfter(expiry);
    } catch (e) {
      return false;
    }
  }

  SavedCardModel copyWith({
    String? id,
    String? userId,
    String? bindingId,
    String? maskedPan,
    CardType? cardType,
    String? expiryDate,
    bool? isDefault,
    DateTime? createdAt,
  }) {
    return SavedCardModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bindingId: bindingId ?? this.bindingId,
      maskedPan: maskedPan ?? this.maskedPan,
      cardType: cardType ?? this.cardType,
      expiryDate: expiryDate ?? this.expiryDate,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

/// Karta turlari
enum CardType {
  uzcard('uzcard', 'UzCard', 0xFF1E88E5),
  humo('humo', 'HUMO', 0xFF43A047),
  visa('visa', 'Visa', 0xFF1A237E),
  mastercard('mastercard', 'Mastercard', 0xFFFF6D00),
  unknown('unknown', 'Karta', 0xFF757575);

  final String value;
  final String displayName;
  final int colorValue;

  const CardType(this.value, this.displayName, this.colorValue);

  static CardType fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'uzcard':
        return CardType.uzcard;
      case 'humo':
        return CardType.humo;
      case 'visa':
        return CardType.visa;
      case 'mastercard':
        return CardType.mastercard;
      default:
        return CardType.unknown;
    }
  }

  /// Karta raqamidan turini aniqlash
  static CardType fromCardNumber(String cardNumber) {
    final cleanNumber = cardNumber.replaceAll(RegExp(r'[^\d]'), '');

    if (cleanNumber.startsWith('8600')) {
      return CardType.uzcard;
    } else if (cleanNumber.startsWith('9860')) {
      return CardType.humo;
    } else if (cleanNumber.startsWith('4')) {
      return CardType.visa;
    } else if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
      return CardType.mastercard;
    }

    return CardType.unknown;
  }
}

/// Tranzaksiya modeli
class TransactionModel {
  final String id;
  final String orderId;
  final String transactionId;
  final double amount;
  final String currency;
  final TransactionStatus status;
  final String provider;
  final String? errorMessage;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime? updatedAt;

  TransactionModel({
    required this.id,
    required this.orderId,
    required this.transactionId,
    required this.amount,
    this.currency = 'UZS',
    required this.status,
    this.provider = 'asia_alliance',
    this.errorMessage,
    this.metadata,
    required this.createdAt,
    this.updatedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] ?? '',
      orderId: json['order_id'] ?? '',
      transactionId: json['transaction_id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'UZS',
      status: TransactionStatus.fromString(json['status']),
      provider: json['provider'] ?? 'asia_alliance',
      errorMessage: json['error_message'],
      metadata: json['metadata'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'transaction_id': transactionId,
      'amount': amount,
      'currency': currency,
      'status': status.value,
      'provider': provider,
      'error_message': errorMessage,
      'metadata': metadata,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  /// Formatlangan summa
  String get formattedAmount => '${amount.toStringAsFixed(0)} so\'m';
}

/// Tranzaksiya holatlari
enum TransactionStatus {
  pending('pending', 'Kutilmoqda'),
  held('held', 'Band qilingan'),
  completed('completed', 'Yakunlangan'),
  failed('failed', 'Muvaffaqiyatsiz'),
  reversed('reversed', 'Qaytarilgan'),
  refunded('refunded', 'To\'lov qaytarildi'),
  cancelled('cancelled', 'Bekor qilindi');

  final String value;
  final String displayName;

  const TransactionStatus(this.value, this.displayName);

  static TransactionStatus fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'pending':
        return TransactionStatus.pending;
      case 'held':
        return TransactionStatus.held;
      case 'completed':
        return TransactionStatus.completed;
      case 'failed':
        return TransactionStatus.failed;
      case 'reversed':
        return TransactionStatus.reversed;
      case 'refunded':
        return TransactionStatus.refunded;
      case 'cancelled':
        return TransactionStatus.cancelled;
      default:
        return TransactionStatus.pending;
    }
  }

  bool get isSuccess => this == TransactionStatus.completed;
  bool get isPending =>
      this == TransactionStatus.pending || this == TransactionStatus.held;
  bool get isFailed =>
      this == TransactionStatus.failed || this == TransactionStatus.cancelled;
}
