import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/core/repositories/i_shop_repository.dart';
import 'package:topla_app/models/shop_model.dart';
import 'package:topla_app/models/product_model.dart';
import 'package:topla_app/providers/shop_provider.dart';

// ==================== MOCK ====================
class MockShopRepository implements IShopRepository {
  List<ShopModel> _shops = [];
  List<ShopModel> _followedShops = [];
  List<ShopModel> _topShops = [];
  List<ProductModel> _products = [];
  final Set<String> _followedIds = {};
  Exception? nextError;
  bool followCalled = false;
  bool unfollowCalled = false;

  void seedShops(List<ShopModel> shops) {
    _shops = List.from(shops);
  }

  void seedTopShops(List<ShopModel> shops) {
    _topShops = List.from(shops);
  }

  @override
  Future<ShopModel?> getShopById(String shopId) async {
    if (nextError != null) throw nextError!;
    return _shops.where((s) => s.id == shopId).firstOrNull;
  }

  @override
  Future<List<ShopModel>> getActiveShops({
    int page = 1,
    int pageSize = 20,
    String? searchQuery,
    String? city,
    String? sortBy,
  }) async {
    if (nextError != null) throw nextError!;
    var result = List<ShopModel>.from(_shops);
    if (searchQuery != null && searchQuery.isNotEmpty) {
      result = result
          .where(
              (s) => s.name.toLowerCase().contains(searchQuery.toLowerCase()))
          .toList();
    }
    if (city != null) {
      result = result.where((s) => s.city == city).toList();
    }
    return result;
  }

  @override
  Future<List<ShopModel>> getTopShops({int limit = 10}) async {
    if (nextError != null) throw nextError!;
    return _topShops.take(limit).toList();
  }

  @override
  Future<List<ProductModel>> getShopProducts(
    String shopId, {
    int page = 1,
    int pageSize = 20,
    String? categoryId,
    String? sortBy,
  }) async {
    if (nextError != null) throw nextError!;
    return _products;
  }

  @override
  Future<bool> followShop(String shopId) async {
    if (nextError != null) throw nextError!;
    followCalled = true;
    _followedIds.add(shopId);
    return true;
  }

  @override
  Future<bool> unfollowShop(String shopId) async {
    if (nextError != null) throw nextError!;
    unfollowCalled = true;
    _followedIds.remove(shopId);
    return true;
  }

  @override
  Future<bool> isFollowingShop(String shopId) async {
    return _followedIds.contains(shopId);
  }

  @override
  Future<List<ShopModel>> getFollowedShops() async {
    return _followedShops;
  }

  @override
  Future<Map<String, dynamic>> getShopStats(String shopId) async {
    return {'totalOrders': 100, 'totalSales': 5000000};
  }

  @override
  Future<List<Map<String, dynamic>>> getShopReviews(
    String shopId, {
    int page = 1,
    int pageSize = 20,
  }) async {
    return [];
  }

  @override
  Future<bool> addShopReview({
    required String shopId,
    required int rating,
    String? comment,
    List<String>? images,
    String? orderId,
  }) async {
    return true;
  }

  @override
  Future<Map<String, dynamic>?> getOrCreateConversation(String shopId) async {
    return {'id': 'conv-1', 'shopId': shopId};
  }

  @override
  Future<List<Map<String, dynamic>>> getMessages(
    String conversationId, {
    int page = 1,
    int pageSize = 50,
  }) async {
    return [];
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
    return true;
  }

  @override
  Future<void> markMessagesAsRead(String conversationId) async {}

  @override
  Future<List<Map<String, dynamic>>> getUserConversations() async {
    return [];
  }
}

// ==================== HELPERS ====================
ShopModel _makeShop({
  String id = 'shop-1',
  String name = 'Test Shop',
  String? city,
  double rating = 4.5,
  int followersCount = 100,
}) {
  return ShopModel(
    id: id,
    ownerId: 'owner-1',
    name: name,
    city: city,
    rating: rating,
    followersCount: followersCount,
    createdAt: DateTime(2024, 1, 1),
  );
}

