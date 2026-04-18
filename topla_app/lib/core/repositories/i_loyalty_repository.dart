import '../../models/loyalty_model.dart';

/// Loyalty repository interface
abstract class ILoyaltyRepository {
  /// Foydalanuvchining loyalty hisobi
  Future<LoyaltyAccount> getMyAccount();

  /// Kundalik kirish bonusini olish
  Future<int> claimDailyLogin();
}
