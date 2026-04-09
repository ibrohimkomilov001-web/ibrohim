/// To'lov holatlari
enum PayoutStatus { pending, processing, completed, failed, cancelled }

/// To'lov usullari
enum PaymentMethod { bankTransfer, octobank }

/// To'lov modeli
class PayoutModel {
  final String id;
  final String shopId;
  final double amount;
  final double commission;
  final double netAmount;
  final PaymentMethod paymentMethod;
  final Map<String, dynamic>? paymentDetails;
  final PayoutStatus status;
  final String? processedBy;
  final DateTime? processedAt;
  final String? notes;
  final DateTime createdAt;

  // Relations
  final String? shopName;
  final String? processedByName;

  PayoutModel({
    required this.id,
    required this.shopId,
    required this.amount,
    required this.commission,
    required this.netAmount,
    required this.paymentMethod,
    this.paymentDetails,
    this.status = PayoutStatus.pending,
    this.processedBy,
    this.processedAt,
    this.notes,
    required this.createdAt,
    this.shopName,
    this.processedByName,
  });

  factory PayoutModel.fromJson(Map<String, dynamic> json) {
    final amount = (json['amount'] ?? 0).toDouble();
    final commission = (json['commission'] ?? 0).toDouble();
    return PayoutModel(
      id: (json['id'])?.toString() ?? '',
      shopId: (json['shop_id'] ?? json['shopId']) as String? ?? '',
      amount: amount,
      commission: commission,
      netAmount:
          (json['net_amount'] ?? json['netAmount'] ?? (amount - commission))
              .toDouble(),
      paymentMethod:
          _parsePaymentMethod(json['payment_method'] ?? json['paymentMethod']),
      paymentDetails: json['payment_details'] ?? json['paymentDetails'],
      status: _parseStatus(json['status']),
      processedBy: json['processed_by'] ?? json['processedBy'],
      processedAt: (json['processed_at'] ?? json['processedAt']) != null
          ? DateTime.parse((json['processed_at'] ?? json['processedAt']))
          : null,
      notes: json['notes'],
      createdAt: DateTime.tryParse(
              (json['created_at'] ?? json['createdAt'] ?? '').toString()) ??
          DateTime.now(),
      shopName: json['shops']?['name'] ?? json['shop']?['name'],
      processedByName:
          json['profiles']?['full_name'] ?? json['profiles']?['fullName'],
    );
  }

  Map<String, dynamic> toInsertJson() {
    return {
      'shop_id': shopId,
      'amount': amount,
      'commission': commission,
      'net_amount': netAmount,
      'payment_method': paymentMethodValue,
      'payment_details': paymentDetails,
      'notes': notes,
    };
  }

  static PayoutStatus _parseStatus(String? status) {
    switch (status) {
      case 'processing':
        return PayoutStatus.processing;
      case 'completed':
        return PayoutStatus.completed;
      case 'failed':
        return PayoutStatus.failed;
      case 'cancelled':
        return PayoutStatus.cancelled;
      default:
        return PayoutStatus.pending;
    }
  }

  static PaymentMethod _parsePaymentMethod(String? method) {
    switch (method) {
      case 'octobank':
        return PaymentMethod.octobank;
      case 'bank_transfer':
        return PaymentMethod.bankTransfer;
      default:
        return PaymentMethod.bankTransfer;
    }
  }

  String get statusValue {
    switch (status) {
      case PayoutStatus.pending:
        return 'pending';
      case PayoutStatus.processing:
        return 'processing';
      case PayoutStatus.completed:
        return 'completed';
      case PayoutStatus.failed:
        return 'failed';
      case PayoutStatus.cancelled:
        return 'cancelled';
    }
  }

  String get paymentMethodValue {
    switch (paymentMethod) {
      case PaymentMethod.octobank:
        return 'octobank';
      case PaymentMethod.bankTransfer:
        return 'bank_transfer';
    }
  }

  String get statusText {
    switch (status) {
      case PayoutStatus.pending:
        return 'Kutilmoqda';
      case PayoutStatus.processing:
        return 'Jarayonda';
      case PayoutStatus.completed:
        return 'To\'landi';
      case PayoutStatus.failed:
        return 'Xatolik';
      case PayoutStatus.cancelled:
        return 'Bekor qilindi';
    }
  }

  String get statusTextRu {
    switch (status) {
      case PayoutStatus.pending:
        return 'Ожидает';
      case PayoutStatus.processing:
        return 'В процессе';
      case PayoutStatus.completed:
        return 'Оплачено';
      case PayoutStatus.failed:
        return 'Ошибка';
      case PayoutStatus.cancelled:
        return 'Отменено';
    }
  }

  String get paymentMethodText {
    switch (paymentMethod) {
      case PaymentMethod.bankTransfer:
        return 'Bank o\'tkazmasi';
      case PaymentMethod.octobank:
        return 'Octobank';
    }
  }

  String get formattedAmount => '${amount.toStringAsFixed(0)} so\'m';
  String get formattedNetAmount => '${netAmount.toStringAsFixed(0)} so\'m';
}
