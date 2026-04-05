import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../product/product_detail_screen.dart';
import '../shop/shop_detail_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrderById(widget.orderId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OrdersProvider>(
      builder: (context, ordersProvider, _) {
        final order = ordersProvider.currentOrder;

        if (ordersProvider.isLoading || order == null) {
          return Scaffold(
            appBar: AppBar(title: Text(context.l10n.translate('my_orders'))),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final statusInfo = _getStatusInfo(context, order.status);

        return Scaffold(
          backgroundColor: Colors.grey.shade50,
          appBar: AppBar(
            title: Text(
              '${context.l10n.translate('order_number')}: ${order.orderNumber}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          body: SingleChildScrollView(
            child: Column(
              children: [
                // Status Card
                _buildStatusCard(order, statusInfo),

                const SizedBox(height: 16),

                // Timeline
                _buildTimeline(order),

                const SizedBox(height: 16),

                // QR Code (barcha pickup buyurtmalar uchun)
                if (order.deliveryMethod == 'pickup' &&
                    order.pickupToken != null &&
                    order.status != OrderStatus.delivered &&
                    order.status != OrderStatus.cancelled)
                  _buildQrCodeSection(order),

                if (order.deliveryMethod == 'pickup' &&
                    order.pickupToken != null &&
                    order.status != OrderStatus.delivered &&
                    order.status != OrderStatus.cancelled)
                  const SizedBox(height: 16),

                const SizedBox(height: 16),

                // Products
                _buildProductsSection(order),

                const SizedBox(height: 16),

                // Address or Pickup Point
                if (order.deliveryMethod == 'pickup')
                  _buildPickupPointSection(order)
                else
                  _buildAddressSection(order),

                const SizedBox(height: 16),

                // Payment Summary
                _buildPaymentSummary(order),

                const SizedBox(height: 100),
              ],
            ),
          ),
          bottomSheet: order.status == OrderStatus.pending ||
                  order.status == OrderStatus.processing
              ? _buildBottomActions(order)
              : (order.status == OrderStatus.delivered ||
                      order.status == OrderStatus.cancelled)
                  ? _buildReorderAction(order)
                  : null,
        );
      },
    );
  }

  Widget _buildStatusCard(OrderModel order, Map<String, dynamic> statusInfo) {
    final formattedDate =
        '${order.createdAt.day}.${order.createdAt.month.toString().padLeft(2, '0')}.${order.createdAt.year}';
    final progress = _getOrderProgress(order.status);
    final statusColor = statusInfo['color'] as Color;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Status icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              statusInfo['icon'] as IconData,
              color: statusColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          // Status text + date
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  statusInfo['text'] as String,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${order.orderNumber} • $formattedDate',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          // Progress indicator
          if (order.status != OrderStatus.cancelled)
            SizedBox(
              width: 40,
              height: 40,
              child: CircularProgressIndicator(
                value: progress,
                strokeWidth: 3,
                backgroundColor: Colors.grey.shade100,
                valueColor: AlwaysStoppedAnimation<Color>(statusColor),
              ),
            ),
        ],
      ),
    );
  }

  double _getOrderProgress(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 0.1;
      case OrderStatus.processing:
        return 0.25;
      case OrderStatus.readyForPickup:
        return 0.55;
      case OrderStatus.courierAssigned:
        return 0.6;
      case OrderStatus.courierPickedUp:
        return 0.7;
      case OrderStatus.shipping:
        return 0.8;
      case OrderStatus.atPickupPoint:
        return 0.85;
      case OrderStatus.delivered:
        return 1.0;
      case OrderStatus.cancelled:
        return 0.0;
    }
  }

  Widget _buildTimeline(OrderModel order) {
    final isPickup = order.deliveryMethod == 'pickup';

    final steps = isPickup
        ? [
            {
              'status': OrderStatus.processing,
              'label': context.l10n.translate('status_store_preparing'),
              'icon': Iconsax.box_tick
            },
            {
              'status': OrderStatus.atPickupPoint,
              'label': context.l10n.translate('status_at_pickup'),
              'icon': Iconsax.building
            },
            {
              'status': OrderStatus.delivered,
              'label': context.l10n.translate('picked_up'),
              'icon': Iconsax.tick_circle
            },
          ]
        : [
            {
              'status': OrderStatus.processing,
              'label': context.l10n.translate('status_store_preparing'),
              'icon': Iconsax.box_tick
            },
            {
              'status': OrderStatus.shipping,
              'label': context.l10n.translate('status_on_the_way'),
              'icon': Iconsax.truck_fast
            },
            {
              'status': OrderStatus.delivered,
              'label': context.l10n.translate('status_delivered_info'),
              'icon': Iconsax.tick_circle
            },
          ];

    final currentIndex = steps.indexWhere((s) => s['status'] == order.status);
    final isCancelled = order.status == OrderStatus.cancelled;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.translate('order_status_title'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          if (isCancelled)
            Center(
              child: Column(
                children: [
                  Icon(
                    Iconsax.close_circle,
                    size: 48,
                    color: AppColors.error,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    context.l10n.translate('order_cancelled_title'),
                    style: TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            )
          else
            ...List.generate(steps.length, (index) {
              final step = steps[index];
              final isCompleted = index <= currentIndex;
              final isLast = index == steps.length - 1;

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isCompleted
                              ? AppColors.primary
                              : Colors.grey.shade200,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          step['icon'] as IconData,
                          color:
                              isCompleted ? Colors.white : Colors.grey.shade400,
                          size: 16,
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2,
                          height: 40,
                          color: isCompleted
                              ? AppColors.primary
                              : Colors.grey.shade200,
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        step['label'] as String,
                        style: TextStyle(
                          fontWeight:
                              isCompleted ? FontWeight.w600 : FontWeight.normal,
                          color:
                              isCompleted ? Colors.black : Colors.grey.shade500,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }),
        ],
      ),
    );
  }

  Widget _buildProductsSection(OrderModel order) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.translate('products_with_count'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${order.items.length} ${context.l10n.translate('piece')}',
                style: TextStyle(
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...order.items.map((item) => _buildProductItem(order, item)),
        ],
      ),
    );
  }

  Widget _buildProductItem(OrderModel order, OrderItemModel item) {
    final canPartialCancel = order.items.length > 1 &&
        (order.status == OrderStatus.pending ||
            order.status == OrderStatus.processing);

    return GestureDetector(
      onTap: () {
        if (item.productId != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProductDetailScreen(
                product: {
                  'id': item.productId,
                  'name': item.productName,
                  'imageUrl': item.productImage,
                  'price': item.price,
                },
              ),
            ),
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(10),
              ),
              child: item.productImage != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: CachedNetworkImage(
                        imageUrl: item.productImage!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Icon(
                          Iconsax.box,
                          color: Colors.grey.shade400,
                          size: 22,
                        ),
                      ),
                    )
                  : Icon(
                      Iconsax.box,
                      color: Colors.grey.shade400,
                      size: 22,
                    ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.productName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.quantity} ta',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '${_formatPrice(item.total.toInt())} ${context.l10n.currency}',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
            // Partial cancel button
            if (canPartialCancel) ...[
              const SizedBox(width: 6),
              GestureDetector(
                onTap: () => _showPartialCancelDialog(order, item),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    Iconsax.close_circle,
                    size: 18,
                    color: AppColors.error.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ========== QR Kod bo'limi ==========
  Widget _buildQrCodeSection(OrderModel order) {
    final qrData = jsonEncode({
      'orderId': order.id,
      'token': order.pickupToken,
    });

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Iconsax.scan_barcode, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                context.l10n.translate('show_qr'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            context.l10n.translate('show_qr_desc'),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 20),

          // QR Code
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: QrImageView(
              data: qrData,
              version: QrVersions.auto,
              size: 200.0,
              backgroundColor: Colors.white,
              errorCorrectionLevel: QrErrorCorrectLevel.M,
            ),
          ),

          const SizedBox(height: 16),

          // Pickup code (qo'lda kiritish uchun)
          if (order.pickupCode != null) ...[
            Text(
              context.l10n.translate('or_tell_code'),
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                order.pickupCode!,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 6,
                  color: Colors.black87,
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Punkt ma'lumotlari
          if (order.pickupPoint != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.building, color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.pickupPoint!.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          order.pickupPoint!.address,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ========== Topshirish punkti ma'lumotlari ==========
  Widget _buildPickupPointSection(OrderModel order) {
    final point = order.pickupPoint;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.translate('pickup_point'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Iconsax.building,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      point?.name ?? context.l10n.translate('pickup_point'),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      point?.address ?? '',
                      style: const TextStyle(color: Colors.grey),
                    ),
                    if (point?.phone != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        point!.phone!,
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAddressSection(OrderModel order) {
    // AddressesProvider orqali haqiqiy manzilni olish
    final addressesProvider = context.read<AddressesProvider>();
    final address = order.addressId != null
        ? addressesProvider.addresses.cast<AddressModel?>().firstWhere(
              (a) => a!.id == order.addressId,
              orElse: () => null,
            )
        : null;

    final addressTitle = address?.title ?? 'Manzil';
    final addressText =
        address?.address ?? context.l10n.translate('address_not_found');

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.translate('delivery_address'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Iconsax.location,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      addressTitle,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      addressText,
                      style: const TextStyle(color: Colors.grey),
                    ),
                    if (address?.apartment != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        '${context.l10n.translate('apartment')}: ${address!.apartment}${address.entrance != null ? ', ${context.l10n.translate('entrance')}: ${address.entrance}' : ''}${address.floor != null ? ', ${context.l10n.translate('floor')}: ${address.floor}' : ''}',
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSummary(OrderModel order) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.l10n.translate('payment_info'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildSummaryRow(
              context.l10n.translate('products_with_count'), order.subtotal),
          _buildSummaryRow(
              context.l10n.translate('shipping'), order.deliveryFee),
          if (order.discount > 0)
            _buildSummaryRow(
                context.l10n.translate('discount'), -order.discount),
          if (order.cashbackUsed > 0)
            _buildSummaryRow(
                context.l10n.translate('cashback'), -order.cashbackUsed),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.translate('total'),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_formatPrice(order.total.toInt())} ${context.l10n.currency}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // To'lov usuli
          Text(
            context.l10n.translate('payment_method'),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(
                  _getPaymentIcon(order.paymentMethod),
                  color: Colors.grey.shade600,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  _getPaymentMethodLabel(context, order.paymentMethod),
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, double amount) {
    final isNegative = amount < 0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.grey.shade600),
          ),
          Text(
            '${isNegative ? "-" : ""}${_formatPrice(amount.abs().toInt())} ${context.l10n.currency}',
            style: TextStyle(
              color: isNegative ? AppColors.success : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions(OrderModel order) {
    // Birinchi mahsulotning shopId sini olamiz
    final shopId = order.items.isNotEmpty ? order.items.first.shopId : null;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        border: Border(
          top: BorderSide(color: Colors.grey.shade200, width: 0.5),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 38,
                child: OutlinedButton(
                  onPressed: () => _showCancelDialog(order),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error, width: 1),
                    shape: const StadiumBorder(),
                  ),
                  child: Text(
                    context.l10n.translate('cancel'),
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: SizedBox(
                height: 38,
                child: ElevatedButton(
                  onPressed: shopId != null
                      ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ShopDetailScreen(shopId: shopId),
                            ),
                          );
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    backgroundColor: AppColors.primary,
                    elevation: 0,
                    shape: const StadiumBorder(),
                  ),
                  child: Text(
                    context.l10n.translate('seller_page'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCancelDialog(OrderModel order) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.translate('cancel_order')),
        content: Text(context.l10n.translate('cancel_order_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.l10n.translate('no')),
          ),
          ElevatedButton(
            onPressed: () async {
              final cancelledMsg = context.l10n.translate('order_cancelled');
              Navigator.pop(context);
              final ordersProvider = context.read<OrdersProvider>();
              final navigator = Navigator.of(context);
              final scaffoldMessenger = ScaffoldMessenger.of(context);
              final success = await ordersProvider.cancelOrder(order.id);
              if (mounted && success) {
                navigator.pop();
                scaffoldMessenger.showSnackBar(
                  SnackBar(
                    content: Text(cancelledMsg),
                    backgroundColor: AppColors.success,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text(context.l10n.translate('yes_cancel')),
          ),
        ],
      ),
    );
  }

  /// Reorder action — show for delivered/cancelled orders
  Widget _buildReorderAction(OrderModel order) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        border: Border(
          top: BorderSide(color: Colors.grey.shade200, width: 0.5),
        ),
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 44,
          child: ElevatedButton.icon(
            onPressed: () => _handleReorder(order),
            icon: const Icon(Iconsax.refresh, size: 18),
            label: Text(
              context.l10n.translate('reorder'),
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              elevation: 0,
              shape: const StadiumBorder(),
            ),
          ),
        ),
      ),
    );
  }

  /// Handle reorder — add items to cart
  Future<void> _handleReorder(OrderModel order) async {
    final ordersProvider = context.read<OrdersProvider>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    final result = await ordersProvider.reorder(order.id);
    if (result != null) {
      final addedCount = (result['addedItems'] as List?)?.length ?? 0;
      final skippedCount = (result['skippedItems'] as List?)?.length ?? 0;

      String message;
      if (skippedCount > 0) {
        message = '$addedCount ta qo\'shildi, $skippedCount ta mavjud emas';
      } else {
        message = '$addedCount ta mahsulot savatga qo\'shildi';
      }

      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.success,
          action: SnackBarAction(
            label: 'Savatga',
            textColor: Colors.white,
            onPressed: () => navigator.popUntil((r) => r.isFirst),
          ),
        ),
      );
    } else {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Xatolik yuz berdi'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  /// Show partial cancel dialog for a single item
  void _showPartialCancelDialog(OrderModel order, OrderItemModel item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mahsulotni bekor qilish'),
        content: Text(
          '"${item.productName}" buyurtmadan olib tashlansinmi?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Yo\'q'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final ordersProvider = context.read<OrdersProvider>();
              final scaffoldMessenger = ScaffoldMessenger.of(context);
              final navigator = Navigator.of(context);

              final result = await ordersProvider.cancelOrderItem(
                order.id,
                item.id,
              );
              if (result != null) {
                final orderCancelled = result['orderCancelled'] == true;
                if (orderCancelled && mounted) {
                  navigator.pop();
                  scaffoldMessenger.showSnackBar(
                    const SnackBar(
                      content: Text(
                          'Oxirgi mahsulot bekor qilindi — buyurtma bekor qilindi'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                } else if (mounted) {
                  scaffoldMessenger.showSnackBar(
                    SnackBar(
                      content: Text('"${item.productName}" olib tashlandi'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Ha, bekor qilish'),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusInfo(
      BuildContext context, OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return {
          'text': context.l10n.translate('status_order_received'),
          'color': AppColors.warning,
          'icon': Iconsax.clock,
        };
      case OrderStatus.processing:
        return {
          'text': context.l10n.translate('status_store_preparing'),
          'color': AppColors.primary,
          'icon': Iconsax.box_tick,
        };
      case OrderStatus.readyForPickup:
        return {
          'text': context.l10n.translate('status_order_ready'),
          'color': const Color(0xFF2196F3),
          'icon': Iconsax.box_tick,
        };
      case OrderStatus.courierAssigned:
        return {
          'text': context.l10n.translate('status_courier_assigned'),
          'color': AppColors.primary,
          'icon': Iconsax.profile_tick,
        };
      case OrderStatus.courierPickedUp:
        return {
          'text': context.l10n.translate('status_courier_picked_up'),
          'color': AppColors.primary,
          'icon': Iconsax.truck_fast,
        };
      case OrderStatus.shipping:
        return {
          'text': context.l10n.translate('status_on_the_way'),
          'color': AppColors.primary,
          'icon': Iconsax.truck_fast,
        };
      case OrderStatus.atPickupPoint:
        return {
          'text': context.l10n.translate('status_at_pickup'),
          'color': const Color(0xFF9C27B0),
          'icon': Iconsax.building,
        };
      case OrderStatus.delivered:
        return {
          'text': context.l10n.translate('status_delivered_info'),
          'color': AppColors.success,
          'icon': Iconsax.tick_circle,
        };
      case OrderStatus.cancelled:
        return {
          'text': context.l10n.translate('status_cancelled_info'),
          'color': AppColors.error,
          'icon': Iconsax.close_circle,
        };
    }
  }

  IconData _getPaymentIcon(String? method) {
    switch (method) {
      case 'card':
        return Iconsax.card;
      default:
        return Iconsax.money;
    }
  }

  String _getPaymentMethodLabel(BuildContext context, String? method) {
    switch (method) {
      case 'card':
        return context.l10n.translate('plastic_card');
      default:
        return context.l10n.translate('cash_payment');
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]} ',
        );
  }
}
