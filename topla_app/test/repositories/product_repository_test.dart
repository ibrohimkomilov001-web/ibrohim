import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/core/repositories/i_product_repository.dart';
import 'package:topla_app/models/models.dart';
import 'package:topla_app/models/search_result.dart';

/// Mock product repository for testing
class MockProductRepository implements IProductRepository {
  final List<ProductModel> _products = [
    ProductModel(
      id: 'product-1',
      categoryId: 'cat-1',
      shopId: 'shop-1',
      nameUz: 'Olma',
      nameRu: 'Яблоко',
      descriptionUz: 'Yashil olma',
      descriptionRu: 'Зеленое яблоко',
      price: 10000,
      oldPrice: 12000,
      images: ['https://example.com/apple.jpg'],
      stock: 100,
      isFeatured: true,
      isActive: true,
      createdAt: DateTime.now(),
    ),
    ProductModel(
      id: 'product-2',
      categoryId: 'cat-1',
      shopId: 'shop-1',
      nameUz: 'Banan',
      nameRu: 'Банан',
      descriptionUz: 'Sariq banan',
      descriptionRu: 'Желтый банан',
      price: 15000,
      images: ['https://example.com/banana.jpg'],
      stock: 50,
      isFeatured: true,
      isActive: true,
      createdAt: DateTime.now(),
    ),
    ProductModel(
      id: 'product-3',
      categoryId: 'cat-2',
      shopId: 'shop-2',
      nameUz: 'Sabzi',
      nameRu: 'Морковь',
      descriptionUz: 'Yangi sabzi',
      descriptionRu: 'Свежая морковь',
      price: 8000,
      images: ['https://example.com/carrot.jpg'],
      stock: 200,
      isFeatured: false,
      isActive: true,
      createdAt: DateTime.now(),
    ),
    ProductModel(
      id: 'product-4',
      categoryId: 'cat-2',
      shopId: 'shop-1',
      nameUz: 'Pomidor',
      nameRu: 'Помидор',
      descriptionUz: 'Qizil pomidor',
      descriptionRu: 'Красный помидор',
      price: 12000,
      images: [],
      stock: 0,
      isFeatured: false,
      isActive: false,
      createdAt: DateTime.now(),
    ),
  ];

  @override
  Future<List<ProductModel>> getProducts({
    String? categoryId,
    bool? isFeatured,
    String? search,
    int limit = 20,
    int offset = 0,
  }) async {
    await Future.delayed(const Duration(milliseconds: 10));

    var filtered = _products.where((p) => p.isActive).toList();

    if (categoryId != null) {
      filtered = filtered.where((p) => p.categoryId == categoryId).toList();
    }

    if (isFeatured != null) {
      filtered = filtered.where((p) => p.isFeatured == isFeatured).toList();
    }

    if (search != null && search.isNotEmpty) {
      final query = search.toLowerCase();
      filtered = filtered
          .where((p) =>
              p.nameUz.toLowerCase().contains(query) ||
              p.nameRu.toLowerCase().contains(query))
          .toList();
    }

    // Apply pagination
    final start = offset;
    final end = (offset + limit).clamp(0, filtered.length);

    if (start >= filtered.length) return [];

    return filtered.sublist(start, end);
  }

