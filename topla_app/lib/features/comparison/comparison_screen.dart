import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/comparison_provider.dart';
import '../product/product_detail_screen.dart';

class ComparisonScreen extends StatelessWidget {
  const ComparisonScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          context.l10n.translate('comparison_list'),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          Consumer<ComparisonProvider>(
            builder: (context, provider, _) {
              if (provider.count == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: () {
                  provider.clearAll();
                },
                child: Text(
                  context.l10n.translate('clear_all'),
                  style: TextStyle(
                    color: Colors.red.shade400,
                    fontSize: 13,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<ComparisonProvider>(
        builder: (context, provider, _) {
          if (provider.count == 0) {
            return _buildEmptyState(context);
          }

          if (provider.count == 1) {
            return _buildSingleProductHint(context, provider);
          }

          return _buildComparisonTable(context, provider);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Iconsax.chart_21,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              context.l10n.translate('comparison_empty'),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.l10n.translate('comparison_empty_desc'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSingleProductHint(
      BuildContext context, ComparisonProvider provider) {
    final product = provider.products.first;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildProductCard(context, product, provider),
          const SizedBox(height: 24),
          Text(
            context.l10n.translate('comparison_add_more'),
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonTable(
      BuildContext context, ComparisonProvider provider) {
    final products = provider.products;
    final currency = context.l10n.translate('currency');

    return SingleChildScrollView(
      child: Column(
        children: [
          // Product cards horizontally scrollable
          SizedBox(
            height: 260,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              itemCount: products.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: SizedBox(
                    width: 160,
                    child:
                        _buildProductCard(context, products[index], provider),
                  ),
                );
              },
            ),
          ),

          // Comparison rows
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildComparisonRow(
                  context,
                  context.l10n.translate('price'),
                  products
                      .map((p) =>
                          '${_formatPrice((p['price'] as num?)?.toInt() ?? 0)} $currency')
                      .toList(),
                ),
                Divider(height: 1, color: Colors.grey.shade100),
                _buildComparisonRow(
                  context,
                  context.l10n.translate('rating_label'),
                  products
                      .map((p) =>
                          '${((p['rating'] as num?) ?? 0).toStringAsFixed(1)} ★')
                      .toList(),
                ),
                Divider(height: 1, color: Colors.grey.shade100),
                _buildComparisonRow(
                  context,
                  context.l10n.translate('sold_count'),
                  products.map((p) => '${(p['sold'] as num?) ?? 0}').toList(),
                ),
                if (products.any((p) => p['oldPrice'] != null)) ...[
                  Divider(height: 1, color: Colors.grey.shade100),
                  _buildComparisonRow(
                    context,
                    context.l10n.translate('discount'),
                    products.map((p) {
                      final old = (p['oldPrice'] as num?)?.toInt();
                      final cur = (p['price'] as num?)?.toInt() ?? 0;
                      if (old == null || old <= cur) return '—';
                      final disc = ((old - cur) * 100 / old).round();
                      return '-$disc%';
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildComparisonRow(
      BuildContext context, String label, List<String> values) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          ...values.map((v) => Expanded(
                child: Text(
                  v,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, Map<String, dynamic> product,
      ComparisonProvider provider) {
    final imageUrl = product['imageUrl'] as String? ?? '';
    final name = product['name'] as String? ?? '';
    final price = (product['price'] as num?)?.toInt() ?? 0;
    final currency = context.l10n.translate('currency');

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: product),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Stack(
              children: [
                ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(14)),
                  child: SizedBox(
                    height: 140,
                    width: double.infinity,
                    child: imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Container(
                              color: Colors.grey.shade100,
                              child: Icon(Iconsax.image,
                                  color: Colors.grey.shade300, size: 32),
                            ),
                          )
                        : Container(
                            color: Colors.grey.shade100,
                            child: Icon(Iconsax.image,
                                color: Colors.grey.shade300, size: 32),
                          ),
                  ),
                ),
                // Remove button
                Positioned(
                  top: 6,
                  right: 6,
                  child: GestureDetector(
                    onTap: () =>
                        provider.removeProduct(product['id'] as String),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.close,
                          size: 16, color: Colors.grey.shade600),
                    ),
                  ),
                ),
              ],
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${_formatPrice(price)} $currency',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]} ',
        );
  }
}
