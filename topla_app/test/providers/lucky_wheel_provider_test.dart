import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/core/repositories/i_lucky_wheel_repository.dart';
import 'package:topla_app/providers/lucky_wheel_provider.dart';

// ==================== MOCK ====================
class MockLuckyWheelRepository implements ILuckyWheelRepository {
  List<LuckyWheelPrize> _prizes = [];
  LuckyWheelStatus _status = LuckyWheelStatus(canSpin: true);
  SpinResult? _spinResult;
  Exception? nextError;
  Exception? statusError;
  bool spinCalled = false;

  void seedPrizes(List<LuckyWheelPrize> prizes) {
    _prizes = prizes;
  }

  void setStatus(LuckyWheelStatus status) {
    _status = status;
  }

  void setSpinResult(SpinResult result) {
    _spinResult = result;
  }

  @override
  Future<List<LuckyWheelPrize>> getPrizes() async {
    if (nextError != null) throw nextError!;
    return _prizes;
  }

  @override
  Future<LuckyWheelStatus> getStatus() async {
    if (statusError != null) throw statusError!;
    return _status;
  }

  @override
  Future<SpinResult> spin() async {
    if (nextError != null) throw nextError!;
    spinCalled = true;
    return _spinResult ??
        SpinResult(
          id: 'spin-1',
          prizeType: 'discount_percent',
          prizeName: '10% chegirma',
          prize: _makePrize(),
          nextSpinAt: DateTime.now().add(const Duration(hours: 24)),
        );
  }

  @override
  Future<List<SpinHistoryItem>> getHistory(
      {int page = 1, int limit = 20}) async {
    return [];
  }

  @override
  Future<List<MyPromoCode>> getMyPromoCodes() async {
    return [];
  }

  @override
  Future<Map<String, dynamic>> verifyPromoCode(String code) async {
    return {'valid': true};
  }
}

// ==================== HELPERS ====================
LuckyWheelPrize _makePrize({
  String id = 'prize-1',
  String type = 'discount_percent',
  String nameUz = '10% chegirma',
}) {
  return LuckyWheelPrize(
    id: id,
    nameUz: nameUz,
    nameRu: '10% скидка',
    type: type,
    value: '10',
    color: '#FF6B35',
    sortOrder: 1,
  );
}

