import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/product_model.dart';
import '../../models/filter_model.dart';
import '../../models/brand_model.dart';
import '../../models/color_option.dart';
import '../../models/product_facets.dart';
import '../../models/category_filter_attribute.dart';
import '../../providers/cart_provider.dart';
import '../../providers/products_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton_widgets.dart';
import '../../widgets/empty_states.dart';
import '../../widgets/product_filter_sheet.dart';
import '../product/product_detail_screen.dart';
import '../catalog/category_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  final String? initialQuery;
  final bool showCategories;
  final bool showBackArrow;

  const SearchScreen({
    super.key,
    this.initialQuery,
    this.showCategories = false,
    this.showBackArrow = false,
  });

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  List<ProductModel> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;
  String _sortBy = 'popular';
  bool _showClearButton = false;

  // Filter tizimi
  ProductFilter _filter = const ProductFilter();
  List<BrandModel> _brands = [];
  List<ColorOption> _colors = [];
  List<CategoryFilterAttribute> _categoryFilters = [];
  ProductFacets? _facets;
  String? _dominantCategoryId;

  // Qidiruv tarixi
  List<String> _searchHistory = [];
  static const String _historyKey = 'search_history';

  // Auto-suggest
  List<Map<String, dynamic>> _suggestions = [];
  bool _showSuggestions = false;
  Timer? _debounceTimer;
  OverlayEntry? _overlayEntry;

  // Natijalar soni
  int _totalResults = 0;

  bool get _isUzbek => context.l10n.locale.languageCode == 'uz';

  // Pagination
  int _currentPage = 1;
  int _totalPages = 1;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadSearchHistory();

    _searchFocusNode.addListener(_onFocusChange);

    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _searchController.text = widget.initialQuery!;
      _showClearButton = true;
      _performSearch(widget.initialQuery!);
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _searchFocusNode.requestFocus();
      });
    }

    // Pagination scroll listener
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore &&
          _currentPage < _totalPages &&
          _searchController.text.trim().isNotEmpty) {
        _performSearch(_searchController.text, loadMore: true);
      }
    }
  }

  void _onFocusChange() {
    if (!_searchFocusNode.hasFocus) {
      _removeSuggestionOverlay();
    }
  }

  Future<void> _loadSearchHistory() async {
    // Try server first if logged in
    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;
    if (isLoggedIn) {
      try {
        final serverHistory =
            await context.read<ProductsProvider>().getSearchHistory();
        if (serverHistory.isNotEmpty && mounted) {
          setState(() => _searchHistory = serverHistory);
          // Also save to local for offline access
          final prefs = await SharedPreferences.getInstance();
          await prefs.setStringList(_historyKey, serverHistory);
          return;
        }
      } catch (_) {}
    }
    // Fallback to local
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList(_historyKey);
    if (history != null && mounted) {
      setState(() => _searchHistory = history);
    }
  }

  Future<void> _saveSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_historyKey, _searchHistory);
    // Sync to server if logged in (async, fire-and-forget)
    if (!mounted) return;
    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;
    if (isLoggedIn && _searchHistory.isNotEmpty && mounted) {
      context.read<ProductsProvider>().saveSearchQuery(_searchHistory.first);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _removeSuggestionOverlay();
    _searchController.dispose();
    _searchFocusNode.removeListener(_onFocusChange);
    _searchFocusNode.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  // ============ SEARCH LOGIC ============

  void _onSearchChanged(String value) {
    final shouldShowClear = value.isNotEmpty;
    if (_showClearButton != shouldShowClear) {
      setState(() => _showClearButton = shouldShowClear);
    }

    // Debounce auto-suggest: 300ms
    _debounceTimer?.cancel();
    if (value.trim().length >= 2) {
      _debounceTimer = Timer(const Duration(milliseconds: 300), () {
        _fetchSuggestions(value.trim());
      });
    } else {
      _removeSuggestionOverlay();
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
    }
  }

  Future<void> _fetchSuggestions(String query) async {
    final provider = context.read<ProductsProvider>();
    final results = await provider.getSearchSuggestions(query);
    if (mounted && _searchController.text.trim() == query) {
      setState(() {
        _suggestions = results;
        _showSuggestions = results.isNotEmpty;
      });
      if (_showSuggestions) {
        _showSuggestionOverlay();
      } else {
        _removeSuggestionOverlay();
      }
    }
  }

  void _showSuggestionOverlay() {
    // Suggestions are now shown inline in the body, no overlay needed
    setState(() {});
  }

  void _removeSuggestionOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  Future<void> _performSearch(String query, {bool loadMore = false}) async {
    if (query.trim().isEmpty) return;
    if (loadMore && (_isLoadingMore || _currentPage >= _totalPages)) return;

    _removeSuggestionOverlay();
    if (!loadMore) {
      setState(() {
        _isSearching = true;
        _hasSearched = true;
        _showSuggestions = false;
        _currentPage = 1;
      });
    } else {
      setState(() => _isLoadingMore = true);
    }

    try {
      final productsProvider = context.read<ProductsProvider>();
      final sortParam = _getSortParam();

      // Build filter params for API
      final filterParams = <String, dynamic>{};
      final queryMap = _filter.toQueryMap();
      if (queryMap.containsKey('minPrice')) {
        filterParams['minPrice'] = queryMap['minPrice'];
      }
      if (queryMap.containsKey('maxPrice')) {
        filterParams['maxPrice'] = queryMap['maxPrice'];
      }
      if (queryMap.containsKey('brandIds')) {
        filterParams['brandIds'] = queryMap['brandIds'];
      }
      if (queryMap.containsKey('colorIds')) {
        filterParams['colorIds'] = queryMap['colorIds'];
      }
      if (queryMap.containsKey('sizeIds')) {
        filterParams['sizeIds'] = queryMap['sizeIds'];
      }
      if (queryMap.containsKey('minRating')) {
        filterParams['minRating'] = queryMap['minRating'];
      }
      if (queryMap.containsKey('inStock')) {
        filterParams['inStock'] = queryMap['inStock'];
      }
      if (queryMap.containsKey('hasDiscount')) {
        filterParams['hasDiscount'] = queryMap['hasDiscount'];
      }
      if (queryMap.containsKey('attributes')) {
        filterParams['attributes'] = queryMap['attributes'];
      }
      if (queryMap.containsKey('shopIds')) {
        filterParams['shopIds'] = queryMap['shopIds'];
      }
      if (queryMap.containsKey('deliveryHours')) {
        filterParams['deliveryHours'] = queryMap['deliveryHours'];
      }
      if (queryMap.containsKey('deliveryType')) {
        filterParams['deliveryType'] = queryMap['deliveryType'];
      }
      if (queryMap.containsKey('isWowPrice')) {
        filterParams['isWowPrice'] = queryMap['isWowPrice'];
      }
      if (_filter.isOriginal == true) {
        filterParams['isOriginal'] = true;
      }
      if (_dominantCategoryId != null) {
        filterParams['categoryId'] = _dominantCategoryId;
      }

      final page = loadMore ? _currentPage + 1 : 1;
      final result = await productsProvider.searchProducts(
        query,
        page: page,
        sort: sortParam,
        filters: filterParams.isNotEmpty ? filterParams : null,
      );

      if (mounted) {
        setState(() {
          if (loadMore) {
            _searchResults.addAll(result.products);
          } else {
            _searchResults = result.products;
          }
          _totalResults = result.total;
          _currentPage = result.page;
          _totalPages = result.totalPages;
          _isSearching = false;
          _isLoadingMore = false;
        });

        // Detect dominant category from results and load its filters
        if (!loadMore) {
          _detectAndLoadCategoryFilters(result.products);
        }
      }

      // Tarixga qo'shish
      if (!loadMore) {
        _searchHistory.remove(query);
        _searchHistory.insert(0, query);
        if (_searchHistory.length > 15) _searchHistory.removeLast();
        _saveSearchHistory();
      }
    } catch (e) {
      setState(() {
        _isSearching = false;
        _isLoadingMore = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('search_error')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  /// Rasm orqali qidirish (CLIP image search)
  Future<void> _openImageSearch() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                context.l10n.translate('image_search'),
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFF0F0F0),
                  child: Icon(Icons.camera_alt, color: Colors.black87),
                ),
                title: Text(context.l10n.translate('take_photo')),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFF0F0F0),
                  child: Icon(Icons.photo_library, color: Colors.black87),
                ),
                title: Text(context.l10n.translate('choose_gallery')),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return;

    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 80,
    );

    if (image == null || !mounted) return;

    _removeSuggestionOverlay();
    setState(() {
      _isSearching = true;
      _hasSearched = true;
      _showSuggestions = false;
      _searchController.text = '📷 ${context.l10n.translate('image_search')}';
      _showClearButton = true;
    });

    try {
      final productsProvider = context.read<ProductsProvider>();
      final result = await productsProvider.searchByImage(image.path);

      if (mounted) {
        setState(() {
          _searchResults = result.products;
          _totalResults = result.total;
          _currentPage = result.page;
          _totalPages = result.totalPages;
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSearching = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('image_search_error')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Detect dominant category from search results and load its filters
  Future<void> _detectAndLoadCategoryFilters(List<ProductModel> results) async {
    if (results.isEmpty) return;

    // Count category occurrences
    final categoryCounts = <String, int>{};
    for (final product in results) {
      final catId = product.categoryId;
      if (catId != null && catId.isNotEmpty) {
        categoryCounts[catId] = (categoryCounts[catId] ?? 0) + 1;
      }
    }

    if (categoryCounts.isEmpty) return;

    // Find dominant category (most products)
    final sortedEntries = categoryCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final dominantId = sortedEntries.first.key;

    // Only reload filters if dominant category changed
    if (_dominantCategoryId == dominantId) return;
    _dominantCategoryId = dominantId;

    try {
      final provider = context.read<ProductsProvider>();
      final filterResults = await Future.wait([
        provider.getBrandsByCategory(dominantId),
        provider.getColorsByCategory(dominantId),
        provider.getCategoryFilters(dominantId),
        provider.getFacets(dominantId),
      ]);

      if (mounted) {
        setState(() {
          _brands = filterResults[0] as List<BrandModel>;
          _colors = filterResults[1] as List<ColorOption>;
          _categoryFilters = filterResults[2] as List<CategoryFilterAttribute>;
          _facets = filterResults[3] as ProductFacets;
        });
      }
    } catch (e) {
      debugPrint('Error loading search category filters: $e');
    }
  }

  Future<void> _openFilterSheet() async {
    final newFilter = await ProductFilterSheet.show(
      context,
      currentFilter: _filter,
      categoryName: context.l10n.translate('filter_title'),
      accentColor: AppColors.primary,
      productCount: _totalResults,
      brands: _brands,
      colors: _colors,
      facets: _facets,
      categoryAttributes: _categoryFilters,
      isUzbek: _isUzbek,
    );
    if (newFilter != null && mounted) {
      setState(() {
        _filter = newFilter;
        _sortBy = newFilter.sortBy ?? 'popular';
      });
      // Re-search with new filters
      if (_searchController.text.isNotEmpty) {
        _performSearch(_searchController.text);
      }
    }
  }

  String? _getSortParam() {
    switch (_sortBy) {
      case 'price_low':
      case 'price_asc':
        return 'price_asc';
      case 'price_high':
      case 'price_desc':
        return 'price_desc';
      case 'newest':
        return 'newest';
      case 'popular':
        return 'popular';
      case 'rating':
        return 'rating';
      case 'discount':
        return 'popular'; // search API has no discount sort, fallback to popular
      default:
        return null;
    }
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
            content: Text(context.l10n.translate('added_to_cart')),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.translate('add_to_cart_error')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _toggleFavorite(ProductModel product) async {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.pushNamed(context, '/auth');
      return;
    }
    try {
      await context.read<ProductsProvider>().toggleFavorite(product.id);
    } catch (_) {}
  }

  void _clearHistory() {
    setState(() => _searchHistory.clear());
    _saveLocalHistory();
    // Clear on server too
    if (context.read<AuthProvider>().isLoggedIn) {
      context.read<ProductsProvider>().clearSearchHistory();
    }
  }

  void _removeHistoryItem(String query) {
    setState(() => _searchHistory.remove(query));
    _saveLocalHistory();
    // Remove on server too
    if (context.read<AuthProvider>().isLoggedIn) {
      context.read<ProductsProvider>().removeSearchHistoryItem(query);
    }
  }

  Future<void> _saveLocalHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_historyKey, _searchHistory);
  }

  // ============ BUILD ============

  @override
  Widget build(BuildContext context) {
    final showResultsAppBar = _hasSearched && _searchResults.isNotEmpty;
    final showTopBar = widget.showBackArrow || showResultsAppBar;

    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: showTopBar
          ? AppBar(
              automaticallyImplyLeading: false,
              backgroundColor: const Color(0xFFF2F2F7),
              elevation: 0,
              scrolledUnderElevation: 0,
              titleSpacing: 0,
              leading: widget.showBackArrow
                  ? IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_new,
                          size: 20, color: Colors.black87),
                    )
                  : null,
              title: _buildSearchField(),
              actions: [
                // Filter (tune) icon — like category detail screen
                if (showResultsAppBar)
                  Stack(
                    children: [
                      IconButton(
                        onPressed: _openFilterSheet,
                        icon: Icon(
                          Icons.tune,
                          color: _filter.hasActiveFilters
                              ? const Color(0xFF4E6AFF)
                              : Colors.grey.shade700,
                        ),
                      ),
                      if (_filter.activeFilterCount > 0)
                        Positioned(
                          right: 8,
                          top: 8,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
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
                if (!widget.showBackArrow)
                  Padding(
                    padding: const EdgeInsets.only(right: 16.0, left: 4.0),
                    child: Center(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.close,
                              color: Colors.black87, size: 20),
                        ),
                      ),
                    ),
                  ),
              ],
            )
          : null,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        top: !showTopBar,
        bottom: false,
        child: Column(
          children: [
            Expanded(child: _buildBody()),
            // Kategoriyalar + qidiruv maydoni pastda (faqat catalog rejimda)
            if (!widget.showBackArrow &&
                (!_hasSearched || _searchResults.isEmpty)) ...[
              if (widget.showCategories) _buildHorizontalCategories(),
              _buildBottomSearchBar(),
            ],
          ],
        ),
      ),
    );
  }

  /// Pastdagi qidiruv maydoni + X tugmasi (Telegram uslubida)
  Widget _buildBottomSearchBar() {
    return Container(
      color: const Color(0xFFF2F2F7),
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 8),
      child: Row(
        children: [
          Expanded(child: _buildSearchField()),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: Colors.grey.shade300, width: 1),
              ),
              child: const Icon(Icons.close, color: Colors.black87, size: 22),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalCategories() {
    final categories = context.watch<ProductsProvider>().categories;
    if (categories.isEmpty) return const SizedBox.shrink();
    final locale = context.l10n.locale.languageCode;

    return Container(
      color: const Color(0xFFF2F2F7),
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SizedBox(
        height: 36,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: categories.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final cat = categories[index];
            return GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CategoryDetailScreen(
                      category: cat,
                      categoryColor: AppColors.primary,
                    ),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(100),
                ),
                alignment: Alignment.center,
                child: Text(
                  cat.getName(locale),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildSearchField() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(100),
      ),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        cursorColor: const Color(0xFF007AFF),
        cursorWidth: 2.0,
        textInputAction: TextInputAction.search,
        style: const TextStyle(fontSize: 16, color: Colors.black87),
        decoration: InputDecoration(
          hintText: context.l10n.translate('search_hint'),
          hintStyle: const TextStyle(color: Color(0xFF8E8E93), fontSize: 16),
          prefixIcon: const Padding(
            padding: EdgeInsets.only(left: 14, right: 8),
            child: Icon(Icons.search, color: Color(0xFF8E8E93), size: 22),
          ),
          prefixIconConstraints:
              const BoxConstraints(minWidth: 40, minHeight: 40),
          suffixIcon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_showClearButton)
                IconButton(
                  onPressed: () {
                    _searchController.clear();
                    _removeSuggestionOverlay();
                    setState(() {
                      _showClearButton = false;
                      _hasSearched = false;
                      _searchResults.clear();
                      _suggestions.clear();
                      _showSuggestions = false;
                    });
                    _searchFocusNode.requestFocus();
                  },
                  icon: const Icon(Icons.cancel,
                      color: Color(0xFF8E8E93), size: 18),
                  padding: EdgeInsets.zero,
                  constraints:
                      const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              if (!_showClearButton)
                IconButton(
                  // Kamera knopkasi — faqat bo'sh maydonda ko'rinadi
                  onPressed: _openImageSearch,
                  icon: const Icon(Icons.camera_alt_outlined,
                      color: Color(0xFF8E8E93), size: 20),
                  padding: EdgeInsets.zero,
                  constraints:
                      const BoxConstraints(minWidth: 36, minHeight: 36),
                  tooltip: context.l10n.translate('image_search'),
                ),
              const SizedBox(width: 4),
            ],
          ),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: const BorderSide(color: Color(0xFF007AFF), width: 1.5),
          ),
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
        onChanged: _onSearchChanged,
        onSubmitted: _performSearch,
      ),
    );
  }

  Widget _buildInlineSuggestions() {
    final query = _searchController.text.trim().toLowerCase();
    final locale = context.l10n.locale.languageCode;
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _suggestions.length,
      separatorBuilder: (_, __) => Divider(
        height: 1,
        color: Colors.grey.shade200,
      ),
      itemBuilder: (context, index) {
        final item = _suggestions[index];
        final name = locale == 'ru'
            ? (item['nameRu'] ?? item['name'] ?? '')
            : (item['name'] ?? '');

        return InkWell(
          onTap: () {
            _searchController.text = name;
            _searchController.selection = TextSelection.fromPosition(
              TextPosition(offset: name.length),
            );
            _showClearButton = true;
            _removeSuggestionOverlay();
            _performSearch(name);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: _buildHighlightedText(name, query),
          ),
        );
      },
    );
  }

  Widget _buildHighlightedText(String text, String query) {
    if (query.isEmpty) {
      return Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 15),
      );
    }

    final lowerText = text.toLowerCase();
    final matchIndex = lowerText.indexOf(query);

    if (matchIndex == -1) {
      return Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 15),
      );
    }

    final before = text.substring(0, matchIndex);
    final match = text.substring(matchIndex, matchIndex + query.length);
    final after = text.substring(matchIndex + query.length);

    return RichText(
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      text: TextSpan(
        style: TextStyle(
          fontSize: 15,
          color: Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black,
        ),
        children: [
          if (before.isNotEmpty) TextSpan(text: before),
          TextSpan(
            text: match,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          if (after.isNotEmpty) TextSpan(text: after),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isSearching) {
      return GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.52,
        ),
        itemCount: 6,
        itemBuilder: (_, __) => const ProductCardSkeleton(),
      );
    }

    if (_hasSearched) return _buildSearchResults();

    // Show inline suggestions if available
    if (_showSuggestions && _suggestions.isNotEmpty) {
      return _buildInlineSuggestions();
    }

    return _buildSuggestionsPage();
  }

  Widget _buildSuggestionsPage() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Qidiruv tarixi
        if (_searchHistory.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.translate('search_history'),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade700,
                ),
              ),
              GestureDetector(
                onTap: _clearHistory,
                child: Icon(Icons.close, size: 18, color: Colors.grey.shade500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...(_searchHistory.take(8).map((query) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading:
                    Icon(Iconsax.clock, size: 18, color: Colors.grey.shade400),
                title: Text(
                  query,
                  style: const TextStyle(fontSize: 14),
                ),
                trailing: IconButton(
                  icon:
                      Icon(Icons.close, size: 18, color: Colors.grey.shade400),
                  onPressed: () => _removeHistoryItem(query),
                ),
                onTap: () {
                  _searchController.text = query;
                  setState(() => _showClearButton = true);
                  _performSearch(query);
                },
              ),
            );
          })),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
        ],
      ],
    );
  }

  Widget _buildSearchResults() {
    if (_searchResults.isEmpty) {
      return EmptySearchWidget(
        query: _searchController.text,
        onClear: () {
          _searchController.clear();
          setState(() {
            _hasSearched = false;
            _searchResults.clear();
          });
          _searchFocusNode.requestFocus();
        },
      );
    }

    return Column(
      children: [
        // Quick filter bar (category detail style)
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: AppSizes.sm),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
            child: Row(
              children: [
                // 1. Sort icon button
                _buildSearchSortIconButton(),
                const SizedBox(width: 10),
                Container(width: 1, height: 24, color: Colors.grey.shade300),
                const SizedBox(width: 10),

                // 2. Narxi chip
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildSearchFilterChip(
                    label: _filter.minPrice != null || _filter.maxPrice != null
                        ? _formatSearchPriceLabel()
                        : context.l10n.translate('price_label'),
                    onTap: _openFilterSheet,
                    isActive:
                        _filter.minPrice != null || _filter.maxPrice != null,
                    onClear: () {
                      setState(() => _filter = _filter.copyWith(
                          clearMinPrice: true, clearMaxPrice: true));
                      _performSearch(_searchController.text);
                    },
                  ),
                ),

                // 3. WOW narx
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildSearchToggleChip(
                    label: context.l10n.translate('wow_price'),
                    isActive: _filter.isWowPrice == true,
                    onTap: () {
                      setState(() {
                        _filter = _filter.copyWith(
                          isWowPrice: _filter.isWowPrice == true ? null : true,
                          clearIsWowPrice: _filter.isWowPrice == true,
                        );
                      });
                      _performSearch(_searchController.text);
                    },
                  ),
                ),

                // 4. Brend chip
                if (_brands.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _buildSearchFilterChip(
                      label: _filter.brandIds.isNotEmpty
                          ? '${context.l10n.translate('brand')}: ${_filter.brandIds.length}'
                          : context.l10n.translate('brand'),
                      onTap: _openFilterSheet,
                      isActive: _filter.brandIds.isNotEmpty,
                      onClear: () {
                        setState(
                            () => _filter = _filter.copyWith(brandIds: {}));
                        _performSearch(_searchController.text);
                      },
                    ),
                  ),

                // 5. Original
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildSearchToggleChip(
                    label: context.l10n.translate('original'),
                    isActive: _filter.isOriginal == true,
                    onTap: () {
                      setState(() {
                        _filter = _filter.copyWith(
                          isOriginal: _filter.isOriginal == true ? null : true,
                          clearIsOriginal: _filter.isOriginal == true,
                        );
                      });
                      _performSearch(_searchController.text);
                    },
                  ),
                ),

                // 6. Chegirmali
                if (_facets != null && _facets!.discountCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _buildSearchToggleChip(
                      label: context.l10n.translate('discounted'),
                      count: _facets!.discountCount,
                      isActive: _filter.onlyWithDiscount,
                      onTap: () {
                        setState(() {
                          _filter = _filter.copyWith(
                              onlyWithDiscount: !_filter.onlyWithDiscount);
                        });
                        _performSearch(_searchController.text);
                      },
                    ),
                  ),

                // 7. Stokda bor
                if (_facets != null && _facets!.inStockCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _buildSearchToggleChip(
                      label: context.l10n.translate('in_stock'),
                      count: _facets!.inStockCount,
                      isActive: _filter.onlyInStock,
                      onTap: () {
                        setState(() {
                          _filter = _filter.copyWith(
                              onlyInStock: !_filter.onlyInStock);
                        });
                        _performSearch(_searchController.text);
                      },
                    ),
                  ),

                // 8. Reyting
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildSearchFilterChip(
                    label: _filter.minRating != null
                        ? '★ ${_filter.minRating!.toStringAsFixed(0)}+'
                        : context.l10n.translate('high_rating'),
                    onTap: () {
                      setState(
                          () => _filter = _filter.copyWith(minRating: 4.0));
                      _performSearch(_searchController.text);
                    },
                    isActive: _filter.minRating != null,
                    hideArrow: true,
                    onClear: () {
                      setState(() =>
                          _filter = _filter.copyWith(clearMinRating: true));
                      _performSearch(_searchController.text);
                    },
                  ),
                ),

                // Results count
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F2F7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$_totalResults ${context.l10n.translate('results_count')}',
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                        fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Active filter pills row
        if (_filter.hasActiveFilters)
          Container(
            color: Colors.white,
            padding: const EdgeInsets.only(left: 12, right: 12, bottom: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (_filter.minPrice != null || _filter.maxPrice != null)
                    _buildSearchRemovablePill(
                      _filter.minPrice != null && _filter.maxPrice != null
                          ? '${(_filter.minPrice! / 1000).toStringAsFixed(0)}K - ${(_filter.maxPrice! / 1000).toStringAsFixed(0)}K'
                          : _filter.minPrice != null
                              ? '${context.l10n.translate('from_price')} ${(_filter.minPrice! / 1000).toStringAsFixed(0)}K'
                              : '${context.l10n.translate('to_price')} ${(_filter.maxPrice! / 1000).toStringAsFixed(0)}K',
                      () {
                        setState(() {
                          _filter = _filter.copyWith(
                              clearMinPrice: true, clearMaxPrice: true);
                        });
                        _performSearch(_searchController.text);
                      },
                    ),
                  if (_filter.brandIds.isNotEmpty)
                    _buildSearchRemovablePill(
                      '${context.l10n.translate('brands_plural')}: ${_filter.brandIds.length}',
                      () {
                        setState(
                            () => _filter = _filter.copyWith(brandIds: {}));
                        _performSearch(_searchController.text);
                      },
                    ),
                  if (_filter.minRating != null)
                    _buildSearchRemovablePill(
                      '★ ${_filter.minRating!.toStringAsFixed(0)}+',
                      () {
                        setState(() =>
                            _filter = _filter.copyWith(clearMinRating: true));
                        _performSearch(_searchController.text);
                      },
                    ),
                  // Clear all
                  if (_filter.activeFilterCount > 1)
                    GestureDetector(
                      onTap: () {
                        setState(() => _filter = const ProductFilter());
                        _performSearch(_searchController.text);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(left: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.red.shade300),
                        ),
                        child: Text(
                          context.l10n.locale.languageCode == 'uz'
                              ? 'Tozalash'
                              : 'Сбросить',
                          style: TextStyle(
                              fontSize: 11,
                              color: Colors.red.shade400,
                              fontWeight: FontWeight.w500),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

        // Divider
        Container(height: 0.5, color: Colors.grey.shade200),

        // Mahsulotlar grid
        Expanded(
          child: GridView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.52,
            ),
            itemCount: _searchResults.length + (_isLoadingMore ? 2 : 0),
            itemBuilder: (context, index) {
              // Loading indicator at the bottom
              if (index >= _searchResults.length) {
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                );
              }
              final product = _searchResults[index];
              final locale = context.l10n.locale.languageCode;
              return ProductCard(
                name: product.getName(locale),
                price: product.price.toInt(),
                oldPrice: product.oldPrice?.toInt(),
                discount: product.discountPercent,
                rating: product.rating,
                sold: product.soldCount,
                imageUrl: product.firstImage,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductDetailScreen(
                        product: product.toMap(),
                      ),
                    ),
                  );
                },
                onAddToCart: () => _addToCart(product),
                onFavoriteToggle: () => _toggleFavorite(product),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showSortOptions() {
    final l10n = context.l10n;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  l10n.translate('sort_by'),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _buildSortOption(
                'popular',
                l10n.translate('most_popular'),
                Iconsax.star,
              ),
              _buildSortOption(
                'price_low',
                l10n.translate('price_low_high'),
                Iconsax.arrow_up_3,
              ),
              _buildSortOption(
                'price_high',
                l10n.translate('price_high_low'),
                Iconsax.arrow_down,
              ),
              _buildSortOption(
                'newest',
                l10n.translate('newest'),
                Iconsax.calendar,
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSortOption(String value, String label, IconData icon) {
    final isSelected = _sortBy == value;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppColors.primary : null,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? AppColors.primary : null,
          fontWeight: isSelected ? FontWeight.bold : null,
        ),
      ),
      trailing:
          isSelected ? const Icon(Icons.check, color: AppColors.primary) : null,
      onTap: () {
        Navigator.pop(context);
        if (_sortBy != value) {
          setState(() => _sortBy = value);
          // Re-search with new sort from server
          if (_hasSearched && _searchController.text.isNotEmpty) {
            _performSearch(_searchController.text);
          }
        }
      },
    );
  }

  // === Helper widgets ===

  /// Sort icon button (category detail style)
  Widget _buildSearchSortIconButton() {
    final isActive = _sortBy != 'popular';
    return GestureDetector(
      onTap: _showSortOptions,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          border: isActive
              ? Border.all(color: AppColors.primary, width: 1.5)
              : null,
        ),
        child: Center(
          child: Icon(
            Icons.sort,
            color: isActive ? AppColors.primary : Colors.grey.shade700,
            size: 18,
          ),
        ),
      ),
    );
  }

  /// Filter chip with dropdown arrow (category detail style)
  Widget _buildSearchFilterChip({
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
    bool hideArrow = false,
    VoidCallback? onClear,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFEEF2FF) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          border: Border.all(
            color: isActive ? const Color(0xFF4E6AFF) : Colors.grey.shade300,
            width: isActive ? 1.2 : 0.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isActive)
              const Padding(
                padding: EdgeInsets.only(right: 5),
                child: Icon(
                  Icons.check_circle_rounded,
                  size: 14,
                  color: Color(0xFF4E6AFF),
                ),
              ),
            Text(
              label,
              style: TextStyle(
                color:
                    isActive ? const Color(0xFF4E6AFF) : Colors.grey.shade800,
                fontSize: 13,
                height: 1.2,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            if (isActive && onClear != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: onClear,
                behavior: HitTestBehavior.opaque,
                child: const Padding(
                  padding: EdgeInsets.all(2),
                  child: Icon(
                    Icons.close_rounded,
                    size: 14,
                    color: Color(0xFF4E6AFF),
                  ),
                ),
              ),
            ] else if (!hideArrow) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.keyboard_arrow_down,
                size: 16,
                color: Colors.grey.shade600,
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Quick toggle chip (category detail style)
  Widget _buildSearchToggleChip({
    required String label,
    int? count,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFEEF2FF) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          border: Border.all(
            color: isActive ? const Color(0xFF4E6AFF) : Colors.grey.shade300,
            width: isActive ? 1.2 : 0.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isActive)
              const Padding(
                padding: EdgeInsets.only(right: 5),
                child: Icon(
                  Icons.check_circle_rounded,
                  size: 14,
                  color: Color(0xFF4E6AFF),
                ),
              ),
            Text(
              label,
              style: TextStyle(
                color:
                    isActive ? const Color(0xFF4E6AFF) : Colors.grey.shade800,
                fontSize: 13,
                height: 1.2,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            if (count != null) ...[
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(
                  color: isActive
                      ? const Color(0xFF4E6AFF).withValues(alpha: 0.7)
                      : Colors.grey.shade500,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
            if (isActive) ...[
              const SizedBox(width: 4),
              const Icon(
                Icons.close_rounded,
                size: 14,
                color: Color(0xFF4E6AFF),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Narx labelini formatlash
  String _formatSearchPriceLabel() {
    final min = _filter.minPrice;
    final max = _filter.maxPrice;
    if (min != null && max != null) {
      return '${_formatSearchPrice(min)} - ${_formatSearchPrice(max)}';
    } else if (min != null) {
      return '${context.l10n.translate('from_price')} ${_formatSearchPrice(min)}';
    } else if (max != null) {
      return '${context.l10n.translate('to_price')} ${_formatSearchPrice(max)}';
    }
    return context.l10n.translate('price_label');
  }

  String _formatSearchPrice(double price) {
    if (price >= 1000000) {
      return '${(price / 1000000).toStringAsFixed(1)}M';
    } else if (price >= 1000) {
      return '${(price / 1000).toStringAsFixed(0)}K';
    }
    return price.toStringAsFixed(0);
  }

  Widget _buildSearchRemovablePill(String label, VoidCallback onRemove) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onRemove,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFEEF2FF),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF4E6AFF), width: 1.2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF4E6AFF),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.close_rounded,
                  size: 12, color: Color(0xFF4E6AFF)),
            ],
          ),
        ),
      ),
    );
  }
}
