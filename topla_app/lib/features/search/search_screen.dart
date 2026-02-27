import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/products_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeleton_widgets.dart';
import '../../widgets/empty_states.dart';
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
      final results =
          await productsProvider.searchProducts(query, sort: sortParam);

      setState(() {
        _searchResults = results;
        _totalResults = results.length;
        _isSearching = false;
      });

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
            content: Text(context.l10n.locale.languageCode == 'ru'
                ? 'Ошибка поиска'
                : 'Qidiruvda xatolik'),
            backgroundColor: AppColors.error,
          ),
        );
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
            content: Text(context.l10n.locale.languageCode == 'ru'
                ? 'Товар добавлен в корзину'
                : 'Mahsulot savatga qo\'shildi'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.locale.languageCode == 'ru'
                ? 'Ошибка при добавлении'
                : 'Qo\'shishda xatolik'),
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
    final isRu = context.l10n.locale.languageCode == 'ru';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: _buildSearchField(isRu),
        actions: [
          if (_hasSearched && _searchResults.isNotEmpty)
            IconButton(
              onPressed: _showSortOptions,
              icon: const Icon(Iconsax.sort),
              tooltip: isRu ? 'Сортировка' : 'Saralash',
            ),
        ],
      ),
      body: _buildBody(isRu),
    );
  }

  Widget _buildSearchField(bool isRu) {
    return Container(
      height: 42,
      margin: const EdgeInsets.only(right: 8),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: isRu ? 'Поиск товаров...' : 'Mahsulot qidirish...',
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

  Widget _buildInlineSuggestions(bool isRu) {
    final query = _searchController.text.trim().toLowerCase();
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _suggestions.length,
      separatorBuilder: (_, __) => Divider(
        height: 1,
        color: Colors.grey.shade200,
      ),
      itemBuilder: (context, index) {
        final item = _suggestions[index];
        final name = isRu
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

  Widget _buildBody(bool isRu) {
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

    if (_hasSearched) return _buildSearchResults(isRu);

    // Show inline suggestions if available
    if (_showSuggestions && _suggestions.isNotEmpty) {
      return _buildInlineSuggestions(isRu);
    }

    return _buildSuggestionsPage(isRu);
  }

  Widget _buildSuggestionsPage(bool isRu) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Qidiruv tarixi
        if (_searchHistory.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isRu ? 'История поиска' : 'Qidiruv tarixi',
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

  Widget _buildSearchResults(bool isRu) {
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
                      text: isRu ? 'результатов' : 'natija',
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
                        _getSortLabel(isRu),
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

  String _getSortLabel(bool isRu) {
    switch (_sortBy) {
      case 'price_low':
        return isRu ? 'Дешевле' : 'Arzon';
      case 'price_high':
        return isRu ? 'Дороже' : 'Qimmat';
      case 'newest':
        return isRu ? 'Новинки' : 'Yangi';
      default:
        return isRu ? 'Популярные' : 'Mashhur';
    }
  }

  void _showSortOptions() {
    final isRu = context.l10n.locale.languageCode == 'ru';
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
                  isRu ? 'Сортировка' : 'Saralash',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _buildSortOption(
                'popular',
                isRu ? 'Популярные' : 'Mashhur',
                Iconsax.star,
              ),
              _buildSortOption(
                'price_low',
                isRu ? 'Цена: по возрастанию' : 'Narx: Arzon → Qimmat',
                Iconsax.arrow_up_3,
              ),
              _buildSortOption(
                'price_high',
                isRu ? 'Цена: по убыванию' : 'Narx: Qimmat → Arzon',
                Iconsax.arrow_down,
              ),
              _buildSortOption(
                'newest',
                isRu ? 'Новинки' : 'Eng yangi',
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
