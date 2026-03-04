import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/order_model.dart';
import '../../services/vendor_service.dart';

/// Vendor — Buyurtma tafsilotlari + status yangilash
class VendorOrderDetailScreen extends StatefulWidget {
  final OrderModel order;

  const VendorOrderDetailScreen({super.key, required this.order});

  @override
  State<VendorOrderDetailScreen> createState() =>
      _VendorOrderDetailScreenState();
}

class _VendorOrderDetailScreenState extends State<VendorOrderDetailScreen> {
  late OrderModel _order;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
  }

  /// Keyingi mumkin bo'lgan statuslar
  List<_StatusAction> get _nextActions {
    switch (_order.status) {
      case OrderStatus.pending:
        return [
          _StatusAction(
            status: 'confirmed',
            label: context.l10n.translate('confirm'),
            icon: Iconsax.tick_circle,
            color: Colors.blue,
          ),
          _StatusAction(
            status: 'cancelled',
            label: context.l10n.translate('cancel_order'),
            icon: Iconsax.close_circle,
            color: Colors.red,
          ),
        ];
      case OrderStatus.confirmed:
        return [
          _StatusAction(
            status: 'processing',
            label: context.l10n.translate('start_processing'),
            icon: Iconsax.box,
            color: Colors.purple,
          ),
          _StatusAction(
            status: 'cancelled',
            label: context.l10n.translate('cancel_order'),
            icon: Iconsax.close_circle,
            color: Colors.red,
          ),
        ];
      case OrderStatus.processing:
        return [
          _StatusAction(
            status: 'ready_for_pickup',
            label: context.l10n.translate('ready_for_courier'),
            icon: Iconsax.tick_square,
            color: Colors.teal,
          ),
        ];
      case OrderStatus.readyForPickup:
        return [
          _StatusAction(
            status: 'at_pickup_point',
            label: context.l10n.translate('delivered_to_point'),
            icon: Iconsax.building,
            color: Colors.deepOrange,
          ),
        ];
      default:
        return [];
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.translate('confirm')),
        content: Text(
          newStatus == 'cancelled'
              ? context.l10n.translate('cancel_order_confirm')
              : context.l10n.translate('update_status_confirm'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.l10n.translate('no')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor:
                  newStatus == 'cancelled' ? Colors.red : AppColors.primary,
            ),
            child: Text(context.l10n.translate('yes')),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isUpdating = true);
    try {
      await VendorService.updateOrderStatus(_order.id, newStatus);
      HapticFeedback.mediumImpact();

      // Lokal holatni yangilash
      setState(() {
        _order = OrderModel(
          id: _order.id,
          orderNumber: _order.orderNumber,
          userId: _order.userId,
          addressId: _order.addressId,
          status: OrderStatus.fromString(newStatus),
          subtotal: _order.subtotal,
          deliveryFee: _order.deliveryFee,
          discount: _order.discount,
          cashbackUsed: _order.cashbackUsed,
          total: _order.total,
          paymentMethod: _order.paymentMethod,
          paymentStatus: _order.paymentStatus,
          deliveryDate: _order.deliveryDate,
          deliveryTimeSlot: _order.deliveryTimeSlot,
          notes: _order.notes,
          recipientName: _order.recipientName,
          recipientPhone: _order.recipientPhone,
          deliveryMethod: _order.deliveryMethod,
          createdAt: _order.createdAt,
          items: _order.items,
          pickupPointId: _order.pickupPointId,
          pickupCode: _order.pickupCode,
          pickupToken: _order.pickupToken,
          pickupPoint: _order.pickupPoint,
        );
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '${context.l10n.translate('status_updated')}: ${_order.status.nameUz}'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${context.l10n.translate('error')}: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      setState(() => _isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? Colors.black : Colors.grey.shade50,
      appBar: AppBar(
        title: Text('#${_order.orderNumber}'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Status banner
            _buildStatusBanner(isDark),
            const SizedBox(height: 8),

            // Status timeline
            _buildStatusTimeline(isDark),
            const SizedBox(height: 8),

            // Order items
            _buildItemsCard(isDark),
            const SizedBox(height: 8),

            // Customer info
            _buildCustomerCard(isDark),
            const SizedBox(height: 8),

            // Delivery info
            if (_order.deliveryMethod != null || _order.pickupPoint != null)
              _buildDeliveryCard(isDark),
            const SizedBox(height: 8),

            // Price summary
            _buildPriceSummary(isDark),
            const SizedBox(height: 8),

            // Notes
            if (_order.notes != null && _order.notes!.isNotEmpty)
              _buildNotesCard(isDark),

            const SizedBox(height: 100), // Bottom padding for action buttons
          ],
        ),
      ),
      // Floating action buttons for status update
      bottomNavigationBar:
          _nextActions.isNotEmpty ? _buildActionBar(isDark) : null,
    );
  }

  // ─── STATUS BANNER ────────────────────────────────────────────
  Widget _buildStatusBanner(bool isDark) {
    final statusColor = _getStatusColor(_order.status);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [statusColor, statusColor.withValues(alpha: 0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Icon(_getStatusIcon(_order.status), color: Colors.white, size: 40),
          const SizedBox(height: 8),
          Text(
            _order.status.nameUz,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _formatDateTime(_order.createdAt),
            style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9), fontSize: 13),
          ),
        ],
      ),
    );
  }

  // ─── STATUS TIMELINE ──────────────────────────────────────────
  Widget _buildStatusTimeline(bool isDark) {
    final steps = [
      OrderStatus.pending,
      OrderStatus.confirmed,
      OrderStatus.processing,
      OrderStatus.readyForPickup,
    ];
    final currentIndex =
        steps.indexOf(_order.status).clamp(0, steps.length - 1);
    final isCancelled = _order.status == OrderStatus.cancelled;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.l10n.translate('order_process'),
              style:
                  const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 16),
          if (isCancelled)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Iconsax.close_circle, color: Colors.red, size: 20),
                  const SizedBox(width: 8),
                  Text(context.l10n.translate('order_cancelled'),
                      style: const TextStyle(
                          color: Colors.red, fontWeight: FontWeight.w600)),
                ],
              ),
            )
          else
            ...List.generate(steps.length, (i) {
              final isCompleted = i <= currentIndex;
              final isCurrent = i == currentIndex;
              final isLast = i == steps.length - 1;
              return _timelineStep(
                label: steps[i].nameUz,
                isCompleted: isCompleted,
                isCurrent: isCurrent,
                isLast: isLast,
                isDark: isDark,
              );
            }),
        ],
      ),
    );
  }

  Widget _timelineStep({
    required String label,
    required bool isCompleted,
    required bool isCurrent,
    required bool isLast,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCompleted
                    ? AppColors.primary
                    : isDark
                        ? Colors.grey.shade700
                        : Colors.grey.shade300,
                border: isCurrent
                    ? Border.all(color: AppColors.primary, width: 3)
                    : null,
              ),
              child: isCompleted
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 28,
                color: isCompleted
                    ? AppColors.primary
                    : isDark
                        ? Colors.grey.shade700
                        : Colors.grey.shade300,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w400,
              color: isCompleted
                  ? (isDark ? Colors.white : Colors.black)
                  : Colors.grey,
            ),
          ),
        ),
      ],
    );
  }

  // ─── ITEMS CARD ───────────────────────────────────────────────
  Widget _buildItemsCard(bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.box, size: 18),
              const SizedBox(width: 8),
              Text(
                  '${context.l10n.translate('products')} (${_order.items.length})',
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
          const Divider(height: 20),
          ..._order.items.map((item) => _buildItemRow(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildItemRow(OrderItemModel item, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          // Product image
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 50,
              height: 50,
              color: isDark ? Colors.grey.shade800 : Colors.grey.shade100,
              child: item.productImage != null
                  ? Image.network(item.productImage!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          const Icon(Iconsax.image, color: Colors.grey))
                  : const Icon(Iconsax.image, color: Colors.grey),
            ),
          ),
          const SizedBox(width: 12),
          // Name + quantity
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.productName,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('${_formatPrice(item.price.toInt())} × ${item.quantity}',
                    style:
                        TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
          // Total
          Text(_formatPrice(item.total.toInt()),
              style:
                  const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        ],
      ),
    );
  }

  // ─── CUSTOMER CARD ────────────────────────────────────────────
  Widget _buildCustomerCard(bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.user, size: 18),
              const SizedBox(width: 8),
              Text(context.l10n.translate('customer_info'),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
          const Divider(height: 20),
          if (_order.recipientName != null)
            _infoRow(
                context.l10n.translate('name_label'), _order.recipientName!),
          if (_order.recipientPhone != null)
            _infoRow(
                context.l10n.translate('phone_label'), _order.recipientPhone!),
          if (_order.paymentMethod != null)
            _infoRow(context.l10n.translate('payment_method'),
                _order.paymentMethod!),
          _infoRow(context.l10n.translate('payment_status'),
              _order.paymentStatus.name),
        ],
      ),
    );
  }

  // ─── DELIVERY CARD ────────────────────────────────────────────
  Widget _buildDeliveryCard(bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.truck, size: 18),
              const SizedBox(width: 8),
              Text(context.l10n.translate('delivery'),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
          const Divider(height: 20),
          if (_order.deliveryMethod != null)
            _infoRow(
                context.l10n.translate('method_label'), _order.deliveryMethod!),
          if (_order.deliveryDate != null)
            _infoRow(context.l10n.translate('date_label'),
                _formatDate(_order.deliveryDate!)),
          if (_order.deliveryTimeSlot != null)
            _infoRow(
                context.l10n.translate('time_label'), _order.deliveryTimeSlot!),
          if (_order.pickupPoint != null) ...[
            _infoRow(context.l10n.translate('point_label'),
                _order.pickupPoint!.name),
            _infoRow(
                context.l10n.translate('address'), _order.pickupPoint!.address),
          ],
          if (_order.pickupCode != null)
            Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border:
                    Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Iconsax.barcode, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    '${context.l10n.translate('pickup_code')}: ${_order.pickupCode}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 18,
                      color: AppColors.primary,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ─── PRICE SUMMARY ────────────────────────────────────────────
  Widget _buildPriceSummary(bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _priceRow(
              context.l10n.translate('products'), _order.subtotal, isDark),
          if (_order.deliveryFee > 0)
            _priceRow(
                context.l10n.translate('delivery'), _order.deliveryFee, isDark),
          if (_order.discount > 0)
            _priceRow(
                context.l10n.translate('discount'), -_order.discount, isDark,
                color: Colors.green),
          if (_order.cashbackUsed > 0)
            _priceRow('Cashback', -_order.cashbackUsed, isDark,
                color: Colors.orange),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(context.l10n.translate('total'),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 16)),
              Text(
                  '${_formatPrice(_order.total.toInt())} ${context.l10n.translate('currency')}',
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceRow(String label, double amount, bool isDark, {Color? color}) {
    final isNegative = amount < 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade600)),
          Text(
            '${isNegative ? "-" : ""}${_formatPrice(amount.abs().toInt())} ${context.l10n.translate('currency')}',
            style: TextStyle(
              color: color ?? (isDark ? Colors.white : Colors.black),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // ─── NOTES CARD ───────────────────────────────────────────────
  Widget _buildNotesCard(bool isDark) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Iconsax.note, size: 18),
              const SizedBox(width: 8),
              Text(context.l10n.translate('note_label'),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 8),
          Text(_order.notes!,
              style: TextStyle(color: Colors.grey.shade600, height: 1.5)),
        ],
      ),
    );
  }

  // ─── ACTION BAR ───────────────────────────────────────────────
  Widget _buildActionBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: _nextActions.map((action) {
          final isCancel = action.status == 'cancelled';
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: isCancel
                  ? OutlinedButton.icon(
                      onPressed: _isUpdating
                          ? null
                          : () => _updateStatus(action.status),
                      icon: Icon(action.icon, size: 18),
                      label: Text(action.label,
                          style: const TextStyle(fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    )
                  : FilledButton.icon(
                      onPressed: _isUpdating
                          ? null
                          : () => _updateStatus(action.status),
                      icon: _isUpdating
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : Icon(action.icon, size: 18),
                      label: Text(action.label,
                          style: const TextStyle(fontSize: 13)),
                      style: FilledButton.styleFrom(
                        backgroundColor: action.color,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ─── HELPERS ──────────────────────────────────────────────────
  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          Flexible(
            child: Text(value,
                style:
                    const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                textAlign: TextAlign.end),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Colors.orange;
      case OrderStatus.confirmed:
        return Colors.blue;
      case OrderStatus.processing:
        return Colors.purple;
      case OrderStatus.readyForPickup:
        return Colors.teal;
      case OrderStatus.courierAssigned:
        return Colors.indigo;
      case OrderStatus.courierPickedUp:
        return Colors.deepPurple;
      case OrderStatus.shipping:
        return Colors.cyan;
      case OrderStatus.atPickupPoint:
        return Colors.deepOrange;
      case OrderStatus.delivered:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
    }
  }

  IconData _getStatusIcon(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Iconsax.timer;
      case OrderStatus.confirmed:
        return Iconsax.tick_circle;
      case OrderStatus.processing:
        return Iconsax.box;
      case OrderStatus.readyForPickup:
        return Iconsax.tick_square;
      case OrderStatus.courierAssigned:
        return Iconsax.profile_tick;
      case OrderStatus.courierPickedUp:
        return Iconsax.truck_fast;
      case OrderStatus.shipping:
        return Iconsax.truck;
      case OrderStatus.atPickupPoint:
        return Iconsax.building;
      case OrderStatus.delivered:
        return Iconsax.verify;
      case OrderStatus.cancelled:
        return Iconsax.close_circle;
    }
  }

  String _formatPrice(int price) {
    final str = price.toString();
    final buf = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buf.write(' ');
      buf.write(str[i]);
    }
    return buf.toString();
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}  ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
  }
}

/// Status o'zgartirish uchun action modeli
class _StatusAction {
  final String status;
  final String label;
  final IconData icon;
  final Color color;

  _StatusAction({
    required this.status,
    required this.label,
    required this.icon,
    required this.color,
  });
}
