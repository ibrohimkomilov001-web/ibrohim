import '../../core/repositories/i_product_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Product repository - Node.js backend implementation
class ApiProductRepositoryImpl implements IProductRepository {
  final ApiClient _api;

  ApiProductRepositoryImpl(this._api);

  @override
  Future<List<ProductModel>> getProducts({
    String? categoryId,
    bool? isFeatured,
    bool? isFlashSale,
    String? search,
    int limit = 20,
    int offset = 0,
  }) async {
    final page = (offset ~/ limit) + 1;
    final params = <String, dynamic>{
      'limit': limit,
      'page': page,
    };
    if (categoryId != null) params['categoryId'] = categoryId;
    if (isFeatured == true) params['isFeatured'] = 'true';
    if (isFlashSale == true) params['isFlashSale'] = 'true';
    if (search != null && search.isNotEmpty) params['search'] = search;

    final response =
        await _api.get('/products', queryParams: params, auth: false);
    return response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  @override
  Future<ProductModel?> getProductById(String id) async {
    try {
      final response = await _api.get('/products/$id', auth: false);
      return ProductModel.fromJson(response.dataMap);
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  @override
  Future<List<ProductModel>> getFeaturedProducts({int limit = 10}) async {
    final response = await _api.get(
      '/products/featured',
      queryParams: {'limit': limit},
      auth: false,
    );
    return response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ProductModel>> getFlashSaleProducts({int limit = 10}) async {
    final response = await _api.get(
      '/products',
      queryParams: {'isFlashSale': 'true', 'limit': limit},
      auth: false,
    );
    return response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ProductModel>> searchProducts(String query,
      {int limit = 20, String? sort}) async {
    final params = <String, dynamic>{'q': query, 'limit': limit};
    if (sort != null) params['sort'] = sort;
    final response = await _api.get(
      '/products/search',
      queryParams: params,
      auth: false,
    );
    return response.dataList
        .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<String>> getPopularSearches() async {
    final response = await _api.get('/search/popular', auth: false);
    final list = response.dataList;
    return list
        .map((e) => (e as Map<String, dynamic>)['query'] as String)
        .toList();
  }

  @override
  Future<List<Map<String, dynamic>>> getSearchSuggestions(String query) async {
    final response = await _api.get(
      '/search/suggest',
      queryParams: {'q': query},
      auth: false,
    );
    return response.dataList
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }

  @override
  Future<List<ProductModel>> getProductsByCategory(
    String categoryId, {
    int limit = 20,
    int offset = 0,
  }) async {
    final response = await _api.get(
      '/products',
      queryParams: {
        'categoryId': categoryId,
        'limit': limit,
        'page': (offset ~/ limit) + 1
      },
      auth: false,
    );
    return response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ProductModel>> getProductsByShop(
    String shopId, {
    int limit = 20,
    int offset = 0,
  }) async {
    final response = await _api.get(
      '/shops/$shopId/products',
      queryParams: {'limit': limit, 'offset': offset},
      auth: false,
    );
    return response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<BrandModel>> getBrandsByCategory(String categoryId) async {
    final response = await _api.get('/brands',
        queryParams: {'categoryId': categoryId}, auth: false);
    return response
        .nestedList('brands')
        .map((e) => BrandModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ColorOption>> getColors() async {
    final response = await _api.get('/colors', auth: false);
    return response
        .nestedList('colors')
        .map((e) => ColorOption.fromJson(e))
        .toList();
  }

  @override
  Future<List<ColorOption>> getColorsByCategory(String categoryId) async {
    final response = await _api.get('/colors',
        queryParams: {'categoryId': categoryId}, auth: false);
    return response
        .nestedList('colors')
        .map((e) => ColorOption.fromJson(e))
        .toList();
  }

  @override
  Future<List<CategoryFilterAttribute>> getCategoryFilters(
      String categoryId) async {
    // TODO: Backend endpoint qo'shish kerak
    return [];
  }

  @override
  Future<FilteredProductsResult> getFilteredProducts({
    required String categoryId,
    required ProductFilter filter,
    int limit = 20,
    int offset = 0,
  }) async {
    final params = <String, dynamic>{
      'categoryId': categoryId,
      'limit': limit,
      'offset': offset,
    };
    if (filter.minPrice != null) params['minPrice'] = filter.minPrice;
    if (filter.maxPrice != null) params['maxPrice'] = filter.maxPrice;
    if (filter.brandIds.isNotEmpty) {
      params['brandIds'] = filter.brandIds.join(',');
    }
    if (filter.colorIds.isNotEmpty) {
      params['colorIds'] = filter.colorIds.join(',');
    }
    if (filter.sortBy != null) params['sortBy'] = filter.sortBy;

    final response =
        await _api.get('/products', queryParams: params, auth: false);
    final products = response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();

    return FilteredProductsResult(
      products: products,
      totalCount: products.length,
    );
  }

  @override
  Future<int> getFilteredProductsCount({
    required String categoryId,
    required ProductFilter filter,
  }) async {
    final result = await getFilteredProducts(
      categoryId: categoryId,
      filter: filter,
      limit: 1,
      offset: 0,
    );
    return result.totalCount;
  }
}
