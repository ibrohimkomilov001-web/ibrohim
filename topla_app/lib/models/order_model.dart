/// Xavfsiz double parse (Prisma Decimal string sifatida keladi)
double _safeDouble(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}

/// Buyurtma modeli
class OrderModel {
  final String id;
  final String orderNumber;
  final String? userId;
  final String? addressId;
  final OrderStatus status;
  final double subtotal;
  final double deliveryFee;
  final double discount;
  final double cashbackUsed;
  final double total;
  final String? paymentMethod;
  final PaymentStatus paymentStatus;
  final DateTime? deliveryDate;
  final String? deliveryTimeSlot;
  final String? notes;
  final String? recipientName;
  final String? recipientPhone;
  final String? deliveryMethod;
  final DateTime createdAt;
  final List<OrderItemModel> items;

  // Pickup point fields
  final String? pickupPointId;
  final String? pickupCode;
  final String? pickupToken;
  final PickupPointModel? pickupPoint;

  OrderModel({
    required this.id,
    required this.orderNumber,
    this.userId,
    this.addressId,
    this.status = OrderStatus.pending,
    required this.subtotal,
    this.deliveryFee = 0,
    this.discount = 0,
    this.cashbackUsed = 0,
    required this.total,
    this.paymentMethod,
    this.paymentStatus = PaymentStatus.pending,
    this.deliveryDate,
    this.deliveryTimeSlot,
    this.notes,
    this.recipientName,
    this.recipientPhone,
    this.deliveryMethod,
    required this.createdAt,
    this.items = const [],
    this.pickupPointId,
    this.pickupCode,
    this.pickupToken,
    this.pickupPoint,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    // Parse items from either 'items' (backend) or 'order_items' (legacy)
    final itemsList = json['items'] ?? json['order_items'];

    return OrderModel(
      id: json['id'] as String,
      orderNumber: (json['order_number'] ?? json['orderNumber']) as String,
      userId: (json['user_id'] ?? json['userId']) as String?,
      addressId: (json['address_id'] ?? json['addressId']) as String?,
      status: OrderStatus.fromString(json['status'] as String? ?? 'pending'),
      subtotal: _safeDouble(json['subtotal']),
      deliveryFee: _safeDouble(json['delivery_fee'] ?? json['deliveryFee']),
      discount: _safeDouble(json['discount']),
      cashbackUsed: _safeDouble(json['cashback_used'] ?? json['cashbackUsed']),
      total: _safeDouble(json['total']),
      paymentMethod:
          (json['payment_method'] ?? json['paymentMethod']) as String?,
      paymentStatus: PaymentStatus.fromString(
          (json['payment_status'] ?? json['paymentStatus']) as String? ??
              'pending'),
      deliveryDate: (json['delivery_date'] ?? json['deliveryDate']) != null
          ? DateTime.parse((json['delivery_date'] ?? json['deliveryDate']))
          : null,
      deliveryTimeSlot:
          (json['delivery_time_slot'] ?? json['deliveryTimeSlot']) as String?,
      notes: (json['notes'] ?? json['note']) as String?,
      recipientName:
          (json['recipient_name'] ?? json['recipientName']) as String?,
      recipientPhone:
          (json['recipient_phone'] ?? json['recipientPhone']) as String?,
      deliveryMethod:
          (json['delivery_method'] ?? json['deliveryMethod']) as String?,
      createdAt: DateTime.tryParse(
              (json['created_at'] ?? json['createdAt'] ?? '').toString()) ??
          DateTime.now(),
      pickupPointId:
          (json['pickup_point_id'] ?? json['pickupPointId']) as String?,
      pickupCode: (json['pickup_code'] ?? json['pickupCode']) as String?,
      pickupToken: (json['pickup_token'] ?? json['pickupToken']) as String?,
      pickupPoint: json['pickupPoint'] != null
          ? PickupPointModel.fromJson(json['pickupPoint'])
          : null,
      items: itemsList != null
          ? (itemsList as List)
              .map((item) => OrderItemModel.fromJson(item))
              .toList()
          : [],
    );
  }
}

/// Buyurtma elementi
class OrderItemModel {
  final String id;
  final String orderId;
  final String? productId;
  final String productName;
  final String? productImage;
  final double price;
  final int quantity;
  final double total;

