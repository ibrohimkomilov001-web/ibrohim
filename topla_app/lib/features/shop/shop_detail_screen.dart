import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/constants.dart';
import '../../core/utils/haptic_utils.dart';
import '../../providers/auth_provider.dart';
import '../../providers/shop_provider.dart';
import '../../models/shop_model.dart';
import '../../widgets/premium_product_card.dart';
import '../product/product_detail_screen.dart';
import 'shop_reviews_screen.dart';
import 'shop_chat_screen.dart';

/// Do'kon batafsil sahifasi
class ShopDetailScreen extends StatefulWidget {
  final String shopId;
  final String? shopName;

  const ShopDetailScreen({
    super.key,
    required this.shopId,
    this.shopName,
  });

  @override
  State<ShopDetailScreen> createState() => _ShopDetailScreenState();
}

class _ShopDetailScreenState extends State<ShopDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isFollowing = false;
  bool _isLoadingFollow = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadShopData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadShopData() async {
    final shopProvider = context.read<ShopProvider>();
    await shopProvider.loadShop(widget.shopId);

    // Mahsulotlarni API dan yuklash
    if (mounted) {
      shopProvider.loadShopProducts(widget.shopId);
    }

    // Check follow status
    if (!mounted) return;
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isLoggedIn && authProvider.currentUserId != null) {
      final isFollowing = await shopProvider.checkIsFollowing(widget.shopId);
      if (mounted) {
        setState(() => _isFollowing = isFollowing);
      }
    }
  }

  Future<void> _toggleFollow() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      _showLoginRequired();
      return;
    }

    setState(() => _isLoadingFollow = true);
    await HapticUtils.selectionClick();

    if (!mounted) return;
    final shopProvider = context.read<ShopProvider>();
    bool success;

    if (_isFollowing) {
      success = await shopProvider.unfollowShop(widget.shopId);
    } else {
      success = await shopProvider.followShop(widget.shopId);
    }

    if (mounted) {
      setState(() {
        if (success) _isFollowing = !_isFollowing;
        _isLoadingFollow = false;
      });
    }
  }

  void _showLoginRequired() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Bu funksiya uchun tizimga kiring'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _startChat() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      _showLoginRequired();
      return;
    }

    final shopProvider = context.read<ShopProvider>();
    final conversationId =
        await shopProvider.getOrCreateConversation(widget.shopId);

    if (conversationId != null && mounted) {
      final shop = shopProvider.currentShop;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ShopChatScreen(
            conversationId: conversationId,
            shopName: shop?.name ?? 'Do\'kon',
            shopLogoUrl: shop?.logoUrl,
          ),
        ),
      );
    }
  }

  void _shareShop() {
    final shop = context.read<ShopProvider>().currentShop;
    if (shop != null) {
      Share.share(
        '${shop.name} do\'koniga qarang!\n\nhttps://topla.app/shop/${shop.slug ?? shop.id}',
        subject: shop.name,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<ShopProvider>(
        builder: (context, shopProvider, _) {
          if (shopProvider.isLoading && shopProvider.currentShop == null) {
            return _buildLoadingState();
          }

          final shop = shopProvider.currentShop;
          if (shop == null) {
            return _buildErrorState();
          }

          return _buildContent(shop);
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Iconsax.shop_remove_copy,
            size: 64,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            'Do\'kon topilmadi',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey,
                ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Orqaga'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(ShopModel shop) {
    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) {
        return [
          _buildSliverAppBar(shop),
          _buildShopInfoSliver(shop),
          _buildTabBarSliver(),
        ];
      },
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildProductsTab(shop),
          _buildAboutTab(shop),
          _buildReviewsTab(shop),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar(ShopModel shop) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.3),
            shape: BoxShape.circle,
          ),
          child:
              const Icon(Iconsax.arrow_left_2, color: Colors.white, size: 20),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: const Icon(Iconsax.share, color: Colors.white, size: 20),
          ),
          onPressed: _shareShop,
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Banner
            if (shop.bannerUrl != null)
              CachedNetworkImage(
                imageUrl: shop.bannerUrl!,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  color: AppColors.primary.withValues(alpha: 0.2),
                ),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  child:
                      const Icon(Iconsax.shop, size: 48, color: Colors.white54),
                ),
              )
            else
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withValues(alpha: 0.7),
                    ],
                  ),
                ),
              ),
            // Gradient overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.7),
                  ],
                ),
              ),
            ),
            // Shop logo and name at bottom
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Row(
                children: [
                  // Logo
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(13),
                      child: shop.logoUrl != null
                          ? CachedNetworkImage(
                              imageUrl: shop.logoUrl!,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(
                                color: Colors.white,
                                child: const Icon(Iconsax.shop,
                                    color: AppColors.primary),
                              ),
                              errorWidget: (_, __, ___) => Container(
                                color: Colors.white,
                                child: const Icon(Iconsax.shop,
                                    color: AppColors.primary),
                              ),
                            )
                          : Container(
                              color: Colors.white,
                              child: Center(
                                child: Text(
                                  shop.name.substring(0, 1).toUpperCase(),
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineMedium
                                      ?.copyWith(
                                        color: AppColors.primary,
                                      ),
                                ),
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Name and verification
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                shop.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (shop.isVerified) ...[
                              const SizedBox(width: 6),
                              const Icon(
                                Icons.verified,
                                color: Colors.lightBlueAccent,
                                size: 20,
                              ),
                            ],
                          ],
                        ),
                        if (shop.city != null)
                          Text(
                            shop.city!,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.white70,
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
      ),
    );
  }

  Widget _buildShopInfoSliver(ShopModel shop) {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          border: Border(
            bottom: BorderSide(
                color: AppColors.dividerLight.withValues(alpha: 0.5)),
          ),
        ),
        child: Column(
          children: [
            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatItem(
                  icon: Iconsax.star_1,
                  value: shop.formattedRating,
                  label: '${shop.reviewCount} sharh',
                  iconColor: Colors.amber,
                ),
                _buildDivider(),
                _buildStatItem(
                  icon: Iconsax.people,
                  value: shop.formattedFollowers,
                  label: 'Obunachilar',
                ),
                _buildDivider(),
                _buildStatItem(
                  icon: Iconsax.shopping_bag,
                  value: '${shop.totalOrders}',
                  label: 'Buyurtmalar',
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isLoadingFollow ? null : _toggleFollow,
                    icon: _isLoadingFollow
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(
                            _isFollowing
                                ? Iconsax.tick_circle
                                : Iconsax.add_circle,
                            size: 20,
                          ),
                    label: Text(_isFollowing ? 'Obuna' : 'Obuna bo\'lish'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isFollowing
                          ? AppColors.surfaceLight
                          : AppColors.primary,
                      foregroundColor: _isFollowing
                          ? AppColors.textPrimaryLight
                          : Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: _isFollowing
                            ? BorderSide(color: AppColors.dividerLight)
                            : BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _startChat,
                  icon: const Icon(Iconsax.message, size: 20),
                  label: const Text('Xabar'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 20),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
    Color? iconColor,
  }) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: iconColor ?? Colors.grey),
            const SizedBox(width: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 32,
      width: 1,
      color: AppColors.dividerLight,
    );
  }

  Widget _buildTabBarSliver() {
    return SliverPersistentHeader(
      pinned: true,
      delegate: _SliverTabBarDelegate(
        TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Mahsulotlar'),
            Tab(text: 'Haqida'),
            Tab(text: 'Sharhlar'),
          ],
        ),
        color: Theme.of(context).scaffoldBackgroundColor,
      ),
    );
  }

  Widget _buildProductsTab(ShopModel shop) {
    return Consumer<ShopProvider>(
      builder: (context, shopProvider, _) {
        final shopProducts = shopProvider.shopProducts;

        if (shopProvider.isLoading && shopProducts.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (shopProducts.isEmpty) {
          // Fallback: try loading from API
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (shopProvider.shopProducts.isEmpty && !shopProvider.isLoading) {
              shopProvider.loadShopProducts(shop.id);
            }
          });

          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Iconsax.box,
                  size: 64,
                  color: Colors.grey.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 16),
                Text(
                  'Mahsulotlar hali mavjud emas',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                ),
              ],
            ),
          );
        }

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.65,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: shopProducts.length,
          itemBuilder: (context, index) {
            final product = shopProducts[index];
            return PremiumProductCard(
              name: product.name,
              price: product.price.toInt(),
              rating: product.rating,
              sold: product.soldCount,
              imageUrl: product.images.isNotEmpty ? product.images.first : '',
              onTap: () => _navigateToProduct(product.toJson()),
            );
          },
        );
      },
    );
  }

  void _navigateToProduct(Map<String, dynamic> product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProductDetailScreen(product: product),
      ),
    );
  }

  Widget _buildAboutTab(ShopModel shop) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Description
          if (shop.description != null && shop.description!.isNotEmpty) ...[
            Text(
              'Tavsif',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              shop.description!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                    height: 1.5,
                  ),
            ),
            const SizedBox(height: 24),
          ],

          // Contact info
          Text(
            'Aloqa',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),

          if (shop.address != null)
            _buildContactItem(
              icon: Iconsax.location,
              title: 'Manzil',
              value: shop.address!,
            ),

          if (shop.phone != null)
            _buildContactItem(
              icon: Iconsax.call,
              title: 'Telefon',
              value: shop.phone!,
              onTap: () {
                // TODO: Launch phone dialer
              },
            ),

          if (shop.email != null)
            _buildContactItem(
              icon: Iconsax.sms,
              title: 'Email',
              value: shop.email!,
              onTap: () {
                // TODO: Launch email
              },
            ),

          const SizedBox(height: 24),

          // Statistics
          Text(
            'Statistika',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _buildStatRow(
                  'Jami sotuvlar',
                  shop.formattedTotalSales,
                  Iconsax.money_recive,
                ),
                const Divider(height: 24),
                _buildStatRow(
                  'Jami buyurtmalar',
                  '${shop.totalOrders}',
                  Iconsax.shopping_cart,
                ),
                const Divider(height: 24),
                _buildStatRow(
                  'A\'zo bo\'lgan sana',
                  _formatDate(shop.createdAt),
                  Iconsax.calendar,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactItem({
    required IconData icon,
    required String title,
    required String value,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            if (onTap != null)
              Icon(
                Iconsax.arrow_right_3,
                color: Colors.grey,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon) {
    return Builder(
      builder: (context) {
        return Row(
          children: [
            Icon(icon, color: Colors.grey, size: 20),
            const SizedBox(width: 12),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
            ),
            const Spacer(),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'Yan',
      'Fev',
      'Mar',
      'Apr',
      'May',
      'Iyn',
      'Iyl',
      'Avg',
      'Sen',
      'Okt',
      'Noy',
      'Dek'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Widget _buildReviewsTab(ShopModel shop) {
    return ShopReviewsScreen(
      shopId: shop.id,
      embedded: true,
    );
  }
}

/// TabBar uchun SliverPersistentHeaderDelegate
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color color;

  _SliverTabBarDelegate(this.tabBar, {required this.color});

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: color,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return tabBar != oldDelegate.tabBar || color != oldDelegate.color;
  }
}
