import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/utils/haptic_utils.dart';
import '../../widgets/product_card.dart';
import '../../widgets/category_item.dart';
import '../../widgets/skeleton_widgets.dart';
import '../../widgets/empty_states.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../search/search_screen.dart';
import '../product/product_detail_screen.dart';
import '../catalog/catalog_screen.dart';
import '../lucky_wheel/lucky_wheel_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with AutomaticKeepAliveClientMixin {
  String _selectedFilter = 'for_you';

  // Filter ID lari - backend bilan ishlash uchun
  final Map<String, String?> _filterCategoryMap = {
    'for_you': null, // Barcha mahsulotlar
    'wow_price': 'wow_price',
    'discounts': 'discounts',
    'cat_electronics': 'elektronika',
    'clothing': 'kiyim',
  };

  List<String> get _filterOptions => _filterCategoryMap.keys.toList();

  @override
  void initState() {
    super.initState();
    // Ma'lumotlarni yuklash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductsProvider>().loadAll();
    });
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final statusBarHeight = MediaQuery.of(context).padding.top;

    return Scaffold(
      body: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              notification.metrics.extentAfter < 300) {
            // Scroll pastga tushganda keyingi sahifani yuklash
            final provider = context.read<ProductsProvider>();
            if (_selectedFilter == 'for_you' &&
                !provider.isFeaturedLoadingMore &&
                provider.featuredHasMore) {
              provider.loadMoreFeaturedProducts();
            }
          }
          return false;
        },
        child: Builder(
          builder: (context) {
            return CustomScrollView(
              slivers: [
                // Status bar uchun padding
                SliverToBoxAdapter(
                  child: SizedBox(height: statusBarHeight),
                ),

                // App Bar with Search
                SliverToBoxAdapter(
                  child: _buildSearchHeader(),
                ),

                // Banner Carousel
                SliverToBoxAdapter(
                  child: Consumer<ProductsProvider>(
                    builder: (context, productsProvider, _) {
                      return _buildBannerCarousel(productsProvider);
                    },
                  ),
                ),

                // Filter chips - Consumer tashqarisida, faqat setState bilan boshqariladi
                SliverToBoxAdapter(
                  child: _buildFilterChips(),
                ),

                // Featured products grid - faqat shu qism provider bilan yangilanadi
                Consumer<ProductsProvider>(
                  builder: (context, productsProvider, _) {
                    return _buildFeaturedProductsGrid(productsProvider);
                  },
                ),

                // Loading more indicator
                Consumer<ProductsProvider>(
                  builder: (context, productsProvider, _) {
                    if (productsProvider.isFeaturedLoadingMore) {
                      return const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(AppSizes.lg),
                          child: Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                        ),
                      );
                    }
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  },
                ),

                // Bottom padding
                const SliverToBoxAdapter(
                  child: SizedBox(height: AppSizes.xxl),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildSearchHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg, vertical: 8),
      child: Row(
        children: [
          // Search Field
          Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const SearchScreen(),
                  ),
                );
              },
              child: Container(
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFECECEC),
                  borderRadius: BorderRadius.circular(100),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: [
                    Icon(
                      Icons.search,
                      color: Colors.grey.shade400,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      context.l10n.translate('search_products_hint'),
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: AppSizes.md),

          // Lucky Wheel Button
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const LuckyWheelScreen(),
                ),
              );
            },
            child: const Icon(
              Icons.emoji_events_rounded,
              color: Color(0xFFFFD700),
              size: 30,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBannerCarousel(ProductsProvider productsProvider) {
    final banners = productsProvider.banners;

    // Agar bannerlar bo'sh bo'lsa - chiroyli shimmer skeleton
    if (banners.isEmpty) {
      return const BannerSkeleton();
    }

    return CarouselSlider.builder(
      itemCount: banners.length,
      options: CarouselOptions(
        height: AppSizes.bannerHeight,
        viewportFraction: 1.0,
        enlargeCenterPage: false,
        autoPlay: true,
        autoPlayInterval: const Duration(seconds: 7),
        autoPlayAnimationDuration: const Duration(milliseconds: 800),
        autoPlayCurve: Curves.fastOutSlowIn,
      ),
      itemBuilder: (context, index, realIndex) {
        final banner = banners[index];
        return GestureDetector(
          onTap: () async {
            try {
              if (banner.actionType == 'link' && banner.actionValue != null) {
                final Uri url = Uri.parse(banner.actionValue!);
                await launchUrl(url, mode: LaunchMode.externalApplication);
              } else if (banner.actionType == 'product' &&
                  banner.actionValue != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ProductDetailScreen(
                      product: {'id': banner.actionValue},
                    ),
                  ),
                );
              } else if (banner.actionType == 'category' &&
                  banner.actionValue != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CatalogScreen(
                      initialCategoryId: banner.actionValue,
                    ),
                  ),
                );
              } else {
                final Uri url = Uri.parse('https://t.me/topla_market');
                await launchUrl(url, mode: LaunchMode.externalApplication);
              }
            } catch (e) {
              debugPrint('Banner tap error: $e');
            }
          },
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Banner rasmi yoki placeholder
                  banner.imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: banner.imageUrl,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) {
                            return _buildBannerPlaceholder(banner);
                          },
                          placeholder: (_, __) {
                            return _buildBannerPlaceholder(banner);
                          },
                        )
                      : _buildBannerPlaceholder(banner),
                  // Overlay text
                  _buildBannerOverlay(banner),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBannerPlaceholder(BannerModel banner) {
    final title = banner.getTitle('uz');
    final colors = [
      [AppColors.primary, AppColors.primaryLight],
      [const Color(0xFF1976D2), const Color(0xFF42A5F5)],
      [const Color(0xFF388E3C), const Color(0xFF66BB6A)],
    ];
    final colorPair = colors[banner.sortOrder % colors.length];

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colorPair,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.local_offer, color: Colors.white, size: 32),
            if (title != null) ...[
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBannerOverlay(BannerModel banner) {
    final title = banner.getTitle('uz');
    final subtitle = banner.getSubtitle('uz');

    if (title == null && subtitle == null) return const SizedBox();

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.black.withValues(alpha: 0.45),
            Colors.transparent,
          ],
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          stops: const [0.0, 0.6],
        ),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.lg,
        vertical: AppSizes.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          if (title != null)
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  // ignore: unused_element
  Widget _buildCategoriesGrid(ProductsProvider productsProvider) {
    final categories = productsProvider.categories;

    if (categories.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(AppSizes.xl),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: AppSizes.md,
          crossAxisSpacing: AppSizes.md,
          childAspectRatio: 0.85,
        ),
        itemCount: categories.length > 8 ? 8 : categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return CategoryItem(
            icon: _getCategoryIcon(category.icon),
            name: category.getName('uz'),
            color: _getCategoryColor(index, category.icon),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CatalogScreen(
                    initialCategoryId: category.id,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  IconData _getCategoryIcon(String? iconName) {
    // Yangilangan 35+ kategoriya ikonlari
    switch (iconName) {
      // Elektronika
      case 'mobile':
        return Iconsax.mobile;
      case 'tablet':
      case 'cpu':
        return Iconsax.cpu;
      case 'laptop':
      case 'monitor_mobbile':
        return Iconsax.monitor_mobbile;
      case 'monitor':
        return Iconsax.monitor;
      case 'screenmirroring':
      case 'tv':
        return Iconsax.screenmirroring;
      case 'headphone':
        return Iconsax.headphone;
      case 'watch':
        return Iconsax.watch;

      // Erkaklar
      case 'man':
        return Iconsax.man;
      case 'ruler':
        return Iconsax.ruler;
      case 'clock':
        return Iconsax.clock;

      // Ayollar
      case 'woman':
        return Iconsax.woman;
      case 'diamonds':
        return Iconsax.diamonds;
      case 'bag_2':
        return Iconsax.bag_2;
      case 'crown_1':
        return Iconsax.crown_1;

      // Bolalar
      case 'happyemoji':
        return Iconsax.happyemoji;
      case 'game':
        return Iconsax.game;

      // Uy-ro'zg'or
      case 'blend':
      case 'blend_2':
        return Iconsax.blend_2;
      case 'lamp_charge':
        return Iconsax.lamp_charge;
      case 'coffee':
        return Iconsax.coffee;
      case 'home_2':
        return Iconsax.home_2;

      // Go'zallik
      case 'drop':
        return Iconsax.drop;
      case 'magic_star':
        return Iconsax.magic_star;
      case 'brush':
      case 'brush_1':
        return Iconsax.brush_1;

      // Salomatlik
      case 'health':
        return Iconsax.health;
      case 'hospital':
        return Iconsax.hospital;

      // Sport
      case 'weight_1':
        return Iconsax.weight_1;
      case 'activity':
        return Iconsax.activity;

      // Oziq-ovqat
      case 'cake':
        return Iconsax.cake;
      case 'cup':
        return Iconsax.cup;
      case 'milk':
        return Iconsax.milk;

      // Kiyim
      case 'shirt':
        return Iconsax.shopping_bag;

      // Kitob
      case 'book':
        return Iconsax.book;

      // Xobbi
      case 'colorfilter':
        return Iconsax.colorfilter;

      // Maktab
      case 'pen_tool':
        return Iconsax.pen_tool;

      // Uy kimyo - quti
      case 'box_1':
        return Iconsax.box_1;

      // O'yin konsol
      case 'driver':
        return Iconsax.driver;

      // Boshqalar
      case 'car':
        return Iconsax.car;
      case 'pet':
        return Iconsax.pet;
      case 'book_1':
        return Iconsax.book_1;
      case 'gift':
        return Iconsax.gift;
      case 'tag':
        return Iconsax.tag;
      case 'lovely':
        return Iconsax.lovely;

      // ========== ESKI DATABASE IKONLARI (Material Icons -> Iconsax) ==========
      case 'devices': // Elektronika
        return Iconsax.mobile;
      case 'checkroom': // Kiyim
        return Iconsax.man;
      case 'home': // Uy-rozgor
        return Iconsax.home_2;
      case 'spa': // Gozallik
        return Iconsax.magic_star;
      case 'child_care': // Bolalar
        return Iconsax.happyemoji;
      case 'fitness_center': // Sport
        return Iconsax.weight_1;
      case 'restaurant': // Oziq-ovqat
        return Iconsax.cake;
      case 'directions_car': // Avto
        return Iconsax.car;

      default:
        return Iconsax.category;
    }
  }

  /// Kategoriya ranglari - icon nomiga qarab
  Color _getCategoryColor(int index, [String? iconName]) {
    // Icon nomiga qarab rang berish (database icon qiymatiga mos)
    switch (iconName) {
      // Eski database ikonlari
      case 'devices': // Elektronika
        return const Color(0xFF3B82F6); // blue
      case 'checkroom': // Kiyim
        return const Color(0xFF475569); // slate
      case 'home': // Uy-rozgor
        return const Color(0xFF14B8A6); // teal
      case 'spa': // Gozallik
        return const Color(0xFFEC4899); // pink
      case 'child_care': // Bolalar
        return const Color(0xFFF59E0B); // amber
      case 'fitness_center': // Sport
        return const Color(0xFF0284C7); // sky
      case 'restaurant': // Oziq-ovqat
        return const Color(0xFF16A34A); // green
      case 'directions_car': // Avto
        return const Color(0xFF64748B); // slate-500

      // Yangi kategoriya ikonlari
      case 'mobile':
        return const Color(0xFF3B82F6);
      case 'cpu':
        return const Color(0xFF6366F1);
      case 'monitor_mobbile':
        return const Color(0xFF8B5CF6);
      case 'monitor':
        return const Color(0xFFA855F7);
      case 'man':
        return const Color(0xFF475569);
      case 'woman':
        return const Color(0xFFEC4899);
      case 'happyemoji':
        return const Color(0xFFF59E0B);
      case 'blend_2':
        return const Color(0xFF14B8A6);
      case 'magic_star':
        return const Color(0xFFDB2777);
      case 'weight_1':
        return const Color(0xFF0284C7);
      case 'cake':
        return const Color(0xFF16A34A);
      case 'shirt':
        return const Color(0xFF475569);
      case 'bag_2':
        return const Color(0xFF7C3AED);
      case 'diamonds':
        return const Color(0xFFD946EF);
      case 'drop':
        return const Color(0xFF06B6D4);
      case 'brush_1':
        return const Color(0xFFF472B6);
      case 'home_2':
        return const Color(0xFF14B8A6);
      case 'lamp_charge':
        return const Color(0xFF059669);
      case 'ruler':
        return const Color(0xFF92400E);
      case 'box_1':
        return const Color(0xFF6366F1);
      case 'game':
        return const Color(0xFFEF4444);
      case 'pen_tool':
        return const Color(0xFF4B5563);
      case 'milk':
        return const Color(0xFF16A34A);
      case 'cup':
        return const Color(0xFF7C2D12);
      case 'driver':
        return const Color(0xFFDC2626);
      case 'book':
        return const Color(0xFF1D4ED8);
      case 'colorfilter':
        return const Color(0xFFE11D48);
      case 'pet':
        return const Color(0xFFF59E0B);
      case 'lovely':
        return const Color(0xFFEC4899);
      case 'gift':
        return const Color(0xFFD946EF);
      case 'car':
        return const Color(0xFF64748B);

      default:
        // Index bo'yicha fallback ranglar
        final colors = [
          const Color(0xFF3B82F6),
          const Color(0xFF8B5CF6),
          const Color(0xFFEC4899),
          const Color(0xFFF59E0B),
          const Color(0xFF14B8A6),
          const Color(0xFF0284C7),
          const Color(0xFF16A34A),
          const Color(0xFF64748B),
        ];
        return colors[index % colors.length];
    }
  }

  Widget _buildFilterChips() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8), // Sal oshirdim
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        clipBehavior: Clip.none,
        child: Container(
          padding: const EdgeInsets.all(2), // 3 dan 2 ga qisqartirdik
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius:
                BorderRadius.circular(16), // 18 dan 16 ga qisqartirdik
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            children: _filterOptions.map((filter) {
              final isSelected = _selectedFilter == filter;
              return GestureDetector(
                onTap: () {
                  HapticUtils.lightImpact();
                  setState(() {
                    _selectedFilter = filter;
                  });
                  // Filtrlangan mahsulotlarni yuklash
                  _loadFilteredProducts(filter);
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 1),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFFF3F4F6)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    context.l10n.translate(filter),
                    style: TextStyle(
                      fontSize: 14, // 11.5 dan 14 ga qaytardik (standart)
                      fontWeight:
                          isSelected ? FontWeight.w500 : FontWeight.w400,
                      color: isSelected ? Colors.black : Colors.black87,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  void _loadFilteredProducts(String filter) {
    final provider = context.read<ProductsProvider>();
    final categorySlug = _filterCategoryMap[filter];

    if (categorySlug == null) {
      // "Siz uchun" - barcha mahsulotlar
      provider.loadAll();
    } else if (categorySlug == 'wow_price') {
      // WOW narx - eng arzon mahsulotlar
      provider.loadProductsByPriceRange(maxPrice: 100000);
    } else if (categorySlug == 'discounts') {
      // Chegirmalar - faqat chegirmali
      provider.loadDiscountedProducts();
    } else {
      // Kategoriya bo'yicha
      provider.loadProductsByCategorySlug(categorySlug);
    }
  }

  Widget _buildFeaturedProductsGrid(ProductsProvider productsProvider) {
    // Agar filter tanlangan bo'lsa filteredProducts ni, aks holda featuredProducts ni ko'rsatish
    final bool isFilterActive = _selectedFilter != 'for_you';
    final products = isFilterActive
        ? productsProvider.filteredProducts
        : productsProvider.featuredProducts;
    final isLoading = isFilterActive
        ? productsProvider.isFilteredLoading
        : productsProvider.isFeaturedLoading;

    if (isLoading) {
      // Shimmer skeleton grid loading
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: AppSizes.sm,
            crossAxisSpacing: AppSizes.sm,
            childAspectRatio: 0.62,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) => const ProductCardSkeleton(),
            childCount: 4,
          ),
        ),
      );
    }

    if (products.isEmpty) {
      return const SliverToBoxAdapter(
        child: ProductsLoadingWidget(),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: AppSizes.sm,
          crossAxisSpacing: AppSizes.sm,
          childAspectRatio: 0.62,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final product = products[index];
            return ProductCard(
              name: product.nameUz,
              price: product.price.toInt(),
              oldPrice: product.oldPrice?.toInt(),
              discount: product.discountPercent,
              rating: product.rating,
              sold: product.soldCount,
              imageUrl: product.firstImage,
              isFavorite: productsProvider.isFavorite(product.id),
              onTap: () => _openProductDetail(product),
              onAddToCart: () => _addToCart(product),
              onFavoriteToggle: () => _toggleFavorite(product.id),
            );
          },
          childCount: products.length,
        ),
      ),
    );
  }

  void _addToCart(ProductModel product) async {
    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;
    if (!isLoggedIn) {
      HapticUtils.error();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.translate('login_to_add_cart'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13),
          ),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: const StadiumBorder(),
          margin: const EdgeInsets.only(bottom: 24, left: 32, right: 32),
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.pushNamed(context, '/auth');
      return;
    }
    HapticUtils.addToCart();
    try {
      await context.read<CartProvider>().addToCart(product.id, quantity: 1);
      if (mounted) HapticUtils.success();
    } catch (e) {
      if (mounted) {
        HapticUtils.error();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('error_occurred')),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  void _toggleFavorite(String productId) async {
    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;
    if (!isLoggedIn) {
      HapticUtils.error();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.translate('login_to_add_favorites'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13),
          ),
          backgroundColor: AppColors.primary,
          behavior: SnackBarBehavior.floating,
          shape: const StadiumBorder(),
          margin: const EdgeInsets.only(bottom: 24, left: 32, right: 32),
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.pushNamed(context, '/auth');
      return;
    }
    // Haptic feedback
    HapticUtils.favorite();

    try {
      await context.read<ProductsProvider>().toggleFavorite(productId);
    } catch (e) {
      if (mounted) {
        HapticUtils.error();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('error_occurred')),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  void _openProductDetail(ProductModel product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailScreen(
          product: product.toMap(),
        ),
      ),
    );
  }
}
