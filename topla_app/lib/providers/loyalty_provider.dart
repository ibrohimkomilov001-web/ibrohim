import 'package:flutter/material.dart';
import '../core/repositories/i_loyalty_repository.dart';
import '../models/loyalty_model.dart';

class LoyaltyProvider extends ChangeNotifier {
  final ILoyaltyRepository _repo;
  LoyaltyProvider(this._repo);

  // State
  bool _isLoading = false;
  bool _isClaiming = false;
  String? _error;
  LoyaltyAccount? _account;
  bool _dailyClaimed = false;

  // Getters
  bool get isLoading => _isLoading;
  bool get isClaiming => _isClaiming;
  String? get error => _error;
  LoyaltyAccount? get account => _account;
  bool get dailyClaimed => _dailyClaimed;

  /// Loyalty hisobni yuklash
  Future<void> loadAccount() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _account = await _repo.getMyAccount();

      // Bugun bonus olinganmi tekshirish
      if (_account?.lastDailyLogin != null) {
        final today = DateTime.now();
        final last = _account!.lastDailyLogin!;
        _dailyClaimed = last.year == today.year &&
            last.month == today.month &&
            last.day == today.day;
      } else {
        _dailyClaimed = false;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Kundalik kirish bonusini olish
  Future<int?> claimDailyLogin() async {
    if (_isClaiming || _dailyClaimed) return null;

    _isClaiming = true;
    _error = null;
    notifyListeners();

    try {
      final points = await _repo.claimDailyLogin();
      _dailyClaimed = true;
      // Hisobni yangilash
      await loadAccount();
      return points;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    } finally {
      _isClaiming = false;
      notifyListeners();
    }
  }
}