void main() {
  late MockLuckyWheelRepository mockRepo;
  late LuckyWheelProvider provider;

  setUp(() {
    mockRepo = MockLuckyWheelRepository();
    provider = LuckyWheelProvider(mockRepo);
  });

  group('LuckyWheelProvider', () {
    test('boshlang\'ich holat', () {
      expect(provider.prizes, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.isSpinning, isFalse);
      expect(provider.canSpin, isTrue);
      expect(provider.lastResult, isNull);
      expect(provider.error, isNull);
    });

    test('loadAll sovg\'alarni yuklaydi', () async {
      mockRepo.seedPrizes([
        _makePrize(id: 'p1', nameUz: '10%'),
        _makePrize(id: 'p2', nameUz: '20%'),
        _makePrize(id: 'p3', nameUz: 'Bepul yetkazish', type: 'free_delivery'),
      ]);

      await provider.loadAll();

      expect(provider.prizes.length, 3);
      expect(provider.isLoading, isFalse);
      expect(provider.error, isNull);
    });

    test('loadAll status ham yuklanadi', () async {
      mockRepo.seedPrizes([_makePrize()]);
      mockRepo.setStatus(LuckyWheelStatus(
        canSpin: false,
        nextSpinAt: DateTime(2024, 6, 1, 12, 0),
      ));

      await provider.loadAll();

      expect(provider.canSpin, isFalse);
      expect(provider.nextSpinAt, isNotNull);
    });

    test('loadAll status xatolikda — faqat prizes ko\'rsatadi', () async {
      mockRepo.seedPrizes([_makePrize()]);
      mockRepo.statusError = Exception('Auth required');

      await provider.loadAll();

      expect(provider.prizes.length, 1);
      expect(provider.canSpin, isTrue); // default, auth yo'q bo'lganda
    });

    test('loadAll xatolikda error qo\'yadi', () async {
      mockRepo.nextError = Exception('Server error');
      await provider.loadAll();

      expect(provider.error, contains('Server error'));
      expect(provider.isLoading, isFalse);
    });

    test('spin muvaffaqiyatli — natija qaytaradi', () async {
      final result = SpinResult(
        id: 's-1',
        prizeType: 'discount_percent',
        prizeName: '15% chegirma',
        promoCode: 'TOPLA15',
        prize: _makePrize(nameUz: '15% chegirma'),
        nextSpinAt: DateTime.now().add(const Duration(hours: 24)),
      );
      mockRepo.setSpinResult(result);

      final spinResult = await provider.spin();

      expect(spinResult, isNotNull);
      expect(spinResult!.prizeName, '15% chegirma');
      expect(spinResult.promoCode, 'TOPLA15');
      expect(provider.canSpin, isFalse);
      expect(provider.lastResult, isNotNull);
      expect(provider.isSpinning, isFalse);
    });

    test('spin xatolikda error qo\'yadi', () async {
      mockRepo.nextError = Exception('Spin failed');

      final result = await provider.spin();

      expect(result, isNull);
      expect(provider.error, contains('Spin failed'));
      expect(provider.isSpinning, isFalse);
    });

    test('spin — canSpin false bo\'lsa null qo\'yadi', () async {
      // Set canSpin to false
      mockRepo.seedPrizes([_makePrize()]);
      mockRepo.setStatus(LuckyWheelStatus(canSpin: false));
      await provider.loadAll();

      final result = await provider.spin();
      expect(result, isNull);
      expect(mockRepo.spinCalled, isFalse);
    });

    test('refreshStatus yangilaydi', () async {
      mockRepo.setStatus(LuckyWheelStatus(
        canSpin: false,
        todaySpin: TodaySpin(prizeType: 'nothing', prizeName: 'Omad'),
      ));

      await provider.refreshStatus();

      expect(provider.canSpin, isFalse);
      expect(provider.todaySpin, isNotNull);
      expect(provider.todaySpin!.prizeName, 'Omad');
    });
  });

  group('LuckyWheelPrize', () {
    test('fromJson to\'g\'ri parse qiladi', () {
      final json = {
        'id': 'p1',
        'nameUz': '10% chegirma',
        'nameRu': 'Скидка 10%',
        'type': 'discount_percent',
        'value': '10',
        'color': '#FF6B35',
        'sortOrder': 1,
      };

      final prize = LuckyWheelPrize.fromJson(json);
      expect(prize.id, 'p1');
      expect(prize.nameUz, '10% chegirma');
      expect(prize.type, 'discount_percent');
      expect(prize.isWin, isTrue);
    });

    test('isWin — nothing tipda false', () {
      final prize = _makePrize(type: 'nothing');
      expect(prize.isWin, isFalse);
    });
  });

  group('MyPromoCode', () {
    test('fromJson va getterlar', () {
      final json = {
        'code': 'TOPLA20',
        'prizeType': 'discount_percent',
        'discountType': 'percentage',
        'discountValue': 20,
        'status': 'active',
        'isUsed': false,
        'isExpired': false,
        'createdAt': '2024-01-01T00:00:00Z',
        'expiresAt':
            DateTime.now().add(const Duration(days: 5)).toIso8601String(),
      };

      final promo = MyPromoCode.fromJson(json);
      expect(promo.code, 'TOPLA20');
      expect(promo.isActive, isTrue);
      expect(promo.formattedDiscount, '20%');
      expect(promo.daysRemaining, greaterThanOrEqualTo(4));
    });

    test('formattedDiscount — free_delivery', () {
      final promo = MyPromoCode(
        code: 'FREE',
        prizeType: 'free_delivery',
        status: 'active',
        isUsed: false,
        isExpired: false,
        createdAt: DateTime.now(),
      );
      expect(promo.formattedDiscount, 'Bepul yetkazish');
    });
  });
}
