// ignore_for_file: use_build_context_synchronously
import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/utils/haptic_utils.dart';
import '../../providers/providers.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton_widgets.dart';
import '../checkout/checkout_screen.dart';
import '../shop/shop_detail_screen.dart';
import '../shop/shop_chat_screen.dart';
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

  // === VARIANT SYSTEM (multi-attribute) ===
  List<Map<String, dynamic>> _variants = [];

  /// Parsed option types for the product: [{id, slug, nameUz, nameRu, displayType, unit, values: [{id, slug, valueUz, valueRu, hexCode, imageUrl}]}]
  List<Map<String, dynamic>> _optionTypes = [];

  /// Selected value per option type: {optionTypeId: optionValueId}
  Map<String, String> _selectedValues = {};

  // Backward-compat aliases
  List<Map<String, dynamic>> get _uniqueColors {
    final ct = _optionTypes.where((t) => t['slug'] == 'color' || t['displayType'] == 'color').toList();
    if (ct.isEmpty) return [];
    return List<Map<String, dynamic>>.from(ct.first['values'] ?? []);
  }
  List<Map<String, dynamic>> get _uniqueSizes {
    final st = _optionTypes.where((t) => t['slug'] == 'size').toList();
    if (st.isEmpty) return [];
    return List<Map<String, dynamic>>.from(st.first['values'] ?? []);
  }
  String? get _selectedColorId {
    final ct = _optionTypes.where((t) => t['slug'] == 'color' || t['displayType'] == 'color').toList();
    if (ct.isEmpty) return null;
    return _selectedValues[ct.first['id']];
  }
  String? get _selectedSizeId {
    final st = _optionTypes.where((t) => t['slug'] == 'size').toList();
    if (st.isEmpty) return null;
    return _selectedValues[st.first['id']];
  }

  bool get _hasVariants => _variants.isNotEmpty;
  bool get _hasColors => _uniqueColors.isNotEmpty;
  bool get _hasSizes => _uniqueSizes.isNotEmpty;

  /// Hozir tanlangan variantni topish (N-attribute)
  Map<String, dynamic>? get _selectedVariant {
    if (!_hasVariants) return null;
    if (_selectedValues.isEmpty) return null;

    for (final v in _variants) {
      // New format: variantValues junction
      final variantValues = v['variantValues'];
      if (variantValues != null && variantValues is List && variantValues.isNotEmpty) {
        bool allMatch = true;
        for (final vv in variantValues) {
          final typeId = (vv['optionType']?['id'] ?? vv['optionTypeId'])?.toString();
          final valId = (vv['optionValue']?['id'] ?? vv['optionValueId'])?.toString();
          if (typeId != null && _selectedValues[typeId] != valId) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) return v;
        continue;
      }
      // Old format: colorId + sizeId
      final vc = (v['colorId'] ?? v['color_id'])?.toString();
      final vs = (v['sizeId'] ?? v['size_id'])?.toString();
      if (vc == _selectedColorId && vs == _selectedSizeId) return v;
      if (_uniqueSizes.isEmpty && vc == _selectedColorId && vs == null) return v;
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
    if (v != null) {
      return (v['stock'] ?? 0) is int
          ? v['stock'] as int
          : int.tryParse(v['stock'].toString()) ?? 0;
    }
    return (widget.product['stock'] ?? 100) is int
        ? (widget.product['stock'] ?? 100) as int
        : 100;
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

  // O'xshash mahsulotlar
  List<Map<String, dynamic>> _similarProducts = [];
  bool _isSimilarLoading = false;

  // WOW narx mahsulotlar
  List<Map<String, dynamic>> _wowProducts = [];
  bool _isWowLoading = false;

  // Shop follow state
  bool _isFollowingShop = false;

  // Tab indices
  int _descTabIndex = 0; // 0=Tavsif, 1=Xususiyatlar
  int _bottomTabIndex = 0; // 0=O'xshash, 1=WOW narx

  // Do'kon ma'lumotlari - mahsulotdan olinadi
  Map<String, dynamic> get _shop {
    final shop = widget.product['shop'];
    if (shop != null && shop is Map<String, dynamic>) {
      return shop;
    }
    final shopId = widget.product['shopId'] ?? widget.product['shop_id'] ?? '';
    return {
      'id': shopId,
      'name': 'TOPLA Market',
      'logoUrl': null,
      'rating': 0,
      'reviewCount': 0,
      'phone': null,
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
    // O'xshash mahsulotlarni yuklash
    _loadSimilarProducts();
    // WOW narx mahsulotlarni yuklash
    _loadWowProducts();
    // Shop follow holatini tekshirish
    _checkShopFollowStatus();
  }

  /// O'xshash mahsulotlarni yuklash (shu kategoriya bo'yicha)
  Future<void> _loadSimilarProducts() async {
    final categoryId = widget.product['categoryId'] ??
        widget.product['category_id'] ??
        (widget.product['category'] is Map
            ? widget.product['category']['id']
            : null);
    if (categoryId == null) return;

    setState(() => _isSimilarLoading = true);
    try {
      final provider = context.read<ProductsProvider>();
      final products = await provider.getProductsByCategory(
        categoryId.toString(),
      );
      if (!mounted) return;
      setState(() {
        _similarProducts = products
            .where((p) => p.id != _productId) // o'zini chiqarish
            .take(8)
            .map((p) => {
                  'id': p.id,
                  'name': p.nameUz,
                  'price': p.price.toInt(),
                  'oldPrice': p.oldPrice?.toInt(),
                  'rating': p.rating,
                  'sold': p.soldCount,
                  'image': p.images.isNotEmpty ? p.images.first : null,
                  'images': p.images,
                  'stock': p.stock,
                  'categoryId': p.categoryId,
                  'shopId': p.shopId,
                  'description': p.descriptionUz,
                })
            .toList();
        _isSimilarLoading = false;
      });
    } catch (e) {
      debugPrint('Similar products error: $e');
      if (mounted) setState(() => _isSimilarLoading = false);
    }
  }

  /// WOW narx mahsulotlar (arzon + chegirmali)
  Future<void> _loadWowProducts() async {
    setState(() => _isWowLoading = true);
    try {
      final provider = context.read<ProductsProvider>();
      final allProducts = await provider.getAllProducts(limit: 30);
      if (!mounted) return;
      setState(() {
        _wowProducts = allProducts
            .where((p) =>
                p.id != _productId &&
                (p.discountPercent > 0 || p.price < 100000))
            .take(8)
            .map((p) => {
                  'id': p.id,
                  'name': p.nameUz,
                  'price': p.price.toInt(),
                  'oldPrice': p.oldPrice?.toInt(),
                  'rating': p.rating,
                  'sold': p.soldCount,
                  'image': p.images.isNotEmpty ? p.images.first : null,
                  'images': p.images,
                  'stock': p.stock,
                  'categoryId': p.categoryId,
                  'shopId': p.shopId,
                  'description': p.descriptionUz,
                })
            .toList();
        _isWowLoading = false;
      });
    } catch (e) {
      debugPrint('WOW products error: $e');
      if (mounted) setState(() => _isWowLoading = false);
    }
  }

  /// Shop follow holatini tekshirish
  Future<void> _checkShopFollowStatus() async {
    final shopId = _shop['id']?.toString();
    if (shopId == null || shopId.isEmpty) return;
    try {
      final shopProvider = context.read<ShopProvider>();
      final isFollowing = await shopProvider.checkIsFollowing(shopId);
      if (mounted) setState(() => _isFollowingShop = isFollowing);
    } catch (_) {}
  }

  /// Shop follow/unfollow toggle
  Future<void> _toggleShopFollow() async {
    final shopId = _shop['id']?.toString();
    if (shopId == null || shopId.isEmpty) return;
    final shopProvider = context.read<ShopProvider>();
    HapticUtils.lightImpact();
    if (_isFollowingShop) {
      final ok = await shopProvider.unfollowShop(shopId);
      if (ok && mounted) setState(() => _isFollowingShop = false);
    } else {
      final ok = await shopProvider.followShop(shopId);
      if (ok && mounted) setState(() => _isFollowingShop = true);
    }
  }

  /// Backenddan to'liq mahsulot olish (variantlar bilan)
  Future<void> _fetchFullProduct() async {
    try {
      final productsProvider = context.read<ProductsProvider>();
      final raw = await productsProvider.getProductByIdRaw(_productId);
      if (raw != null && mounted) {
        _parseVariants(raw);
        // salesCount ni yangilash
        final sc = raw['salesCount'] ?? raw['sales_count'] ?? raw['sold'];
        if (sc != null) {
          widget.product['sold'] =
              sc is int ? sc : int.tryParse(sc.toString()) ?? 0;
        }
        // Atributlarni yuklash (specifications)
        _loadProductAttributes();
        setState(() {});
      }
    } catch (e) {
      debugPrint('Fetch full product error: $e');
    }
  }

  /// Mahsulot atributlarini yuklash
  Future<void> _loadProductAttributes() async {
    try {
      final api = context.read<ProductsProvider>();
      final attrs = await api.getProductAttributes(_productId);
      if (attrs != null && attrs.isNotEmpty && mounted) {
        final specs = attrs.map<Map<String, String>>((a) {
          final attr = a['attribute'] as Map<String, dynamic>? ?? {};
          return {
            'key': (attr['nameUz'] ?? attr['key'] ?? '').toString(),
            'value': (a['value'] ?? '').toString(),
          };
        }).toList();
        widget.product['specifications'] = specs;
        setState(() {});
      }
    } catch (e) {
      debugPrint('Load product attributes error: $e');
    }
  }

  /// Variantlarni parse qilish (multi-attribute yoki eski color/size)
  void _parseVariants(Map<String, dynamic> product) {
    final variants = product['variants'];
    if (variants == null || variants is! List || variants.isEmpty) return;

    final variantList = List<Map<String, dynamic>>.from(
      variants.map((v) => Map<String, dynamic>.from(v as Map)),
    );

    // Check if new multi-attribute format (optionLinks + variantValues)
    final optionLinks = product['optionLinks'];
    if (optionLinks != null && optionLinks is List && optionLinks.isNotEmpty) {
      // New format: parse option types from optionLinks
      final types = <Map<String, dynamic>>[];
      for (final ol in optionLinks) {
        final ot = ol['optionType'];
        if (ot == null) continue;
        final typeId = ot['id']?.toString() ?? '';
        // Collect only values that actually appear in variants
        final usedValueIds = <String>{};
        for (final v in variantList) {
          final vvList = v['variantValues'];
          if (vvList != null && vvList is List) {
            for (final vv in vvList) {
              final tId = (vv['optionType']?['id'] ?? vv['optionTypeId'])?.toString();
              final valId = (vv['optionValue']?['id'] ?? vv['optionValueId'])?.toString();
              if (tId == typeId && valId != null) usedValueIds.add(valId);
            }
          }
        }
        final allValues = ot['values'] is List ? List<Map<String, dynamic>>.from(
          (ot['values'] as List).map((v) => Map<String, dynamic>.from(v as Map))
        ) : <Map<String, dynamic>>[];
        final filteredValues = allValues.where((v) => usedValueIds.contains(v['id']?.toString())).toList();
        if (filteredValues.isNotEmpty) {
          types.add({
            'id': typeId,
            'slug': ot['slug'] ?? '',
            'nameUz': ot['nameUz'] ?? ot['name_uz'] ?? '',
            'nameRu': ot['nameRu'] ?? ot['name_ru'] ?? '',
            'displayType': ot['displayType'] ?? ot['display_type'] ?? 'text',
            'unit': ot['unit'],
            'values': filteredValues,
          });
        }
      }

      setState(() {
        _variants = variantList;
        _optionTypes = types;
        // Auto-select first variant's values
        if (_selectedValues.isEmpty && variantList.isNotEmpty) {
          final defaultV = product['defaultVariantId'] != null
            ? variantList.firstWhere((v) => v['id'] == product['defaultVariantId'], orElse: () => variantList.first)
            : variantList.first;
          final vvList = defaultV['variantValues'];
          if (vvList != null && vvList is List) {
            for (final vv in vvList) {
              final tId = (vv['optionType']?['id'] ?? vv['optionTypeId'])?.toString();
              final valId = (vv['optionValue']?['id'] ?? vv['optionValueId'])?.toString();
              if (tId != null && valId != null) _selectedValues[tId] = valId;
            }
          }
        }
        _updateImagesForVariant();
      });
      return;
    }

    // Old format: extract color/size from variant objects
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

    // Build optionTypes from old color/size for uniform handling
    final types = <Map<String, dynamic>>[];
    if (colorMap.isNotEmpty) {
      types.add({
        'id': 'legacy-color',
        'slug': 'color',
        'nameUz': 'Rang',
        'nameRu': 'Цвет',
        'displayType': 'color',
        'values': colorMap.values.map((c) => <String, dynamic>{
          'id': c['id']?.toString(),
          'slug': '',
          'valueUz': c['nameUz'] ?? c['name_uz'] ?? c['nameRu'] ?? '',
          'valueRu': c['nameRu'] ?? c['name_ru'] ?? '',
          'hexCode': c['hexCode'] ?? c['hex_code'],
        }).toList(),
      });
    }
    if (sizeMap.isNotEmpty) {
      types.add({
        'id': 'legacy-size',
        'slug': 'size',
        'nameUz': 'O\'lcham',
        'nameRu': 'Размер',
        'displayType': 'text',
        'values': sizeMap.values.map((s) => <String, dynamic>{
          'id': s['id']?.toString(),
          'slug': '',
          'valueUz': s['nameUz'] ?? s['name_uz'] ?? '',
          'valueRu': s['nameRu'] ?? s['name_ru'] ?? '',
        }).toList(),
      });
    }

    setState(() {
      _variants = variantList;
      _optionTypes = types;
      // Auto-select first value per type
      if (_selectedValues.isEmpty) {
        for (final t in types) {
          final vals = t['values'] as List;
          if (vals.isNotEmpty) {
            _selectedValues[t['id'].toString()] = (vals.first as Map)['id'].toString();
          }
        }
      }
      _updateImagesForVariant();
    });
  }

  /// Tanlangan variant rasmlarini ko'rsatish
  void _updateImagesForVariant() {
    final v = _selectedVariant;
    if (v != null && v['images'] != null && (v['images'] as List).isNotEmpty) {
      _productImages = List<String>.from(v['images']).map((url) {
        if (url.startsWith('http')) return url;
        return 'https://topla.uz$url';
      }).toList();
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
        (product['colorSiblings'] as List)
            .map((s) => Map<String, dynamic>.from(s)),
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
      final images = List<String>.from(product['images']).map((url) {
        if (url.startsWith('http')) return url;
        return 'https://topla.uz$url';
      }).toList();
      // Remove duplicates while preserving order
      return images.toSet().toList();
    } else if (product['image'] != null) {
      final url = product['image'] as String;
      return [url.startsWith('http') ? url : 'https://topla.uz$url'];
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
          // App Bar
          _buildSliverAppBar(product, hasDiscount, discountPercent),

          // Image Carousel (below AppBar, Yandex Market style)
          SliverToBoxAdapter(
            child: _buildImageCarousel(product),
          ),

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

                  // 🎨 VARIANTS - All option types (generic)
                  if (_hasVariants && _optionTypes.isNotEmpty) ...[
                    for (final optType in _optionTypes) ...[
                      _buildOptionTypeSelector(optType),
                      const SizedBox(height: 16),
                    ],
                  ],

                  // Agar variant bo'lmasa, shunchaki bo'sh joy
                  if (!_hasVariants) const SizedBox(height: 8),

                  // 🏪 SHOP INFO
                  _buildShopInfo(),

                  const SizedBox(height: 20),

                  // TABBED: Tavsif | Xususiyatlar
                  _buildDescSpecTabs(product),

                  const SizedBox(height: 24),

                  // TABBED: O'xshash mahsulotlar | WOW narx
                  _buildBottomTabs(),

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
      pinned: true,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      foregroundColor: Colors.black,
      elevation: 0,
      leading: _buildBackButton(),
      actions: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
          child: Consumer<ProductsProvider>(
            builder: (context, provider, _) {
              final isFav =
                  _productId.isNotEmpty && provider.isFavorite(_productId);
              return Container(
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Favorite
                    GestureDetector(
                      onTap: () async {
                        if (_productId.isEmpty) return;
                        if (!context.read<AuthProvider>().isLoggedIn) {
                          Navigator.pushNamed(context, '/auth');
                          return;
                        }
                        try {
                          await provider.toggleFavorite(_productId);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text(provider.isFavorite(_productId)
                                  ? 'Sevimlilarga qo\'shildi'
                                  : 'Sevimlilardan olib tashlandi'),
                              backgroundColor: provider.isFavorite(_productId)
                                  ? AppColors.success
                                  : Colors.grey,
                            ));
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text(
                                  '${context.l10n.translate('error')}: $e'),
                              backgroundColor: AppColors.error,
                            ));
                          }
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Icon(
                          isFav
                              ? Icons.favorite
                              : Icons.favorite_border_rounded,
                          color: isFav ? AppColors.error : Colors.black87,
                          size: 19,
                        ),
                      ),
                    ),
                    // Share
                    GestureDetector(
                      onTap: () async {
                        final productName =
                            widget.product['name'] ?? 'Mahsulot';
                        final productPrice =
                            _formatPrice(widget.product['price']);
                        final message =
                            '$productName - $productPrice so\'m\n\nTOPLA Market da xarid qiling!\nhttps://topla.uz';
                        await Share.share(message, subject: productName);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Transform.scale(
                          scaleX: -1,
                          child: Icon(CupertinoIcons.reply,
                              color: Colors.black87, size: 21),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ============ IMAGE CAROUSEL (Yandex Market style) ============
  Widget _buildImageCarousel(Map<String, dynamic> product) {
    final screenWidth = MediaQuery.of(context).size.width;
    final imageHeight = screenWidth * 0.85;
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          SizedBox(
            height: imageHeight,
            child: _productImages.isNotEmpty
                ? PageView.builder(
                    controller: _pageController,
                    itemCount: _productImages.length,
                    onPageChanged: (index) =>
                        setState(() => _selectedImageIndex = index),
                    itemBuilder: (context, index) {
                      return GestureDetector(
                        onTap: () => _showFullScreenImage(index),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 8),
                          child: Hero(
                            tag: index == 0
                                ? 'product_${product['name']}'
                                : 'product_${product['name']}_$index',
                            child: CachedNetworkImage(
                              imageUrl: _productImages[index],
                              fit: BoxFit.contain,
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
            Padding(
              padding: const EdgeInsets.only(bottom: 12, top: 4),
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
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isActive
                            ? Colors.black.withValues(alpha: 0.8)
                            : Colors.black.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }

  // ============ WARRANTY BADGE ============
  Widget _buildWarrantyBadge(Map<String, dynamic> product) {
    final warranty = product['warranty'];
    if (warranty == null || warranty.toString().trim().isEmpty) {
      return const SizedBox.shrink();
    }
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
                      '$reviewCount ta sharh · $sold+ buyurtma',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right,
                      color: Colors.grey.shade400, size: 18),
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
                  child: const Icon(Icons.check,
                      color: AppColors.success, size: 18),
                ),
                const SizedBox(width: 10),
                Text(
                  '$stock dona xarid qilish mumkin',
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w500),
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
                  child: Icon(Iconsax.box_tick,
                      color: Colors.amber.shade700, size: 18),
                ),
                const SizedBox(width: 10),
                Text(
                  'Bu haftada $sold kishi sotib oldi',
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w500),
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
              '${_formatPrice(oldPrice)} ${context.l10n.currency}',
              style: TextStyle(
                  decoration: TextDecoration.lineThrough,
                  color: Colors.grey.shade500,
                  fontSize: 14),
            ),
          Text(
            '${_formatPrice(price)} ${context.l10n.currency}',
            style: const TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: Colors.black),
          ),
        ],
      ),
    );
  }

  // ============ SHOP INFO — Yandex Market style ============
  Widget _buildShopInfo() {
    final shopName = (_shop['name'] ?? 'Do\'kon') as String;
    final shopRating = (_shop['rating'] ?? 0);
    final rawReviews = _shop['reviewCount'] ?? _shop['review_count'] ?? 0;
    final shopReviews = rawReviews is num
        ? rawReviews.toInt()
        : (int.tryParse(rawReviews.toString()) ?? 0);
    final shopLogo = _shop['logoUrl'] ?? _shop['logo_url'] ?? _shop['logo'];
    final shopId = _shop['id']?.toString();
    final shopType = (_shop['shopType'] ?? _shop['shop_type'] ?? context.l10n.translate('shop_type_store')) as String;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Row(
          children: [
            // Rounded square logo
            GestureDetector(
              onTap: () => _navigateToShop(shopId, shopName),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200, width: 0.5),
                ),
                clipBehavior: Clip.antiAlias,
                child: shopLogo != null && shopLogo.toString().isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: shopLogo.toString(),
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Center(
                          child: Text(
                            shopName.isNotEmpty
                                ? shopName.substring(0, 1).toUpperCase()
                                : 'D',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      )
                    : Center(
                        child: Text(
                          shopName.isNotEmpty
                              ? shopName.substring(0, 1).toUpperCase()
                              : 'D',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            // Name + Type + Rating
            Expanded(
              child: GestureDetector(
                onTap: () => _navigateToShop(shopId, shopName),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shopName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          shopType,
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Iconsax.star_1,
                            size: 12, color: Colors.amber),
                        const SizedBox(width: 3),
                        Text(
                          '$shopRating',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                        if (shopReviews > 0)
                          Text(
                            ' ($shopReviews)',
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Chat icon + Heart icon
            InkWell(
              onTap: () {
                // Chat bilan to'g'ridan-to'g'ri do'kon sahifasiga o'tish
                if (shopId != null && shopId.isNotEmpty) {
                  _navigateToShop(shopId, shopName);
                }
              },
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Icon(Iconsax.message, size: 22, color: Colors.grey.shade600),
              ),
            ),
            GestureDetector(
              onTap: () => _toggleShopFollow(),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Icon(
                  _isFollowingShop ? Iconsax.heart_copy : Iconsax.heart,
                  size: 22,
                  color: _isFollowingShop ? Colors.red : Colors.grey.shade600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToShop(String? shopId, String shopName) {
    if (shopId != null && shopId.isNotEmpty) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ShopDetailScreen(
            shopId: shopId,
            shopName: shopName,
          ),
        ),
      );
    }
  }

  /// Do'konga xabar yozish
  Future<void> _openShopChat() async {
    final shopId = _shop['id']?.toString();
    if (shopId == null || shopId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Do\'kon topilmadi'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    // Auth tekshirish
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Avval tizimga kiring'),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    try {
      final shopProvider = context.read<ShopProvider>();
      final conversationId = await shopProvider.getOrCreateConversation(shopId);
      if (!mounted || conversationId == null) return;

      final shopName = (_shop['name'] ?? 'Do\'kon') as String;
      final shopLogo = _shop['logoUrl'] ?? _shop['logo_url'] ?? _shop['logo'];

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ShopChatScreen(
            conversationId: conversationId,
            shopName: shopName,
            shopLogoUrl: shopLogo?.toString(),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Xatolik: $e'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  // ============ GENERIC OPTION TYPE SELECTOR ============
  Widget _buildOptionTypeSelector(Map<String, dynamic> optType) {
    final typeId = optType['id']?.toString() ?? '';
    final displayType = optType['displayType'] ?? 'text';
    final typeName = optType['nameUz'] ?? '';
    final unit = optType['unit'];
    final values = List<Map<String, dynamic>>.from(optType['values'] ?? []);
    if (values.isEmpty) return const SizedBox.shrink();

    final selectedValId = _selectedValues[typeId];
    // Find selected value name
    String selectedName = '';
    for (final v in values) {
      if (v['id']?.toString() == selectedValId) {
        selectedName = v['valueUz']?.toString() ?? '';
        break;
      }
    }

    // Check which values are available given other selected options
    Set<String> availableIds = {};
    for (final variant in _variants) {
      final vvList = variant['variantValues'];
      if (vvList != null && vvList is List && vvList.isNotEmpty) {
        bool otherMatch = true;
        String? thisVal;
        for (final vv in vvList) {
          final tId = (vv['optionType']?['id'] ?? vv['optionTypeId'])?.toString();
          final valId = (vv['optionValue']?['id'] ?? vv['optionValueId'])?.toString();
          if (tId == typeId) {
            thisVal = valId;
          } else if (_selectedValues[tId] != null && _selectedValues[tId] != valId) {
            otherMatch = false;
            break;
          }
        }
        if (otherMatch && thisVal != null) availableIds.add(thisVal);
      } else {
        // Old format fallback: all values available
        for (final v in values) {
          availableIds.add(v['id']?.toString() ?? '');
        }
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
                '$typeName${unit != null ? ' ($unit)' : ''}: ',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
              ),
              Text(
                selectedName,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: values.map((val) {
              final vId = val['id']?.toString() ?? '';
              final isSelected = vId == selectedValId;
              final isAvailable = availableIds.contains(vId);
              final valName = val['valueUz']?.toString() ?? '';
              final hexCode = val['hexCode'] ?? val['hex_code'];

              if (displayType == 'color' && hexCode != null) {
                // Color swatch with optional image
                String? imageUrl;
                for (final v in _variants) {
                  final vvList = v['variantValues'];
                  if (vvList != null && vvList is List) {
                    for (final vv in vvList) {
                      final tId = (vv['optionType']?['id'] ?? vv['optionTypeId'])?.toString();
                      final valId = (vv['optionValue']?['id'] ?? vv['optionValueId'])?.toString();
                      if (tId == typeId && valId == vId && v['images'] != null && (v['images'] as List).isNotEmpty) {
                        imageUrl = (v['images'] as List).first.toString();
                        break;
                      }
                    }
                  } else {
                    // Old format
                    final vc = (v['colorId'] ?? v['color_id'])?.toString();
                    if (vc == vId && v['images'] != null && (v['images'] as List).isNotEmpty) {
                      imageUrl = (v['images'] as List).first.toString();
                    }
                  }
                  if (imageUrl != null) break;
                }

                final color = _parseColor(hexCode);
                return GestureDetector(
                  onTap: () {
                    if (!isAvailable || isSelected) return;
                    setState(() {
                      _selectedValues[typeId] = vId;
                      _updateImagesForVariant();
                    });
                  },
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? Colors.black87
                            : isAvailable
                                ? Colors.grey.shade300
                                : Colors.grey.shade200,
                        width: isSelected ? 2.5 : 1,
                      ),
                    ),
                    child: Opacity(
                      opacity: isAvailable ? 1.0 : 0.3,
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
                            : Container(color: color),
                      ),
                    ),
                  ),
                );
              }

              // Text/pill style (size, storage, RAM, material, etc.)
              return GestureDetector(
                onTap: () {
                  if (!isAvailable || isSelected) return;
                  setState(() {
                    _selectedValues[typeId] = vId;
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
                    valName,
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

  // ============ COLOR SELECTOR ============
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
                style:
                    const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
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
              final hexCode =
                  colorInfo['hexCode'] ?? colorInfo['hex_code'] ?? '';
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
                    final ct = _optionTypes.where((t) => t['slug'] == 'color' || t['displayType'] == 'color').toList();
                    if (ct.isNotEmpty) _selectedValues[ct.first['id'].toString()] = cId!;
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
                            child: color == Colors.white ? null : null,
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

  // ============ SIZE SELECTOR ============
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
                style:
                    const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
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
                  return vc == _selectedColorId &&
                      vs == sId &&
                      (v['stock'] ?? 0) > 0;
                });
              }

              return GestureDetector(
                onTap: () {
                  if (!isAvailable) return;
                  setState(() {
                    final st = _optionTypes.where((t) => t['slug'] == 'size').toList();
                    if (st.isNotEmpty) _selectedValues[st.first['id'].toString()] = sId!;
                    _updateImagesForVariant();
                  });
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
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

  // ============ TAB SELECTOR HELPER ============
  Widget _buildTabBar({
    required List<String> labels,
    required int selectedIndex,
    required ValueChanged<int> onTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200, width: 1),
        ),
      ),
      child: Row(
        children: List.generate(labels.length, (i) {
          final isSelected = i == selectedIndex;
          return GestureDetector(
            onTap: () => onTap(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding:
                  const EdgeInsets.only(left: 4, right: 16, top: 8, bottom: 10),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isSelected ? Colors.black87 : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? Colors.black87 : Colors.grey.shade400,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ============ TAVSIF + XUSUSIYATLAR TABS ============
  Widget _buildDescSpecTabs(Map<String, dynamic> product) {
    return Column(
      children: [
        _buildTabBar(
          labels: [
            context.l10n.translate('description'),
            'Xususiyatlar',
          ],
          selectedIndex: _descTabIndex,
          onTap: (i) => setState(() => _descTabIndex = i),
        ),
        const SizedBox(height: 16),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _descTabIndex == 0
              ? _buildDescriptionContent(product)
              : _buildSpecificationsContent(),
        ),
      ],
    );
  }

  Widget _buildDescriptionContent(Map<String, dynamic> product) {
    final rawDesc = product['description'] ??
        'Bu mahsulot haqida batafsil ma\'lumot. Sifatli materiallardan tayyorlangan, uzoq muddat xizmat qiladi.';
    // Strip HTML tags (vendor uses TipTap rich text editor)
    final cleanDesc = rawDesc
        .replaceAll(RegExp(r'<br\s*/?>'), '\n')
        .replaceAll(RegExp(r'</p>\s*<p>'), '\n\n')
        .replaceAll(RegExp(r'<li>'), '• ')
        .replaceAll(RegExp(r'</li>'), '\n')
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll(RegExp(r'&amp;'), '&')
        .replaceAll(RegExp(r'&lt;'), '<')
        .replaceAll(RegExp(r'&gt;'), '>')
        .replaceAll(RegExp(r'&quot;'), '"')
        .replaceAll(RegExp(r'&#39;'), "'")
        .replaceAll(RegExp(r'&nbsp;'), ' ')
        .trim();
    return Padding(
      key: const ValueKey('desc'),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Text(
        cleanDesc,
        style:
            TextStyle(color: Colors.grey.shade700, fontSize: 15, height: 1.5),
      ),
    );
  }

  Widget _buildSpecificationsContent() {
    if (_specifications.isEmpty) {
      return Padding(
        key: const ValueKey('specs_empty'),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Text(
          'Xususiyatlar haqida ma\'lumot yo\'q',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
        ),
      );
    }
    return Padding(
      key: const ValueKey('specs'),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: _specifications.asMap().entries.map((entry) {
            final index = entry.key;
            final spec = entry.value;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: index < _specifications.length - 1
                    ? Border(bottom: BorderSide(color: Colors.grey.shade200))
                    : null,
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: Text(
                      spec['key'] ?? '',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(
                      spec['value'] ?? '',
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
    );
  }

  // ============ O'XSHASH + WOW NARX TABS ============
  Widget _buildBottomTabs() {
    return Column(
      children: [
        _buildTabBar(
          labels: [
            'O\'xshash mahsulotlar',
            'WOW narx',
          ],
          selectedIndex: _bottomTabIndex,
          onTap: (i) => setState(() => _bottomTabIndex = i),
        ),
        const SizedBox(height: 16),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _bottomTabIndex == 0
              ? _buildSimilarProductsContent()
              : _buildWowProductsContent(),
        ),
      ],
    );
  }

  Widget _buildSimilarProductsContent() {
    return _buildProductHorizontalList(
      key: const ValueKey('similar'),
      products: _similarProducts,
      isLoading: _isSimilarLoading,
    );
  }

  Widget _buildWowProductsContent() {
    return _buildProductHorizontalList(
      key: const ValueKey('wow'),
      products: _wowProducts,
      isLoading: _isWowLoading,
    );
  }

  Widget _buildProductHorizontalList({
    required Key key,
    required List<Map<String, dynamic>> products,
    required bool isLoading,
  }) {
    if (isLoading) {
      return SizedBox(
        key: key,
        height: 220,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: 3,
          itemBuilder: (_, __) => Padding(
            padding: const EdgeInsets.only(right: 14),
            child: SizedBox(
              width: 160,
              child: ProductCardSkeleton(width: 160),
            ),
          ),
        ),
      );
    }

    if (products.isEmpty) {
      return SizedBox(
        key: key,
        height: 60,
        child: Center(
          child: Text(
            'Mahsulotlar topilmadi',
            style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
          ),
        ),
      );
    }

    return SizedBox(
      key: key,
      height: 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          return Padding(
            padding: const EdgeInsets.only(right: 14),
            child: SizedBox(
              width: 160,
              child: ProductCard(
                name: product['name'] ?? '',
                price: product['price'] ?? 0,
                oldPrice: product['oldPrice'],
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
                  final cartProvider =
                      Provider.of<CartProvider>(context, listen: false);
                  final pid = product['id']?.toString() ?? '';
                  cartProvider.addToCart(pid).then((_) {
                    if (!mounted) return;
                    HapticUtils.addToCart();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(Iconsax.tick_circle,
                                color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Text(context.l10n.translate('added_to_cart')),
                          ],
                        ),
                        backgroundColor: AppColors.success,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  });
                },
              ),
            ),
          );
        },
      ),
    );
  }

  // ============ BOTTOM BAR ============
  Widget _buildBottomBar(Map<String, dynamic> product, int stock) {
    final isOutOfStock = stock <= 0;
    // Variant kerak lekin tanlanmagan holat
    final needsVariant = _hasVariants && _selectedVariant == null;
    final isDisabled = isOutOfStock || needsVariant;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.75),
            border: Border(
              top: BorderSide(
                color: Colors.grey.shade200.withValues(alpha: 0.5),
                width: 0.5,
              ),
            ),
          ),
          child: SafeArea(
            child: Row(
              children: [
                // === CHAP: Savatga tugmasi / Counter ===
                Expanded(
                  child: _isInCart && !isDisabled
                      // Savatda bor — counter ko'rsatish
                      ? Container(
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.07),
                            borderRadius: BorderRadius.circular(50),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.25),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _buildCounterButton(
                                icon: _cartItemQuantity > 1
                                    ? Icons.remove
                                    : Icons.delete_outline,
                                onTap: () {
                                  HapticUtils.lightImpact();
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
                              ),
                              Text(
                                '$_cartItemQuantity',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              _buildCounterButton(
                                icon: Icons.add,
                                onTap: () {
                                  HapticUtils.lightImpact();
                                  setState(() => _cartItemQuantity++);
                                  _updateCartQuantity();
                                },
                              ),
                            ],
                          ),
                        )
                      // Savatda yo'q — "Savatga" tugmasi
                      : OutlinedButton.icon(
                          onPressed:
                              isDisabled ? null : () => _addToCart(context),
                          icon: Icon(
                            Iconsax.bag_2,
                            size: 18,
                            color: isDisabled
                                ? Colors.grey.shade400
                                : AppColors.primary,
                          ),
                          label: Text(
                            isOutOfStock
                                ? 'Tugagan'
                                : needsVariant
                                    ? 'Tanlang'
                                    : 'Savatga',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: isDisabled
                                  ? Colors.grey.shade400
                                  : AppColors.primary,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            minimumSize: const Size(0, 42),
                            side: BorderSide(
                              color: isDisabled
                                  ? Colors.grey.shade300
                                  : AppColors.primary.withValues(alpha: 0.4),
                              width: 1,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(50),
                            ),
                          ),
                        ),
                ),
                const SizedBox(width: 10),
                // === O'NG: Sotib olish tugmasi ===
                Expanded(
                  child: ElevatedButton(
                    onPressed: isDisabled ? null : () => _buyNow(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isDisabled ? Colors.grey.shade300 : AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                      disabledForegroundColor: Colors.grey.shade500,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      minimumSize: const Size(0, 42),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50),
                      ),
                    ),
                    child: Text(
                      isOutOfStock
                          ? 'Tugagan'
                          : needsVariant
                              ? 'Tanlang'
                              : 'Sotib olish',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Counter +/- tugmalari
  Widget _buildCounterButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 38,
        height: 42,
        child: Center(
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
      ),
    );
  }

  /// Hozir sotib olish - to'g'ri checkout sahifasiga o'tish
  void _buyNow(BuildContext context) {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.pushNamed(context, '/auth');
      return;
    }
    // Haptic feedback
    HapticUtils.addToCart();

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final productId = widget.product['id']?.toString() ??
        DateTime.now().millisecondsSinceEpoch.toString();

    // Variant tanlangan bo'lsa, variantId ni ham yuborish
    final variant = _selectedVariant;
    final variantId = variant?['id']?.toString();

    cartProvider
        .addToCart(productId, quantity: 1, variantId: variantId)
        .then((_) {
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
            color: Colors.grey.shade200.withValues(alpha: 0.7),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back_ios_new, size: 16),
        ),
      ),
    );
  }

  // ignore: unused_element
  Widget _buildActionIconButton({
    IconData? icon,
    Widget? child,
    Color? iconColor,
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
          child: Center(
            child: child ??
                Icon(icon, color: iconColor ?? Colors.grey.shade700, size: 19),
          ),
        ),
      ),
    );
  }

  // ignore: unused_element
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

  // ignore: unused_element
  Widget _buildPillButton({
    IconData? icon,
    Widget? child,
    Color? color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 36,
        height: 36,
        child: Center(
          child: child ?? Icon(icon, color: color ?? Colors.black87, size: 19),
        ),
      ),
    );
  }

  Widget _buildCompareIcon({bool active = false}) {
    final color = active ? AppColors.primary : Colors.black87;
    return SizedBox(
      width: 22,
      height: 22,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 1,
            top: 1,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    active ? AppColors.primary.withValues(alpha: 0.15) : null,
                border: Border.all(
                  color: color,
                  width: 1.6,
                ),
              ),
            ),
          ),
          Positioned(
            left: 7,
            top: 7,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    active ? AppColors.primary.withValues(alpha: 0.15) : null,
                border: Border.all(
                  color: color,
                  width: 1.6,
                ),
              ),
            ),
          ),
        ],
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

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final numPrice =
        price is num ? price.toInt() : int.tryParse(price.toString()) ?? 0;
    return numPrice.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ');
  }

  void _addToCart(BuildContext context) {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.pushNamed(context, '/auth');
      return;
    }
    HapticUtils.addToCart();

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final productId = widget.product['id']?.toString() ??
        DateTime.now().millisecondsSinceEpoch.toString();

    // Variant tanlangan bo'lsa, variantId ni ham yuborish
    final variant = _selectedVariant;
    final variantId = variant?['id']?.toString();

    cartProvider
        .addToCart(productId, quantity: 1, variantId: variantId)
        .then((_) {
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