  OrderItemModel({
    required this.id,
    required this.orderId,
    this.productId,
    required this.productName,
    this.productImage,
    required this.price,
    required this.quantity,
    required this.total,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final qty = json['quantity'] is int
        ? json['quantity'] as int
        : int.tryParse(json['quantity'].toString()) ?? 1;
    final prc = _safeDouble(json['price']);
    return OrderItemModel(
      id: json['id'] as String,
      orderId: (json['order_id'] ?? json['orderId']) as String? ?? '',
      productId: (json['product_id'] ?? json['productId']) as String?,
      productName: (json['product_name'] ?? json['name']) as String? ?? '',
      productImage:
          json['product_image'] ?? json['imageUrl'] ?? json['image_url'],
      price: prc,
      quantity: qty,
      total: _safeDouble(json['total'] ?? (prc * qty)),
    );
  }
}

/// Buyurtma holati
enum OrderStatus {
  pending,
  confirmed,
  processing,
  readyForPickup,
  courierAssigned,
  courierPickedUp,
  shipping,
  atPickupPoint,
  delivered,
  cancelled;

  static OrderStatus fromString(String value) {
    switch (value) {
      case 'ready_for_pickup':
        return OrderStatus.readyForPickup;
      case 'courier_assigned':
        return OrderStatus.courierAssigned;
      case 'courier_picked_up':
        return OrderStatus.courierPickedUp;
      case 'at_pickup_point':
        return OrderStatus.atPickupPoint;
      default:
        return OrderStatus.values.firstWhere(
          (e) => e.name == value,
          orElse: () => OrderStatus.pending,
        );
    }
  }

  String get nameUz {
    switch (this) {
      case OrderStatus.pending:
        return 'Kutilmoqda';
      case OrderStatus.confirmed:
        return 'Tasdiqlangan';
      case OrderStatus.processing:
        return 'Tayyorlanmoqda';
      case OrderStatus.readyForPickup:
        return 'Tayyor';
      case OrderStatus.courierAssigned:
        return 'Kuryer tayinlandi';
      case OrderStatus.courierPickedUp:
        return 'Kuryer oldi';
      case OrderStatus.shipping:
        return 'Yetkazilmoqda';
      case OrderStatus.atPickupPoint:
        return 'Punktda kutmoqda';
      case OrderStatus.delivered:
        return 'Yetkazildi';
      case OrderStatus.cancelled:
        return 'Bekor qilindi';
    }
  }

  String get nameRu {
    switch (this) {
      case OrderStatus.pending:
        return 'Ожидает';
      case OrderStatus.confirmed:
        return 'Подтвержден';
      case OrderStatus.processing:
        return 'Готовится';
      case OrderStatus.readyForPickup:
        return 'Готов к выдаче';
      case OrderStatus.courierAssigned:
        return 'Курьер назначен';
      case OrderStatus.courierPickedUp:
        return 'Курьер забрал';
      case OrderStatus.shipping:
        return 'Доставляется';
      case OrderStatus.atPickupPoint:
        return 'Ожидает в пункте';
      case OrderStatus.delivered:
        return 'Доставлен';
      case OrderStatus.cancelled:
        return 'Отменен';
    }
  }
}

/// To'lov holati
enum PaymentStatus {
  pending,
  paid,
  failed;

  static PaymentStatus fromString(String value) {
    return PaymentStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => PaymentStatus.pending,
    );
  }
}

/// Topshirish punkti modeli
class PickupPointModel {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String? phone;
  final Map<String, dynamic>? workingHours;

  PickupPointModel({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    this.phone,
    this.workingHours,
  });

  factory PickupPointModel.fromJson(Map<String, dynamic> json) {
    return PickupPointModel(
      id: (json['id'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      address: (json['address'] as String?) ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      phone: json['phone'] as String?,
      workingHours: json['workingHours'] as Map<String, dynamic>?,
    );
  }
}
