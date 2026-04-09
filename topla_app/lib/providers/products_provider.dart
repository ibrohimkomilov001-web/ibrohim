import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../core/utils/app_logger.dart';
import '../models/models.dart';
import '../models/search_result.dart';
import '../services/cache_service.dart';

/// Mahsulotlar holati uchun Provider
/// Repository pattern bilan - backend o'zgarganda bu kod o'zgarmaydi
///
/// LAZY LOADING: Ma'lumotlar faqat kerak bo'lganda yuklanadi
class ProductsProvider extends ChangeNotifier {
  static const _tag = 'ProductsProvider';

  final IProductRepository _productRepo;
  final ICategoryRepository _categoryRepo;
  final IBannerRepository _bannerRepo;
  final IFavoritesRepository _favoritesRepo;

  // Real-time subscription
  StreamSubscription<List<Map<String, dynamic>>>? _productsSubscription;

  ProductsProvider(
    this._productRepo,
    this._categoryRepo,
    this._bannerRepo,
    this._favoritesRepo,
  ) {
    // Faqat kategoriyalarni yuklash - asosiy navigatsiya uchun kerak
    _initializeEssentialData();
    // Real-time subscriptionni boshlash
    _startProductsRealtimeSubscription();
  }

  // State
  List<CategoryModel> _categories = [];
  List<ProductModel> _featuredProducts = [];
  List<ProductModel> _allProducts = [];
  List<BannerModel> _banners = [];
  List<ProductModel> _favorites = [];
  Set<String> _favoriteIds = {};
  List<ProductModel> _filteredProducts = [];

  bool _isLoading = false;
  bool _isCategoriesLoading = false;
  bool _isFeaturedLoading = false;
  bool _isBannersLoading = false;
  bool _isFavoritesLoading = false;
  bool _isFilteredLoading = false;
  String? _error;

  // Lazy loading uchun flag'lar
  bool _categoriesLoaded = false;
  bool _featuredLoaded = false;
  bool _bannersLoaded = false;
  bool _favoritesLoaded = false;

  // Pagination uchun
  static const int _pageSize = 20;
  int _featuredOffset = 0;
  bool _featuredHasMore = true;
  bool _isFeaturedLoadingMore = false;

  // Getters
  List<CategoryModel> get categories => _categories;
  List<ProductModel> get featuredProducts => _featuredProducts;
  List<ProductModel> get allProducts => _allProducts;
  List<BannerModel> get banners => _banners;
  List<ProductModel> get favorites => _favorites;
  List<ProductModel> get filteredProducts => _filteredProducts;
  bool get isLoading => _isLoading;
  bool get isCategoriesLoading => _isCategoriesLoading;
  bool get isFeaturedLoading => _isFeaturedLoading;
  bool get isBannersLoading => _isBannersLoading;
  bool get isFavoritesLoading => _isFavoritesLoading;
  bool get isFilteredLoading => _isFilteredLoading;
  bool get isFeaturedLoadingMore => _isFeaturedLoadingMore;
  bool get featuredHasMore => _featuredHasMore;
  String? get error => _error;

  /// Boshlang'ich kerakli ma'lumotlarni yuklash (faqat kategoriyalar)
  Future<void> _initializeEssentialData() async {
    await loadCategories();
    // Bannerlarni parallel yuklash - home screen uchun
    loadBanners();
  }

