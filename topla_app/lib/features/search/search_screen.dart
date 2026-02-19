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
  final LayerLink _layerLink = LayerLink();

  List<ProductModel> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;
  String _sortBy = 'popular';
  bool _showClearButton = false;

  // Qidiruv tarixi
  List<String> _searchHistory = [];
  static const String _historyKey = 'search_history';

  // Mashhur qidiruvlar (API dan)
  List<String> _popularSearches = [];
  bool _popularLoading = true;

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
    _loadPopularSearches();

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
    final prefs = await SharedPreferences.getInstance();
    final history = prefs.getStringList(_historyKey);
    if (history != null && mounted) {
      setState(() => _searchHistory = history);
    }
  }

  Future<void> _saveSearchHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_historyKey, _searchHistory);
  }

  Future<void> _loadPopularSearches() async {
    try {
      final popular =
          await context.read<ProductsProvider>().getPopularSearches();
      if (mounted) {
        setState(() {
          _popularSearches = popular.isNotEmpty
              ? popular
              : [
                  'Telefon',
                  'Noutbuk',
                  'Quloqchin',
                  'Smart soat',
                  'Televizor',
                  'Planshet',
                ];
          _popularLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _popularSearches = [
            'Telefon',
            'Noutbuk',
            'Quloqchin',
            'Smart soat',
          ];
          _popularLoading = false;
        });
      }
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
    _removeSuggestionOverlay();
    _overlayEntry = OverlayEntry(builder: (_) => _buildSuggestionOverlay());
    Overlay.of(context).insert(_overlayEntry!);
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
    _saveSearchHistory();
  }

  void _removeHistoryItem(String query) {
    setState(() => _searchHistory.remove(query));
    _saveSearchHistory();
  }

  // ============ BUILD ============

  @override
  Widget build(BuildContext context) {
    final isRu = context.l10n.locale.languageCode == 'ru';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: CompositedTransformTarget(
          link: _layerLink,
          child: _buildSearchField(isRu),
        ),
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
      height: 44,
      margin: const EdgeInsets.only(right: 8),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: isRu ? 'Поиск товаров...' : 'Mahsulot qidirish...',
          prefixIcon: const Icon(Icons.search, size: 22),
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
                  icon: const Icon(Icons.close, size: 20),
                )
              : null,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        onChanged: _onSearchChanged,
        onSubmitted: _performSearch,
      ),
    );
  }

  Widget _buildSuggestionOverlay() {
    final isRu = context.l10n.locale.languageCode == 'ru';
    return Positioned.fill(
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onTap: _removeSuggestionOverlay,
        child: Stack(
          children: [
            CompositedTransformFollower(
              link: _layerLink,
              showWhenUnlinked: false,
              offset: const Offset(0, 48),
              child: Material(
                elevation: 8,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width - 72,
                    maxHeight: 300,
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.grey.shade200,
                    ),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    itemCount: _suggestions.length,
                    separatorBuilder: (_, __) =>
                        Divider(height: 1, color: Colors.grey.shade100),
                    itemBuilder: (context, index) {
                      final item = _suggestions[index];
                      final name = isRu
                          ? (item['nameRu'] ?? item['name'] ?? '')
                          : (item['name'] ?? '');
                      final price = item['price'];
                      final image = item['image'];

                      return ListTile(
                        dense: true,
                        leading: image != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  image,
                                  width: 40,
                                  height: 40,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Iconsax.image,
                                        size: 20, color: Colors.grey),
                                  ),
                                ),
                              )
                            : Icon(Iconsax.search_normal,
                                size: 20, color: Colors.grey.shade500),
                        title: Text(
                          name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14),
                        ),
                        subtitle: price != null
                            ? Text(
                                '${_formatPrice(price)} ${isRu ? 'сум' : 'so\'m'}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              )
                            : null,
                        onTap: () {
                          final productId = item['id'];
                          if (productId != null) {
                            _removeSuggestionOverlay();
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ProductDetailScreen(
                                  product: {
                                    'id': productId,
                                    'name': name,
                                    'price':
                                        price is num ? price.toDouble() : 0.0,
                                    'image': image,
                                  },
                                ),
                              ),
                            );
                          } else {
                            _searchController.text = name;
                            _performSearch(name);
                          }
                        },
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(dynamic price) {
    if (price == null) return '0';
    final num = price is int ? price : (price as double).toInt();
    final str = num.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0) buffer.write(' ');
    }
    return buffer.toString().split('').reversed.join();
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
              Row(
                children: [
                  Icon(Iconsax.clock, size: 18, color: Colors.grey.shade600),
                  const SizedBox(width: 8),
                  Text(
                    isRu ? 'История поиска' : 'Qidiruv tarixi',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              TextButton.icon(
                onPressed: _clearHistory,
                icon: const Icon(Iconsax.trash, size: 16),
                label: Text(isRu ? 'Очистить' : 'Tozalash'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.grey.shade600,
                ),
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

        // Mashhur qidiruvlar
        Row(
          children: [
            Icon(Iconsax.trend_up, size: 18, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              isRu ? 'Популярные запросы' : 'Mashhur qidiruvlar',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_popularLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 10,
            children: _popularSearches.asMap().entries.map((entry) {
              final index = entry.key;
              final query = entry.value;
              final isTop3 = index < 3;
              return ActionChip(
                avatar: isTop3
                    ? Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: AppColors.accent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.accent,
                            ),
                          ),
                        ),
                      )
                    : Icon(Iconsax.search_normal,
                        size: 14, color: Colors.grey.shade600),
                label: Text(
                  query,
                  style: TextStyle(
                    color: isTop3 ? AppColors.primary : Colors.grey.shade800,
                    fontWeight: isTop3 ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
                backgroundColor: isTop3
                    ? AppColors.primary.withValues(alpha: 0.08)
                    : Colors.grey.shade100,
                side: BorderSide(
                  color: isTop3
                      ? AppColors.primary.withValues(alpha: 0.2)
                      : Colors.grey.shade200,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                onPressed: () {
                  _searchController.text = query;
                  _showClearButton = true;
                  _performSearch(query);
                },
              );
            }).toList(),
          ),
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
                        product: {
                          'id': product.id,
                          'name': product.getName(locale),
                          'price': product.price,
                          'oldPrice': product.oldPrice,
                          'discount': product.discountPercent,
                          'rating': product.rating,
                          'sold': product.soldCount,
                          'image': product.firstImage,
                          'cashback': product.cashbackPercent,
                          'description': product.getDescription(locale),
                        },
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
