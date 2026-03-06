import '../../core/repositories/i_lucky_wheel_repository.dart';
import '../../core/services/api_client.dart';

class ApiLuckyWheelRepositoryImpl implements ILuckyWheelRepository {
  final ApiClient _api;
  ApiLuckyWheelRepositoryImpl(this._api);

  @override
  Future<List<LuckyWheelPrize>> getPrizes() async {
    final response = await _api.get('/lucky-wheel/prizes', auth: false);
    final data = response.dataMap;
    final prizes = data['prizes'] as List<dynamic>? ?? [];
    return prizes.map((e) => LuckyWheelPrize.fromJson(e)).toList();
  }

  @override
  Future<LuckyWheelStatus> getStatus() async {
    final response = await _api.get('/lucky-wheel/status');
    return LuckyWheelStatus.fromJson(response.dataMap);
  }

  @override
  Future<SpinResult> spin() async {
    final response = await _api.post('/lucky-wheel/spin');
    return SpinResult.fromJson(response.dataMap);
  }

  @override
  Future<List<SpinHistoryItem>> getHistory(
      {int page = 1, int limit = 20}) async {
    final response = await _api.get(
      '/lucky-wheel/history',
      queryParams: {'page': page.toString(), 'limit': limit.toString()},
    );
    final data = response.dataMap;
    final spins = data['spins'] as List<dynamic>? ?? [];
    return spins.map((e) => SpinHistoryItem.fromJson(e)).toList();
  }

  @override
  Future<List<MyPromoCode>> getMyPromoCodes() async {
    final response = await _api.get('/promo-codes/my');
    final data = response.dataMap;
    final codes = data['promoCodes'] as List<dynamic>? ?? [];
    return codes.map((e) => MyPromoCode.fromJson(e)).toList();
  }
}
