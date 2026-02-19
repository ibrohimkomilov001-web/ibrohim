import '../../core/repositories/i_shop_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Shop repository - Node.js backend implementation
class ApiShopRepositoryImpl implements IShopRepository {
  final ApiClient _api;

  ApiShopRepositoryImpl(this._api);

  @override
  Future<ShopModel?> getShopById(String shopId) async {
    try {
      final response = await _api.get('/shops/$shopId', auth: false);
      return ShopModel.fromJson(response.dataMap);
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  @override
  Future<List<ShopModel>> getActiveShops({
    int page = 1,
    int pageSize = 20,
    String? searchQuery,
    String? city,
    String? sortBy,
  }) async {
    final params = <String, dynamic>{
      'limit': pageSize,
      'offset': (page - 1) * pageSize,
    };
    if (searchQuery != null) params['search'] = searchQuery;
    if (city != null) params['city'] = city;
    if (sortBy != null) params['sortBy'] = sortBy;

    final response = await _api.get('/shops', queryParams: params, auth: false);
    return response
        .nestedList('shops')
        .map((e) => ShopModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ShopModel>> getTopShops({int limit = 10}) async {
    final response = await _api.get(
      '/shops',
      queryParams: {'sortBy': 'rating', 'limit': limit},
      auth: false,
    );
    return response
        .nestedList('shops')
        .map((e) => ShopModel.fromJson(e))
        .toList();
  }

  @override
  Future<List<ProductModel>> getShopProducts(
    String shopId, {
    int page = 1,
    int pageSize = 20,
    String? categoryId,
    String? sortBy,
  }) async {
    final params = <String, dynamic>{
      'limit': pageSize,
      'offset': (page - 1) * pageSize,
    };
    if (categoryId != null) params['categoryId'] = categoryId;
    if (sortBy != null) params['sortBy'] = sortBy;

    final response = await _api.get('/shops/$shopId/products',
        queryParams: params, auth: false);
    return response
        .nestedList('products')
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  @override
  Future<bool> followShop(String shopId) async {
    await _api.post('/shops/$shopId/follow');
    return true;
  }

  @override
  Future<bool> unfollowShop(String shopId) async {
    await _api.delete('/shops/$shopId/follow');
    return true;
  }

  @override
  Future<bool> isFollowingShop(String shopId) async {
    try {
      final response = await _api.get('/shops/$shopId/is-following');
      return response.dataMap['isFollowing'] == true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<List<ShopModel>> getFollowedShops() async {
    try {
      final response = await _api.get('/user/followed-shops');
      return response
          .nestedList('shops')
          .map((e) => ShopModel.fromJson(e))
          .toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>> getShopStats(String shopId) async {
    // Shop stats available via vendor routes, not public
    return {};
  }

  @override
  Future<List<Map<String, dynamic>>> getShopReviews(
    String shopId, {
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _api.get(
      '/shops/$shopId/reviews',
      queryParams: {'limit': pageSize, 'offset': (page - 1) * pageSize},
      auth: false,
    );
    return response
        .nestedList('reviews')
        .map((e) => e as Map<String, dynamic>)
        .toList();
  }

  @override
  Future<bool> addShopReview({
    required String shopId,
    required int rating,
    String? comment,
    List<String>? images,
    String? orderId,
  }) async {
    await _api.post('/shops/$shopId/reviews', body: {
      'rating': rating,
      if (comment != null) 'comment': comment,
      if (images != null) 'images': images,
      if (orderId != null) 'orderId': orderId,
    });
    return true;
  }

  @override
  Future<Map<String, dynamic>?> getOrCreateConversation(String shopId) async {
    try {
      final response = await _api.post('/chat/rooms', body: {
        'shopId': shopId,
      });
      return response.dataMap;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getMessages(
    String conversationId, {
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _api.get(
        '/chat/rooms/$conversationId/messages',
        queryParams: {'page': page, 'limit': pageSize},
      );
      // Backend returns { items: [...], pagination: {...} }
      final data = response.dataMap;
      if (data.containsKey('items')) {
        return (data['items'] as List).cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  @override
  Future<bool> sendMessage({
    required String conversationId,
    required String message,
    String messageType = 'text',
    String? attachmentUrl,
    String? productId,
    String? orderId,
  }) async {
    try {
      await _api.post('/chat/rooms/$conversationId/messages', body: {
        'message': message,
        if (attachmentUrl != null) 'imageUrl': attachmentUrl,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> markMessagesAsRead(String conversationId) async {
    try {
      await _api.put('/chat/rooms/$conversationId/read');
    } catch (_) {
      // silently fail
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getUserConversations() async {
    try {
      final response = await _api.get('/chat/rooms');
      final data = response.data;
      if (data is List) {
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
