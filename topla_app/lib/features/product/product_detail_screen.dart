// ignore_for_file: use_build_context_synchronously
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/utils/haptic_utils.dart';
import '../../providers/providers.dart';
import '../../widgets/product_card.dart';
import '../checkout/checkout_screen.dart';
import '../shop/shop_detail_screen.dart';
import 'product_reviews_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  bool _isInCart = false;
  int _cartItemQuantity = 0;
  int _selectedImageIndex = 0;
  late PageController _pageController;
  late List<String> _productImages;
  late String _productId;

  // === VARIANT SYSTEM (Uzum style) ===
  List<Map<String, dynamic>> _variants = [];
  List<Map<String, dynamic>> _uniqueColors = [];  // [{id, nameUz, hexCode}]
  List<Map<String, dynamic>> _uniqueSizes = [];   // [{id, nameUz}]
  String? _selectedColorId;
  String? _selectedSizeId;

  bool get _hasVariants => _variants.isNotEmpty;
  bool get _hasColors => _uniqueColors.isNotEmpty;
  bool get _hasSizes => _uniqueSizes.isNotEmpty;

  /// Hozir tanlangan variantni topish
  Map<String, dynamic>? get _selectedVariant {
    if (!_hasVariants) return null;
    for (final v in _variants) {
      final vc = v['colorId'] ?? v['color_id'];
      final vs = v['sizeId'] ?? v['size_id'];
      if (vc == _selectedColorId && vs == _selectedSizeId) return v;
      // Faqat rang bo'lsa (o'lchamsiz)
      if (_uniqueSizes.isEmpty && vc == _selectedColorId && vs == null) return v;
      // Faqat o'lcham bo'lsa (rangsiz)
      if (_uniqueColors.isEmpty && vs == _selectedSizeId && vc == null) return v;
    }
    return null;
  }

  /// Tanlangan variant narxi (yoki mahsulot default narxi)
  dynamic get _displayPrice {
    final v = _selectedVariant;
    if (v != null) return v['price'];
    return widget.product['price'];
  }

  /// Tanlangan variant eski narxi
  dynamic get _displayOldPrice {
    final v = _selectedVariant;
    if (v != null) return v['compareAtPrice'] ?? v['compare_at_price'];
    return widget.product['oldPrice'] ?? widget.product['originalPrice'];
  }

  /// Tanlangan variant stoki
  int get _displayStock {
    final v = _selectedVariant;
    if (v != null) return (v['stock'] ?? 0) is int ? v['stock'] as int : int.tryParse(v['stock'].toString()) ?? 0;
    return (widget.product['stock'] ?? 100) is int ? (widget.product['stock'] ?? 100) as int : 100;
  }

  // Eski field - backward compat
  // ignore: unused_field
  List<Map<String, dynamic>> _colorSiblings = [];

  // Xususiyatlar - mahsulotdan dinamik olinadi
  List<Map<String, String>> get _specifications {
    final specs = widget.product['specifications'];
    if (specs != null && specs is List) {
      return List<Map<String, String>>.from(specs);
    }
    return [];
  }

  // Sharhlar - mahsulotdan dinamik olinadi
  List<Map<String, dynamic>> get _reviews {
    final reviews = widget.product['reviews'];
    if (reviews != null && reviews is List) {
      return List<Map<String, dynamic>>.from(reviews);
    }
    return [];
  }

  // O'xshash mahsulotlar - hozircha bo'sh
  List<Map<String, dynamic>> get _similarProducts => [];

  // Do'kon ma'lumotlari - mahsulotdan olinadi
  Map<String, dynamic> get _shop {
    final shop = widget.product['shop'];
    if (shop != null && shop is Map<String, dynamic>) {
      return shop;
    }
    // Fallback: shopId dan foydalanish
    final shopId = widget.product['shopId'] ?? widget.product['shop_id'] ?? '';
    return {
      'id': shopId,
      'name': 'TOPLA Market',
      'logo': '',
      'rating': 4.8,
      'isVerified': true,
      'followers': 0,
      'products': 0,
    };
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _productImages = _getProductImages();
    _productId = widget.product['id']?.toString() ?? '';

    // Mahsulot variantlarini yuklash
    _loadProductVariants();
    // Backenddan to'liq mahsulot ma'lumotlarini olish (variants bilan)
    _fetchFullProduct();
  }

  /// Backenddan to'liq mahsulot olish (variantlar bilan)
  Future<void> _fetchFullProduct() async {
    try {
      final productsProvider = context.read<ProductsProvider>();
      final raw = await productsProvider.getProductByIdRaw(_productId);
      if (raw != null && mounted) {
        _parseVariants(raw);
      }
    } catch (e) {
      debugPrint('Fetch full product error: $e');
    }
  }

  /// Variantlarni parse qilish
  void _parseVariants(Map<String, dynamic> product) {
    final variants = product['variants'];
    if (variants == null || variants is! List || (variants as List).isEmpty) return;

    final variantList = List<Map<String, dynamic>>.from(
      variants.map((v) => Map<String, dynamic>.from(v as Map)),
    );

    // Unique ranglarni olish
    final colorMap = <String, Map<String, dynamic>>{};
    final sizeMap = <String, Map<String, dynamic>>{};

    for (final v in variantList) {
      final color = v['color'];
      if (color != null && color is Map) {
        final cId = color['id']?.toString();
        if (cId != null && !colorMap.containsKey(cId)) {
          colorMap[cId] = Map<String, dynamic>.from(color);
        }
      }
      final size = v['size'];
      if (size != null && size is Map) {
        final sId = size['id']?.toString();
        if (sId != null && !sizeMap.containsKey(sId)) {
          sizeMap[sId] = Map<String, dynamic>.from(size);
        }
      }
    }

    setState(() {
      _variants = variantList;
      _uniqueColors = colorMap.values.toList();
      _uniqueSizes = sizeMap.values.toList();
      // Birinchi rangni tanlash
      if (_uniqueColors.isNotEmpty && _selectedColorId == null) {
        _selectedColorId = _uniqueColors.first['id']?.toString();
      }
      // Birinchi o'lchamni tanlash
      if (_uniqueSizes.isNotEmpty && _selectedSizeId == null) {
        _selectedSizeId = _uniqueSizes.first['id']?.toString();
      }
      // Tanlangan variant rasmlarini yangilash
      _updateImagesForVariant();
    });
  }

  /// Tanlangan variant rasmlarini ko'rsatish
  void _updateImagesForVariant() {
    final v = _selectedVariant;
    if (v != null && v['images'] != null && (v['images'] as List).isNotEmpty) {
      _productImages = List<String>.from(v['images']);
      _selectedImageIndex = 0;
      if (_pageController.hasClients) {
        _pageController.jumpToPage(0);
      }
    }
  }

  /// Mahsulot variantlarini yuklash (eski colorSiblings uchun backward compat)
  void _loadProductVariants() {
    final product = widget.product;

    // Agar product map da allaqachon variants bo'lsa
    if (product['variants'] != null && product['variants'] is List) {
      _parseVariants(product);
    }

    // Eski tizim: colorSiblings
    if (product['colorSiblings'] != null && product['colorSiblings'] is List) {
      _colorSiblings = List<Map<String, dynamic>>.from(
        (product['colorSiblings'] as List).map((s) => Map<String, dynamic>.from(s)),
      );
    }
  }

  /// Rang kodini Color ga o'girish
  Color _parseColor(dynamic colorValue) {
    if (colorValue == null) return Colors.grey;
    if (colorValue is Color) return colorValue;
    if (colorValue is String) {
      // Hex rangni parse qilish
      final hex = colorValue.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
    }
    return Colors.grey;
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<String> _getProductImages() {
    final product = widget.product;
    if (product['images'] != null && product['images'] is List) {
      final images = List<String>.from(product['images']);
      // Remove duplicates while preserving order
      return images.toSet().toList();
    } else if (product['image'] != null) {
      return [product['image']];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final hasDiscount = _displayOldPrice != null || product['oldPrice'] != null;
    final discountPercent = product['discount'] ?? 0;
    final stock = _displayStock;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: CustomScrollView(
        slivers: [
          // App Bar with Image
          _buildSliverAppBar(product, hasDiscount, discountPercent),

          // Product Info
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // Warranty badge
                  _buildWarrantyBadge(product),

                  const SizedBox(height: 12),

                  // Name and Rating
                  _buildNameAndRating(product),

                  const SizedBox(height: 16),

                  // 📦 STOCK & SALES INFO
                  _buildStockAndSalesInfo(stock, product),

                  const SizedBox(height: 16),

                  // 💰 Price Section (compact, after rating/stock)
                  _buildPriceSection(product, hasDiscount),

                  const SizedBox(height: 16),

                  // 🎨 VARIANTS - COLOR
                  if (_hasColors && _hasVariants) ...[
                    _buildColorSelectorWithImages(),
                    const SizedBox(height: 16),
                  ],

                  // 📏 VARIANTS - SIZE
                  if (_hasSizes && _hasVariants) ...[
                    _buildSizeSelector(),
                    const SizedBox(height: 16),
                  ],

                  // Agar variant bo'lmasa, shunchaki bo'sh joy
                  if (!_hasVariants) const SizedBox(height: 8),

                  // 🏪 SHOP INFO
                  _buildShopInfo(),

                  const SizedBox(height: 20),

                  //  Description
                  _buildDescription(product),

                  const SizedBox(height: 24),

                  // 📋 SPECIFICATIONS
                  _buildSpecifications(),

                  const SizedBox(height: 24),

                  // 🚚 Delivery Info
                  _buildDeliveryInfo(),

                  const SizedBox(height: 24),

                  // 🔗 SIMILAR PRODUCTS
                  _buildSimilarProducts(),

                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Action Bar
      bottomNavigationBar: _buildBottomBar(product, stock),
    );
  }

  // ============ SLIVER APP BAR ============
  Widget _buildSliverAppBar(
      Map<String, dynamic> product, bool hasDiscount, int discountPercent) {
    final screenHeight = MediaQuery.of(context).size.height;
    final productName = product['name'] ?? 'Mahsulot';
    return SliverAppBar(
      expandedHeight: screenHeight * 0.48,
      pinned: true,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      foregroundColor: Colors.black,
      leading: _buildBackButton(),
      actions: [
        Consumer<ProductsProvider>(
          builder: (context, provider, _) {
            final isFavorite =
                _productId.isNotEmpty && provider.isFavorite(_productId);
            return _buildActionButton(
              icon: isFavorite ? Icons.favorite : Icons.favorite_border,
              color: isFavorite ? AppColors.error : null,
              onTap: () async {
                if (_productId.isEmpty) return;
                try {
                  await provider.toggleFavorite(_productId);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(provider.isFavorite(_productId)
                            ? 'Sevimlilarga qo\'shildi'
                            : 'Sevimlilardan olib tashlandi'),
                        backgroundColor: provider.isFavorite(_productId)
                            ? AppColors.success
                            : Colors.grey,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${context.l10n.translate('error')}: $e'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              },
            );
          },
        ),
        _buildActionButton(
          icon: Icons.ios_share,
          onTap: () async {
            final productName = widget.product['name'] ?? 'Mahsulot';
            final productPrice = _formatPrice(widget.product['price']);
            final message =
                '$productName - $productPrice so\'m\n\nTOPLA Market da xarid qiling!\nhttps://topla.uz';

            await Share.share(
              message,
              subject: productName,
            );
          },
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: LayoutBuilder(
        builder: (context, constraints) {
          final top = constraints.biggest.height;
          final statusBarHeight = MediaQuery.of(context).padding.top;
          final collapsedHeight = kToolbarHeight + statusBarHeight;
          final isCollapsed = top <= collapsedHeight + 10;
          return FlexibleSpaceBar(
            title: isCollapsed
                ? Text(
                    productName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                : null,
            titlePadding: const EdgeInsets.only(left: 56, right: 100, bottom: 14),
            background: Stack(
          children: [
            Positioned.fill(
              child: Container(
                color: Colors.grey.shade100,
                child: _productImages.isNotEmpty
                    ? PageView.builder(
                      controller: _pageController,
                      itemCount: _productImages.length,
                      onPageChanged: (index) =>
                          setState(() => _selectedImageIndex = index),
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () => _showFullScreenImage(index),
                          child: Hero(
                            tag: index == 0
                                ? 'product_${product['name']}'
                                : 'product_${product['name']}_$index',
                            child: CachedNetworkImage(
                              imageUrl: _productImages[index],
                              fit: BoxFit.cover,
                              width: double.infinity,
                              errorWidget: (_, __, ___) =>
                                  _buildPlaceholderImage(),
                            ),
                          ),
                        );
                      },
                    )
                    : Center(child: _buildPlaceholderImage()),
              ),
            ),
            if (_productImages.length > 1)
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_productImages.length, (index) {
                    final isActive = _selectedImageIndex == index;
                    return GestureDetector(
                      onTap: () => _pageController.animateToPage(index,
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 20 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color:
                              isActive ? Colors.white : Colors.white.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(3),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            )
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),
          ],
        ),
          );
        },
      ),
    );
  }

  // ============ WARRANTY BADGE ============
  Widget _buildWarrantyBadge(Map<String, dynamic> product) {
    final warranty = product['warranty'] ?? '1 OY';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Icon(Icons.verified, color: Colors.blue.shade700, size: 16),
          const SizedBox(width: 6),
          Text(
            'KAFOLAT $warranty',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  // ============ NAME AND RATING ============
  Widget _buildNameAndRating(Map<String, dynamic> product) {
    final rating = (product['rating'] ?? 4.5).toDouble();
    final reviewCount = product['reviewCount'] ?? 0;
    final sold = product['sold'] ?? 0;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            product['name'] ?? 'Mahsulot',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              height: 1.3,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 12),
          // Rating row - tappable -> sharhlar sahifasiga o'tish
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ProductReviewsScreen(
                    productId: _productId,
                    productName: product['name'] ?? 'Mahsulot',
                    rating: rating,
                    reviewCount: reviewCount,
                    reviews: _reviews,
                  ),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Text(
                    rating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(width: 4),
                  ...List.generate(5, (index) {
                    return Icon(
                      Icons.star_rounded,
                      color: index < rating.floor()
                          ? Colors.amber
                          : Colors.amber.shade100,
                      size: 16,
                    );
                  }),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '$reviewCount ta sharh · ${sold}+ buyurtma',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============ STOCK & SALES INFO ============
  Widget _buildStockAndSalesInfo(int stock, Map<String, dynamic> product) {
    final sold = product['sold'] ?? 0;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          // Stock info
          if (stock > 0)
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.check, color: AppColors.success, size: 18),
                ),
                const SizedBox(width: 10),
                Text(
                  '$stock dona xarid qilish mumkin',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          if (stock > 0) const SizedBox(height: 10),
          // Sales info
          if (sold > 0)
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Iconsax.box_tick, color: Colors.amber.shade700, size: 18),
                ),
                const SizedBox(width: 10),
                Text(
                  'Bu haftada $sold kishi sotib oldi',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                ),
              ],
            ),
        ],
      ),
    );
  }

  // ============ PRICE SECTION ============
  Widget _buildPriceSection(Map<String, dynamic> product, bool hasDiscount) {
    final price = _displayPrice ?? product['price'];
    final oldPrice = _displayOldPrice ?? product['oldPrice'];
    final showDiscount = oldPrice != null && oldPrice != price;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showDiscount)
            Text(
              '${_formatPrice(oldPrice)} ${AppStrings.currency}',
              style: TextStyle(
                  decoration: TextDecoration.lineThrough,
                  color: Colors.grey.shade500,
                  fontSize: 14),
            ),
          Text(
            '${_formatPrice(price)} ${AppStrings.currency}',
            style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Colors.black),
          ),
        ],
      ),
    );
  }

  // ============ SHOP INFO ============
  Widget _buildShopInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Shop logo
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  _shop['name'].substring(0, 1),
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Shop info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        _shop['name'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      if (_shop['isVerified'] == true) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 10,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Iconsax.star_1, size: 14, color: Colors.amber),
                      const SizedBox(width: 4),
                      Text(
                        '${_shop['rating']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Iconsax.people,
                          size: 14, color: Colors.grey.shade500),
                      const SizedBox(width: 4),
                      Text(
                        '${_shop['followers']}',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Iconsax.box, size: 14, color: Colors.grey.shade500),
                      const SizedBox(width: 4),
                      Text(
                        '${_shop['products']}',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Visit shop button
            TextButton(
              onPressed: () {
                final shopId = _shop['id']?.toString();
                if (shopId != null && shopId.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ShopDetailScreen(
                        shopId: shopId,
                        shopName: _shop['name'],
                      ),
                    ),
                  );
                }
              },
              style: TextButton.styleFrom(
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                'Ko\'rish',
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============ COLOR SELECTOR (old - kept for backwards compat) ============
  Widget _buildColorSelector() {
    return _buildColorSelectorWithImages();
  }

  // ============ COLOR SELECTOR - UZUM STYLE ============
  Widget _buildColorSelectorWithImages() {
    if (_uniqueColors.isEmpty) return const SizedBox.shrink();

    // Hozir tanlangan rangning nomi
    String selectedColorName = '';
    for (final c in _uniqueColors) {
      if (c['id']?.toString() == _selectedColorId) {
        selectedColorName = c['nameUz'] ?? c['name_uz'] ?? c['nameRu'] ?? '';
        break;
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Rang: ',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
              ),
              Text(
                selectedColorName,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Gorizontal rang tanlagich - faqat rasmlar
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _uniqueColors.map((colorInfo) {
              final cId = colorInfo['id']?.toString();
              final isSelected = cId == _selectedColorId;
              final hexCode = colorInfo['hexCode'] ?? colorInfo['hex_code'] ?? '';
              final color = _parseColor(hexCode);

              // Shu rang uchun birinchi variant rasmini olish
              String? imageUrl;
              for (final v in _variants) {
                final vc = v['colorId'] ?? v['color_id'];
                if (vc?.toString() == cId) {
                  if (v['images'] != null && (v['images'] as List).isNotEmpty) {
                    imageUrl = (v['images'] as List).first.toString();
                  }
                  break;
                }
              }

              return GestureDetector(
                onTap: () {
                  if (isSelected) return;
                  setState(() {
                    _selectedColorId = cId;
                    _updateImagesForVariant();
                  });
                },
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? Colors.black87 : Colors.grey.shade300,
                      width: isSelected ? 2.5 : 1,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(isSelected ? 7.5 : 9),
                    child: imageUrl != null && imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => Container(
                              color: color,
                              child: const Icon(Iconsax.image,
                                  color: Colors.white, size: 18),
                            ),
                          )
                        : Container(
                            color: color,
                            child: color == Colors.white
                                ? null
                                : null,
                          ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  /// Boshqa rangli mahsulotga o'tish (eski tizim uchun)
  void _navigateToColorSibling(String productId) async {
    try {
      final productsProvider = context.read<ProductsProvider>();
      final product = await productsProvider.getProductById(productId);
      if (product != null && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: product),
          ),
        );
      }
    } catch (e) {
      debugPrint('Color sibling navigation error: $e');
    }
  }

  // ============ SIZE SELECTOR - UZUM STYLE ============
  Widget _buildSizeSelector() {
    if (_uniqueSizes.isEmpty) return const SizedBox.shrink();

    // Hozir tanlangan o'lcham nomi
    String selectedSizeName = '';
    for (final s in _uniqueSizes) {
      if (s['id']?.toString() == _selectedSizeId) {
        selectedSizeName = s['nameUz'] ?? s['name_uz'] ?? '';
        break;
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'O\'lcham: ',
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              Text(
                selectedSizeName,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _uniqueSizes.map((sizeInfo) {
              final sId = sizeInfo['id']?.toString();
              final isSelected = sId == _selectedSizeId;
              final sizeName = sizeInfo['nameUz'] ?? sizeInfo['name_uz'] ?? '';

              // Bu o'lcham + hozirgi rang kombinatsiyasi mavjudmi tekshirish
              bool isAvailable = true;
              if (_selectedColorId != null) {
                isAvailable = _variants.any((v) {
                  final vc = (v['colorId'] ?? v['color_id'])?.toString();
                  final vs = (v['sizeId'] ?? v['size_id'])?.toString();
                  return vc == _selectedColorId && vs == sId && (v['stock'] ?? 0) > 0;
                });
              }

              return GestureDetector(
                onTap: () {
                  if (!isAvailable) return;
                  setState(() {
                    _selectedSizeId = sId;
                    _updateImagesForVariant();
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary
                        : isAvailable
                            ? Colors.white
                            : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : isAvailable
                              ? Colors.grey.shade300
                              : Colors.grey.shade200,
                    ),
                  ),
                  child: Text(
                    sizeName,
                    style: TextStyle(
                      color: isSelected
                          ? Colors.white
                          : isAvailable
                              ? Colors.black
                              : Colors.grey.shade400,
                      fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ============ DESCRIPTION ============
  Widget _buildDescription(Map<String, dynamic> product) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.l10n.translate('description'),
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(
            product['description'] ??
                'Bu mahsulot haqida batafsil ma\'lumot. Sifatli materiallardan tayyorlangan, uzoq muddat xizmat qiladi.',
            style: TextStyle(
                color: Colors.grey.shade700, fontSize: 15, height: 1.5),
          ),
        ],
      ),
    );
  }

  // ============ SPECIFICATIONS ============
  Widget _buildSpecifications() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Xususiyatlar',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: _specifications.asMap().entries.map((entry) {
                final index = entry.key;
                final spec = entry.value;
                return Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    border: index < _specifications.length - 1
                        ? Border(
                            bottom: BorderSide(color: Colors.grey.shade200))
                        : null,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Text(
                          spec['key']!,
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          spec['value']!,
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  // ============ DELIVERY INFO ============
  Widget _buildDeliveryInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          children: [
            _buildInfoRow(
                icon: Iconsax.truck_fast,
                title: 'Yetkazib berish',
                value: '3-7 kun ichida yetkazib beramiz',
                color: AppColors.success),
            const Divider(height: 24),
            _buildInfoRow(
                icon: Iconsax.shield_tick,
                title: 'Kafolat',
                value: '3 kunlik qaytarish',
                color: AppColors.primary),
          ],
        ),
      ),
    );
  }

  // ============ REVIEWS SECTION ============
  Widget _buildReviewsSection(Map<String, dynamic> product) {
    final rating = (product['rating'] ?? 4.5).toDouble();
    final reviewCount = product['reviewCount'] ?? _reviews.length;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Text(
                'Sharhlar',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              TextButton(
                onPressed: () {},
                child: Text(
                  'Barchasi ($reviewCount)',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Rating Overview
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                // Big rating
                Column(
                  children: [
                    Text(
                      rating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Row(
                      children: List.generate(5, (index) {
                        return Icon(
                          index < rating.floor()
                              ? Iconsax.star_1
                              : Iconsax.star,
                          color: Colors.amber,
                          size: 16,
                        );
                      }),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$reviewCount ta sharh',
                      style:
                          TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    ),
                  ],
                ),

                const SizedBox(width: 24),

                // Rating bars
                Expanded(
                  child: Column(
                    children: [
                      _buildRatingBar(5, 0.7),
                      _buildRatingBar(4, 0.2),
                      _buildRatingBar(3, 0.05),
                      _buildRatingBar(2, 0.03),
                      _buildRatingBar(1, 0.02),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Review cards
          ...(_reviews.take(2).map((review) => _buildReviewCard(review))),

          const SizedBox(height: 12),

          // Write review button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _showWriteReviewSheet,
              icon: const Icon(Iconsax.edit),
              label: Text(context.l10n.translate('write_review')),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingBar(int stars, double percentage) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text('$stars',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          const SizedBox(width: 4),
          const Icon(Iconsax.star_1, size: 12, color: Colors.amber),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage,
                backgroundColor: Colors.grey.shade200,
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
                minHeight: 6,
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 35,
            child: Text(
              '${(percentage * 100).toInt()}%',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(
                  review['userName']?.substring(0, 1) ?? 'U',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          review['userName'] ?? 'Foydalanuvchi',
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        if (review['isVerified'] == true) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Iconsax.verify,
                                    size: 10, color: AppColors.success),
                                SizedBox(width: 2),
                                Text(
                                  'Sotib olgan',
                                  style: TextStyle(
                                      fontSize: 9,
                                      color: AppColors.success,
                                      fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      review['date'] ?? '',
                      style:
                          TextStyle(fontSize: 11, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < (review['rating'] ?? 5)
                        ? Iconsax.star_1
                        : Iconsax.star,
                    color: Colors.amber,
                    size: 14,
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            review['comment'] ?? '',
            style: TextStyle(
                color: Colors.grey.shade700, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              InkWell(
                onTap: () {},
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    children: [
                      Icon(Iconsax.like_1,
                          size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(
                        'Foydali (${review['likes'] ?? 0})',
                        style: TextStyle(
                            fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showWriteReviewSheet() {
    int selectedRating = 5;
    final commentController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  context.l10n.translate('write_review'),
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                Text(context.l10n.translate('your_rating'),
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return GestureDetector(
                      onTap: () =>
                          setModalState(() => selectedRating = index + 1),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(
                          index < selectedRating
                              ? Iconsax.star_1
                              : Iconsax.star,
                          color: Colors.amber,
                          size: 36,
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: commentController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: context.l10n.translate('write_your_opinion'),
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Row(
                            children: [
                              const Icon(Iconsax.tick_circle,
                                  color: Colors.white),
                              const SizedBox(width: 12),
                              Text(context.l10n.translate('review_submitted')),
                            ],
                          ),
                          backgroundColor: AppColors.success,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(context.l10n.translate('submit'),
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ============ SIMILAR PRODUCTS ============
  Widget _buildSimilarProducts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              const Text(
                'O\'xshash mahsulotlar',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              TextButton(
                onPressed: () {},
                child: Text(
                  'Barchasi',
                  style: TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _similarProducts.length,
            itemBuilder: (context, index) {
              final product = _similarProducts[index];
              return Padding(
                padding: const EdgeInsets.only(right: 14),
                child: SizedBox(
                  width: 160,
                  child: ProductCard(
                    name: product['name'],
                    price: product['price'],
                    oldPrice: product['oldPrice'],
                    discount: product['discount'],
                    rating: product['rating']?.toDouble(),
                    sold: product['sold'],
                    imageUrl: product['image'],
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProductDetailScreen(product: product),
                        ),
                      );
                    },
                    onAddToCart: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content:
                                Text(context.l10n.translate('added_to_cart'))),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ============ BOTTOM BAR ============
  Widget _buildBottomBar(Map<String, dynamic> product, int stock) {
    final isOutOfStock = stock <= 0;
    // Calculate delivery date (3-7 days from now)
    final deliveryDate = DateTime.now().add(const Duration(days: 6));
    final months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
    final deliveryText = '${deliveryDate.day}-${months[deliveryDate.month - 1]}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, -3))
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Price section
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_formatPrice(_displayPrice ?? product['price'])} ${AppStrings.currency}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                  if (!isOutOfStock)
                    Text(
                      'Yetkazish: $deliveryText',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Cart button
            Expanded(
              child: _isInCart && !isOutOfStock
                  ? Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          InkWell(
                            onTap: () {
                              if (_cartItemQuantity > 1) {
                                setState(() => _cartItemQuantity--);
                                _updateCartQuantity();
                              } else {
                                setState(() {
                                  _isInCart = false;
                                  _cartItemQuantity = 0;
                                });
                                _removeFromCart();
                              }
                            },
                            child: const SizedBox(
                              width: 40,
                              height: 48,
                              child: Center(
                                child: Text('−',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ),
                          Text(
                            '$_cartItemQuantity',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          InkWell(
                            onTap: () {
                              setState(() => _cartItemQuantity++);
                              _updateCartQuantity();
                            },
                            child: const SizedBox(
                              width: 40,
                              height: 48,
                              child: Center(
                                child: Text('+',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : ElevatedButton(
                      onPressed: isOutOfStock ? null : () => _addToCart(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            isOutOfStock ? Colors.grey : AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        isOutOfStock ? 'Tugagan' : 'Savatga',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Hozir sotib olish - to'g'ri checkout sahifasiga o'tish
  void _buyNow(BuildContext context) {
    // Haptic feedback
    HapticUtils.addToCart();

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final productId = widget.product['id']?.toString() ??
        DateTime.now().millisecondsSinceEpoch.toString();

    // Variant tanlangan bo'lsa, variantId ni ham yuborish
    final variant = _selectedVariant;
    final variantId = variant?['id']?.toString();

    cartProvider.addToCart(productId, quantity: 1, variantId: variantId).then((_) {
      if (!mounted) return;
      // Rasmiylashtirish sahifasiga o'tish
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const CheckoutScreen()),
      );
    }).catchError((error) {
      if (!mounted) return;
      HapticUtils.error();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${context.l10n.translate('error')}: $error'),
          backgroundColor: AppColors.error,
        ),
      );
    });
  }

  // ============ HELPER WIDGETS ============
  Widget _buildBackButton() {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.grey.shade200.withValues(alpha: 0.85),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back_ios_new, size: 16),
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    Color? color,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.grey.shade200.withValues(alpha: 0.85),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color ?? Colors.grey.shade700, size: 20),
        ),
      ),
    );
  }

  /// Rasmni to'liq ekranda ko'rsatish
  void _showFullScreenImage(int initialIndex) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _FullScreenImageViewer(
          images: _productImages,
          initialIndex: initialIndex,
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
        height: 280,
        color: Colors.grey.shade100,
        child: Icon(Iconsax.image, size: 80, color: Colors.grey.shade400));
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color)),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          Text(value,
              style:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ]),
      ],
    );
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final numPrice =
        price is num ? price.toInt() : int.tryParse(price.toString()) ?? 0;
    return numPrice.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ');
  }

  void _addToCart(BuildContext context) {
    HapticUtils.addToCart();

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final productId = widget.product['id']?.toString() ??
        DateTime.now().millisecondsSinceEpoch.toString();

    // Variant tanlangan bo'lsa, variantId ni ham yuborish
    final variant = _selectedVariant;
    final variantId = variant?['id']?.toString();

    cartProvider.addToCart(productId, quantity: 1, variantId: variantId).then((_) {
      if (!mounted) return;
      HapticUtils.success();
      setState(() {
        _isInCart = true;
        _cartItemQuantity = 1;
      });
    }).catchError((error) {
      if (!mounted) return;
      HapticUtils.error();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${context.l10n.translate('error')}: $error'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    });
  }

  void _updateCartQuantity() {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final productId = widget.product['id']?.toString() ?? '';
    // Savatdagi mahsulotni topish
    final cartItem = cartProvider.items
        .where(
          (item) => item.productId == productId,
        )
        .firstOrNull;
    if (cartItem != null) {
      cartProvider.updateQuantity(cartItem.id, _cartItemQuantity);
    }
  }

  void _removeFromCart() {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final productId = widget.product['id']?.toString() ?? '';
    final cartItem = cartProvider.items
        .where(
          (item) => item.productId == productId,
        )
        .firstOrNull;
    if (cartItem != null) {
      cartProvider.removeFromCart(cartItem.productId);
    }
  }
}

/// To'liq ekranda rasm ko'rish uchun
class _FullScreenImageViewer extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const _FullScreenImageViewer({
    required this.images,
    required this.initialIndex,
  });

  @override
  State<_FullScreenImageViewer> createState() => _FullScreenImageViewerState();
}

class _FullScreenImageViewerState extends State<_FullScreenImageViewer> {
  late PageController _pageController;
  late int _currentIndex;
  final TransformationController _transformationController =
      TransformationController();

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _transformationController.dispose();
    super.dispose();
  }

  void _resetZoom() {
    _transformationController.value = Matrix4.identity();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          '${_currentIndex + 1}/${widget.images.length}',
          style: const TextStyle(color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: PageView.builder(
        controller: _pageController,
        itemCount: widget.images.length,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
          _resetZoom();
        },
        itemBuilder: (context, index) {
          return InteractiveViewer(
            transformationController: _transformationController,
            minScale: 0.5,
            maxScale: 4.0,
            child: Center(
              child: CachedNetworkImage(
                imageUrl: widget.images[index],
                fit: BoxFit.contain,
                placeholder: (_, __) => const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),
                errorWidget: (_, __, ___) => const Icon(
                  Icons.broken_image,
                  size: 80,
                  color: Colors.grey,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
