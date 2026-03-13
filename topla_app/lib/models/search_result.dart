import 'product_model.dart';

/// Search results with pagination meta
class SearchResult {
  final List<ProductModel> products;
  final int total;
  final int page;
  final int limit;
  final int totalPages;
  final String? query;

  const SearchResult({
    required this.products,
    this.total = 0,
    this.page = 1,
    this.limit = 20,
    this.totalPages = 1,
    this.query,
  });

  bool get hasMore => page < totalPages;

  factory SearchResult.fromResponse(
      List<ProductModel> products, Map<String, dynamic>? meta) {
    return SearchResult(
      products: products,
      total: meta?['total'] as int? ?? products.length,
      page: meta?['page'] as int? ?? 1,
      limit: meta?['limit'] as int? ?? 20,
      totalPages: meta?['totalPages'] as int? ?? 1,
      query: meta?['query'] as String?,
    );
  }
}
