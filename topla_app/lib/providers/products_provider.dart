import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../core/utils/app_logger.dart';
import '../models/models.dart';

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
  List<ProductModel> _flashSaleProducts = [];
  List<ProductModel> _allProducts = [];
  List<BannerModel> _banners = [];
  List<ProductModel> _favorites = [];
  Set<String> _favoriteIds = {};
  List<ProductModel> _filteredProducts = [];

  bool _isLoading = false;
  bool _isCategoriesLoading = false;
  bool _isFeaturedLoading = false;
  bool _isFlashSaleLoading = false;
  bool _isBannersLoading = false;
  bool _isFavoritesLoading = false;
  bool _isFilteredLoading = false;
  String? _error;

  // Lazy loading uchun flag'lar
  bool _categoriesLoaded = false;
  bool _featuredLoaded = false;
  bool _flashSaleLoaded = false;
  bool _bannersLoaded = false;
  bool _favoritesLoaded = false;

  // Getters
  List<CategoryModel> get categories => _categories;
  List<ProductModel> get featuredProducts => _featuredProducts;
  List<ProductModel> get flashSaleProducts => _flashSaleProducts;
  List<ProductModel> get allProducts => _allProducts;
  List<BannerModel> get banners => _banners;
  List<ProductModel> get favorites => _favorites;
  List<ProductModel> get filteredProducts => _filteredProducts;
  bool get isLoading => _isLoading;
  bool get isCategoriesLoading => _isCategoriesLoading;
  bool get isFeaturedLoading => _isFeaturedLoading;
  bool get isFlashSaleLoading => _isFlashSaleLoading;
  bool get isBannersLoading => _isBannersLoading;
  bool get isFavoritesLoading => _isFavoritesLoading;
  bool get isFilteredLoading => _isFilteredLoading;
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
      _flashSaleLoaded = false;
      _bannersLoaded = false;
      _favoritesLoaded = false;
    }

    await Future.wait([
      loadCategories(),
      loadFeaturedProducts(),
      loadFlashSaleProducts(),
      loadBanners(),
      loadFavorites(),
    ]);

    _isLoading = false;
    notifyListeners();
  }

  /// Home screen uchun kerakli ma'lumotlarni yuklash
  Future<void> loadHomeData() async {
    AppLogger.d(_tag, 'Loading home data...');
    await Future.wait([
      loadBanners(),
      loadFeaturedProducts(),
      loadFlashSaleProducts(),
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
  Future<void> loadCategories() async {
    if (_categoriesLoaded && _categories.isNotEmpty) return;

    _isCategoriesLoading = true;
    notifyListeners();

    try {
      _categories = await _categoryRepo.getCategories();
      _categoriesLoaded = true;
      AppLogger.d(_tag, 'Categories loaded: ${_categories.length}');
    } catch (e) {
      AppLogger.e(_tag, 'loadCategories error', e);
      _error = e.toString();
    }

    _isCategoriesLoading = false;
    notifyListeners();
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
    notifyListeners();

    try {
      _featuredProducts = await _productRepo.getFeaturedProducts();
      // Agar featured bo'sh bo'lsa — barcha mahsulotlarni ko'rsatish
      if (_featuredProducts.isEmpty) {
        _featuredProducts = await _productRepo.getProducts(limit: 20);
        AppLogger.d(_tag,
            'No featured products, loaded all: ${_featuredProducts.length}');
      }
      _featuredLoaded = true;
      AppLogger.d(
          _tag, 'Featured products loaded: ${_featuredProducts.length}');
    } catch (e) {
      AppLogger.e(_tag, 'loadFeaturedProducts error', e);
      _error = e.toString();
    }

    _isFeaturedLoading = false;
    notifyListeners();
  }

  /// Flash Sale mahsulotlarni yuklash (lazy)
  Future<void> loadFlashSaleProducts() async {
    if (_flashSaleLoaded && _flashSaleProducts.isNotEmpty) return;

    _isFlashSaleLoading = true;
    notifyListeners();

    try {
      _flashSaleProducts = await _productRepo.getFlashSaleProducts();
      _flashSaleLoaded = true;
      AppLogger.d(
          _tag, 'Flash sale products loaded: ${_flashSaleProducts.length}');
    } catch (e) {
      AppLogger.e(_tag, 'loadFlashSaleProducts error', e);
      _error = e.toString();
    }

    _isFlashSaleLoading = false;
    notifyListeners();
  }

  /// Bannerlarni yuklash (lazy)
  Future<void> loadBanners() async {
    if (_bannersLoaded && _banners.isNotEmpty) return;

    _isBannersLoading = true;
    notifyListeners();

    try {
      _banners = await _bannerRepo.getActiveBanners();
      _bannersLoaded = true;
      AppLogger.d(_tag, 'Banners loaded: ${_banners.length}');
    } catch (e) {
      AppLogger.e(_tag, 'loadBanners error', e);
      _error = e.toString();
    }

    _isBannersLoading = false;
    notifyListeners();
  }

  /// Sevimlilarni yuklash (lazy)
  Future<void> loadFavorites() async {
    if (_favoritesLoaded) return;

    _isFavoritesLoading = true;
    notifyListeners();

    try {
      _favorites = await _favoritesRepo.getFavorites();
      _favoriteIds = _favorites.map((p) => p.id).toSet();
      _favoritesLoaded = true;
      AppLogger.d(_tag, 'Favorites loaded: ${_favorites.length}');
    } catch (e) {
      AppLogger.e(_tag, 'loadFavorites error', e);
      _error = e.toString();
    }

    _isFavoritesLoading = false;
    notifyListeners();
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

  /// Mahsulotlarni qidirish (Meilisearch)
  Future<List<ProductModel>> searchProducts(String query,
      {String? sort}) async {
    try {
      return await _productRepo.searchProducts(query, sort: sort);
    } catch (e) {
      AppLogger.e(_tag, 'searchProducts error', e);
      _error = e.toString();
      return [];
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
        _filteredProducts = await _productRepo.searchProducts(categorySlug);
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
        _filteredProducts = await _productRepo.getFlashSaleProducts();
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

  @override
  void dispose() {
    _productsSubscription?.cancel();
    super.dispose();
  }
}