  @override
  Future<ProductModel?> getProductById(String id) async {
    await Future.delayed(const Duration(milliseconds: 10));
    try {
      return _products.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Map<String, dynamic>?> getProductByIdRaw(String id) async {
    await Future.delayed(const Duration(milliseconds: 10));
    try {
      final product = _products.firstWhere((p) => p.id == id);
      return {
        'id': product.id,
        'name_uz': product.nameUz,
        'name_ru': product.nameRu,
        'price': product.price,
      };
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<ProductModel>> getFeaturedProducts({int limit = 10}) async {
    return getProducts(isFeatured: true, limit: limit);
  }

  @override
  Future<SearchResult> searchProducts(String query,
      {int page = 1,
      int limit = 20,
      String? sort,
      Map<String, dynamic>? filters}) async {
    final products = await getProducts(search: query, limit: limit);
    return SearchResult(
        products: products,
        total: products.length,
        page: page,
        limit: limit,
        totalPages: 1);
  }

  @override
  Future<List<String>> getPopularSearches() async {
    return ['olma', 'banan', 'sabzi'];
  }

  @override
  Future<List<Map<String, dynamic>>> getSearchSuggestions(String query) async {
    final result = await searchProducts(query);
    return result.products.map((p) => {'id': p.id, 'name': p.nameUz}).toList();
  }

  @override
  Future<List<String>> getSearchHistory() async {
    return [];
  }

  @override
  Future<void> saveSearchQuery(String query) async {}

  @override
  Future<void> clearSearchHistory() async {}

  @override
  Future<void> removeSearchHistoryItem(String query) async {}

  @override
  Future<List<ProductModel>> getProductsByCategory(
    String categoryId, {
    int limit = 20,
    int offset = 0,
  }) async {
    return getProducts(categoryId: categoryId, limit: limit, offset: offset);
  }

  @override
  Future<List<ProductModel>> getProductsByShop(
    String shopId, {
    int limit = 20,
    int offset = 0,
  }) async {
    await Future.delayed(const Duration(milliseconds: 10));

    final filtered =
        _products.where((p) => p.isActive && p.shopId == shopId).toList();

    final start = offset;
    final end = (offset + limit).clamp(0, filtered.length);

    if (start >= filtered.length) return [];

    return filtered.sublist(start, end);
  }

  // === FILTER TIZIMI MOCK IMPLEMENTATIONS ===

  @override
  Future<List<BrandModel>> getBrandsByCategory(String categoryId) async {
    return [
      BrandModel(
        id: 'brand-1',
        nameUz: 'Samsung',
        slug: 'samsung',
      ),
      BrandModel(
        id: 'brand-2',
        nameUz: 'Apple',
        slug: 'apple',
      ),
    ];
  }

  @override
  Future<List<ColorOption>> getColors() async {
    return [
      const ColorOption(
        id: 'color-1',
        nameUz: 'Qora',
        hexCode: '#000000',
      ),
      const ColorOption(
        id: 'color-2',
        nameUz: 'Oq',
        hexCode: '#FFFFFF',
      ),
    ];
  }

  @override
  Future<List<ColorOption>> getColorsByCategory(String categoryId) async {
    return getColors();
  }

  @override
  Future<List<CategoryFilterAttribute>> getCategoryFilters(
      String categoryId) async {
    return [];
  }

  @override
  Future<ProductFacets> getFacets(String categoryId) async {
    return ProductFacets.empty;
  }

  @override
  Future<FilteredProductsResult> getFilteredProducts({
    required String categoryId,
    required ProductFilter filter,
    int limit = 20,
    int offset = 0,
  }) async {
    final products = await getProducts(
      categoryId: categoryId,
      limit: limit,
      offset: offset,
    );
    return FilteredProductsResult(
      products: products,
      totalCount: products.length,
      page: 1,
      perPage: limit,
    );
  }

  @override
  Future<int> getFilteredProductsCount({
    required String categoryId,
    required ProductFilter filter,
  }) async {
    final products = await getProducts(categoryId: categoryId);
    return products.length;
  }

  @override
  Future<SearchResult> searchByImage(String imagePath,
      {int page = 1, int limit = 20}) async {
    return SearchResult(
      products: _products.where((p) => p.isActive).take(limit).toList(),
      total: _products.where((p) => p.isActive).length,
      page: page,
      limit: limit,
      totalPages: 1,
    );
  }

  // Helper methods for testing
  void addProduct(ProductModel product) {
    _products.add(product);
  }

  void clearProducts() {
    _products.clear();
  }
}

void main() {
  late MockProductRepository productRepo;

  setUp(() {
    productRepo = MockProductRepository();
  });

  group('ProductRepository Tests', () {
    test('getProducts returns active products', () async {
      final products = await productRepo.getProducts();

      expect(products.length, equals(3)); // Only active products
      expect(products.every((p) => p.isActive), isTrue);
    });

    test('getProducts filters by category', () async {
      final products = await productRepo.getProducts(categoryId: 'cat-1');

      expect(products.length, equals(2));
      expect(products.every((p) => p.categoryId == 'cat-1'), isTrue);
    });

    test('getProducts filters by isFeatured', () async {
      final products = await productRepo.getProducts(isFeatured: true);

      expect(products.length, equals(2));
      expect(products.every((p) => p.isFeatured), isTrue);
    });

    test('getProducts filters by search', () async {
      final products = await productRepo.getProducts(search: 'olma');

      expect(products.length, equals(1));
      expect(products.first.nameUz, equals('Olma'));
    });

    test('getProducts supports pagination', () async {
      final firstPage = await productRepo.getProducts(limit: 2, offset: 0);
      final secondPage = await productRepo.getProducts(limit: 2, offset: 2);

      expect(firstPage.length, equals(2));
      expect(secondPage.length, equals(1));

      // Ensure no duplicates
      final allIds = [
        ...firstPage.map((p) => p.id),
        ...secondPage.map((p) => p.id)
      ];
      expect(allIds.toSet().length, equals(allIds.length));
    });

    test('getProductById returns product', () async {
      final product = await productRepo.getProductById('product-1');

      expect(product, isNotNull);
      expect(product!.id, equals('product-1'));
      expect(product.nameUz, equals('Olma'));
    });

    test('getProductById returns null for non-existent id', () async {
      final product = await productRepo.getProductById('non-existent');
      expect(product, isNull);
    });

    test('getFeaturedProducts returns featured products', () async {
      final products = await productRepo.getFeaturedProducts();

      expect(products.isNotEmpty, isTrue);
      expect(products.every((p) => p.isFeatured), isTrue);
    });

    test('getFeaturedProducts respects limit', () async {
      final products = await productRepo.getFeaturedProducts(limit: 1);

      expect(products.length, equals(1));
    });

    test('searchProducts finds by Uzbek name', () async {
      final result = await productRepo.searchProducts('Banan');

      expect(result.products.length, equals(1));
      expect(result.products.first.nameUz, equals('Banan'));
    });

    test('searchProducts finds by Russian name', () async {
      final result = await productRepo.searchProducts('Яблоко');

      expect(result.products.length, equals(1));
      expect(result.products.first.nameRu, equals('Яблоко'));
    });

    test('searchProducts is case insensitive', () async {
      final result = await productRepo.searchProducts('OLMA');

      expect(result.products.length, equals(1));
    });

    test('getProductsByCategory returns products in category', () async {
      final products = await productRepo.getProductsByCategory('cat-2');

      expect(products.length, equals(1)); // Only active ones
      expect(products.every((p) => p.categoryId == 'cat-2'), isTrue);
    });

    test('getProductsByShop returns products from shop', () async {
      final products = await productRepo.getProductsByShop('shop-1');

      expect(products.length, equals(2)); // Only active ones from shop-1
      expect(products.every((p) => p.shopId == 'shop-1'), isTrue);
    });

    test('product model has correct price info', () async {
      final product = await productRepo.getProductById('product-1');

      expect(product, isNotNull);
      expect(product!.price, equals(10000));
      expect(product.oldPrice, equals(12000));
    });

    test('product model has correct discount percentage', () async {
      final product = await productRepo.getProductById('product-1');

      expect(product, isNotNull);
      // discount = (12000 - 10000) / 12000 * 100 = 16.67%
      final discount =
          ((product!.oldPrice! - product.price) / product.oldPrice! * 100)
              .round();
      expect(discount, equals(17)); // Rounded
    });
  });
}
