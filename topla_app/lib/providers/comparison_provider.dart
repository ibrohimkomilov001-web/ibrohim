import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Mahsulotlarni taqqoslash uchun local provider (SharedPreferences bilan)
class ComparisonProvider extends ChangeNotifier {
  static const _storageKey = 'comparison_products';

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> get products => _products;
  int get count => _products.length;

  Set<String> get productIds => _products.map((p) => p['id'] as String).toSet();

  ComparisonProvider() {
    _load();
  }

  bool isInComparison(String productId) => productIds.contains(productId);

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw != null) {
      try {
        final list = jsonDecode(raw) as List;
        _products = list.cast<Map<String, dynamic>>();
        notifyListeners();
      } catch (e) {
        debugPrint('ComparisonProvider load error: $e');
      }
    }
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(_products));
  }

  void addProduct(Map<String, dynamic> product) {
    final id = product['id'] as String?;
    if (id == null || isInComparison(id)) return;
    if (_products.length >= 10) {
      _products.removeAt(0); // Max 10 ta
    }
    _products.add({
      'id': id,
      'name': product['name'] ?? '',
      'price': product['price'] ?? 0,
      'oldPrice': product['oldPrice'] ?? product['originalPrice'],
      'imageUrl': product['imageUrl'] ?? product['image_url'] ?? '',
      'rating': product['rating'] ?? 0,
      'sold': product['sold'] ?? 0,
    });
    notifyListeners();
    _save();
  }

  void removeProduct(String productId) {
    _products.removeWhere((p) => p['id'] == productId);
    notifyListeners();
    _save();
  }

  void clearAll() {
    _products.clear();
    notifyListeners();
    _save();
  }
}
