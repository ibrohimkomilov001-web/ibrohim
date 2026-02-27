import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/constants.dart';
import '../../core/utils/haptic_utils.dart';
import '../../providers/auth_provider.dart';
import '../../providers/shop_provider.dart';
import '../../models/shop_model.dart';
import '../product/product_detail_screen.dart';
import 'shop_reviews_screen.dart';
import 'shop_chat_screen.dart';

/// Do'kon batafsil sahifasi — Instagram uslubida
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
  int _localFollowerCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadShopData());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadShopData() async {
    if (!mounted) return;
    final shopProvider = context.read<ShopProvider>();
    await shopProvider.loadShop(widget.shopId);

    if (!mounted) return;
    if (shopProvider.currentShop != null) {
      _localFollowerCount = shopProvider.currentShop!.followersCount;
    }

    shopProvider.loadShopProducts(widget.shopId);

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
        if (success) {
          _isFollowing = !_isFollowing;
          _localFollowerCount += _isFollowing ? 1 : -1;
          if (_localFollowerCount < 0) _localFollowerCount = 0;
        }
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

  Future<void> _launchPhone(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchEmail(String email) async {
    final uri = Uri(scheme: 'mailto', path: email);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    }
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  String _formatPrice(int price) {
    final str = price.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return buffer.toString();
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
      'Dek',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  // ═══════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<ShopProvider>(
        builder: (context, shopProvider, _) {
          if (shopProvider.isLoading && shopProvider.currentShop == null) {
            return _buildLoadingState();
          }
          final shop = shopProvider.currentShop;
          if (shop == null) return _buildErrorState();
          return _buildContent(shop);
        },
      ),
    );
  }

  // ─── LOADING — Instagram shimmer skeleton ─────────────────────
  Widget _buildLoadingState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? Colors.grey.shade800 : Colors.grey.shade200;
    final highlight = isDark ? Colors.grey.shade700 : Colors.grey.shade50;

    return SafeArea(
      child: Shimmer.fromColors(
        baseColor: base,
        highlightColor: highlight,
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Column(
            children: [
              // AppBar shimmer
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    _shimmerCircle(32),
                    const SizedBox(width: 12),
                    _shimmerBox(120, 16),
                    const Spacer(),
                    _shimmerCircle(32),
                  ],
                ),
              ),
              // Profile header shimmer
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    _shimmerCircle(86),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: List.generate(
                          3,
                          (_) => Column(
                            children: [
                              _shimmerBox(36, 16),
                              const SizedBox(height: 6),
                              _shimmerBox(52, 12),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Name + bio shimmer
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _shimmerBox(140, 14),
                    const SizedBox(height: 8),
                    _shimmerBox(double.infinity, 12),
                    const SizedBox(height: 4),
                    _shimmerBox(200, 12),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Buttons shimmer
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(child: _shimmerBox(double.infinity, 36)),
                    const SizedBox(width: 8),
                    Expanded(child: _shimmerBox(double.infinity, 36)),
                    const SizedBox(width: 8),
                    _shimmerBox(36, 36),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Tab bar shimmer
              Container(
                  height: 44, color: Colors.white, width: double.infinity),
              const SizedBox(height: 4),
              // 3-column grid shimmer
              Padding(
                padding: const EdgeInsets.all(2),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 2,
                    mainAxisSpacing: 2,
                  ),
                  itemCount: 9,
                  itemBuilder: (_, __) => Container(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _shimmerCircle(double size) => Container(
        width: size,
        height: size,
        decoration:
            const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
      );

  Widget _shimmerBox(double width, double height) => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
        ),
      );

  // ─── ERROR STATE ──────────────────────────────────────────────
  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(Iconsax.shop_remove_copy,
                size: 48, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 20),
          Text(
            'Do\'kon topilmadi',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'Bu do\'kon mavjud emas yoki o\'chirilgan',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Iconsax.arrow_left_2, size: 18),
            label: const Text('Orqaga'),
          ),
        ],
      ),
    );
  }

  // ─── MAIN CONTENT ─────────────────────────────────────────────
  Widget _buildContent(ShopModel shop) {
    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) {
        return [
          _buildAppBar(shop),
          _buildProfileHeader(shop),
          _buildNameAndBio(shop),
          _buildActionButtons(shop),
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

  // ─── INSTAGRAM STYLE APPBAR ───────────────────────────────────
  Widget _buildAppBar(ShopModel shop) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SliverAppBar(
      pinned: true,
      floating: false,
      elevation: 0.5,
      backgroundColor: isDark ? Colors.grey.shade900 : Colors.white,
      foregroundColor: isDark ? Colors.white : Colors.black,
      leading: IconButton(
        icon: const Icon(Iconsax.arrow_left_2, size: 22),
        onPressed: () => Navigator.pop(context),
      ),
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(
            child: Text(
              shop.name,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (shop.isVerified) ...[
            const SizedBox(width: 4),
            const Icon(Icons.verified, color: Color(0xFF3897F0), size: 18),
          ],
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Iconsax.share, size: 22),
          onPressed: _shareShop,
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  // ─── PROFILE HEADER: AVATAR + STATS ───────────────────────────
  Widget _buildProfileHeader(ShopModel shop) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Row(
          children: [
            _buildAvatar(shop),
            const SizedBox(width: 24),
            Expanded(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildProfileStat(_formatCount(shop.totalOrders), 'Sotilgan'),
                  _buildProfileStat(
                      _formatCount(_localFollowerCount), 'Obunachilar'),
                  _buildProfileStat(
                    shop.rating > 0 ? shop.formattedRating : '—',
                    '${shop.reviewCount} sharh',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(ShopModel shop) {
    return Container(
      width: 90,
      height: 90,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            Color(0xFFFBAA47),
            Color(0xFFD91A46),
            Color(0xFFA60F93),
          ],
        ),
      ),
      padding: const EdgeInsets.all(3),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Theme.of(context).scaffoldBackgroundColor,
        ),
        padding: const EdgeInsets.all(2),
        child: ClipOval(
          child: shop.logoUrl != null
              ? CachedNetworkImage(
                  imageUrl: shop.logoUrl!,
                  fit: BoxFit.cover,
                  width: 82,
                  height: 82,
                  placeholder: (_, __) => Container(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    child: const Icon(Iconsax.shop,
                        color: AppColors.primary, size: 32),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    child: const Icon(Iconsax.shop,
                        color: AppColors.primary, size: 32),
                  ),
                )
              : Container(
                  width: 82,
                  height: 82,
                  color: AppColors.primary.withValues(alpha: 0.1),
                  child: Center(
                    child: Text(
                      shop.name.isNotEmpty ? shop.name[0].toUpperCase() : 'D',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildProfileStat(String value, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
      ],
    );
  }

  // ─── NAME + BIO ───────────────────────────────────────────────
  Widget _buildNameAndBio(ShopModel shop) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Name + City
            Row(
              children: [
                Flexible(
                  child: Text(
                    shop.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (shop.city != null) ...[
                  const SizedBox(width: 6),
                  Icon(Iconsax.location, size: 13, color: Colors.grey.shade500),
                  const SizedBox(width: 2),
                  Text(shop.city!,
                      style:
                          TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                ],
              ],
            ),
            // Bio / Description
            if (shop.description != null && shop.description!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                shop.description!,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark ? Colors.grey.shade300 : Colors.grey.shade800,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            // Rating badge
            if (shop.rating > 0) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Iconsax.star_1, size: 14, color: Colors.amber),
                  const SizedBox(width: 3),
                  Text(
                    '${shop.formattedRating} reyting',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.amber.shade800,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('•', style: TextStyle(color: Colors.grey.shade400)),
                  const SizedBox(width: 8),
                  Text(
                    '${shop.totalOrders}+ sotilgan',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  // ─── ACTION BUTTONS ───────────────────────────────────────────
  Widget _buildActionButtons(ShopModel shop) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.grey.shade700 : Colors.grey.shade300;
    final textColor = isDark ? Colors.white : Colors.black;

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Row(
          children: [
            // Follow / Obuna button
            Expanded(
              child: SizedBox(
                height: 36,
                child: _isFollowing
                    ? OutlinedButton(
                        onPressed: _isLoadingFollow ? null : _toggleFollow,
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                          side: BorderSide(color: borderColor),
                        ),
                        child: _isLoadingFollow
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Obuna',
                                style: TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 13)),
                      )
                    : FilledButton(
                        onPressed: _isLoadingFollow ? null : _toggleFollow,
                        style: FilledButton.styleFrom(
                          padding: EdgeInsets.zero,
                          backgroundColor: const Color(0xFF3897F0),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: _isLoadingFollow
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ))
                            : const Text('Obuna bo\'lish',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: Colors.white,
                                )),
                      ),
              ),
            ),
            const SizedBox(width: 6),
            // Xabar button
            Expanded(
              child: SizedBox(
                height: 36,
                child: OutlinedButton(
                  onPressed: _startChat,
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                    side: BorderSide(color: borderColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Iconsax.message, size: 16, color: textColor),
                      const SizedBox(width: 6),
                      Text('Xabar',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: textColor,
                          )),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            // Share button
            SizedBox(
              width: 36,
              height: 36,
              child: OutlinedButton(
                onPressed: _shareShop,
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  side: BorderSide(color: borderColor),
                ),
                child: Icon(Iconsax.share, size: 16, color: textColor),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── TAB BAR ──────────────────────────────────────────────────
  Widget _buildTabBarSliver() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SliverPersistentHeader(
      pinned: true,
      delegate: _SliverTabBarDelegate(
        TabBar(
          controller: _tabController,
          labelColor: isDark ? Colors.white : Colors.black,
          unselectedLabelColor: Colors.grey,
          indicatorColor: isDark ? Colors.white : Colors.black,
          indicatorWeight: 1.5,
          labelStyle:
              const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.grid_on_rounded, size: 24)),
            Tab(icon: Icon(Iconsax.info_circle, size: 24)),
            Tab(icon: Icon(Iconsax.star_1, size: 24)),
          ],
        ),
        color: isDark ? Colors.grey.shade900 : Colors.white,
      ),
    );
  }

  // ─── PRODUCTS TAB — 3-column Instagram grid ───────────────────
  Widget _buildProductsTab(ShopModel shop) {
    return Consumer<ShopProvider>(
      builder: (context, shopProvider, _) {
        final products = shopProvider.shopProducts;

        if (shopProvider.isLoading && products.isEmpty) {
          return _buildProductsShimmer();
        }

        if (products.isEmpty) {
          return _buildEmptyProducts();
        }

        return GridView.builder(
          padding: const EdgeInsets.all(1),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 2,
            mainAxisSpacing: 2,
            childAspectRatio: 0.75,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
            final product = products[index];
            final imageUrl =
                product.images.isNotEmpty ? product.images.first : '';
            return _buildProductGridItem(
              imageUrl: imageUrl,
              price: product.price.toInt(),
              onTap: () => _navigateToProduct(product.toMap()),
            );
          },
        );
      },
    );
  }

  Widget _buildProductGridItem({
    required String imageUrl,
    required int price,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: isDark ? Colors.grey.shade900 : Colors.grey.shade50,
        child: Column(
          children: [
            // Image
            Expanded(
              child: imageUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      placeholder: (_, __) => Container(
                        color: Colors.grey.shade200,
                        child: const Center(
                            child: Icon(Iconsax.image,
                                size: 24, color: Colors.grey)),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: Colors.grey.shade200,
                        child: const Center(
                            child: Icon(Iconsax.image,
                                size: 24, color: Colors.grey)),
                      ),
                    )
                  : Container(
                      color: Colors.grey.shade200,
                      child: const Center(
                          child: Icon(Iconsax.image,
                              size: 24, color: Colors.grey)),
                    ),
            ),
            // Price
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Text(
                '${_formatPrice(price)} so\'m',
                style:
                    const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductsShimmer() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
      highlightColor: isDark ? Colors.grey.shade700 : Colors.grey.shade50,
      child: GridView.builder(
        padding: const EdgeInsets.all(1),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 2,
          mainAxisSpacing: 2,
        ),
        itemCount: 12,
        itemBuilder: (_, __) => Container(color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyProducts() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(Iconsax.box, size: 40, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 16),
          Text('Mahsulotlar hali mavjud emas',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade600,
              )),
          const SizedBox(height: 4),
          Text('Tez orada yangi mahsulotlar qo\'shiladi',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
        ],
      ),
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

  // ─── ABOUT TAB ────────────────────────────────────────────────
  Widget _buildAboutTab(ShopModel shop) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (shop.description != null && shop.description!.isNotEmpty) ...[
            _sectionTitle('Tavsif'),
            const SizedBox(height: 8),
            Text(
              shop.description!,
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 24),
          ],
          _sectionTitle('Aloqa'),
          const SizedBox(height: 12),
          if (shop.address != null)
            _contactRow(Iconsax.location, 'Manzil', shop.address!),
          if (shop.phone != null)
            _contactRow(Iconsax.call, 'Telefon', shop.phone!,
                onTap: () => _launchPhone(shop.phone!)),
          if (shop.email != null)
            _contactRow(Iconsax.sms, 'Email', shop.email!,
                onTap: () => _launchEmail(shop.email!)),
          const SizedBox(height: 24),
          _sectionTitle('Statistika'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? Colors.grey.shade900 : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
              ),
            ),
            child: Column(
              children: [
                _statRow('Jami sotuvlar', shop.formattedTotalSales,
                    Iconsax.money_recive),
                const Divider(height: 24),
                _statRow('Jami buyurtmalar', '${shop.totalOrders}',
                    Iconsax.shopping_cart),
                const Divider(height: 24),
                _statRow('A\'zo bo\'lgan sana', _formatDate(shop.createdAt),
                    Iconsax.calendar),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) => Text(title,
      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16));

  Widget _contactRow(IconData icon, String title, String value,
      {VoidCallback? onTap}) {
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
                  Text(title,
                      style:
                          TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                  Text(value, style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
            if (onTap != null)
              Icon(Iconsax.arrow_right_3, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _statRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.grey, size: 20),
        const SizedBox(width: 12),
        Text(label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
        const Spacer(),
        Text(value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      ],
    );
  }

  // ─── REVIEWS TAB ──────────────────────────────────────────────
  Widget _buildReviewsTab(ShopModel shop) {
    return ShopReviewsScreen(shopId: shop.id, embedded: true);
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