  /// Barcha ma'lumotlarni yuklash (agar kerak bo'lsa)
  /// [forceReload] - cache'ni yangilash
  Future<void> loadAll({bool forceReload = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (forceReload) {
      _categoriesLoaded = false;
      _featuredLoaded = false;
      _bannersLoaded = false;
      _favoritesLoaded = false;
      _featuredOffset = 0;
      _featuredHasMore = true;
    }

    await Future.wait([
      loadCategories(),
      loadFeaturedProducts(),
      loadBanners(),
      loadFavorites(),
    ]);

    _isLoading = false;
    notifyListeners();
  }

  /// Home screen uchun kerakli ma'lumotlarni yuklash
  Future<void> loadHomeData() async {
    AppLogger.d(_tag, 'Loading home data...');
    // Bannerlarni har doim yangilab turish (yangi banner qo'shilgan bo'lishi mumkin)
    _bannersLoaded = false;
    _featuredLoaded = false;
    await Future.wait([
      loadBanners(),
      loadFeaturedProducts(),
    ]);
  }

  /// Barcha mahsulotlarni yuklash (lazy - faqat kerak bo'lganda)
  Future<void> loadAllProducts() async {
    try {
      _allProducts = await _productRepo.getProducts(limit: 50);
    } catch (e) {
      AppLogger.e(_tag, 'loadAllProducts error', e);
      _error = e.toString();
    }
    notifyListeners();
  }

  /// Kategoriyalarni yuklash (lazy)
  Future<void> loadCategories({bool force = false}) async {
    if (!force && _categoriesLoaded && _categories.isNotEmpty) return;

    _isCategoriesLoading = true;
    notifyListeners();

    // Cache-first: show cached data immediately
    if (!force && _categories.isEmpty) {
      try {
        final cached = await PersistentCache.get<List<dynamic>>(
          CacheKeys.categories,
          (json) => json as List<dynamic>,
        );
        if (cached != null && cached.isNotEmpty) {
          _categories = cached
              .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
              .toList();
          _categoriesLoaded = true;
          _isCategoriesLoading = false;
          notifyListeners();
          AppLogger.d(_tag, 'Categories from cache: ${_categories.length}');
          // Refresh in background
          _refreshCategoriesInBackground();
          return;
        }
      } catch (e) {
        AppLogger.e(_tag, 'Categories cache read error', e);
      }
    }

    try {
      _categories = await _categoryRepo.getCategories();
      _categoriesLoaded = true;
      AppLogger.d(_tag, 'Categories loaded: ${_categories.length}');
      // Save to cache
      _saveCategoriesCache();
    } catch (e) {
      AppLogger.e(_tag, 'loadCategories error', e);
      _error = e.toString();
    }

    _isCategoriesLoading = false;
    notifyListeners();
  }

  void _refreshCategoriesInBackground() {
    _categoryRepo.getCategories().then((data) {
      _categories = data;
      _saveCategoriesCache();
      notifyListeners();
    }).catchError((e) {
      AppLogger.e(_tag, 'Categories background refresh error', e);
    });
  }

  void _saveCategoriesCache() {
    PersistentCache.set(
      CacheKeys.categories,
      _categories.map((c) => c.toJson()).toList(),
      (data) => data,
      ttl: const Duration(hours: 6),
    );
  }

  /// Subcategoriyalarni yuklash (parent_id bo'yicha)
  Future<List<CategoryModel>> getSubCategories(String parentId) async {
    try {
      return await _categoryRepo.getSubCategories(parentId);
    } catch (e) {
      AppLogger.e(_tag, 'getSubCategories error', e);
      _error = e.toString();
      return [];
    }
  }

  /// Tavsiya etilgan mahsulotlarni yuklash (lazy)
  Future<void> loadFeaturedProducts() async {
    if (_featuredLoaded && _featuredProducts.isNotEmpty) return;

    _isFeaturedLoading = true;
    _featuredOffset = 0;
    _featuredHasMore = true;
    notifyListeners();

    // Cache-first: show cached data immediately
    if (_featuredProducts.isEmpty) {
      try {
        final cached = await PersistentCache.get<List<dynamic>>(
          CacheKeys.featuredProducts,
          (json) => json as List<dynamic>,
        );
        if (cached != null && cached.isNotEmpty) {
          _featuredProducts = cached
              .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
              .toList();
          _featuredOffset = _featuredProducts.length;
          _featuredHasMore = _featuredProducts.length >= _pageSize;
          _featuredLoaded = true;
          _isFeaturedLoading = false;
          notifyListeners();
          AppLogger.d(_tag, 'Featured from cache: ${_featuredProducts.length}');
          // Refresh in background
          _refreshFeaturedInBackground();
          return;
        }
      } catch (e) {
        AppLogger.e(_tag, 'Featured cache read error', e);
      }
    }

    try {
      _featuredProducts =
          await _productRepo.getFeaturedProducts(limit: _pageSize);
      // Agar featured bo'sh bo'lsa — barcha mahsulotlarni ko'rsatish
      if (_featuredProducts.isEmpty) {
        _featuredProducts =
            await _productRepo.getProducts(limit: _pageSize, offset: 0);
        AppLogger.d(_tag,
            'No featured products, loaded all: ${_featuredProducts.length}');
      }
      _featuredOffset = _featuredProducts.length;
      _featuredHasMore = _featuredProducts.length >= _pageSize;
      _featuredLoaded = true;
      AppLogger.d(
          _tag, 'Featured products loaded: ${_featuredProducts.length}');
      // Save to cache
      _saveFeaturedCache();
    } catch (e) {
      AppLogger.e(_tag, 'loadFeaturedProducts error', e);
      _error = e.toString();
    }

    _isFeaturedLoading = false;
    notifyListeners();
  }

  void _refreshFeaturedInBackground() {
    _productRepo.getFeaturedProducts(limit: _pageSize).then((data) async {
      var products = data;
      if (products.isEmpty) {
        products = await _productRepo.getProducts(limit: _pageSize, offset: 0);
      }
      _featuredProducts = products;
      _featuredOffset = products.length;
      _featuredHasMore = products.length >= _pageSize;
      _saveFeaturedCache();
      notifyListeners();
    }).catchError((e) {
      AppLogger.e(_tag, 'Featured background refresh error', e);
    });
  }

  void _saveFeaturedCache() {
    PersistentCache.set(
      CacheKeys.featuredProducts,
      _featuredProducts.map((p) => p.toMap()).toList(),
      (data) => data,
      ttl: const Duration(hours: 1),
    );
  }

  /// Keyingi sahifadagi mahsulotlarni yuklash (infinite scroll)
  Future<void> loadMoreFeaturedProducts() async {
    if (_isFeaturedLoadingMore || !_featuredHasMore) return;

    _isFeaturedLoadingMore = true;
    notifyListeners();

    try {
      final moreProducts = await _productRepo.getProducts(
        limit: _pageSize,
        offset: _featuredOffset,
      );

      if (moreProducts.isEmpty) {
        _featuredHasMore = false;
      } else {
        // Dublikatlarni oldini olish
        final existingIds = _featuredProducts.map((p) => p.id).toSet();
        final newProducts =
            moreProducts.where((p) => !existingIds.contains(p.id)).toList();
        _featuredProducts = [..._featuredProducts, ...newProducts];
        _featuredOffset += moreProducts.length;
        _featuredHasMore = moreProducts.length >= _pageSize;
        AppLogger.d(_tag,
            'Loaded more products: +${newProducts.length}, total: ${_featuredProducts.length}');
      }
    } catch (e) {
      AppLogger.e(_tag, 'loadMoreFeaturedProducts error', e);
      _error = e.toString();
    }

    _isFeaturedLoadingMore = false;
    notifyListeners();
  }

  /// Bannerlarni yuklash (lazy)
  Future<void> loadBanners() async {
    if (_bannersLoaded && _banners.isNotEmpty) return;

    _isBannersLoading = true;
    notifyListeners();

    // Cache-first: show cached data immediately
    if (_banners.isEmpty) {
      try {
        final cached = await PersistentCache.get<List<dynamic>>(
          CacheKeys.banners,
          (json) => json as List<dynamic>,
        );
        if (cached != null && cached.isNotEmpty) {
          _banners = cached
              .map((e) => BannerModel.fromJson(e as Map<String, dynamic>))
              .toList();
          _bannersLoaded = true;
          _isBannersLoading = false;
          notifyListeners();
          AppLogger.d(_tag, 'Banners from cache: ${_banners.length}');
          // Refresh in background
          _refreshBannersInBackground();
          return;
        }
      } catch (e) {
        AppLogger.e(_tag, 'Banners cache read error', e);
      }
    }

    try {
      _banners = await _bannerRepo.getActiveBanners();
      _bannersLoaded = true;
      AppLogger.d(_tag, 'Banners loaded: ${_banners.length}');
      _saveBannersCache();
    } catch (e) {
      AppLogger.e(_tag, 'loadBanners error', e);
      _error = e.toString();
    }

    _isBannersLoading = false;
    notifyListeners();
  }

  void _refreshBannersInBackground() {
    _bannerRepo.getActiveBanners().then((data) {
      _banners = data;
      _saveBannersCache();
      notifyListeners();
    }).catchError((e) {
      AppLogger.e(_tag, 'Banners background refresh error', e);
    });
  }

  void _saveBannersCache() {
    PersistentCache.set(
      CacheKeys.banners,
      _banners.map((b) => b.toJson()).toList(),
      (data) => data,
      ttl: const Duration(hours: 2),
    );
  }

  /// Sevimlilarni yuklash (lazy)
  Future<void> loadFavorites() async {
    if (_favoritesLoaded) return;

    _isFavoritesLoading = true;
    notifyListeners();

    // Cache-first: show cached data immediately
    if (_favorites.isEmpty) {
      try {
        final cached = await PersistentCache.get<List<dynamic>>(
          CacheKeys.favorites,
          (json) => json as List<dynamic>,
        );
        if (cached != null && cached.isNotEmpty) {
          _favorites = cached
              .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
              .toList();
          _favoriteIds = _favorites.map((p) => p.id).toSet();
          _favoritesLoaded = true;
          _isFavoritesLoading = false;
          notifyListeners();
          AppLogger.d(_tag, 'Favorites from cache: ${_favorites.length}');
          // Refresh in background
          _refreshFavoritesInBackground();
          return;
        }
      } catch (e) {
        AppLogger.e(_tag, 'Favorites cache read error', e);
      }
    }

    try {
      _favorites = await _favoritesRepo.getFavorites();
      _favoriteIds = _favorites.map((p) => p.id).toSet();
      _favoritesLoaded = true;
      AppLogger.d(_tag, 'Favorites loaded: ${_favorites.length}');
      _saveFavoritesCache();
    } catch (e) {
      AppLogger.e(_tag, 'loadFavorites error', e);
      _error = e.toString();
    }

    _isFavoritesLoading = false;
    notifyListeners();
  }

  void _refreshFavoritesInBackground() {
    _favoritesRepo.getFavorites().then((data) {
      _favorites = data;
      _favoriteIds = data.map((p) => p.id).toSet();
      _saveFavoritesCache();
      notifyListeners();
    }).catchError((e) {
      AppLogger.e(_tag, 'Favorites background refresh error', e);
    });
  }

  void _saveFavoritesCache() {
    PersistentCache.set(
      CacheKeys.favorites,
      _favorites.map((p) => p.toMap()).toList(),
      (data) => data,
      ttl: const Duration(hours: 1),
    );
  }

  /// Sevimlilarni majburan yangilash (toggle dan keyin)
  Future<void> reloadFavorites() async {
    _favoritesLoaded = false;
    await loadFavorites();
  }

  /// Mahsulot sevimlilarni tekshirish
  bool isFavorite(String productId) {
    return _favoriteIds.contains(productId);
  }

  /// Sevimlilarga qo'shish/o'chirish
  Future<void> toggleFavorite(String productId) async {
    // Optimistic update
    final wasFavorite = _favoriteIds.contains(productId);
    if (wasFavorite) {
      _favoriteIds.remove(productId);
      _favorites.removeWhere((p) => p.id == productId);
    } else {
      _favoriteIds.add(productId);
    }
    notifyListeners();

    try {
      await _favoritesRepo.toggleFavorite(productId);
      if (!wasFavorite) {
        await reloadFavorites();
      }
    } catch (e) {
      // Revert on error
      if (wasFavorite) {
        _favoriteIds.add(productId);
      } else {
        _favoriteIds.remove(productId);
      }
      AppLogger.e(_tag, 'toggleFavorite error', e);
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Mahsulot ID bo'yicha olish (color sibling uchun)
  Future<Map<String, dynamic>?> getProductById(String id) async {
    try {
      final product = await _productRepo.getProductById(id);
      return product?.toJson();
    } catch (e) {
      AppLogger.e(_tag, 'getProductById error', e);
      return null;
    }
  }

  /// Mahsulot ID bo'yicha raw JSON olish (variants bilan)
  Future<Map<String, dynamic>?> getProductByIdRaw(String id) async {
    try {
      return await _productRepo.getProductByIdRaw(id);
    } catch (e) {
      AppLogger.e(_tag, 'getProductByIdRaw error', e);
      return null;
    }
  }

  /// Mahsulotlarni qidirish (Meilisearch) — pagination bilan
  Future<SearchResult> searchProducts(String query,
      {int page = 1, String? sort, Map<String, dynamic>? filters}) async {
    try {
      return await _productRepo.searchProducts(query,
          page: page, sort: sort, filters: filters);
    } catch (e) {
      AppLogger.e(_tag, 'searchProducts error', e);
      _error = e.toString();
      return const SearchResult(products: []);
    }
  }

  /// Mashhur qidiruvlar
  Future<List<String>> getPopularSearches() async {
    try {
      return await _productRepo.getPopularSearches();
    } catch (e) {
      AppLogger.e(_tag, 'getPopularSearches error', e);
      return [];
    }
  }

  /// Auto-suggest
  Future<List<Map<String, dynamic>>> getSearchSuggestions(String query) async {
    try {
      return await _productRepo.getSearchSuggestions(query);
    } catch (e) {
      AppLogger.e(_tag, 'getSearchSuggestions error', e);
      return [];
    }
  }

  /// Server qidiruv tarixi
  Future<List<String>> getSearchHistory() async {
    try {
      return await _productRepo.getSearchHistory();
    } catch (e) {
      AppLogger.e(_tag, 'getSearchHistory error', e);
      return [];
    }
  }

  /// Server qidiruv tarixiga qo'shish
  Future<void> saveSearchQuery(String query) async {
    try {
      await _productRepo.saveSearchQuery(query);
    } catch (_) {}
  }

  /// Server qidiruv tarixini tozalash
  Future<void> clearSearchHistory() async {
    try {
      await _productRepo.clearSearchHistory();
    } catch (_) {}
  }

  /// Server qidiruv tarixidan bitta so'z o'chirish
  Future<void> removeSearchHistoryItem(String query) async {
    try {
      await _productRepo.removeSearchHistoryItem(query);
    } catch (_) {}
  }

  /// Rasm orqali qidirish (CLIP image search)
  Future<SearchResult> searchByImage(String imagePath, {int page = 1}) async {
    try {
      return await _productRepo.searchByImage(imagePath, page: page);
    } catch (e) {
      AppLogger.e(_tag, 'searchByImage error', e);
      _error = e.toString();
      return const SearchResult(products: []);
    }
  }

  /// Kategoriya bo'yicha mahsulotlar
  Future<List<ProductModel>> getProductsByCategory(String categoryId) async {
    try {
      return await _productRepo.getProductsByCategory(categoryId);
    } catch (e) {
      AppLogger.e(_tag, 'getProductsByCategory error', e);
      _error = e.toString();
      return [];
    }
  }

  /// Kategoriya slug bo'yicha mahsulotlarni yuklash (filter uchun)
  Future<void> loadProductsByCategorySlug(String categorySlug) async {
    _isFilteredLoading = true;
    notifyListeners();

    try {
      // Kategoriyani nom bo'yicha topish
      final category = _categories.firstWhere(
        (c) => c.nameUz.toLowerCase().contains(categorySlug.toLowerCase()),
        orElse: () => CategoryModel(id: '', nameUz: '', nameRu: ''),
      );

      if (category.id.isNotEmpty) {
        _filteredProducts =
            await _productRepo.getProductsByCategory(category.id);
      } else {
        // Agar kategoriya topilmasa, qidirish qilish
        final result = await _productRepo.searchProducts(categorySlug);
        _filteredProducts = result.products;
      }
    } catch (e) {
      _error = e.toString();
    }

    _isFilteredLoading = false;
    notifyListeners();
  }

  /// Chegirmali mahsulotlarni yuklash
  Future<void> loadDiscountedProducts() async {
    _isFilteredLoading = true;
    notifyListeners();

    try {
      // Backend'dan chegirmali mahsulotlarni olish
      _filteredProducts = await _productRepo.getProducts(
        limit: 20,
      );
      // Client-side filter: faqat chegirmali
      _filteredProducts =
          _filteredProducts.where((p) => p.discountPercent > 0).toList();

      if (_filteredProducts.isEmpty) {
        _filteredProducts = await _productRepo.getProducts(limit: 20);
      }
    } catch (e) {
      _error = e.toString();
    }

    _isFilteredLoading = false;
    notifyListeners();
  }

  /// Narx bo'yicha mahsulotlarni yuklash
  Future<void> loadProductsByPriceRange(
      {double? minPrice, double? maxPrice}) async {
    _isFilteredLoading = true;
    notifyListeners();

    try {
      // Backend'dan barcha mahsulotlarni olib, narx bo'yicha filtrlash
      final allProducts = await _productRepo.getProducts(limit: 50);
      _filteredProducts = allProducts.where((p) {
        if (minPrice != null && p.price < minPrice) return false;
        if (maxPrice != null && p.price > maxPrice) return false;
        return true;
      }).toList();

      // Narx bo'yicha saralash
      _filteredProducts.sort((a, b) => a.price.compareTo(b.price));
    } catch (e) {
      _error = e.toString();
    }

    _isFilteredLoading = false;
    notifyListeners();
  }

  /// Barcha mahsulotlarni olish
  Future<List<ProductModel>> getAllProducts({int limit = 50}) async {
    try {
      return await _productRepo.getProducts(limit: limit);
    } catch (e) {
      _error = e.toString();
      return [];
    }
  }

  // === FILTER TIZIMI ===

  /// Kategoriya bo'yicha brendlarni olish
  Future<List<BrandModel>> getBrandsByCategory(String categoryId) async {
    try {
      return await _productRepo.getBrandsByCategory(categoryId);
    } catch (e) {
      debugPrint('Error loading brands: $e');
      return [];
    }
  }

  /// Barcha ranglarni olish
  Future<List<ColorOption>> getColors() async {
    try {
      return await _productRepo.getColors();
    } catch (e) {
      debugPrint('Error loading colors: $e');
      return [];
    }
  }

  /// Kategoriya bo'yicha ranglarni olish
  Future<List<ColorOption>> getColorsByCategory(String categoryId) async {
    try {
      return await _productRepo.getColorsByCategory(categoryId);
    } catch (e) {
      debugPrint('Error loading colors: $e');
      return [];
    }
  }

  /// Kategoriyaga xos filter atributlarini olish
  Future<List<CategoryFilterAttribute>> getCategoryFilters(
      String categoryId) async {
    try {
      return await _productRepo.getCategoryFilters(categoryId);
    } catch (e) {
      debugPrint('Error loading category filters: $e');
      return [];
    }
  }

  /// Kategoriya bo'yicha facets (brendlar/ranglar/o'lchamlar soni bilan)
  Future<ProductFacets> getFacets(String categoryId) async {
    try {
      return await _productRepo.getFacets(categoryId);
    } catch (e) {
      debugPrint('Error loading facets: $e');
      return ProductFacets.empty;
    }
  }

  /// Filtrlangan mahsulotlarni olish
  Future<FilteredProductsResult> getFilteredProducts({
    required String categoryId,
    required ProductFilter filter,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      return await _productRepo.getFilteredProducts(
        categoryId: categoryId,
        filter: filter,
        limit: limit,
        offset: offset,
      );
    } catch (e) {
      debugPrint('Error loading filtered products: $e');
      return FilteredProductsResult.empty;
    }
  }

  /// Filtrlangan mahsulotlar sonini olish
  Future<int> getFilteredProductsCount({
    required String categoryId,
    required ProductFilter filter,
  }) async {
    try {
      return await _productRepo.getFilteredProductsCount(
        categoryId: categoryId,
        filter: filter,
      );
    } catch (e) {
      debugPrint('Error getting filtered count: $e');
      return 0;
    }
  }

  /// Products real-time subscriptionni boshlash (disabled - using API polling)
  void _startProductsRealtimeSubscription() {
    // Real-time subscription disabled - using API polling instead
    // TODO: Implement Socket.IO based real-time updates
  }

  /// Real-time subscriptionni to'xtatish
  void stopProductsRealtimeSubscription() {
    _productsSubscription?.cancel();
    _productsSubscription = null;
  }

  /// Logout bo'lganda sevimlilar ma'lumotlarini tozalash
  void clearFavoritesOnLogout() {
    _favorites = [];
    _favoriteIds = {};
    _favoritesLoaded = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _productsSubscription?.cancel();
    super.dispose();
  }
}
