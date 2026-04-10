import '../../models/models.dart';
import '../../models/search_result.dart';

/// Mahsulot operatsiyalari uchun interface
abstract class IProductRepository {
  /// Barcha mahsulotlarni olish (pagination bilan)
  Future<List<ProductModel>> getProducts({
    String? categoryId,
    bool? isFeatured,
    String? search,
    int limit = 20,
    int offset = 0,
  });

  /// Bitta mahsulotni olish
  Future<ProductModel?> getProductById(String id);

  /// Bitta mahsulotni raw JSON sifatida olish (variants bilan)
  Future<Map<String, dynamic>?> getProductByIdRaw(String id);

  /// Mahsulot atributlarini olish
  Future<List<Map<String, dynamic>>?> getProductAttributes(String id);

  /// Tavsiya etilgan mahsulotlar
  Future<List<ProductModel>> getFeaturedProducts({int limit = 10});

  /// Mahsulot qidirish (Meilisearch) — pagination bilan
  Future<SearchResult> searchProducts(String query,
      {int page = 1,
      int limit = 20,
      String? sort,
      Map<String, dynamic>? filters});

  /// Mashhur qidiruv so'zlari
  Future<List<String>> getPopularSearches();

  /// Auto-suggest (debounce bilan)
  Future<List<Map<String, dynamic>>> getSearchSuggestions(String query);

  /// Qidiruv tarixini serverdan olish
  Future<List<String>> getSearchHistory();

  /// Qidiruv tarixiga qo'shish
  Future<void> saveSearchQuery(String query);

  /// Barcha qidiruv tarixini tozalash
  Future<void> clearSearchHistory();

  /// Bitta qidiruv so'zini tarixdan o'chirish
  Future<void> removeSearchHistoryItem(String query);

  /// Rasm orqali qidirish (CLIP)
  Future<SearchResult> searchByImage(String imagePath,
      {int page = 1, int limit = 20});

  /// Kategoriya bo'yicha mahsulotlar
  Future<List<ProductModel>> getProductsByCategory(
    String categoryId, {
    int limit = 20,
    int offset = 0,
  });

  /// Do'kon mahsulotlari
  Future<List<ProductModel>> getProductsByShop(
    String shopId, {
    int limit = 20,
    int offset = 0,
  });

  // === FILTER TIZIMI ===

  /// Kategoriya bo'yicha brendlarni olish
  Future<List<BrandModel>> getBrandsByCategory(String categoryId);

  /// Barcha ranglarni olish
  Future<List<ColorOption>> getColors();

  /// Kategoriya bo'yicha ranglarni olish (mahsulot bor)
  Future<List<ColorOption>> getColorsByCategory(String categoryId);

  /// Kategoriyaga xos filter atributlarini olish
  Future<List<CategoryFilterAttribute>> getCategoryFilters(String categoryId);

  /// Fasetli filtr ma'lumotlarini olish (brendlar, ranglar, o'lchamlar soni bilan)
  Future<ProductFacets> getFacets(String categoryId);

  /// Filtrlangan mahsulotlarni olish
  Future<FilteredProductsResult> getFilteredProducts({
    required String categoryId,
    required ProductFilter filter,
    int limit = 20,
    int offset = 0,
  });

  /// Filtrlangan mahsulotlar sonini olish
  Future<int> getFilteredProductsCount({
    required String categoryId,
    required ProductFilter filter,
  });

  /// Mahsulotga sharh qo'shish
  Future<bool> addProductReview({
    required String productId,
    required int rating,
    String? comment,
  });
}