void main() {
  late MockShopRepository mockRepo;
  late ShopProvider provider;

  setUp(() {
    mockRepo = MockShopRepository();
    provider = ShopProvider(mockRepo);
  });

  group('ShopProvider', () {
    test('boshlang\'ich holat', () {
      expect(provider.currentShop, isNull);
      expect(provider.shops, isEmpty);
      expect(provider.topShops, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.error, isNull);
    });

    test('loadShop muvaffaqiyatli yuklaydi', () async {
      mockRepo.seedShops([_makeShop(id: 's1', name: 'Mega Shop')]);

      await provider.loadShop('s1');

      expect(provider.currentShop, isNotNull);
      expect(provider.currentShop!.name, 'Mega Shop');
      expect(provider.isLoading, isFalse);
    });

    test('loadShop topilmasa currentShop null', () async {
      await provider.loadShop('nonexistent');
      expect(provider.currentShop, isNull);
    });

    test('loadShop xatolikda error qo\'yadi', () async {
      mockRepo.nextError = Exception('Network error');
      await provider.loadShop('s1');

      expect(provider.error, contains('Network error'));
      expect(provider.isLoading, isFalse);
    });

    test('loadShops barcha do\'konlarni yuklaydi', () async {
      mockRepo.seedShops([
        _makeShop(id: 's1', name: 'Shop 1'),
        _makeShop(id: 's2', name: 'Shop 2'),
        _makeShop(id: 's3', name: 'Shop 3'),
      ]);

      await provider.loadShops();

      expect(provider.shops.length, 3);
      expect(provider.isLoading, isFalse);
    });

    test('searchShops filtrlaydi', () async {
      mockRepo.seedShops([
        _makeShop(id: 's1', name: 'Mega Market'),
        _makeShop(id: 's2', name: 'Mini Store'),
        _makeShop(id: 's3', name: 'Mega Outlet'),
      ]);

      await provider.searchShops('Mega');

      expect(provider.shops.length, 2);
      expect(provider.shops.every((s) => s.name.contains('Mega')), isTrue);
    });

    test('loadShops xatolikda error', () async {
      mockRepo.nextError = Exception('Server down');
      await provider.loadShops();

      expect(provider.error, contains('Server down'));
      expect(provider.shops, isEmpty);
    });

    test('loadTopShops muvaffaqiyatli', () async {
      mockRepo.seedTopShops([
        _makeShop(id: 't1', name: 'Top 1', rating: 5.0),
        _makeShop(id: 't2', name: 'Top 2', rating: 4.8),
      ]);

      await provider.loadTopShops();

      expect(provider.topShops.length, 2);
      expect(provider.isLoading, isFalse);
    });

    test('followShop muvaffaqiyatli', () async {
      mockRepo.seedShops(
          [_makeShop(id: 's1', name: 'Follow Me', followersCount: 10)]);
      await provider.loadShop('s1');

      await provider.followShop('s1');
      expect(mockRepo.followCalled, isTrue);
    });

    test('unfollowShop muvaffaqiyatli', () async {
      mockRepo.seedShops([_makeShop(id: 's1')]);
      await provider.loadShop('s1');

      await provider.unfollowShop('s1');
      expect(mockRepo.unfollowCalled, isTrue);
    });
  });

  group('ShopModel', () {
    test('fromJson to\'g\'ri parse qiladi', () {
      final json = {
        'id': 'shop-1',
        'owner_id': 'user-1',
        'name': 'Test Shop',
        'slug': 'test-shop',
        'description': 'Ajoyib do\'kon',
        'is_verified': true,
        'is_active': true,
        'commission_rate': 8.5,
        'rating': 4.7,
        'followers_count': 250,
        'created_at': '2024-01-01T00:00:00Z',
      };

      final shop = ShopModel.fromJson(json);
      expect(shop.id, 'shop-1');
      expect(shop.name, 'Test Shop');
      expect(shop.isVerified, isTrue);
      expect(shop.commissionRate, 8.5);
      expect(shop.rating, 4.7);
      expect(shop.followersCount, 250);
    });
  });
}
