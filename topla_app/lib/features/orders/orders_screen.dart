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
    with SingleTickerProviderStateMixin, AutomaticKeepAliveClientMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);

    // Buyurtmalarni yuklash (faqat autentifikatsiya bo'lsa)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ordersProvider = context.read<OrdersProvider>();
      if (ordersProvider.isAuthenticated) {
        ordersProvider.loadOrders();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
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
          tabs: [
            Tab(text: context.l10n.translate('in_process_tab')),
            Tab(text: context.l10n.translate('delivered')),
            Tab(text: context.l10n.translate('cancelled_tab')),
            Tab(text: context.l10n.translate('all_tab')),
          ],
        ),
      ),
      body: Consumer<OrdersProvider>(
        builder: (context, ordersProvider, _) {
          // Autentifikatsiya tekshirish
          if (!ordersProvider.isAuthenticated) {
            return _buildLoginRequiredState();
          }

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
              _buildOrdersList(ordersProvider.activeOrders),
              _buildOrdersList(ordersProvider.completedOrders),
              _buildOrdersList(ordersProvider.cancelledOrders),
              _buildOrdersList(ordersProvider.orders),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLoginRequiredState() {
    return EmptyOrdersWidget(
      onShopNow: () => MainScreenState.switchToTab(0),
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
    final statusInfo = _getStatusInfo(context, order.status);
    final formattedDate =
        '${order.createdAt.day}.${order.createdAt.month.toString().padLeft(2, '0')}.${order.createdAt.year}';

    // Progress hisoblash (0.0 - 1.0)
    final progress = _getOrderProgress(order.status);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: order.id),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            // Status + Progress bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status text + icon
                  Row(
                    children: [
                      Icon(
                        statusInfo['icon'] as IconData,
                        color: statusInfo['color'] as Color,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          statusInfo['text'] as String,
                          style: TextStyle(
                            color: statusInfo['color'] as Color,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        formattedDate,
                        style: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Progress bar
                  if (order.status != OrderStatus.cancelled &&
                      order.status != OrderStatus.delivered)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 4,
                        backgroundColor: Colors.grey.shade100,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          statusInfo['color'] as Color,
                        ),
                      ),
                    ),
                  if (order.status == OrderStatus.delivered)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: 1.0,
                        minHeight: 4,
                        backgroundColor: Colors.grey.shade100,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.success),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 12),
            Divider(height: 1, color: Colors.grey.shade100),

            // Product info row
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  // Product image
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: order.items.isNotEmpty &&
                            order.items.first.productImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: CachedNetworkImage(
                              imageUrl: order.items.first.productImage!,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) => Icon(
                                Iconsax.box,
                                color: Colors.grey.shade300,
                                size: 22,
                              ),
                            ),
                          )
                        : Icon(
                            Iconsax.box,
                            color: Colors.grey.shade300,
                            size: 22,
                          ),
                  ),
                  const SizedBox(width: 10),
                  // Product name + count
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
                        if (order.items.length > 1)
                          Text(
                            '${context.l10n.translate('and_more')} ${order.items.length - 1} ${context.l10n.translate('piece')}',
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Price
                  Text(
                    '${_formatPrice(order.total.toInt())} ${context.l10n.translate('currency')}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            // "Bekor qilish" tugmasi faqat detail sahifada ko'rsatiladi
          ],
        ),
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
      case OrderStatus.delivered:
        return {
          'text': context.l10n.translate('status_delivered_info'),
          'color': AppColors.success,
          'icon': Iconsax.tick_circle,
        };
      case OrderStatus.atPickupPoint:
        return {
          'text': context.l10n.translate('status_at_pickup'),
          'color': const Color(0xFF9C27B0),
          'icon': Iconsax.building,
        };
      case OrderStatus.cancelled:
        return {
          'text': context.l10n.translate('status_cancelled_info'),
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
