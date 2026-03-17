import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Cache entry with expiration
class CacheEntry<T> {
  final T data;
  final DateTime createdAt;
  final Duration ttl;

  CacheEntry({
    required this.data,
    required this.createdAt,
    required this.ttl,
  });

  bool get isExpired => DateTime.now().difference(createdAt) > ttl;

  Map<String, dynamic> toJson(dynamic Function(T) toJsonData) => {
        'data': toJsonData(data),
        'createdAt': createdAt.toIso8601String(),
        'ttlSeconds': ttl.inSeconds,
      };

  static CacheEntry<T>? fromJson<T>(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonData,
  ) {
    try {
      return CacheEntry<T>(
        data: fromJsonData(json['data']),
        createdAt: DateTime.parse(json['createdAt']),
        ttl: Duration(seconds: json['ttlSeconds']),
      );
    } catch (e) {
      return null;
    }
  }
}

/// In-memory cache
class MemoryCache {
  static final MemoryCache _instance = MemoryCache._internal();
  factory MemoryCache() => _instance;
  MemoryCache._internal();

  final Map<String, CacheEntry<dynamic>> _cache = {};
  final int _maxEntries = 100;

  /// Get cached value
  T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null) return null;

    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }

    return entry.data as T?;
  }

  /// Set cached value
  void set<T>(String key, T data, {Duration ttl = const Duration(minutes: 5)}) {
    // Remove oldest entries if cache is full
    if (_cache.length >= _maxEntries) {
      _removeOldestEntries();
    }

    _cache[key] = CacheEntry<T>(
      data: data,
      createdAt: DateTime.now(),
      ttl: ttl,
    );
  }

  /// Check if key exists and not expired
  bool has(String key) {
    final entry = _cache[key];
    if (entry == null) return false;

    if (entry.isExpired) {
      _cache.remove(key);
      return false;
    }

    return true;
  }

  /// Remove specific key
  void remove(String key) {
    _cache.remove(key);
  }

  /// Remove keys matching pattern
  void removeWhere(bool Function(String key) test) {
    _cache.removeWhere((key, _) => test(key));
  }

  /// Clear all cache
  void clear() {
    _cache.clear();
  }

  /// Clear expired entries
  void clearExpired() {
    _cache.removeWhere((_, entry) => entry.isExpired);
  }

  void _removeOldestEntries() {
    if (_cache.isEmpty) return;

    // Sort by creation time and remove oldest 20%
    final sorted = _cache.entries.toList()
      ..sort((a, b) => a.value.createdAt.compareTo(b.value.createdAt));

    final toRemove = (sorted.length * 0.2).ceil();
    for (var i = 0; i < toRemove && i < sorted.length; i++) {
      _cache.remove(sorted[i].key);
    }
  }
}

/// Persistent cache using SharedPreferences
class PersistentCache {
  static const String _prefix = 'cache_';
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Get cached value
  static Future<T?> get<T>(
    String key,
    T Function(dynamic) fromJson,
  ) async {
    await init();

    final jsonStr = _prefs?.getString('$_prefix$key');
    if (jsonStr == null) return null;

    try {
      final json = jsonDecode(jsonStr) as Map<String, dynamic>;
      final entry = CacheEntry.fromJson<T>(json, fromJson);

      if (entry == null || entry.isExpired) {
        await remove(key);
        return null;
      }

      return entry.data;
    } catch (e) {
      await remove(key);
      return null;
    }
  }

  /// Set cached value
  static Future<void> set<T>(
    String key,
    T data,
    dynamic Function(T) toJson, {
    Duration ttl = const Duration(hours: 1),
  }) async {
    await init();

    final entry = CacheEntry<T>(
      data: data,
      createdAt: DateTime.now(),
      ttl: ttl,
    );

    final jsonStr = jsonEncode(entry.toJson(toJson));
    await _prefs?.setString('$_prefix$key', jsonStr);
  }

  /// Remove specific key
  static Future<void> remove(String key) async {
    await init();
    await _prefs?.remove('$_prefix$key');
  }

  /// Clear all cache
  static Future<void> clear() async {
    await init();

    final keys = _prefs?.getKeys().where((k) => k.startsWith(_prefix)) ?? [];
    for (final key in keys) {
      await _prefs?.remove(key);
    }
  }
}

/// Cache manager combining memory and persistent cache
class CacheService {
  CacheService();

  final MemoryCache _memoryCache = MemoryCache();

  /// Simple get from memory cache
  T? get<T>(String key) {
    return _memoryCache.get<T>(key);
  }

  /// Simple set to memory cache
  void set<T>(String key, T data,
      {Duration expiry = const Duration(minutes: 5)}) {
    _memoryCache.set<T>(key, data, ttl: expiry);
  }

  /// Check if key exists in cache
  bool has(String key) {
    return _memoryCache.has(key);
  }

  /// Remove from cache
  void remove(String key) {
    _memoryCache.remove(key);
  }

  /// Get or fetch data
  /// First checks memory cache, then persistent cache, then fetches
  Future<T> getOrFetch<T>({
    required String key,
    required Future<T> Function() fetch,
    required T Function(dynamic) fromJson,
    required dynamic Function(T) toJson,
    Duration memoryTtl = const Duration(minutes: 5),
    Duration persistentTtl = const Duration(hours: 1),
    bool forceRefresh = false,
  }) async {
    // Check memory cache first
    if (!forceRefresh) {
      final memoryData = _memoryCache.get<T>(key);
      if (memoryData != null) {
        return memoryData;
      }

      // Check persistent cache
      final persistentData = await PersistentCache.get<T>(key, fromJson);
      if (persistentData != null) {
        // Also store in memory cache
        _memoryCache.set(key, persistentData, ttl: memoryTtl);
        return persistentData;
      }
    }

    // Fetch fresh data
    final data = await fetch();

    // Store in both caches
    _memoryCache.set(key, data, ttl: memoryTtl);
    await PersistentCache.set(key, data, toJson, ttl: persistentTtl);

    return data;
  }

  /// Invalidate cache for key
  Future<void> invalidate(String key) async {
    _memoryCache.remove(key);
    await PersistentCache.remove(key);
  }

  /// Invalidate cache matching pattern
  Future<void> invalidateWhere(bool Function(String key) test) async {
    _memoryCache.removeWhere(test);
    // Note: PersistentCache doesn't support pattern removal easily
    // You may want to store keys separately for pattern invalidation
  }

  /// Clear all caches
  Future<void> clearAll() async {
    _memoryCache.clear();
    await PersistentCache.clear();
  }
}

/// Cache keys constants
class CacheKeys {
  static const String categories = 'categories';
  static const String banners = 'banners';
  static const String products = 'products';
  static const String userProfile = 'user_profile';
  static const String addresses = 'addresses';
  static const String settings = 'app_settings';

  static String productDetail(String id) => 'product_$id';
  static String categoryProducts(String categoryId) =>
      'category_products_$categoryId';
  static String vendorProducts(String vendorId) => 'vendor_products_$vendorId';
  static String orderDetail(String orderId) => 'order_$orderId';
}
