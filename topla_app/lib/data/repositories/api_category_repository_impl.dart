import 'package:flutter/foundation.dart';
import '../../core/repositories/i_category_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Category repository - Node.js backend implementation
class ApiCategoryRepositoryImpl implements ICategoryRepository {
  final ApiClient _api;

  ApiCategoryRepositoryImpl(this._api);

  @override
  Future<List<CategoryModel>> getCategories() async {
    final response = await _api.get('/categories',
        queryParams: {'tree': 'true'}, auth: false);
    return (response.dataList).map((e) => CategoryModel.fromJson(e)).toList();
  }

  @override
  Future<List<CategoryModel>> getSubCategories(String parentId) async {
    final response = await _api.get('/categories',
        queryParams: {'parentId': parentId}, auth: false);
    return (response.dataList).map((e) => CategoryModel.fromJson(e)).toList();
  }

  @override
  Future<CategoryModel?> getCategoryById(String id) async {
    try {
      final response = await _api.get('/categories/$id', auth: false);
      final data = response.data as Map<String, dynamic>?;
      if (data != null) {
        return CategoryModel.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('getCategoryById error: $e');
      return null;
    }
  }
}
