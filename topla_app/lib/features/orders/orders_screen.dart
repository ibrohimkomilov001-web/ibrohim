import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/skeleton_widgets.dart';
import '../../widgets/empty_states.dart';
import '../../widgets/topla_refresh_indicator.dart';
import '../main/main_screen.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  final bool showBackButton;

  const OrdersScreen({super.key, this.showBackButton = false});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);

    // Buyurtmalarni yuklash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().loadOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: widget.showBackButton,
        title: Text(
          context.l10n.myOrders,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: false, // Tablar joyida turadi
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey.shade600,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelPadding: const EdgeInsets.symmetric(horizontal: 8),
          labelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w500,
            fontSize: 12,
          ),
          tabs: const [
            Tab(text: 'Barchasi'),
            Tab(text: 'Jarayonda'),
            Tab(text: 'Yetkazildi'),
            Tab(text: 'Bekor'),
          ],
        ),
      ),
      body: Consumer<OrdersProvider>(
        builder: (context, ordersProvider, _) {
          if (ordersProvider.isLoading) {
            // Shimmer skeleton loading
            return ListView.builder(
              padding: const EdgeInsets.all(AppSizes.lg),
              itemCount: 4,
              itemBuilder: (_, __) => const Padding(
                padding: EdgeInsets.only(bottom: AppSizes.md),
                child: OrderItemSkeleton(),
              ),
            );
          }

          if (ordersProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Iconsax.warning_2,
                      size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                      '${context.l10n.translate('error')}: ${ordersProvider.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ordersProvider.loadOrders(),
                    child: Text(context.l10n.translate('reload')),
                  ),
                ],
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            physics:
                const NeverScrollableScrollPhysics(), // Swipe qilishni o'chirish
            children: [
              _buildOrdersList(ordersProvider.orders),
              _buildOrdersList(ordersProvider.activeOrders),
              _buildOrdersList(ordersProvider.completedOrders),
              _buildOrdersList(ordersProvider.cancelledOrders),
            ],
          );
        },
      ),
    );
  }

  Widget _buildOrdersList(List<OrderModel> orders) {
    if (orders.isEmpty) {
      return EmptyOrdersWidget(
        onShopNow: () => MainScreenState.switchToTab(0),
      );
    }

    return ToplaRefreshIndicator(
      onRefresh: () => context.read<OrdersProvider>().loadOrders(),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSizes.lg),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: index < orders.length - 1 ? AppSizes.md : 0,
            ),
            child: _buildOrderCard(orders[index]),
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order) {
    final statusInfo = _getStatusInfo(order.status);
    final formattedDate =
        '${order.createdAt.day}.${order.createdAt.month.toString().padLeft(2, '0')}.${order.createdAt.year}';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(AppSizes.lg),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.orderNumber,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: AppSizes.xs),
                    Text(
                      formattedDate,
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.md,
                    vertical: AppSizes.sm,
                  ),
                  decoration: BoxDecoration(
                    color:
                        (statusInfo['color'] as Color).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        statusInfo['icon'],
                        color: statusInfo['color'],
                        size: 16,
                      ),
                      const SizedBox(width: AppSizes.xs),
                      Text(
                        statusInfo['text'],
                        style: TextStyle(
                          color: statusInfo['color'],
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Divider
          Divider(height: 1, color: Colors.grey.shade200),

          // Products
          Padding(
            padding: const EdgeInsets.all(AppSizes.lg),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                  ),
                  child: order.items.isNotEmpty &&
                          order.items.first.productImage != null
                      ? ClipRRect(
                          borderRadius:
                              BorderRadius.circular(AppSizes.radiusSm),
                          child: CachedNetworkImage(
                            imageUrl: order.items.first.productImage!,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Icon(
                              Iconsax.box,
                              color: Colors.grey.shade400,
                              size: 28,
                            ),
                          ),
                        )
                      : Icon(
                          Iconsax.box,
                          color: Colors.grey.shade400,
                          size: 28,
                        ),
                ),
                const SizedBox(width: AppSizes.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.items.isNotEmpty
                            ? order.items.first.productName
                            : context.l10n.translate('product'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      if (order.items.length > 1) ...[
                        const SizedBox(height: AppSizes.xs),
                        Text(
                          '+${order.items.length - 1} ${context.l10n.translate('more_products')}',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatPrice(order.total.toInt()),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      context.l10n.translate('currency'),
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSizes.lg,
              0,
              AppSizes.lg,
              AppSizes.lg,
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderDetailScreen(
                            orderId: order.id,
                          ),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding:
                          const EdgeInsets.symmetric(vertical: AppSizes.md),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Text(
                      context.l10n.orderDetails,
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                if (order.status == OrderStatus.shipping) ...[
                  const SizedBox(width: AppSizes.md),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => OrderDetailScreen(
                              orderId: order.id,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        padding:
                            const EdgeInsets.symmetric(vertical: AppSizes.md),
                        backgroundColor: AppColors.success,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Iconsax.location, size: 18),
                          const SizedBox(width: AppSizes.xs),
                          Text(
                            context.l10n.trackOrder,
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                if (order.status == OrderStatus.delivered) ...[
                  const SizedBox(width: AppSizes.md),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        final cart = context.read<CartProvider>();
                        int addedCount = 0;
                        for (final item in order.items) {
                          if (item.productId != null) {
                            await cart.addToCart(
                              item.productId!,
                              quantity: item.quantity,
                            );
                            addedCount++;
                          }
                        }
                        if (mounted && addedCount > 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                  '$addedCount ta mahsulot savatga qo\'shildi'),
                              backgroundColor: AppColors.success,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        padding:
                            const EdgeInsets.symmetric(vertical: AppSizes.md),
                      ),
                      child: Text(
                        context.l10n.translate('reorder'),
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                ],
                if (order.status == OrderStatus.pending) ...[
                  const SizedBox(width: AppSizes.md),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _showCancelDialog(order),
                      style: OutlinedButton.styleFrom(
                        padding:
                            const EdgeInsets.symmetric(vertical: AppSizes.md),
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                      ),
                      child: Text(
                        context.l10n.translate('cancel'),
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(OrderModel order) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.l10n.translate('cancel_order')),
        content: Text(context.l10n.translate('cancel_order_confirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(context.l10n.translate('no')),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              final ordersProvider = context.read<OrdersProvider>();
              final scaffoldMessenger = ScaffoldMessenger.of(context);
              final success = await ordersProvider.cancelOrder(order.id);
              if (mounted && success) {
                scaffoldMessenger.showSnackBar(
                  SnackBar(
                    content: Text(context.l10n.translate('order_cancelled')),
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

  Map<String, dynamic> _getStatusInfo(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return {
          'text': context.l10n.translate('pending'),
          'color': AppColors.warning,
          'icon': Iconsax.clock,
        };
      case OrderStatus.confirmed:
        return {
          'text': context.l10n.translate('confirmed'),
          'color': AppColors.accent,
          'icon': Iconsax.tick_square,
        };
      case OrderStatus.processing:
        return {
          'text': context.l10n.translate('processing'),
          'color': AppColors.accent,
          'icon': Iconsax.box_tick,
        };
      case OrderStatus.readyForPickup:
        return {
          'text': 'Tayyor',
          'color': AppColors.accent,
          'icon': Iconsax.box_tick,
        };
      case OrderStatus.courierAssigned:
        return {
          'text': 'Kuryer tayinlandi',
          'color': AppColors.primary,
          'icon': Iconsax.profile_tick,
        };
      case OrderStatus.courierPickedUp:
        return {
          'text': 'Kuryer oldi',
          'color': AppColors.primary,
          'icon': Iconsax.truck_fast,
        };
      case OrderStatus.shipping:
        return {
          'text': context.l10n.translate('on_the_way'),
          'color': AppColors.primary,
          'icon': Iconsax.truck_fast,
        };
      case OrderStatus.delivered:
        return {
          'text': context.l10n.translate('delivered'),
          'color': AppColors.success,
          'icon': Iconsax.tick_circle,
        };
      case OrderStatus.cancelled:
        return {
          'text': context.l10n.translate('cancelled'),
          'color': AppColors.error,
          'icon': Iconsax.close_circle,
        };
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]} ',
        );
  }
}
