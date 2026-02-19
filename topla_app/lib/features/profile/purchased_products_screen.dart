import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/empty_states.dart';
import '../../providers/providers.dart';
import '../../models/order_model.dart';

class PurchasedProductsScreen extends StatefulWidget {
  const PurchasedProductsScreen({super.key});

  @override
  State<PurchasedProductsScreen> createState() =>
      _PurchasedProductsScreenState();
}

class _PurchasedProductsScreenState extends State<PurchasedProductsScreen> {
  List<Map<String, dynamic>> _purchasedProducts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPurchasedProducts();
  }

  Future<void> _loadPurchasedProducts() async {
    setState(() => _isLoading = true);
    try {
      final ordersProvider =
          Provider.of<OrdersProvider>(context, listen: false);
      await ordersProvider.loadOrders();
      final orders = ordersProvider.orders;

      // Collect all delivered/completed order items
      final products = <Map<String, dynamic>>[];
      for (final order in orders) {
        if (order.status == OrderStatus.delivered) {
          for (final item in order.items) {
            products.add({
              'name': item.productName,
              'image': item.productImage,
              'price': item.price,
              'quantity': item.quantity,
              'order_date': order.createdAt,
              'order_id': order.id,
            });
          }
        }
      }
      if (mounted) {
        setState(() {
          _purchasedProducts = products;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(
          context.l10n.translate('purchased_products'),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _purchasedProducts.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadPurchasedProducts,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _purchasedProducts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) =>
                        _buildProductCard(_purchasedProducts[index]),
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return EmptyPurchasedWidget(
      onShopNow: () =>
          Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final price = product['price'] ?? 0;
    final qty = product['quantity'] ?? 1;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Product image
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
              image: product['image'] != null
                  ? DecorationImage(
                      image: CachedNetworkImageProvider(product['image']),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: product['image'] == null
                ? Icon(Iconsax.box_1, color: Colors.grey.shade400, size: 24)
                : null,
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['name'] ?? '',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${qty}x • ${_formatPrice(price)} ${context.l10n.translate('currency')}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          // Reorder button
          IconButton(
            onPressed: () {
              // TODO: Add to cart
            },
            icon: Icon(Iconsax.refresh_circle,
                color: AppColors.primary, size: 22),
            tooltip: context.l10n.translate('reorder'),
          ),
        ],
      ),
    );
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final num = (price is int) ? price : (price as double).toInt();
    return num.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
  }
}
