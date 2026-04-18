import '../../core/repositories/i_loyalty_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/loyalty_model.dart';

class ApiLoyaltyRepositoryImpl implements ILoyaltyRepository {
  final ApiClient _api;
  ApiLoyaltyRepositoryImpl(this._api);

  @override
  Future<LoyaltyAccount> getMyAccount() async {
    final response = await _api.get('/loyalty/my-account');
    return LoyaltyAccount.fromJson(response.dataMap);
  }

  @override
  Future<int> claimDailyLogin() async {
    final response = await _api.post('/loyalty/daily-login');
    final data = response.dataMap;
    return (data['pointsEarned'] ?? 0) as int;
  }
}
