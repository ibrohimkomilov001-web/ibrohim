import 'dart:math' as math;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/product_card.dart';
import '../../widgets/shein_filter_sheet.dart';
import '../../widgets/product_skeleton.dart';
import '../product/product_detail_screen.dart';
import '../search/search_screen.dart';

/// Professional kategoriya ichidagi mahsulotlar sahifasi
/// Filter, Grid/List toggle, Skeleton loading, Sticky header
class CategoryDetailScreen extends StatefulWidget {
  final CategoryModel category;
  final Color categoryColor;

  const CategoryDetailScreen({
    super.key,
    required this.category,
    required this.categoryColor,
  });

  @override
  State<CategoryDetailScreen> createState() => _CategoryDetailScreenState();
}

class _CategoryDetailScreenState extends State<CategoryDetailScreen>
    with SingleTickerProviderStateMixin {
  // ignore: unused_field
  List<ProductModel> _products = [];
  List<ProductModel> _filteredProducts = [];
  List<CategoryModel> _subCategories = [];
  List<BrandModel> _brands = [];
  // ignore: unused_field
  List<ColorOption> _colors = [];
  // ignore: unused_field
  List<CategoryFilterAttribute> _categoryFilters = [];
  ProductFacets? _facets;
  int _totalProductCount = 0;
  bool _isLoading = true;
  bool _isGridView = true;

  // Pagination
  int _currentPage = 1;
  bool _isLoadingMore = false;
  bool _hasMorePages = true;
  static const int _pageSize = 20;
  String? _selectedSubCategoryId;
  ProductFilter _filter = ProductFilter.empty();
  bool _hasLoadedInitialData = false; // Subcategoriyalar yuklandimi?
  bool _showAllProducts = false; // Barcha mahsulotlarni ko'rsatish

  late AnimationController _animationController;
  final ScrollController _scrollController = ScrollController();
  bool _isHeaderCollapsed = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scrollController.addListener(_onScroll);
    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    final collapsed = _scrollController.offset > 100;
    if (collapsed != _isHeaderCollapsed) {
      setState(() => _isHeaderCollapsed = collapsed);
    }
  }

  bool get _isUzbek => context.l10n.locale.languageCode == 'uz';

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    try {
      // Subcategoriyalarni category modeldan olish (API allaqachon qaytargan)
      _subCategories = widget.category.subcategories;

      // Initial data yuklandi - endi qaysi view ko'rsatishni bilamiz
      if (mounted) {
        setState(() => _hasLoadedInitialData = true);
      }

      // Agar subcategoriya yo'q bo'lsa, mahsulotlarni yuklash
      if (_subCategories.isEmpty) {
        await _loadProducts();
        // Filter ma'lumotlarini yuklash
        await _loadFilterData();
      }
    } catch (e) {
      if (mounted) {
        _showError(
            _isUzbek ? 'Ma\'lumotlarni yuklashda xatolik' : 'Ошибка загрузки');
      }
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  /// Filter ma'lumotlarini yuklash (brendlar, ranglar, kategoriya filterlari, facets)
  Future<void> _loadFilterData() async {
    try {
      final productsProvider = context.read<ProductsProvider>();
      final categoryId = _selectedSubCategoryId ?? widget.category.id;

      // Parallel yuklash
      final results = await Future.wait([
        productsProvider.getBrandsByCategory(categoryId),
        productsProvider.getColorsByCategory(categoryId),
        productsProvider.getCategoryFilters(categoryId),
        productsProvider.getFacets(categoryId),
      ]);

      if (mounted) {
        setState(() {
          _brands = results[0] as List<BrandModel>;
          _colors = results[1] as List<ColorOption>;
          _categoryFilters = results[2] as List<CategoryFilterAttribute>;
          _facets = results[3] as ProductFacets;
        });
      }
    } catch (e) {
      debugPrint('Error loading filter data: $e');
    }
  }

  Future<void> _loadProducts(
      {bool showLoading = false, bool loadMore = false}) async {
    if (loadMore) {
      if (_isLoadingMore || !_hasMorePages) return;
      setState(() => _isLoadingMore = true);
    } else {
      // Reset pagination
      _currentPage = 1;
      _hasMorePages = true;
      if (showLoading && mounted) {
        setState(() => _isLoading = true);
      }
    }

    try {
      final productsProvider = context.read<ProductsProvider>();
      final categoryId = _selectedSubCategoryId ?? widget.category.id;

      final page = loadMore ? _currentPage + 1 : 1;
      final offset = (page - 1) * _pageSize;

      // Server-side filtering orqali yuklash
      final result = await productsProvider.getFilteredProducts(
        categoryId: categoryId,
        filter: _filter,
        limit: _pageSize,
        offset: offset,
      );

      if (mounted) {
        setState(() {
          if (loadMore) {
            _filteredProducts = [..._filteredProducts, ...result.products];
            _products = _filteredProducts;
            _currentPage = page;
          } else {
            _filteredProducts = result.products;
            _products = result.products;
          }
          _totalProductCount = result.totalCount;
          _hasMorePages = _filteredProducts.length < result.totalCount;
        });
      }
    } catch (e) {
      debugPrint('Error loading products: $e');
      if (mounted && !loadMore) {
        _showError(_isUzbek
            ? 'Mahsulotlarni yuklashda xatolik'
            : 'Ошибка загрузки товаров');
      }
    }

    if (mounted) {
      if (loadMore) {
        setState(() => _isLoadingMore = false);
      } else if (showLoading) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _applyFilters() {
    _loadProducts(showLoading: true);
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _addToCart(ProductModel product) async {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.pushNamed(context, '/auth');
      return;
    }
    try {
      await context.read<CartProvider>().addToCart(product.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isUzbek ? 'Savatga qo\'shildi' : 'Добавлено в корзину',
            ),
            backgroundColor: AppColors.success,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      _showError(_isUzbek ? 'Qo\'shishda xatolik' : 'Ошибка');
    }
  }

  void _toggleFavorite(ProductModel product) async {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.pushNamed(context, '/auth');
      return;
    }
    try {
      await context.read<ProductsProvider>().toggleFavorite(product.id);
    } catch (e) {
      _showError(_isUzbek ? 'Xatolik' : 'Ошибка');
    }
  }

  Future<void> _openFilterSheet() async {
    final newFilter = await SheinFilterSheet.show(
      context,
      currentFilter: _filter,
      categoryName: widget.category.getName(_isUzbek ? 'uz' : 'ru'),
      accentColor: widget.categoryColor,
      productCount: _totalProductCount,
      brands: _brands,
      colors: _colors,
      facets: _facets,
      categoryAttributes: _categoryFilters,
    );
    if (newFilter != null && mounted) {
      setState(() => _filter = newFilter);
      _loadProducts(showLoading: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Agar hali ma'lumotlar yuklanmagan bo'lsa - loading ko'rsatish
    // Agar subcategoriya bo'lsa - faqat subcategoriyalar ko'rsatiladi
    // Agar subcategoriya yo'q bo'lsa - mahsulotlar + filter bar
    // Agar "Barcha mahsulotlar" tanlangan bo'lsa - mahsulotlar ko'rsatiladi
    final bool hasSubCategories = _subCategories.isNotEmpty;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: !_hasLoadedInitialData
            ? _buildInitialLoadingView()
            : (hasSubCategories && !_showAllProducts)
                ? _buildSubCategoryOnlyView()
                : _buildProductListingView(),
      ),
    );
  }

  /// Initial loading - subcategoriyalar yuklanguncha
  Widget _buildInitialLoadingView() {
    return Column(
      children: [
        _buildSimpleAppBar(),
        Expanded(
          child: _buildShimmerList(),
        ),
      ],
    );
  }

  /// Shimmer skeleton list - kategoriya/subkategoriya yuklanayotganda
  Widget _buildShimmerList() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSizes.md),
      itemCount: 8,
      itemBuilder: (context, index) {
        return _ShimmerListItem(index: index);
      },
    );
  }

  /// Faqat subcategoriyalar ro'yxati (mahsulotlarsiz)
  Widget _buildSubCategoryOnlyView() {
    return Column(
      children: [
        // App Bar
        _buildSimpleAppBar(),
        // Subcategoriyalar ro'yxati
        Expanded(
          child: _isLoading
              ? _buildShimmerList()
              : ListView(
                  padding: const EdgeInsets.only(top: AppSizes.sm),
                  children: [
                    Container(
                      margin:
                          const EdgeInsets.symmetric(horizontal: AppSizes.md),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                      ),
                      child: Column(
                        children: [
                          // Barcha mahsulotlarni ko'rish - birinchi bo'lib chiqadi
                          _buildSubCategoryItem(
                            label:
                                _isUzbek ? 'Barcha mahsulotlar' : 'Все товары',
                            isSelected: false,
                            onTap: () async {
                              setState(() {
                                _showAllProducts = true;
                                _isLoading = true;
                              });
                              await _loadProducts();
                              await _loadFilterData();
                              if (mounted) {
                                setState(() => _isLoading = false);
                              }
                            },
                            showDivider: true,
                          ),
                          // Subcategoriyalar ro'yxati
                          ...List.generate(_subCategories.length, (index) {
                            final subCategory = _subCategories[index];
                            return _buildSubCategoryItem(
                              label: subCategory
                                  .getName(context.l10n.locale.languageCode),
                              isSelected: false,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => CategoryDetailScreen(
                                      category: subCategory,
                                      categoryColor: widget.categoryColor,
                                    ),
                                  ),
                                );
                              },
                              showDivider: index < _subCategories.length - 1,
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  /// Mahsulotlar sahifasi - Uzum uslubida filter bar + products
  Widget _buildProductListingView() {
    return NestedScrollView(
      controller: _scrollController,
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        _buildSliverAppBar(),
        _buildUzumFilterBar(),
        if (_filter.hasActiveFilters) _buildActiveFilterChips(),
      ],
      body: _isLoading
          ? _isGridView
              ? const ProductsSkeletonGrid(itemCount: 6)
              : const ProductsSkeletonList(itemCount: 6)
          : _buildProductsView(),
    );
  }

  /// Faol filterlarni ko'rsatuvchi chips (har bir filterni alohida olib tashlash mumkin)
  Widget _buildActiveFilterChips() {
    final chips = <Widget>[];

    // Narx
    if (_filter.minPrice != null || _filter.maxPrice != null) {
      String priceLabel = '';
      if (_filter.minPrice != null && _filter.maxPrice != null) {
        priceLabel =
            '${_formatChipPrice(_filter.minPrice!)} - ${_formatChipPrice(_filter.maxPrice!)}';
      } else if (_filter.minPrice != null) {
        priceLabel = '${_formatChipPrice(_filter.minPrice!)}+';
      } else {
        priceLabel =
            '${_isUzbek ? 'gacha' : 'до'} ${_formatChipPrice(_filter.maxPrice!)}';
      }
      chips.add(_buildRemovableChip(
        '💰 $priceLabel',
        () {
          setState(() => _filter = _filter.copyWith(
                clearMinPrice: true,
                clearMaxPrice: true,
              ));
          _loadProducts(showLoading: true);
        },
      ));
    }

    // Reyting
    if (_filter.minRating != null) {
      chips.add(_buildRemovableChip(
        '⭐ ${_filter.minRating}+',
        () {
          setState(() => _filter = _filter.copyWith(clearMinRating: true));
          _loadProducts(showLoading: true);
        },
      ));
    }

    // Brendlar
    for (final brandId in _filter.brandIds) {
      final brand = _brands.where((b) => b.id == brandId).firstOrNull;
      if (brand != null) {
        chips.add(_buildRemovableChip(
          brand.nameUz,
          () {
            final newBrands = Set<String>.from(_filter.brandIds)
              ..remove(brandId);
            setState(() => _filter = _filter.copyWith(brandIds: newBrands));
            _loadProducts(showLoading: true);
          },
        ));
      }
    }

    // Ranglar
    for (final colorId in _filter.colorIds) {
      final color = _colors.where((c) => c.id == colorId).firstOrNull;
      if (color != null) {
        chips.add(_buildRemovableColorChip(
          color,
          () {
            final newColors = Set<String>.from(_filter.colorIds)
              ..remove(colorId);
            setState(() => _filter = _filter.copyWith(colorIds: newColors));
            _loadProducts(showLoading: true);
          },
        ));
      }
    }

    // O'lchamlar
    for (final sizeId in _filter.sizeIds) {
      final size = _facets?.sizes.where((s) => s.id == sizeId).firstOrNull;
      if (size != null) {
        chips.add(_buildRemovableChip(
          '📐 ${size.nameUz}',
          () {
            final newSizes = Set<String>.from(_filter.sizeIds)..remove(sizeId);
            setState(() => _filter = _filter.copyWith(sizeIds: newSizes));
            _loadProducts(showLoading: true);
          },
        ));
      }
    }

    // Holat toggles
    if (_filter.onlyWithDiscount) {
      chips.add(_buildRemovableChip(
        '🏷️ ${_isUzbek ? 'Chegirma' : 'Скидка'}',
        () {
          setState(() => _filter = _filter.copyWith(onlyWithDiscount: false));
          _loadProducts(showLoading: true);
        },
      ));
    }
    if (_filter.onlyInStock) {
      chips.add(_buildRemovableChip(
        '📦 ${_isUzbek ? 'Mavjud' : 'В наличии'}',
        () {
          setState(() => _filter = _filter.copyWith(onlyInStock: false));
          _loadProducts(showLoading: true);
        },
      ));
    }

    // Tozalash tugmasi
    chips.add(
      GestureDetector(
        onTap: () {
          setState(() {
            _filter = ProductFilter.empty();
          });
          _loadProducts(showLoading: true);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            _isUzbek ? 'Tozalash' : 'Очистить',
            style: TextStyle(
              color: Colors.red.shade700,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );

    return SliverToBoxAdapter(
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        child: Wrap(
          spacing: 6,
          runSpacing: 6,
          children: chips,
        ),
      ),
    );
  }

  Widget _buildRemovableChip(String label, VoidCallback onRemove) {
    return Container(
      padding: const EdgeInsets.only(left: 10, right: 4, top: 4, bottom: 4),
      decoration: BoxDecoration(
        color: widget.categoryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: widget.categoryColor.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              color: widget.categoryColor,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 2),
          GestureDetector(
            onTap: onRemove,
            child: Icon(
              Icons.close_rounded,
              size: 16,
              color: widget.categoryColor.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRemovableColorChip(ColorOption color, VoidCallback onRemove) {
    Color colorValue;
    try {
      String hex = color.hexCode.replaceAll('#', '');
      if (hex.length == 6) hex = 'FF$hex';
      colorValue = Color(int.parse(hex, radix: 16));
    } catch (_) {
      colorValue = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.only(left: 6, right: 4, top: 4, bottom: 4),
      decoration: BoxDecoration(
        color: widget.categoryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: widget.categoryColor.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: colorValue,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.grey.shade300, width: 0.5),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            color.nameUz,
            style: TextStyle(
              color: widget.categoryColor,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 2),
          GestureDetector(
            onTap: onRemove,
            child: Icon(
              Icons.close_rounded,
              size: 16,
              color: widget.categoryColor.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  String _formatChipPrice(double price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K';
    }
    return price.toStringAsFixed(0);
  }

  /// Oddiy app bar (subcategoriyalar sahifasi uchun)
  Widget _buildSimpleAppBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(
              Icons.arrow_back_ios,
              color: Colors.black87,
              size: 20,
            ),
          ),
          Expanded(
            child: Text(
              widget.category.getName(context.l10n.locale.languageCode),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        onPressed: () {
          // Agar "Barcha mahsulotlar" ko'rsatilayotgan bo'lsa va subcategoriyalar mavjud bo'lsa
          // -> subcategoriyalar ro'yxatiga qaytish
          if (_showAllProducts && _subCategories.isNotEmpty) {
            setState(() => _showAllProducts = false);
          } else {
            Navigator.pop(context);
          }
        },
        icon: const Icon(
          Icons.arrow_back_ios,
          color: Colors.black87,
          size: 20,
        ),
      ),
      title: Text(
        widget.category.getName(context.l10n.locale.languageCode),
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.black,
        ),
      ),
      actions: [
        IconButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SearchScreen()),
            );
          },
          icon: Icon(
            Icons.search,
            color: Colors.grey.shade700,
          ),
        ),
        Stack(
          children: [
            IconButton(
              onPressed: _openFilterSheet,
              icon: Icon(
                Icons.tune,
                color: _filter.hasActiveFilters
                    ? widget.categoryColor
                    : Colors.grey.shade700,
              ),
            ),
            if (_filter.activeFilterCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: widget.categoryColor,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '${_filter.activeFilterCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  /// Uzum uslubidagi filter bar
  Widget _buildUzumFilterBar() {
    return SliverToBoxAdapter(
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: AppSizes.sm),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
          child: Row(
            children: [
              // Sort icon button
              _buildFilterIconButton(
                icon: Icons.sort,
                onTap: _showSortOptions,
                isActive: _filter.sortBy != null &&
                    _filter.sortBy != ProductFilter.sortByPopular,
              ),
              const SizedBox(width: 12),
              // Divider
              Container(
                width: 1,
                height: 24,
                color: Colors.grey.shade300,
              ),
              const SizedBox(width: 12),
              // Turkumlar chip
              _buildFilterChip(
                label: _isUzbek ? 'Turkumlar' : 'Категории',
                onTap: () => _showCategoryFilterSheet(),
              ),
              const SizedBox(width: 8),
              // Narxi chip
              _buildFilterChip(
                label: _isUzbek ? 'Narxi' : 'Цена',
                onTap: () => _showPriceFilterSheet(),
                isActive: _filter.minPrice != null || _filter.maxPrice != null,
              ),
              const SizedBox(width: 8),
              // Yetkazish muddati chip
              _buildFilterChip(
                label: _isUzbek ? 'Yetkazish muddati' : 'Срок доставки',
                onTap: () => _showDeliveryFilterSheet(),
                isActive: _filter.deliveryHours != null,
              ),
              const SizedBox(width: 8),
              // Yetkazish usuli chip
              _buildFilterChip(
                label: _isUzbek ? 'Yetkazish usuli' : 'Способ доставки',
                onTap: () => _showDeliveryTypeFilterSheet(),
                isActive: _filter.deliveryType != null,
              ),
              const SizedBox(width: 8),
              // Reyting chip
              _buildFilterChip(
                label: _isUzbek ? 'Reyting' : 'Рейтинг',
                onTap: () => _showRatingFilterSheet(),
                isActive: _filter.minRating != null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterIconButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isActive = false,
    int badgeCount = 0,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: isActive
              ? widget.categoryColor.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          border: isActive
              ? Border.all(color: widget.categoryColor, width: 1.5)
              : null,
        ),
        child: Stack(
          children: [
            Center(
              child: Icon(
                icon,
                color: isActive ? widget.categoryColor : Colors.grey.shade700,
                size: 18,
              ),
            ),
            if (badgeCount > 0)
              Positioned(
                top: 2,
                right: 2,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: widget.categoryColor,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$badgeCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive
              ? widget.categoryColor.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          border: isActive
              ? Border.all(color: widget.categoryColor, width: 1.5)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isActive ? widget.categoryColor : Colors.grey.shade800,
                fontSize: 13,
                height: 1.2,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down,
              size: 16,
              color: isActive ? widget.categoryColor : Colors.grey.shade600,
            ),
          ],
        ),
      ),
    );
  }

  void _showCategoryFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PremiumFilterSheet(
        title: _isUzbek ? 'Turkumlar' : 'Категории',
        categoryColor: widget.categoryColor,
        child: _buildCategoryFilterContent(),
      ),
    );
  }

  Widget _buildCategoryFilterContent() {
    return Column(
      children: [
        // Barcha turkumlar
        _buildPremiumSelectableItem(
          icon: Icons.apps_rounded,
          label: _isUzbek ? 'Barcha turkumlar' : 'Все категории',
          isSelected: _selectedSubCategoryId == null,
          onTap: () {
            setState(() => _selectedSubCategoryId = null);
            _loadProducts(showLoading: true);
            Navigator.pop(context);
          },
        ),
        if (_subCategories.isNotEmpty) ...[
          const Divider(height: 24),
          ...List.generate(_subCategories.length, (index) {
            final sub = _subCategories[index];
            return _buildPremiumSelectableItem(
              icon: Icons.category_outlined,
              label: sub.getName(context.l10n.locale.languageCode),
              isSelected: _selectedSubCategoryId == sub.id,
              onTap: () {
                setState(() => _selectedSubCategoryId = sub.id);
                _loadProducts(showLoading: true);
                Navigator.pop(context);
              },
            );
          }),
        ],
      ],
    );
  }

  Widget _buildPremiumSelectableItem({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? widget.categoryColor.withValues(alpha: 0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? widget.categoryColor : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? widget.categoryColor.withValues(alpha: 0.2)
                    : Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isSelected ? widget.categoryColor : Colors.grey.shade600,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? widget.categoryColor : Colors.black87,
                ),
              ),
            ),
            if (isSelected)
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: widget.categoryColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showPriceFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SheinPriceFilterSheet(
        categoryColor: widget.categoryColor,
        currentMinPrice: _filter.minPrice,
        currentMaxPrice: _filter.maxPrice,
        onApply: (min, max) {
          setState(() {
            _filter = _filter.copyWith(
              minPrice: min,
              maxPrice: max,
            );
          });
          _applyFilters();
        },
      ),
    );
  }

  // ignore: unused_element
  Widget _buildQuickPriceChip(
      String label, double min, double max, StateSetter setSheetState) {
    final isSelected = _filter.minPrice == min && _filter.maxPrice == max;
    return GestureDetector(
      onTap: () {
        setState(() {
          _filter = _filter.copyWith(
            minPrice: min > 0 ? min : null,
            maxPrice: max < 10000000 ? max : null,
            clearMinPrice: min == 0,
          );
        });
        _applyFilters();
        Navigator.pop(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? widget.categoryColor.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? widget.categoryColor : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? widget.categoryColor : Colors.grey.shade700,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  // ignore: unused_element
  Widget _buildPriceInputField({
    required String label,
    required double value,
    required Function(double) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade500,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _formatPrice(value),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(double price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M so\'m';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K so\'m';
    }
    return '${price.toStringAsFixed(0)} so\'m';
  }

  void _showDeliveryFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  _isUzbek ? 'Yetkazish muddati' : 'Срок доставки',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 12,
                  children: [
                    _buildOptionChip(
                      label: _isUzbek ? '3 kungacha' : 'До 3 дней',
                      isActive: _filter.deliveryHours == 72,
                      onTap: () {
                        setState(() => _filter = _filter.copyWith(
                            deliveryHours: 72, clearDeliveryHours: false));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                    _buildOptionChip(
                      label: _isUzbek ? '7 kungacha' : 'До 7 дней',
                      isActive: _filter.deliveryHours == 168,
                      onTap: () {
                        setState(() => _filter = _filter.copyWith(
                            deliveryHours: 168, clearDeliveryHours: false));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                    _buildOptionChip(
                      label: _isUzbek ? 'Muhim emas' : 'Не важно',
                      isActive: _filter.deliveryHours == null,
                      onTap: () {
                        setState(() => _filter =
                            _filter.copyWith(clearDeliveryHours: true));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEBEBEB),
                      foregroundColor: Colors.black,
                      elevation: 0,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50),
                      ),
                    ),
                    child: Text(
                      _isUzbek ? 'Bekor qilish' : 'Отмена',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeliveryTypeFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  _isUzbek ? 'Yetkazish usuli' : 'Способ доставки',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 12,
                  children: [
                    _buildOptionChip(
                      label: _isUzbek ? 'Kuryer' : 'Курьер',
                      isActive: _filter.deliveryType == 'courier',
                      onTap: () {
                        setState(() => _filter = _filter.copyWith(
                            deliveryType: 'courier', clearDeliveryType: false));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                    _buildOptionChip(
                      label:
                          _isUzbek ? 'Topshirish punktiga' : 'В пункт выдачи',
                      isActive: _filter.deliveryType == 'pickup_point',
                      onTap: () {
                        setState(() => _filter = _filter.copyWith(
                            deliveryType: 'pickup_point',
                            clearDeliveryType: false));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                    _buildOptionChip(
                      label: _isUzbek ? 'Olib ketish' : 'Самовывоз',
                      isActive: _filter.deliveryType == 'pickup',
                      onTap: () {
                        setState(() => _filter = _filter.copyWith(
                            deliveryType: 'pickup', clearDeliveryType: false));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                    _buildOptionChip(
                      label: _isUzbek ? 'Muhim emas' : 'Не важно',
                      isActive: _filter.deliveryType == null,
                      onTap: () {
                        setState(() => _filter =
                            _filter.copyWith(clearDeliveryType: true));
                        _applyFilters();
                        Navigator.pop(context);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEBEBEB),
                      foregroundColor: Colors.black,
                      elevation: 0,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50),
                      ),
                    ),
                    child: Text(
                      _isUzbek ? 'Bekor qilish' : 'Отмена',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionChip({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF333333) : const Color(0xFFF2F2F2),
          borderRadius: BorderRadius.circular(50),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isActive) ...[
              Container(
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFFFD100),
                ),
                child: Center(
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : Colors.black,
                fontSize: 14,
                fontWeight: isActive ? FontWeight.w500 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRatingFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PremiumFilterSheet(
        title: _isUzbek ? 'Reyting bo\'yicha' : 'По рейтингу',
        categoryColor: widget.categoryColor,
        child: _buildRatingFilterContent(),
      ),
    );
  }

  Widget _buildRatingFilterContent() {
    return Column(
      children: [
        _buildPremiumRatingTile(4.5),
        const SizedBox(height: 8),
        _buildPremiumRatingTile(4.0),
        const SizedBox(height: 8),
        _buildPremiumRatingTile(3.5),
        const SizedBox(height: 8),
        _buildPremiumRatingTile(3.0),
        if (_filter.minRating != null) ...[
          const SizedBox(height: 16),
          TextButton.icon(
            onPressed: () {
              setState(() {
                _filter = _filter.copyWith(clearMinRating: true);
              });
              _applyFilters();
              Navigator.pop(context);
            },
            icon: const Icon(Icons.close, size: 18),
            label: Text(_isUzbek ? 'Filtrni tozalash' : 'Сбросить фильтр'),
            style: TextButton.styleFrom(
              foregroundColor: Colors.grey.shade600,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPremiumRatingTile(double rating) {
    final isSelected = _filter.minRating == rating;
    return GestureDetector(
      onTap: () {
        setState(() {
          _filter = _filter.copyWith(minRating: rating);
        });
        _applyFilters();
        Navigator.pop(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? widget.categoryColor.withValues(alpha: 0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? widget.categoryColor : Colors.grey.shade200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            // Stars
            Row(
              children: List.generate(5, (index) {
                final filled = index < rating.floor();
                final half = !filled && index < rating;
                return Padding(
                  padding: const EdgeInsets.only(right: 2),
                  child: Icon(
                    filled
                        ? Icons.star_rounded
                        : (half
                            ? Icons.star_half_rounded
                            : Icons.star_outline_rounded),
                    color: Colors.amber.shade600,
                    size: 22,
                  ),
                );
              }),
            ),
            const SizedBox(width: 12),
            // Rating text
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isSelected ? widget.categoryColor : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                rating.toString(),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : Colors.grey.shade700,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _isUzbek ? 'va yuqori' : 'и выше',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const Spacer(),
            if (isSelected)
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: widget.categoryColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ignore: unused_element
  Widget _buildSubCategoriesSliver() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.only(top: AppSizes.sm),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        ),
        child: Column(
          children: [
            // "Barcha mahsulotlarni ko'rish" birinchi element
            _buildSubCategoryItem(
              label: _isUzbek
                  ? 'Barcha mahsulotlarni ko\'rish'
                  : 'Показать все товары',
              isSelected: false,
              showProductCount: false,
              onTap: () {
                setState(() => _selectedSubCategoryId = null);
                _loadProducts(showLoading: true);
              },
            ),
            // Subcategoriyalar - har biri alohida sahifaga o'tadi
            ...List.generate(_subCategories.length, (index) {
              final subCategory = _subCategories[index];
              return _buildSubCategoryItem(
                label: subCategory.getName(context.l10n.locale.languageCode),
                isSelected: false,
                onTap: () {
                  // Alohida sahifaga o'tish
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CategoryDetailScreen(
                        category: subCategory,
                        categoryColor: widget.categoryColor,
                      ),
                    ),
                  );
                },
                showDivider: index < _subCategories.length - 1,
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildSubCategoryItem({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    int? productCount,
    bool showProductCount = false,
    bool showDivider = true,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSizes.lg,
              vertical: AppSizes.md,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w500,
                      color: isSelected ? widget.categoryColor : Colors.black87,
                    ),
                  ),
                ),
                if (showProductCount && productCount != null) ...[
                  Text(
                    '$productCount ${_isUzbek ? 'ta' : 'шт'}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Icon(
                  Icons.chevron_right,
                  color:
                      isSelected ? widget.categoryColor : Colors.grey.shade400,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            indent: AppSizes.lg,
            endIndent: AppSizes.lg,
            color: Colors.grey.shade200,
          ),
      ],
    );
  }

  // ignore: unused_element
  Widget _buildFilterBarSliver() {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSizes.lg,
          vertical: AppSizes.md,
        ),
        child: Row(
          children: [
            // Filter button
            Expanded(
              child: GestureDetector(
                onTap: _openFilterSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.md,
                    vertical: AppSizes.sm,
                  ),
                  decoration: BoxDecoration(
                    color: _filter.hasActiveFilters
                        ? widget.categoryColor.withValues(alpha: 0.1)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    border: Border.all(
                      color: _filter.hasActiveFilters
                          ? widget.categoryColor
                          : Colors.grey.shade300,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Iconsax.setting_4,
                        color: _filter.hasActiveFilters
                            ? widget.categoryColor
                            : Colors.grey.shade700,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isUzbek ? 'Filter' : 'Фильтр',
                        style: TextStyle(
                          color: _filter.hasActiveFilters
                              ? widget.categoryColor
                              : Colors.grey.shade700,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (_filter.activeFilterCount > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: widget.categoryColor,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${_filter.activeFilterCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(width: AppSizes.sm),

            // Sort button
            Expanded(
              child: GestureDetector(
                onTap: _showSortOptions,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.md,
                    vertical: AppSizes.sm,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Iconsax.sort,
                        color: Colors.grey.shade700,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          _getSortLabel(),
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(width: AppSizes.sm),

            // Grid/List toggle
            GestureDetector(
              onTap: () => setState(() => _isGridView = !_isGridView),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Icon(
                  _isGridView ? Iconsax.grid_1 : Iconsax.row_vertical,
                  color: Colors.grey.shade700,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getSortLabel() {
    switch (_filter.sortBy) {
      case ProductFilter.sortByPriceLow:
        return _isUzbek ? 'Arzon' : 'Дешевле';
      case ProductFilter.sortByPriceHigh:
        return _isUzbek ? 'Qimmat' : 'Дороже';
      case ProductFilter.sortByRating:
        return _isUzbek ? 'Reyting' : 'Рейтинг';
      case ProductFilter.sortByNewest:
        return _isUzbek ? 'Yangi' : 'Новинки';
      case ProductFilter.sortByPopular:
      default:
        return _isUzbek ? 'Ommabop' : 'Популярные';
    }
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSizes.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSizes.lg),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
                child: Text(
                  _isUzbek ? 'Avval ko\'rsatish' : 'Сначала показывать',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: AppSizes.md),
              _buildSortOption(
                ProductFilter.sortByPopular,
                _isUzbek ? 'Ommabop' : 'Популярные',
              ),
              _buildSortOption(
                ProductFilter.sortByPriceLow,
                _isUzbek ? 'Arzonroq' : 'Дешевле',
              ),
              _buildSortOption(
                ProductFilter.sortByPriceHigh,
                _isUzbek ? 'Qimmatroq' : 'Дороже',
              ),
              _buildSortOption(
                ProductFilter.sortByRating,
                _isUzbek ? 'Yuqori reyting' : 'Высокий рейтинг',
              ),
              const SizedBox(height: AppSizes.sm),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEBEBEB),
                      foregroundColor: Colors.black,
                      elevation: 0,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50),
                      ),
                    ),
                    child: Text(
                      _isUzbek ? 'Bekor qilish' : 'Отмена',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSortOption(String value, String label) {
    final isSelected = (_filter.sortBy ?? ProductFilter.sortByPopular) == value;
    return InkWell(
      onTap: () {
        setState(() => _filter = _filter.copyWith(sortBy: value));
        _applyFilters();
        Navigator.pop(context);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSizes.lg,
          vertical: AppSizes.md,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.normal,
                color: Colors.black,
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected
                    ? const Color(0xFFFFD100)
                    : const Color(0xFFF2F2F2),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.black,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductsView() {
    if (_filteredProducts.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () => _loadProducts(showLoading: false),
      color: widget.categoryColor,
      child: _isGridView ? _buildProductsGrid() : _buildProductsList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated illustration
            _EmptyStateIllustration(color: widget.categoryColor),
            const SizedBox(height: 24),
            Text(
              _isUzbek ? 'Mahsulotlar topilmadi' : 'Товары не найдены',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A1A2E),
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _filter.hasActiveFilters
                  ? (_isUzbek
                      ? 'Boshqa filterlarni sinab ko\'ring'
                      : 'Попробуйте изменить фильтры')
                  : (_isUzbek
                      ? 'Tez orada yangi mahsulotlar qo\'shiladi'
                      : 'Скоро появятся новые товары'),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            if (_filter.hasActiveFilters) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  setState(() => _filter = ProductFilter.empty());
                  _applyFilters();
                },
                icon: const Icon(Iconsax.refresh, size: 18),
                label: Text(
                    _isUzbek ? 'Filterlarni tozalash' : 'Сбросить фильтры'),
                style: FilledButton.styleFrom(
                  backgroundColor: widget.categoryColor,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductsGrid() {
    final locale = context.l10n.locale.languageCode;
    final itemCount =
        _filteredProducts.length + (_hasMorePages || _isLoadingMore ? 1 : 0);

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.pixels >=
                notification.metrics.maxScrollExtent - 200) {
          _loadProducts(loadMore: true);
        }
        return false;
      },
      child: GridView.builder(
        padding: const EdgeInsets.all(AppSizes.lg),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: AppSizes.md,
          crossAxisSpacing: AppSizes.md,
          childAspectRatio: 0.52,
        ),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          if (index >= _filteredProducts.length) {
            return _buildLoadMoreIndicator();
          }
          return _buildProductCard(_filteredProducts[index], locale);
        },
      ),
    );
  }

  Widget _buildProductsList() {
    final locale = context.l10n.locale.languageCode;
    final itemCount =
        _filteredProducts.length + (_hasMorePages || _isLoadingMore ? 1 : 0);

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.pixels >=
                notification.metrics.maxScrollExtent - 200) {
          _loadProducts(loadMore: true);
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSizes.md),
        itemCount: itemCount,
        itemBuilder: (context, index) {
          if (index >= _filteredProducts.length) {
            return _buildLoadMoreIndicator();
          }
          return _buildProductListItem(_filteredProducts[index], locale);
        },
      ),
    );
  }

  Widget _buildLoadMoreIndicator() {
    if (!_hasMorePages) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: widget.categoryColor,
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(ProductModel product, String locale) {
    final productName = locale == 'ru' ? product.nameRu : product.nameUz;
    final productDescription =
        (locale == 'ru' ? product.descriptionRu : product.descriptionUz) ?? '';

    return ProductCard(
      name: productName,
      price: product.price.toInt(),
      oldPrice: product.oldPrice?.toInt(),
      discount: product.discountPercent,
      rating: product.rating,
      sold: product.soldCount,
      imageUrl: product.firstImage,
      onTap: () => _openProductDetail(product, productName, productDescription),
      onAddToCart: () => _addToCart(product),
      onFavoriteToggle: () => _toggleFavorite(product),
    );
  }

  Widget _buildProductListItem(ProductModel product, String locale) {
    final productName = locale == 'ru' ? product.nameRu : product.nameUz;
    final productDescription =
        (locale == 'ru' ? product.descriptionRu : product.descriptionUz) ?? '';

    return GestureDetector(
      onTap: () => _openProductDetail(product, productName, productDescription),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSizes.md),
        padding: const EdgeInsets.all(AppSizes.sm),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Image
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSizes.radiusSm),
              child: Container(
                width: 100,
                height: 100,
                color: Colors.grey.shade100,
                child: product.firstImage != null
                    ? CachedNetworkImage(
                        imageUrl: product.firstImage!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Icon(
                          Iconsax.image,
                          color: Colors.grey.shade400,
                        ),
                      )
                    : Icon(
                        Iconsax.image,
                        color: Colors.grey.shade400,
                      ),
              ),
            ),
            const SizedBox(width: AppSizes.md),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    productName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Iconsax.star_1,
                        color: Colors.amber,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${product.rating}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${product.soldCount} ${_isUzbek ? 'sotildi' : 'продано'}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        '${product.price.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} ${_isUzbek ? 'so\'m' : 'сум'}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: widget.categoryColor,
                        ),
                      ),
                      if (product.oldPrice != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          '${product.oldPrice!.toInt()}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            // Add to cart button
            GestureDetector(
              onTap: () => _addToCart(product),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: widget.categoryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                ),
                child: Icon(
                  Iconsax.shopping_cart,
                  color: widget.categoryColor,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openProductDetail(
    ProductModel product,
    String productName,
    String productDescription,
  ) {
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

/// Premium Filter Sheet Widget - professional bottom sheet design
class _PremiumFilterSheet extends StatelessWidget {
  final String title;
  final Color categoryColor;
  final Widget child;

  const _PremiumFilterSheet({
    required this.title,
    required this.categoryColor,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header with title
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: categoryColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Iconsax.candle_2,
                    color: categoryColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.close,
                      color: Colors.grey.shade600,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Divider
          Divider(height: 1, color: Colors.grey.shade200),
          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: child,
            ),
          ),
          // Bottom safe area
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

class _SheinPriceFilterSheet extends StatefulWidget {
  final Color categoryColor;
  final double? currentMinPrice;
  final double? currentMaxPrice;
  final Function(double? min, double? max) onApply;

  const _SheinPriceFilterSheet({
    required this.categoryColor,
    this.currentMinPrice,
    this.currentMaxPrice,
    required this.onApply,
  });

  @override
  State<_SheinPriceFilterSheet> createState() => _SheinPriceFilterSheetState();
}

class _SheinPriceFilterSheetState extends State<_SheinPriceFilterSheet> {
  late TextEditingController _minController;
  late TextEditingController _maxController;
  late FocusNode _minFocus;
  late FocusNode _maxFocus;
  bool _isChanged = false;

  @override
  void initState() {
    super.initState();
    _minController = TextEditingController(
      text: widget.currentMinPrice != null
          ? widget.currentMinPrice!.toStringAsFixed(0)
          : '',
    );
    _maxController = TextEditingController(
      text: widget.currentMaxPrice != null
          ? widget.currentMaxPrice!.toStringAsFixed(0)
          : '',
    );
    _minFocus = FocusNode();
    _maxFocus = FocusNode();

    _minController.addListener(_checkForChanges);
    _maxController.addListener(_checkForChanges);
    _minFocus.addListener(() {
      setState(() {});
    });
    _maxFocus.addListener(() {
      setState(() {});
    });
  }

  void _checkForChanges() {
    setState(() {
      _isChanged = true;
    });
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    _minFocus.dispose();
    _maxFocus.dispose();
    super.dispose();
  }

  Widget _buildSheinInput({
    required String label,
    required String hint,
    required TextEditingController controller,
    required FocusNode focusNode,
  }) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Text(
                label,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                "so'm",
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color:
                  focusNode.hasFocus ? Colors.white : const Color(0xFFF6F6F6),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: focusNode.hasFocus ? Colors.black : Colors.transparent,
                width: 1,
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Theme(
              data: Theme.of(context).copyWith(
                textSelectionTheme: TextSelectionThemeData(
                  cursorColor: Colors.black,
                  selectionColor: Colors.black.withOpacity(0.3),
                  selectionHandleColor: Colors.black,
                ),
              ),
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                keyboardType: TextInputType.number,
                cursorColor: Colors.black,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Colors.black,
                ),
                decoration: InputDecoration(
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  errorBorder: InputBorder.none,
                  disabledBorder: InputBorder.none,
                  filled: false,
                  hintText: hint,
                  hintStyle: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasInput =
        _minController.text.isNotEmpty || _maxController.text.isNotEmpty;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Narxi',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildSheinInput(
                label: 'dan',
                hint: '4 500',
                controller: _minController,
                focusNode: _minFocus,
              ),
              const SizedBox(width: 12),
              _buildSheinInput(
                label: 'gacha',
                hint: '25 652 000',
                controller: _maxController,
                focusNode: _maxFocus,
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                final min =
                    double.tryParse(_minController.text.replaceAll(' ', ''));
                final max =
                    double.tryParse(_maxController.text.replaceAll(' ', ''));
                widget.onApply(min, max);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    hasInput ? Colors.blue.shade600 : const Color(0xFFEBEBEB),
                foregroundColor: hasInput ? Colors.white : Colors.black,
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
                elevation: 0,
              ),
              child: const Text(
                "Qo'llash",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ============================================================
// Shimmer list item — loading placeholder for subcategories
// ============================================================
class _ShimmerListItem extends StatefulWidget {
  final int index;
  const _ShimmerListItem({required this.index});

  @override
  State<_ShimmerListItem> createState() => _ShimmerListItemState();
}

class _ShimmerListItemState extends State<_ShimmerListItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final shimmerValue = _controller.value;
        return Container(
          margin: EdgeInsets.only(
            bottom: 10,
            left: 0,
            right: 0,
            top: widget.index == 0 ? 4 : 0,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              // Icon placeholder
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment(-1.0 + 2.0 * shimmerValue, 0),
                    end: Alignment(1.0 + 2.0 * shimmerValue, 0),
                    colors: [
                      Colors.grey.shade200,
                      Colors.grey.shade100,
                      Colors.grey.shade200,
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 14,
                      width: 80.0 + (widget.index % 3) * 30,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(6),
                        gradient: LinearGradient(
                          begin: Alignment(-1.0 + 2.0 * shimmerValue, 0),
                          end: Alignment(1.0 + 2.0 * shimmerValue, 0),
                          colors: [
                            Colors.grey.shade200,
                            Colors.grey.shade100,
                            Colors.grey.shade200,
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 10,
                      width: 50.0 + (widget.index % 2) * 20,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        gradient: LinearGradient(
                          begin: Alignment(-1.0 + 2.0 * shimmerValue, 0),
                          end: Alignment(1.0 + 2.0 * shimmerValue, 0),
                          colors: [
                            Colors.grey.shade200,
                            Colors.grey.shade50,
                            Colors.grey.shade200,
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  gradient: LinearGradient(
                    begin: Alignment(-1.0 + 2.0 * shimmerValue, 0),
                    end: Alignment(1.0 + 2.0 * shimmerValue, 0),
                    colors: [
                      Colors.grey.shade200,
                      Colors.grey.shade100,
                      Colors.grey.shade200,
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ============================================================
// Empty state illustration — animated floating box with sparkles
// ============================================================
class _EmptyStateIllustration extends StatefulWidget {
  final Color color;
  const _EmptyStateIllustration({required this.color});

  @override
  State<_EmptyStateIllustration> createState() =>
      _EmptyStateIllustrationState();
}

class _EmptyStateIllustrationState extends State<_EmptyStateIllustration>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180,
      height: 180,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final bounce = math.sin(_controller.value * math.pi) * 8;
          final sparkle1 = (_controller.value * 2 * math.pi);
          final sparkle2 = (_controller.value * 2 * math.pi + math.pi / 2);

          return Stack(
            alignment: Alignment.center,
            children: [
              // Shadow
              Positioned(
                bottom: 10,
                child: Container(
                  width: 80 - bounce.abs() * 0.5,
                  height: 12,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Colors.black
                        .withValues(alpha: 0.06 + bounce.abs() * 0.002),
                  ),
                ),
              ),
              // Main box
              Transform.translate(
                offset: Offset(0, -bounce),
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: widget.color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: widget.color.withValues(alpha: 0.2),
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    Iconsax.box_1,
                    size: 44,
                    color: widget.color.withValues(alpha: 0.5),
                  ),
                ),
              ),
              // Sparkle 1
              Positioned(
                top: 20 + math.sin(sparkle1) * 6,
                right: 20 + math.cos(sparkle1) * 4,
                child: _buildSparkle(
                  size: 10,
                  opacity: 0.3 + math.sin(sparkle1).abs() * 0.5,
                ),
              ),
              // Sparkle 2
              Positioned(
                top: 45 + math.cos(sparkle2) * 5,
                left: 15 + math.sin(sparkle2) * 3,
                child: _buildSparkle(
                  size: 7,
                  opacity: 0.2 + math.cos(sparkle2).abs() * 0.4,
                ),
              ),
              // Sparkle 3
              Positioned(
                bottom: 35 + math.sin(sparkle1 + 1) * 4,
                right: 30 + math.cos(sparkle2) * 3,
                child: _buildSparkle(
                  size: 6,
                  opacity: 0.25 + math.sin(sparkle2).abs() * 0.35,
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSparkle({required double size, required double opacity}) {
    return Icon(
      Icons.auto_awesome,
      size: size,
      color: widget.color.withValues(alpha: opacity),
    );
  }
}
