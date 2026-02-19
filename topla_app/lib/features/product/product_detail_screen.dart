// ignore_for_file: use_build_context_synchronously
import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/constants.dart';
import '../../core/utils/haptic_utils.dart';
import '../../providers/providers.dart';
import '../../widgets/premium_product_card.dart';
import '../checkout/checkout_screen.dart';
import '../shop/shop_detail_screen.dart';

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

  // Variant tanlash
  int _selectedColorIndex = 0;
  int _selectedSizeIndex = -1;
  // ignore: unused_field
  String? _selectedVariant;

  // Flash Sale timer
  Timer? _flashSaleTimer;
  Duration _remainingTime = Duration.zero;

  // Dinamik variantlar - mahsulotdan olinadi
  List<Map<String, dynamic>> _colors = [];
  List<String> _sizes = [];

  // Kategoriyaga qarab variantlar
  bool get _hasColors => _colors.isNotEmpty;
  bool get _hasSizes => _sizes.isNotEmpty;
  // ignore: unused_element
  bool get _hasVariants => widget.product['variants'] != null;

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
    return {
      'id': '',
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

    // Flash Sale timer boshlash
    _initFlashSaleTimer();
  }

  /// Mahsulot kategoriyasi va ma'lumotlariga qarab variantlarni yuklash
  void _loadProductVariants() {
    final product = widget.product;
    final category = product['category']?.toString().toLowerCase() ?? '';
    final categoryId = product['category_id']?.toString() ?? '';

    // Mahsulotdan kelgan variantlar
    if (product['colors'] != null && product['colors'] is List) {
      _colors = List<Map<String, dynamic>>.from(
        (product['colors'] as List).map((c) => {
              'name': c['name'] ?? c.toString(),
              'color': _parseColor(c['hex'] ?? c['color']),
            }),
      );
    }

    if (product['sizes'] != null && product['sizes'] is List) {
      _sizes = List<String>.from(product['sizes']);
    }

    // Agar mahsulotda variant yo'q bo'lsa, kategoriyaga qarab default variantlar
    if (_colors.isEmpty && _sizes.isEmpty) {
      _setDefaultVariantsByCategory(category, categoryId);
    }
  }

  /// Kategoriyaga qarab default variantlar
  void _setDefaultVariantsByCategory(String category, String categoryId) {
    // Kiyim-kechak kategoriyalari
    final clothingCategories = [
      'kiyim',
      'clothing',
      'fashion',
      'apparel',
      'wear',
      'ko\'ylak',
      'shim',
      'kurtka',
      'palto',
      'futbolka',
      't-shirt',
      'shirt',
      'pants',
      'jacket',
      'dress',
      'erkaklar kiyimi',
      'ayollar kiyimi',
      'bolalar kiyimi',
    ];

    // Poyabzal kategoriyalari
    final footwearCategories = [
      'poyabzal',
      'oyoq kiyim',
      'footwear',
      'shoes',
      'boots',
      'krossovka',
      'tufli',
      'sandal',
      'shippak',
    ];

    // Elektronika kategoriyalari (faqat rang)
    final electronicsCategories = [
      'elektronika',
      'electronics',
      'telefon',
      'phone',
      'smartphone',
      'noutbuk',
      'laptop',
      'kompyuter',
      'computer',
      'planshet',
      'tablet',
      'quloqchin',
      'headphones',
      'earbuds',
      'smart watch',
      'soat',
    ];

    // Kategoriyani tekshirish
    final lowerCategory = category.toLowerCase();

    if (clothingCategories.any((c) => lowerCategory.contains(c))) {
      // Kiyim uchun rang va o'lcham
      _colors = [
        {'name': 'Qora', 'color': Colors.black},
        {'name': 'Oq', 'color': Colors.white},
        {'name': 'Ko\'k', 'color': Colors.blue},
        {'name': 'Qizil', 'color': Colors.red},
      ];
      _sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    } else if (footwearCategories.any((c) => lowerCategory.contains(c))) {
      // Poyabzal uchun rang va o'lcham (oyoq o'lchami)
      _colors = [
        {'name': 'Qora', 'color': Colors.black},
        {'name': 'Oq', 'color': Colors.white},
        {'name': 'Kulrang', 'color': Colors.grey},
      ];
      _sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
    } else if (electronicsCategories.any((c) => lowerCategory.contains(c))) {
      // Elektronika uchun faqat rang
      _colors = [
        {'name': 'Qora', 'color': Colors.black},
        {'name': 'Oq', 'color': Colors.white},
        {'name': 'Kumush', 'color': Colors.grey.shade400},
      ];
      // O'lcham yo'q
      _sizes = [];
    }
    // Boshqa kategoriyalar uchun hech narsa ko'rsatilmaydi
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

  void _initFlashSaleTimer() {
    final isFlashSale = widget.product['isFlashSale'] ?? false;
    if (isFlashSale) {
      // Demo: 5 soat qolgan
      _remainingTime = const Duration(hours: 5, minutes: 30, seconds: 45);
      _flashSaleTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_remainingTime.inSeconds > 0) {
          setState(() {
            _remainingTime = _remainingTime - const Duration(seconds: 1);
          });
        } else {
          timer.cancel();
        }
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _flashSaleTimer?.cancel();
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
    final hasDiscount = product['oldPrice'] != null;
    final discountPercent = product['discount'] ?? 0;
    final isFlashSale = product['isFlashSale'] ?? false;
    final stock = product['stock'] ?? 100;

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

                  // Name and Rating
                  _buildNameAndRating(product),

                  const SizedBox(height: 16),

                  // ⚡ FLASH SALE TIMER
                  if (isFlashSale) _buildFlashSaleTimer(),

                  // 💰 Price Section
                  _buildPriceSection(product, hasDiscount),

                  const SizedBox(height: 12),

                  //  YETKAZIB BERISH
                  _buildDeliverySection(),

                  const SizedBox(height: 16),

                  // 📦 STOCK STATUS
                  _buildStockStatus(stock),

                  const SizedBox(height: 16),

                  // 🏪 SHOP INFO
                  _buildShopInfo(),

                  const SizedBox(height: 20),

                  // 🎨 VARIANTS - COLOR (faqat ranglar bo'lsa)
                  if (_hasColors) ...[
                    _buildColorSelector(),
                    const SizedBox(height: 16),
                  ],

                  // 📏 VARIANTS - SIZE (faqat o'lchamlar bo'lsa)
                  if (_hasSizes) ...[
                    _buildSizeSelector(),
                    const SizedBox(height: 20),
                  ],

                  // Agar variant bo'lmasa, shunchaki bo'sh joy
                  if (!_hasColors && !_hasSizes) const SizedBox(height: 8),

                  //  Description
                  _buildDescription(product),

                  const SizedBox(height: 24),

                  // 📋 SPECIFICATIONS
                  _buildSpecifications(),

                  const SizedBox(height: 24),

                  // 🚚 Delivery Info
                  _buildDeliveryInfo(),

                  const SizedBox(height: 24),

                  // ⭐ REVIEWS SECTION
                  _buildReviewsSection(product),

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
    return SliverAppBar(
      expandedHeight: 350,
      pinned: true,
      backgroundColor: Colors.white,
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
                        content: Text('Xatolik: $e'),
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

            // Native share dialog
            await Share.share(
              message,
              subject: productName,
            );
          },
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          children: [
            Container(
              color: Colors.white,
              child: _productImages.isNotEmpty
                  ? PageView.builder(
                      controller: _pageController,
                      itemCount: _productImages.length,
                      onPageChanged: (index) =>
                          setState(() => _selectedImageIndex = index),
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () => _showFullScreenImage(index),
                          child: Center(
                            child: Hero(
                              tag: index == 0
                                  ? 'product_${product['name']}'
                                  : 'product_${product['name']}_$index',
                              child: CachedNetworkImage(
                                imageUrl: _productImages[index],
                                fit: BoxFit.contain,
                                height: 280,
                                errorWidget: (_, __, ___) =>
                                    _buildPlaceholderImage(),
                              ),
                            ),
                          ),
                        );
                      },
                    )
                  : Center(child: _buildPlaceholderImage()),
            ),
            if (_productImages.length > 1)
              Positioned(
                bottom: 20,
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
                              isActive ? Colors.black87 : Colors.grey.shade400,
                          borderRadius: BorderRadius.circular(3),
                          boxShadow: isActive
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  )
                                ]
                              : null,
                        ),
                      ),
                    );
                  }),
                ),
              ),
            if (_productImages.length > 1)
              Positioned(
                top: 100,
                right: 16,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12)),
                  child: Text(
                      '${_selectedImageIndex + 1}/${_productImages.length}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 12)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ============ NAME AND RATING ============
  Widget _buildNameAndRating(Map<String, dynamic> product) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(product['name'] ?? 'Mahsulot',
              style:
                  const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    const Icon(Iconsax.star, color: Colors.amber, size: 16),
                    const SizedBox(width: 4),
                    Text('${product['rating'] ?? 4.5}',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 14)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text('${product['sold'] ?? 0} ta sotilgan',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
            ],
          ),
        ],
      ),
    );
  }

  // ============ FLASH SALE TIMER ============
  Widget _buildFlashSaleTimer() {
    final hours = _remainingTime.inHours;
    final minutes = _remainingTime.inMinutes.remainder(60);
    final seconds = _remainingTime.inSeconds.remainder(60);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF4444), Color(0xFFFF6B35)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Iconsax.flash_1, color: Colors.white, size: 24),
          const SizedBox(width: 12),
          const Text(
            'Flash Sale tugashiga:',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          _buildTimeBox(hours.toString().padLeft(2, '0')),
          const Text(' : ',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18)),
          _buildTimeBox(minutes.toString().padLeft(2, '0')),
          const Text(' : ',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18)),
          _buildTimeBox(seconds.toString().padLeft(2, '0')),
        ],
      ),
    );
  }

  Widget _buildTimeBox(String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        value,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
    );
  }

  // ============ PRICE SECTION ============
  Widget _buildPriceSection(Map<String, dynamic> product, bool hasDiscount) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [
          AppColors.primary.withValues(alpha: 0.1),
          AppColors.primary.withValues(alpha: 0.05)
        ]),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (hasDiscount)
                Text(
                  '${_formatPrice(product['oldPrice'])} ${AppStrings.currency}',
                  style: TextStyle(
                      decoration: TextDecoration.lineThrough,
                      color: Colors.grey.shade500,
                      fontSize: 14),
                ),
              Text(
                '${_formatPrice(product['price'])} ${AppStrings.currency}',
                style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ============ YETKAZIB BERISH ============
  Widget _buildDeliverySection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Iconsax.truck_fast,
                  color: Colors.blue.shade600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Market yetkazish xizmati',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.circle, size: 8, color: Colors.blue),
                        SizedBox(width: 4),
                        Text(
                          'Ertaga',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.blue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          ', klik bilan ',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey,
                          ),
                        ),
                        Text(
                          '0 so\'m',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.green,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ],
      ),
    );
  }

  // ============ STOCK STATUS ============
  Widget _buildStockStatus(int stock) {
    if (stock <= 0) {
      return _buildStockCard(
        icon: Iconsax.box_remove,
        title: 'Omborda tugagan',
        subtitle: 'Tez orada qaytadan keladi',
        color: AppColors.error,
        trailing:
            const Icon(Iconsax.close_circle, color: AppColors.error, size: 24),
      );
    } else if (stock <= 5) {
      return _buildStockCard(
        icon: Iconsax.warning_2,
        title: 'Faqat $stock ta qoldi!',
        subtitle: 'Tezroq buyurtma bering',
        color: Colors.orange,
        trailing: const Icon(Iconsax.flash_1, color: Colors.orange, size: 24),
      );
    } else {
      return _buildStockCard(
        icon: Iconsax.box_tick,
        title: 'Omborda mavjud',
        subtitle: 'Tez yetkazib beramiz',
        color: AppColors.success,
        trailing:
            const Icon(Iconsax.tick_circle, color: AppColors.success, size: 24),
      );
    }
  }

  Widget _buildStockCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: color,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(color: color, fontSize: 12),
                  ),
                ],
              ),
            ),
            if (trailing != null) trailing,
          ],
        ),
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

  // ============ COLOR SELECTOR ============
  Widget _buildColorSelector() {
    if (_colors.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Rang',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 8),
              if (_selectedColorIndex < _colors.length)
                Text(
                  _colors[_selectedColorIndex]['name'] ?? '',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: List.generate(_colors.length, (index) {
              final color = _colors[index]['color'] as Color? ?? Colors.grey;
              final isSelected = _selectedColorIndex == index;
              return GestureDetector(
                onTap: () => setState(() => _selectedColorIndex = index),
                child: Container(
                  margin: const EdgeInsets.only(right: 12),
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color:
                          isSelected ? AppColors.primary : Colors.grey.shade300,
                      width: isSelected ? 3 : 1,
                    ),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                    ],
                  ),
                  child: isSelected
                      ? Icon(
                          Icons.check,
                          color: color == Colors.white
                              ? Colors.black
                              : Colors.white,
                          size: 20,
                        )
                      : null,
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  // ============ SIZE SELECTOR ============
  Widget _buildSizeSelector() {
    if (_sizes.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'O\'lcham',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 8),
              if (_selectedSizeIndex >= 0 && _selectedSizeIndex < _sizes.length)
                Text(
                  _sizes[_selectedSizeIndex],
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              const Spacer(),
              TextButton(
                onPressed: () {
                  // Show size guide
                },
                child: Text(
                  'O\'lcham jadvali',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: List.generate(_sizes.length, (index) {
              final isSelected = _selectedSizeIndex == index;
              return GestureDetector(
                onTap: () => setState(() => _selectedSizeIndex = index),
                child: Container(
                  width: 50,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color:
                          isSelected ? AppColors.primary : Colors.grey.shade300,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      _sizes[index],
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.black,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            }),
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
          const Text('Tavsif',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
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
              label: const Text('Sharh yozish'),
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
                const Text(
                  'Sharh yozish',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                const Text('Bahoyingiz',
                    style: TextStyle(fontWeight: FontWeight.w600)),
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
                    hintText: 'Fikringizni yozing...',
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
                          content: const Row(
                            children: [
                              Icon(Iconsax.tick_circle, color: Colors.white),
                              SizedBox(width: 12),
                              Text('Sharhingiz yuborildi!'),
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
                    child: const Text('Yuborish',
                        style: TextStyle(
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
                  child: PremiumProductCard(
                    name: product['name'],
                    price: product['price'],
                    oldPrice: product['oldPrice'],
                    discount: product['discount'],
                    rating: product['rating'].toDouble(),
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
                        const SnackBar(content: Text('Savatchaga qo\'shildi')),
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

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -5))
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // "Hozir sotib olish" tugmasi - oq fon, qora chiziq
            Expanded(
              child: OutlinedButton(
                onPressed: isOutOfStock ? null : () => _buyNow(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black87,
                  side: BorderSide(
                    color: isOutOfStock
                        ? Colors.grey.shade300
                        : Colors.grey.shade400,
                    width: 1.5,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(isOutOfStock ? 'Tugagan' : 'Hozir sotib olish',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isOutOfStock ? Colors.grey : Colors.black87)),
              ),
            ),
            const SizedBox(width: 12),
            // "Savatga" tugmasi yoki miqdor counter
            Expanded(
              child: _isInCart && !isOutOfStock
                  ? Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF6D00),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // Minus tugmasi
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
                          // Miqdor
                          Text(
                            '$_cartItemQuantity',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          // Plus tugmasi
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
                      onPressed:
                          isOutOfStock ? null : () => _addToCart(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isOutOfStock
                            ? Colors.grey
                            : const Color(0xFFFF6D00),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(isOutOfStock ? 'Tugagan' : 'Savatga',
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600)),
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

    cartProvider.addToCart(productId, quantity: 1).then((_) {
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
          content: Text('Xatolik: $error'),
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
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 8,
              )
            ],
          ),
          child: const Icon(Icons.arrow_back_ios_new, size: 18),
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08), blurRadius: 6)
            ]),
        child: IconButton(
            icon: Icon(icon, color: color ?? Colors.grey.shade700, size: 22),
            onPressed: onTap),
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

    cartProvider.addToCart(productId, quantity: 1).then((_) {
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
          content: Text('Xatolik: $error'),
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
