import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/constants.dart';
import '../../providers/shop_provider.dart';
import '../../models/shop_model.dart';
import '../../widgets/skeleton_widgets.dart';
import 'shop_detail_screen.dart';

/// Do'konlar ro'yxati sahifasi
class ShopsListScreen extends StatefulWidget {
  const ShopsListScreen({super.key});

  @override
  State<ShopsListScreen> createState() => _ShopsListScreenState();
}

class _ShopsListScreenState extends State<ShopsListScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _loadShops();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadShops() async {
    await context.read<ShopProvider>().loadShops();
  }

  Future<void> _searchShops(String query) async {
    if (query.isEmpty) {
      await _loadShops();
      return;
    }
    await context.read<ShopProvider>().searchShops(query);
  }

  void _navigateToShop(ShopModel shop) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ShopDetailScreen(
          shopId: shop.id,
          shopName: shop.name,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Do\'kon qidirish...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.grey),
                ),
                onChanged: _searchShops,
              )
            : const Text('Do\'konlar'),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Iconsax.search_normal),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                  _loadShops();
                }
              });
            },
          ),
        ],
      ),
      body: Consumer<ShopProvider>(
        builder: (context, shopProvider, _) {
          if (shopProvider.isLoading && shopProvider.shops.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: List.generate(
                  4,
                  (_) => const ShopCardSkeleton(),
                ),
              ),
            );
          }

          final shops = shopProvider.shops;

          if (shops.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: _loadShops,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: shops.length,
              itemBuilder: (context, index) {
                return _buildShopCard(shops[index]);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Iconsax.shop,
            size: 64,
            color: Colors.grey.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            _isSearching ? 'Do\'kon topilmadi' : 'Hali do\'konlar mavjud emas',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
          if (_isSearching) ...[
            const SizedBox(height: 8),
            Text(
              'Boshqa kalit so\'z bilan qidirib ko\'ring',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildShopCard(ShopModel shop) {
    return GestureDetector(
      onTap: () => _navigateToShop(shop),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Banner
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: shop.bannerUrl != null
                      ? CachedNetworkImage(
                          imageUrl: shop.bannerUrl!,
                          height: 100,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            height: 100,
                            color: AppColors.primary.withValues(alpha: 0.2),
                          ),
                          errorWidget: (_, __, ___) => Container(
                            height: 100,
                            color: AppColors.primary.withValues(alpha: 0.2),
                          ),
                        )
                      : Container(
                          height: 100,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary.withValues(alpha: 0.8),
                                AppColors.primary.withValues(alpha: 0.4),
                              ],
                            ),
                          ),
                        ),
                ),
                // Verified badge
                if (shop.isVerified)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.lightBlueAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.verified,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Tasdiqlangan',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Logo
                  Container(
                    width: 56,
                    height: 56,
                    margin: const EdgeInsets.only(top: 0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.dividerLight,
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: shop.logoUrl != null
                          ? CachedNetworkImage(
                              imageUrl: shop.logoUrl!,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(
                                color: Colors.white,
                                child: const Icon(
                                  Iconsax.shop,
                                  color: AppColors.primary,
                                ),
                              ),
                              errorWidget: (_, __, ___) => Container(
                                color: Colors.white,
                                child: const Icon(
                                  Iconsax.shop,
                                  color: AppColors.primary,
                                ),
                              ),
                            )
                          : Container(
                              color: Colors.white,
                              child: Center(
                                child: Text(
                                  shop.name.substring(0, 1).toUpperCase(),
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(
                                        color: AppColors.primary,
                                      ),
                                ),
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          shop.name,
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (shop.city != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            shop.city!,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey,
                                    ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        // Stats
                        Row(
                          children: [
                            _buildMiniStat(
                              Iconsax.star_1,
                              shop.formattedRating,
                              Colors.amber,
                            ),
                            const SizedBox(width: 16),
                            _buildMiniStat(
                              Iconsax.people,
                              shop.formattedFollowers,
                              Colors.grey,
                            ),
                            const SizedBox(width: 16),
                            _buildMiniStat(
                              Iconsax.shopping_bag,
                              '${shop.totalOrders}',
                              Colors.grey,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Arrow
                  Icon(
                    Iconsax.arrow_right_3,
                    color: Colors.grey,
                    size: 20,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(IconData icon, String value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Builder(
          builder: (context) {
            return Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            );
          },
        ),
      ],
    );
  }
}
