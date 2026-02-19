import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/repositories/i_courier_repository.dart';
import '../../core/services/api_client.dart';

class ApiCourierRepositoryImpl implements ICourierRepository {
  final ApiClient _api;

  ApiCourierRepositoryImpl(this._api);

  // ==================== STATUS ====================

  @override
  Future<void> registerAsCourier({
    required String vehicleType,
    String? vehicleNumber,
    double maxDistance = 10.0,
  }) async {
    final body = <String, dynamic>{
      'vehicleType': vehicleType,
      'maxDistance': maxDistance,
    };
    if (vehicleNumber != null) body['vehicleNumber'] = vehicleNumber;
    await _api.post('/courier/register', body: body);
  }

  @override
  Future<Map<String, dynamic>?> getCourierProfile() async {
    try {
      final res = await _api.get('/courier/me');
      return res.data as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('getCourierProfile error: $e');
      return null;
    }
  }

  @override
  Future<void> setOnlineStatus(bool isOnline) async {
    await _api.put('/courier/status', body: {
      'status': isOnline ? 'online' : 'offline',
    });
  }

  @override
  Future<void> updateLocation({
    required double latitude,
    required double longitude,
    double? speed,
    double? heading,
  }) async {
    final body = <String, dynamic>{
      'latitude': latitude,
      'longitude': longitude,
    };
    if (speed != null) body['speed'] = speed;
    if (heading != null) body['heading'] = heading;
    await _api.post('/courier/location', body: body);
  }

  // ==================== ORDERS ====================

  @override
  Future<List<Map<String, dynamic>>> getAvailableOrders() async {
    final res = await _api.get('/courier/orders/available');
    final list = res.data as List? ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  @override
  Future<Map<String, dynamic>?> getActiveOrder() async {
    try {
      final res = await _api.get('/courier/orders/active');
      // Backend returns array of active orders
      final list = res.data as List? ?? [];
      if (list.isEmpty) return null;
      return list.first as Map<String, dynamic>;
    } catch (e) {
      debugPrint('getActiveOrder error: $e');
      return null;
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getOrderHistory({
    int limit = 20,
    int offset = 0,
  }) async {
    final page = (offset ~/ limit) + 1;
    final res = await _api.get(
      '/courier/orders/history',
      queryParams: {'limit': limit, 'page': page},
    );
    return res.nestedList('orders').cast<Map<String, dynamic>>();
  }

  @override
  Future<void> acceptOrder(String assignmentId) async {
    await _api.post('/courier/orders/$assignmentId/accept');
  }

  @override
  Future<void> rejectOrder(String assignmentId) async {
    await _api.post('/courier/orders/$assignmentId/reject');
  }

  @override
  Future<void> markPickedUp(String orderId) async {
    await _api.post('/courier/orders/$orderId/picked-up');
  }

  @override
  Future<void> startDelivery(String orderId) async {
    await _api.post('/courier/orders/$orderId/start-delivery');
  }

  @override
  Future<void> markDelivered(String orderId) async {
    await _api.post('/courier/orders/$orderId/delivered');
  }

  // ==================== EARNINGS ====================

  @override
  Future<Map<String, dynamic>> getEarnings({String? period}) async {
    final params = <String, dynamic>{};
    if (period != null) params['period'] = period;
    final res = await _api.get('/courier/earnings', queryParams: params);
    return (res.data as Map<String, dynamic>?) ?? {};
  }

  // ==================== TRACKING ====================

  @override
  Future<Map<String, dynamic>?> trackOrder(String orderId) async {
    try {
      final res = await _api.get('/courier/track/$orderId');
      return res.data as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('trackOrder error: $e');
      return null;
    }
  }
}
