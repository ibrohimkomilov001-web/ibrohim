import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/products_provider.dart';
import '../../widgets/premium_product_card.dart';
import '../../widgets/premium_category_item.dart';
import '../../widgets/premium_banner_carousel.dart';
import '../../widgets/premium_search_bar.dart';
import '../product/product_detail_screen.dart';
import '../search/search_screen.dart';
import '../catalog/catalog_screen.dart';

class HomeScreenNew extends StatefulWidget {
  const HomeScreenNew({super.key});

  @override
  State<HomeScreenNew> createState() => _HomeScreenNewState();
}

class _HomeScreenNewState extends State<HomeScreenNew>
    with TickerProviderStateMixin {
  late ScrollController _scrollController;
  bool _isScrolled = false;

  // Demo data
  final List<BannerItem> _banners = [
    BannerItem(
      title: 'MEGA CHEGIRMA',
      subtitle: '50% gacha chegirma!',
      primaryColor: const Color(0xFFFF4444),
      secondaryColor: const Color(0xFFFF6B35),
      badge: '🔥 CHEKLANGAN',
      ctaText: 'Xarid qilish',
      backgroundIcon: Iconsax.flash_1,
    ),
    BannerItem(
      title: 'YANGI KELDI',
      subtitle: 'Elektronika mahsulotlari',
      primaryColor: const Color(0xFF6C5CE7),
      secondaryColor: const Color(0xFFA29BFE),
      badge: '✨ YANGI',
      ctaText: 'Ko\'rish',
      backgroundIcon: Iconsax.cpu,
    ),
    BannerItem(
      title: 'BEPUL YETKAZISH',
      subtitle: '100,000 so\'mdan yuqori xaridlarga',
      primaryColor: const Color(0xFF00B894),
      secondaryColor: const Color(0xFF55EFC4),
      badge: '🚚 AKSIYA',
      ctaText: 'Batafsil',
      backgroundIcon: Iconsax.truck_fast,
    ),
  ];

  final List<Map<String, dynamic>> _categories = [
    {
      'icon': Iconsax.milk,
      'name': 'Oziq-ovqat',
      'color': const Color(0xFFFF6B6B)
    },
    {
      'icon': Iconsax.coffee,
      'name': 'Ichimliklar',
      'color': const Color(0xFF4ECDC4)
    },
    {
      'icon': Iconsax.brush_1,
      'name': 'Uy-ro\'zg\'or',
      'color': const Color(0xFFFFE66D)
    },
    {'icon': Iconsax.cpu, 'name': 'Texnika', 'color': const Color(0xFF95E1D3)},
    {
      'icon': Iconsax.lovely,
      'name': 'Go\'zallik',
      'color': const Color(0xFFF38181)
    },
    {
      'icon': Iconsax.health,
      'name': 'Salomatlik',
      'color': const Color(0xFFAA96DA)
    },
    {'icon': Iconsax.gift, 'name': 'Bolalar', 'color': const Color(0xFFFFB6B9)},
    {
      'icon': Iconsax.menu_board,
      'name': 'Barchasi',
      'color': const Color(0xFF6C5CE7)
    },
  ];

  // Popular uchun bo'sh holatni ko'rsatish
  // Demo ma'lumotlar olib tashlandi — faqat real API ma'lumotlari ko'rsatiladi

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);

    // Ma'lumotlarni yuklash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final productsProvider = context.read<ProductsProvider>();
      productsProvider.loadAll();
    });
  }

  void _onScroll() {
    if (_scrollController.offset > 100 && !_isScrolled) {
      setState(() => _isScrolled = true);
    } else if (_scrollController.offset <= 100 && _isScrolled) {
      setState(() => _isScrolled = false);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  // Provider mahsulotlarni savatga qo'shish
  void _addProductToCart(BuildContext context, ProductModel product) {
    // CartProvider ga qo'shish
    final cartProvider = context.read<CartProvider>();
    cartProvider.addToCart(product.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Iconsax.tick_circle, color: Colors.white),
            const SizedBox(width: 12),
            Text('${product.name} ${context.l10n.addedToCart}'),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // Premium App Header
            SliverToBoxAdapter(
              child: PremiumAppHeader(
                onSearchTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SearchScreen()),
                  );
                },
                onNotificationTap: () {
                  // TODO: Open notifications screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Bildirishnomalar tez orada!'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                onCartTap: () {
                  // Cart is in bottom navigation
                },
                notificationCount: 0,
                cartCount: context.watch<CartProvider>().totalQuantity,
              ),
            ),

            // Banner Carousel
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: PremiumBannerCarousel(
                  banners: _banners,
                  height: 190,
                  onBannerTap: (index) {
                    // Handle banner tap
                  },
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Quick Actions
            SliverToBoxAdapter(
              child: _buildQuickActions(),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Categories Section
            SliverToBoxAdapter(
              child: _buildSectionHeader(
                title: context.l10n.categories,
                subtitle: context.l10n.seeAll,
                onSeeAll: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CatalogScreen()),
                  );
                },
              ),
            ),

            SliverToBoxAdapter(
              child: _buildCategoriesGrid(),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Popular Products Section
            SliverToBoxAdapter(
              child: _buildSectionHeader(
                title: context.l10n.popular,
                subtitle: context.l10n.mostPopular,
                onSeeAll: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CatalogScreen()),
                  );
                },
              ),
            ),

            // Popular Products Grid from Provider
            Consumer<ProductsProvider>(
              builder: (context, productsProvider, child) {
                final popularProducts = productsProvider.featuredProducts;

                if (productsProvider.isLoading && popularProducts.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: SizedBox(
                      height: 200,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  );
                }

                // Agar provider bo'sh bo'lsa, bo'sh holat
                if (popularProducts.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: SizedBox(
                      height: 200,
                      child: Center(
                        child: Text(
                          'Hozircha mahsulotlar yo\'q',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 14,
                      childAspectRatio: 0.52,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final product = popularProducts[index];
                        return PremiumProductCard(
                          name: product.name,
                          price: product.price.toInt(),
                          oldPrice: product.originalPrice?.toInt(),
                          discount: product.discountPercent,
                          rating: product.rating,
                          sold: product.soldCount,
                          imageUrl: product.imageUrl ?? '',
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ProductDetailScreen(
                                  product: product.toMap(),
                                ),
                              ),
                            );
                          },
                          onAddToCart: () =>
                              _addProductToCart(context, product),
                        );
                      },
                      childCount: popularProducts.length,
                    ),
                  ),
                );
              },
            ),

            // Bottom padding
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    String? subtitle,
    VoidCallback? onSeeAll,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade500,
                  ),
                ),
            ],
          ),
          const Spacer(),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: Row(
                children: [
                  Text(
                    context.l10n.seeAll,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Iconsax.arrow_right_3,
                    size: 16,
                    color: AppColors.primary,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {
        'icon': Iconsax.discount_shape,
        'label': context.l10n.translate('discounts'),
        'color': const Color(0xFFFF4444),
        'badge': 'HOT'
      },
      {
        'icon': Iconsax.ticket_discount,
        'label': context.l10n.translate('coupons'),
        'color': const Color(0xFFFF6B35),
        'badge': '3'
      },
      {
        'icon': Iconsax.coin,
        'label': 'Cashback',
        'color': const Color(0xFF9C27B0),
        'badge': null
      },
      {
        'icon': Iconsax.crown_1,
        'label': 'VIP',
        'color': const Color(0xFFFFD93D),
        'badge': null
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: actions.map((action) {
          return _buildQuickActionItem(
            icon: action['icon'] as IconData,
            label: action['label'] as String,
            color: action['color'] as Color,
            badge: action['badge'] as String?,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildQuickActionItem({
    required IconData icon,
    required String label,
    required Color color,
    String? badge,
  }) {
    return GestureDetector(
      onTap: () {
        // Navigate based on label
        if (label == context.l10n.translate('coupons')) {
          // Kuponlar - tez orada
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Iconsax.ticket_discount, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  const Text('Kuponlar tez orada!'),
                ],
              ),
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFFFF6B35),
            ),
          );
        } else if (label == 'Cashback') {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Iconsax.coin, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  const Text('Cashback dasturi tez orada!'),
                ],
              ),
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF9C27B0),
            ),
          );
        } else if (label == 'VIP') {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Iconsax.crown_1, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  const Text('VIP dasturi tez orada!'),
                ],
              ),
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFFFFD93D),
            ),
          );
        }
      },
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      color.withValues(alpha: 0.15),
                      color.withValues(alpha: 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: color.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 28,
                ),
              ),
              if (badge != null)
                Positioned(
                  right: -6,
                  top: -6,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [color, color.withValues(alpha: 0.8)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: color.withValues(alpha: 0.4),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      badge,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriesGrid() {
    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          return PremiumCategoryItem(
            icon: category['icon'] as IconData,
            name: category['name'] as String,
            color: category['color'] as Color,
            onTap: () {
              // Navigate to catalog with selected category
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => CatalogScreen(
                    initialCategoryId: '${index + 1}',
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
