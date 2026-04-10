import '../../core/repositories/i_product_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';
import '../../models/search_result.dart';

/// Product repository - Node.js backend implementation
class ApiProductRepositoryImpl implements IProductRepository {
  final ApiClient _api;

  ApiProductRepositoryImpl(this._api);

  @override
  Future<List<ProductModel>> getProducts({
    String? categoryId,
    bool? isFeatured,
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
  Future<Map<String, dynamic>?> getProductByIdRaw(String id) async {
    try {
      final response = await _api.get('/products/$id', auth: false);
      return response.dataMap;
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  @override
  Future<List<Map<String, dynamic>>?> getProductAttributes(String id) async {
    try {
      final response = await _api.get('/products/$id/attributes', auth: false);
      final list = response.data;
      if (list is List) {
        return List<Map<String, dynamic>>.from(
          list.map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      return null;
    } catch (e) {
      return null;
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
  Future<SearchResult> searchProducts(String query,
      {int page = 1,
      int limit = 20,
      String? sort,
      Map<String, dynamic>? filters}) async {
    final params = <String, dynamic>{'q': query, 'page': page, 'limit': limit};
    if (sort != null) params['sort'] = sort;
    if (filters != null) {
      filters.forEach((key, value) {
        if (value != null && value.toString().isNotEmpty) {
          params[key] = value;
        }
      });
    }
    final response = await _api.get(
      '/products/search',
      queryParams: params,
      auth: false,
    );
    final products = response.dataList
        .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return SearchResult.fromResponse(products, response.meta);
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
  Future<List<String>> getSearchHistory() async {
    try {
      final response = await _api.get('/search/history');
      return response.dataList
          .map((e) => (e as Map<String, dynamic>)['query'] as String)
          .toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<void> saveSearchQuery(String query) async {
    try {
      await _api.post('/search/history', body: {'query': query});
    } catch (_) {
      // Silently fail — local history is the fallback
    }
  }

  @override
  Future<void> clearSearchHistory() async {
    try {
      await _api.delete('/search/history');
    } catch (_) {}
  }

  @override
  Future<void> removeSearchHistoryItem(String query) async {
    try {
      await _api.delete('/search/history/${Uri.encodeComponent(query)}');
    } catch (_) {}
  }

  @override
  Future<SearchResult> searchByImage(String imagePath,
      {int page = 1, int limit = 20}) async {
    final response = await _api.upload(
      '/search/image?page=$page&limit=$limit',
      filePath: imagePath,
      fieldName: 'file',
      auth: false,
    );
    final products = response.dataList
        .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return SearchResult.fromResponse(products, response.meta);
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
    try {
      final response =
          await _api.get('/categories/$categoryId/attributes', auth: false);
      final data = response.data['data'];
      if (data is List) {
        return data
            .map((e) =>
                CategoryFilterAttribute.fromJson(e as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  @override
  Future<ProductFacets> getFacets(String categoryId) async {
    try {
      final response = await _api.get('/products/facets',
          queryParams: {'categoryId': categoryId}, auth: false);
      final data = response.data['data'];
      if (data is Map<String, dynamic>) {
        return ProductFacets.fromJson(data);
      }
      return ProductFacets.empty;
    } catch (e) {
      return ProductFacets.empty;
    }
  }

  @override
  Future<FilteredProductsResult> getFilteredProducts({
    required String categoryId,
    required ProductFilter filter,
    int limit = 20,
    int offset = 0,
  }) async {
    final page = (offset ~/ limit) + 1;
    final params = <String, dynamic>{
      'categoryId': categoryId,
      'limit': limit,
      'page': page,
    };
    // Asosiy filtrlar
    if (filter.minPrice != null) params['minPrice'] = filter.minPrice;
    if (filter.maxPrice != null) params['maxPrice'] = filter.maxPrice;
    if (filter.minRating != null) params['minRating'] = filter.minRating;
    if (filter.onlyInStock) params['inStock'] = true;
    if (filter.onlyWithDiscount) params['hasDiscount'] = true;
    if (filter.brandIds.isNotEmpty) {
      params['brandIds'] = filter.brandIds.join(',');
    }
    if (filter.colorIds.isNotEmpty) {
      params['colorIds'] = filter.colorIds.join(',');
    }
    if (filter.sizeIds.isNotEmpty) {
      params['sizeIds'] = filter.sizeIds.join(',');
    }
    if (filter.shopIds.isNotEmpty) {
      params['shopIds'] = filter.shopIds.join(',');
    }
    if (filter.deliveryHours != null) {
      params['deliveryHours'] = filter.deliveryHours;
    }
    if (filter.deliveryType != null) {
      params['deliveryType'] = filter.deliveryType;
    }
    if (filter.isWowPrice == true) {
      params['isWowPrice'] = true;
    }
    if (filter.isOriginal == true) {
      params['isOriginal'] = true;
    }
    if (filter.sortBy != null) params['sortBy'] = filter.sortBy;

    // Dinamik kategoriya atributlari (C1 fix)
    if (filter.attributes.isNotEmpty) {
      final queryMap = filter.toQueryMap();
      if (queryMap.containsKey('attributes')) {
        params['attributes'] = queryMap['attributes'];
      }
    }

    final response =
        await _api.get('/products', queryParams: params, auth: false);
    final products = response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();

    // Pagination ma'lumotlarini olish
    final pagination = response.data['data']?['pagination'];
    final total = pagination?['total'] ?? products.length;

    return FilteredProductsResult(
      products: products,
      totalCount: total,
      page: page,
      perPage: limit,
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

  @override
  Future<bool> addProductReview({
    required String productId,
    required int rating,
    String? comment,
  }) async {
    await _api.post('/products/$productId/reviews', body: {
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    });
    return true;
  }
}
