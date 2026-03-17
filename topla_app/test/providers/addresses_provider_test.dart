import 'package:flutter_test/flutter_test.dart';
import 'package:topla_app/core/repositories/repositories.dart';
import 'package:topla_app/models/models.dart';
import 'package:topla_app/providers/addresses_provider.dart';

// ==================== MOCK ====================
class MockAddressRepository implements IAddressRepository {
  List<AddressModel> _addresses = [];
  Exception? nextError;
  bool addCalled = false;
  bool updateCalled = false;
  bool deleteCalled = false;
  bool setDefaultCalled = false;
  String? lastDeletedId;
  String? lastDefaultId;

  void seedAddresses(List<AddressModel> addresses) {
    _addresses = List.from(addresses);
  }

  @override
  Future<List<AddressModel>> getAddresses() async {
    if (nextError != null) throw nextError!;
    return _addresses;
  }

  @override
  Future<AddressModel?> getAddressById(String id) async {
    return _addresses.where((a) => a.id == id).firstOrNull;
  }

  @override
  Future<AddressModel?> getDefaultAddress() async {
    return _addresses.where((a) => a.isDefault).firstOrNull;
  }

  @override
  Future<AddressModel> addAddress(AddressModel address) async {
    if (nextError != null) throw nextError!;
    addCalled = true;
    final newAddress = AddressModel(
      id: 'addr-${_addresses.length + 1}',
      title: address.title,
      address: address.address,
      apartment: address.apartment,
      entrance: address.entrance,
      floor: address.floor,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
    );
    _addresses.add(newAddress);
    return newAddress;
  }

  @override
  Future<void> updateAddress(AddressModel address) async {
    if (nextError != null) throw nextError!;
    updateCalled = true;
    final index = _addresses.indexWhere((a) => a.id == address.id);
    if (index != -1) _addresses[index] = address;
  }

  @override
  Future<void> deleteAddress(String id) async {
    if (nextError != null) throw nextError!;
    deleteCalled = true;
    lastDeletedId = id;
    _addresses.removeWhere((a) => a.id == id);
  }

  @override
  Future<void> setDefaultAddress(String id) async {
    if (nextError != null) throw nextError!;
    setDefaultCalled = true;
    lastDefaultId = id;
    _addresses = _addresses
        .map((a) => AddressModel(
              id: a.id,
              title: a.title,
              address: a.address,
              isDefault: a.id == id,
            ))
        .toList();
  }
}

// ==================== HELPERS ====================
AddressModel _makeAddress({
  String id = 'addr-1',
  String title = 'Uy',
  String address = 'Tashkent, Chilanzar 5',
  bool isDefault = false,
}) {
  return AddressModel(
    id: id,
    title: title,
    address: address,
    isDefault: isDefault,
  );
}

void main() {
  late MockAddressRepository mockRepo;
  late AddressesProvider provider;

  setUp(() {
    mockRepo = MockAddressRepository();
    provider = AddressesProvider(mockRepo);
  });

  group('AddressesProvider', () {
    test('boshlang\'ich holat — bo\'sh, loading false', () {
      expect(provider.addresses, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.isEmpty, isTrue);
      expect(provider.error, isNull);
      expect(provider.isInitialized, isFalse);
    });

    test('loadAddresses muvaffaqiyatli yuklaydi', () async {
      mockRepo.seedAddresses([
        _makeAddress(id: 'a1', title: 'Uy', isDefault: true),
        _makeAddress(id: 'a2', title: 'Ish'),
      ]);

      await provider.loadAddresses();

      expect(provider.addresses.length, 2);
      expect(provider.isEmpty, isFalse);
      expect(provider.isInitialized, isTrue);
      expect(provider.isLoading, isFalse);
    });

    test('loadAddresses xatolikda error qo\'yadi', () async {
      mockRepo.nextError = Exception('Server error');
      await provider.loadAddresses();

      expect(provider.error, contains('Server error'));
      expect(provider.isLoading, isFalse);
    });

    test('defaultAddress to\'g\'ri qaytaradi', () async {
      mockRepo.seedAddresses([
        _makeAddress(id: 'a1', title: 'Uy'),
        _makeAddress(id: 'a2', title: 'Ish', isDefault: true),
      ]);

      await provider.loadAddresses();
      expect(provider.defaultAddress?.id, 'a2');
    });

    test('defaultAddress — hech biri default bo\'lmasa, birinchini qaytaradi',
        () async {
      mockRepo.seedAddresses([
        _makeAddress(id: 'a1', title: 'Uy'),
      ]);

      await provider.loadAddresses();
      expect(provider.defaultAddress?.id, 'a1');
    });

    test('defaultAddress — bo\'sh list bo\'lsa null', () {
      expect(provider.defaultAddress, isNull);
    });

    test('addAddress yanga manzil qo\'shadi', () async {
      final newAddr = await provider.addAddress(
        title: 'Yangi',
        address: 'Tashkent, Sergeli',
      );

      expect(newAddr.title, 'Yangi');
      expect(mockRepo.addCalled, isTrue);
    });

    test('addAddress — birinchi manzil default bo\'ladi', () async {
      // Provider addresses bo'sh, shuning uchun shouldBeDefault = true
      await provider.addAddress(title: 'Uy', address: 'Tashkent');
      expect(mockRepo.addCalled, isTrue);
    });

    test('addAddress xatolikda rethrow qiladi', () async {
      mockRepo.nextError = Exception('Add failed');
      await expectLater(
        () => provider.addAddress(title: 'X', address: 'Y'),
        throwsException,
      );
      expect(provider.error, contains('Add failed'));
    });

    test('deleteAddress o\'chiradi', () async {
      mockRepo.seedAddresses([
        _makeAddress(id: 'a1'),
        _makeAddress(id: 'a2'),
      ]);
      await provider.loadAddresses();
      expect(provider.addresses.length, 2);

      await provider.deleteAddress('a1');
      expect(mockRepo.deleteCalled, isTrue);
      expect(mockRepo.lastDeletedId, 'a1');
    });

    test('setDefaultAddress sozlaydi', () async {
      mockRepo.seedAddresses([
        _makeAddress(id: 'a1'),
        _makeAddress(id: 'a2'),
      ]);
      await provider.loadAddresses();

      await provider.setDefaultAddress('a2');
      expect(mockRepo.setDefaultCalled, isTrue);
      expect(mockRepo.lastDefaultId, 'a2');
    });

    test('ensureLoaded faqat bir marta yuklaydi', () async {
      mockRepo.seedAddresses([_makeAddress()]);

      await provider.ensureLoaded();
      expect(provider.isInitialized, isTrue);
      expect(provider.addresses.length, 1);

      // Ikkinchi chaqiruvda qayta yuklamaslik kerak
      mockRepo.seedAddresses([]);
      await provider.ensureLoaded();
      expect(provider.addresses.length, 1); // O'zgarmadi!
    });
  });
}
