import 'package:flutter/material.dart';
import '../core/repositories/i_lucky_wheel_repository.dart';

class LuckyWheelProvider extends ChangeNotifier {
  final ILuckyWheelRepository _repo;
  LuckyWheelProvider(this._repo);

  // State
  bool _isLoading = false;
  bool _isSpinning = false;
  String? _error;
  List<LuckyWheelPrize> _prizes = [];
  bool _canSpin = true;
  TodaySpin? _todaySpin;
  DateTime? _nextSpinAt;
  SpinResult? _lastResult;
  List<SpinHistoryItem> _history = [];
  List<MyPromoCode> _myPromoCodes = [];

  // Getters
  bool get isLoading => _isLoading;
  bool get isSpinning => _isSpinning;
  String? get error => _error;
  List<LuckyWheelPrize> get prizes => _prizes;
  bool get canSpin => _canSpin;
  TodaySpin? get todaySpin => _todaySpin;
  DateTime? get nextSpinAt => _nextSpinAt;
  SpinResult? get lastResult => _lastResult;
  List<SpinHistoryItem> get history => _history;
  List<MyPromoCode> get myPromoCodes => _myPromoCodes;

  /// Sovg'alar va holatni yuklash
  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _prizes = await _repo.getPrizes();

      try {
        final status = await _repo.getStatus();
        _canSpin = status.canSpin;
        _todaySpin = status.todaySpin;
        _nextSpinAt = status.nextSpinAt;
      } catch (_) {
        // Auth bo'lmasa faqat prizes ko'rsatish
        _canSpin = true;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Faqat holatni yangilash
  Future<void> refreshStatus() async {
    try {
      final status = await _repo.getStatus();
      _canSpin = status.canSpin;
      _todaySpin = status.todaySpin;
      _nextSpinAt = status.nextSpinAt;
      notifyListeners();
    } catch (_) {}
  }

  /// Barabanni aylantirish
  Future<SpinResult?> spin() async {
    if (_isSpinning || !_canSpin) return null;

    _isSpinning = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _repo.spin();
      _lastResult = result;
      _canSpin = false;
      _nextSpinAt = result.nextSpinAt;
      _todaySpin = TodaySpin(
        prizeType: result.prizeType,
        prizeName: result.prizeName,
        promoCode: result.promoCode,
      );
      return result;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isSpinning = false;
      notifyListeners();
    }
  }

  /// Tarixni yuklash
  Future<void> loadHistory() async {
    try {
      _history = await _repo.getHistory();
      notifyListeners();
    } catch (_) {}
  }

  /// Clear last result
  void clearResult() {
    _lastResult = null;
    notifyListeners();
  }

  /// Foydalanuvchining promo kodlarini yuklash
  Future<void> loadMyPromoCodes() async {
    try {
      _myPromoCodes = await _repo.getMyPromoCodes();
      notifyListeners();
    } catch (_) {}
  }
}
