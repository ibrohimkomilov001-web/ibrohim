/// Komissiya holati
enum CommissionStatus { pending, paid, cancelled }

/// Komissiya modeli
class CommissionModel {
  final String id;
  final String shopId;
  final String? orderId;
  final double orderAmount;
  final double commissionRate;
  final double commissionAmount;
  final CommissionStatus status;
  final DateTime createdAt;

  // Relations
  final String? shopName;
  final String? orderNumber;

  CommissionModel({
    required this.id,
    required this.shopId,
    this.orderId,
    required this.orderAmount,
    required this.commissionRate,
    required this.commissionAmount,
    this.status = CommissionStatus.pending,
    required this.createdAt,
    this.shopName,
    this.orderNumber,
  });

  factory CommissionModel.fromJson(Map<String, dynamic> json) {
    return CommissionModel(
      id: (json['id'] ?? json['commissionId'])?.toString() ?? '',
      shopId: (json['shopId'] ?? json['shop_id'])?.toString() ?? '',
      orderId: (json['orderId'] ?? json['order_id'])?.toString(),
      orderAmount:
          (json['orderAmount'] ?? json['order_amount'] ?? 0).toDouble(),
      commissionRate:
          (json['commissionRate'] ?? json['commission_rate'] ?? 0).toDouble(),
      commissionAmount:
          (json['commissionAmount'] ?? json['commission_amount'] ?? 0)
              .toDouble(),
      status: _parseStatus(json['status']),
      createdAt: DateTime.tryParse(
              (json['createdAt'] ?? json['created_at'] ?? '').toString()) ??
          DateTime.now(),
      shopName: json['shops']?['name'] ?? json['shop']?['name'],
      orderNumber:
          json['orders']?['order_number'] ?? json['orders']?['orderNumber'],
    );
  }

  static CommissionStatus _parseStatus(String? status) {
    switch (status) {
      case 'paid':
        return CommissionStatus.paid;
      case 'cancelled':
        return CommissionStatus.cancelled;
      default:
        return CommissionStatus.pending;
    }
  }

  String get statusText {
    switch (status) {
      case CommissionStatus.pending:
        return 'Kutilmoqda';
      case CommissionStatus.paid:
        return 'To\'langan';
      case CommissionStatus.cancelled:
        return 'Bekor qilingan';
    }
  }

  String get formattedOrderAmount => '${orderAmount.toStringAsFixed(0)} so\'m';

  String get formattedCommission =>
      '${commissionAmount.toStringAsFixed(0)} so\'m';

  String get formattedRate => '${commissionRate.toStringAsFixed(1)}%';
}
