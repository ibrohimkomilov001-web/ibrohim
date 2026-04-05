import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
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
import 'barcode_scanner_screen.dart';

class SearchScreen extends StatefulWidget {
  final String? initialQuery;

  const SearchScreen({super.key, this.initialQuery});

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

  /// Shtrix-kod skanerini ochish
  Future<void> _openBarcodeScanner() async {
    final barcode = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const BarcodeScannerScreen(),
      ),
    );
    if (barcode != null && barcode.isNotEmpty && mounted) {
      _searchController.text = barcode;
      setState(() {
        _showClearButton = true;
      });
      _performSearch(barcode);
    }
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
      categoryName: _isUzbek ? 'Filtrlar' : 'Фильтры',
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
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: _buildSearchField(),
        actions: [
          if (_hasSearched && _searchResults.isNotEmpty) ...[
            // Filter icon with active count badge
            Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  onPressed: _openFilterSheet,
                  icon: const Icon(Icons.tune_rounded, size: 22),
                  tooltip: _isUzbek ? 'Filtrlar' : 'Фильтры',
                ),
                if (_filter.activeFilterCount > 0)
                  Positioned(
                    top: 6,
                    right: 6,
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
            IconButton(
              onPressed: _showSortOptions,
              icon: const Icon(Iconsax.sort),
              tooltip: context.l10n.translate('sort_by'),
            ),
          ],
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildSearchField() {
    return Container(
      height: 42,
      margin: const EdgeInsets.only(right: 8),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: context.l10n.translate('search_hint'),
          prefixIcon: const Icon(Icons.search, size: 20),
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
                  icon: const Icon(Icons.close, size: 18),
                ),
              IconButton(
                onPressed: _openBarcodeScanner,
                icon: const Icon(Icons.qr_code_scanner, size: 20),
                tooltip: _isUzbek ? 'Shtrix-kod skaneri' : 'Сканер штрих-кода',
              ),
            ],
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(100),
            borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
          ),
          filled: true,
          fillColor: const Color(0xFFECECEC),
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
                  _showClearButton = true;
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
        // Quick filter bar
        Container(
          color: Theme.of(context).colorScheme.surface,
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                // Filter button
                _buildSearchFilterButton(),
                const SizedBox(width: 8),
                // Sort button
                _buildSearchSortButton(),
                const SizedBox(width: 8),
                Container(width: 1, height: 22, color: Colors.grey.shade300),
                const SizedBox(width: 8),
                // Quick toggle: Original
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: _buildSearchQuickChip(
                    label: _isUzbek ? 'Original' : 'Оригинал',
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
                // Quick toggle: Chegirmali
                if (_facets != null && _facets!.discountCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: _buildSearchQuickChip(
                      label: context.l10n.locale.languageCode == 'uz'
                          ? 'Chegirmali'
                          : 'Со скидкой',
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
                // Quick toggle: Stokda bor
                if (_facets != null && _facets!.inStockCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: _buildSearchQuickChip(
                      label: context.l10n.locale.languageCode == 'uz'
                          ? 'Stokda'
                          : 'В наличии',
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
                // Results count
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(
                    '$_totalResults ${context.l10n.translate('results_count')}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Active filter pills row
        if (_filter.hasActiveFilters)
          Container(
            color: Theme.of(context).colorScheme.surface,
            padding: const EdgeInsets.only(left: 12, right: 12, bottom: 6),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (_filter.minPrice != null || _filter.maxPrice != null)
                    _buildSearchRemovablePill(
                      _filter.minPrice != null && _filter.maxPrice != null
                          ? '${(_filter.minPrice! / 1000).toStringAsFixed(0)}K - ${(_filter.maxPrice! / 1000).toStringAsFixed(0)}K'
                          : _filter.minPrice != null
                              ? '${_isUzbek ? "dan" : "от"} ${(_filter.minPrice! / 1000).toStringAsFixed(0)}K'
                              : '${_isUzbek ? "gacha" : "до"} ${(_filter.maxPrice! / 1000).toStringAsFixed(0)}K',
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
                      '${_isUzbek ? "Brendlar" : "Бренды"}: ${_filter.brandIds.length}',
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

  String _getSortLabel() {
    switch (_sortBy) {
      case 'price_low':
        return context.l10n.translate('sort_cheap');
      case 'price_high':
        return context.l10n.translate('sort_expensive');
      case 'newest':
        return context.l10n.translate('newest');
      default:
        return context.l10n.translate('most_popular');
    }
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

  Widget _buildSearchFilterButton() {
    final count = _filter.activeFilterCount;
    return GestureDetector(
      onTap: _openFilterSheet,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: count > 0
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: count > 0
              ? Border.all(color: AppColors.primary, width: 1.5)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.tune_rounded,
                size: 16,
                color: count > 0 ? AppColors.primary : Colors.grey.shade700),
            if (count > 0) ...[
              const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('$count',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSearchSortButton() {
    return GestureDetector(
      onTap: _showSortOptions,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Iconsax.sort, size: 14, color: Colors.grey.shade700),
            const SizedBox(width: 4),
            Text(
              _getSortLabel(),
              style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade800,
                  fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchQuickChip({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF232323) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: isActive
              ? null
              : Border.all(color: Colors.grey.shade300, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isActive ? Colors.white : Colors.grey.shade800,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            if (isActive) ...[
              const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: Color(0xFF757575),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 10, color: Colors.black),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSearchRemovablePill(String label, VoidCallback onRemove) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: onRemove,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFF232323),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: Color(0xFF757575),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 10, color: Colors.black),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
