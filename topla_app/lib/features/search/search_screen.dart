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
import '../../widgets/shein_filter_sheet.dart';
import '../product/product_detail_screen.dart';

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
    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;
    if (isLoggedIn && _searchHistory.isNotEmpty) {
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

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) return;

    _removeSuggestionOverlay();
    setState(() {
      _isSearching = true;
      _hasSearched = true;
      _showSuggestions = false;
    });

    try {
      final productsProvider = context.read<ProductsProvider>();
      final sortParam = _getSortParam();

      // Build filter params for API
      final filterParams = <String, dynamic>{};
      final queryMap = _filter.toQueryMap();
      if (queryMap.containsKey('minPrice'))
        filterParams['minPrice'] = queryMap['minPrice'];
      if (queryMap.containsKey('maxPrice'))
        filterParams['maxPrice'] = queryMap['maxPrice'];
      if (queryMap.containsKey('brandIds'))
        filterParams['brandIds'] = queryMap['brandIds'];
      if (queryMap.containsKey('colorIds'))
        filterParams['colorIds'] = queryMap['colorIds'];
      if (queryMap.containsKey('minRating'))
        filterParams['minRating'] = queryMap['minRating'];
      if (queryMap.containsKey('inStock'))
        filterParams['inStock'] = queryMap['inStock'];
      if (queryMap.containsKey('hasDiscount'))
        filterParams['hasDiscount'] = queryMap['hasDiscount'];
      if (queryMap.containsKey('attributes'))
        filterParams['attributes'] = queryMap['attributes'];
      if (_dominantCategoryId != null)
        filterParams['categoryId'] = _dominantCategoryId;

      final results = await productsProvider.searchProducts(
        query,
        sort: sortParam,
        filters: filterParams.isNotEmpty ? filterParams : null,
      );

      if (mounted) {
        setState(() {
          _searchResults = results;
          _totalResults = results.length;
          _isSearching = false;
        });

        // Detect dominant category from results and load its filters
        _detectAndLoadCategoryFilters(results);
      }

      // Tarixga qo'shish
      _searchHistory.remove(query);
      _searchHistory.insert(0, query);
      if (_searchHistory.length > 15) _searchHistory.removeLast();
      _saveSearchHistory();
    } catch (e) {
      setState(() => _isSearching = false);
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
    final newFilter = await SheinFilterSheet.show(
      context,
      currentFilter: _filter,
      categoryName: 'Filtrlar',
      accentColor: AppColors.primary,
      productCount: _totalResults,
      brands: _brands,
      colors: _colors,
      facets: _facets,
      categoryAttributes: _categoryFilters,
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
        return 'price_asc';
      case 'price_high':
        return 'price_desc';
      case 'newest':
        return 'newest';
      case 'popular':
        return 'popular';
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
                  tooltip: 'Filtrlar',
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
          suffixIcon: _showClearButton
              ? IconButton(
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
                )
              : null,
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
        // Natijalar soni + saralash
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            border: Border(
              bottom: BorderSide(color: Colors.grey.shade200, width: 0.5),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              RichText(
                text: TextSpan(
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 13,
                  ),
                  children: [
                    TextSpan(
                      text: '$_totalResults ',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    TextSpan(
                      text: context.l10n.translate('results_count'),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: _showSortOptions,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Iconsax.sort,
                          size: 16, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        _getSortLabel(),
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Mahsulotlar grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.52,
            ),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
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
}
