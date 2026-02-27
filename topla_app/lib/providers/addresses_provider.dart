import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../models/models.dart';

/// Manzillar holati uchun Provider
class AddressesProvider extends ChangeNotifier {
  final IAddressRepository _addressRepo;

  AddressesProvider(this._addressRepo);

  // State
  List<AddressModel> _addresses = [];
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  // Getters
  List<AddressModel> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isEmpty => _addresses.isEmpty;
  bool get isInitialized => _isInitialized;

  /// Birinchi marta manzillarni yuklash (agar hali yuklanmagan bo'lsa)
  Future<void> ensureLoaded() async {
    if (!_isInitialized) await loadAddresses();
  }

  AddressModel? get defaultAddress {
    try {
      return _addresses.firstWhere((a) => a.isDefault);
    } catch (e) {
      return _addresses.isNotEmpty ? _addresses.first : null;
    }
  }

  Future<void> loadAddresses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _addresses = await _addressRepo.getAddresses();
      _isInitialized = true;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<AddressModel> addAddress({
    required String title,
    required String address,
    String? apartment,
    String? entrance,
    String? floor,
    double? latitude,
    double? longitude,
    bool isDefault = false,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Agar bu birinchi manzil bo'lsa, uni asosiy qilamiz
      final shouldBeDefault = isDefault || _addresses.isEmpty;

      final addressModel = AddressModel(
        id: '', // Backend yaratadi
        title: title,
        address: address,
        apartment: apartment,
        entrance: entrance,
        floor: floor,
        latitude: latitude ?? 0.0,
        longitude: longitude ?? 0.0,
        isDefault: shouldBeDefault,
      );

      final newAddress = await _addressRepo.addAddress(addressModel);
      await loadAddresses();
      return newAddress;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateAddress({
    required String id,
    required String title,
    required String address,
    String? apartment,
    String? entrance,
    String? floor,
    double? latitude,
    double? longitude,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Mavjud manzilni topamiz
      final idx = _addresses.indexWhere((a) => a.id == id);
      final existing = idx >= 0 ? _addresses[idx] : null;
      if (existing == null) {
        throw Exception('Manzil topilmadi (id: $id)');
      }

      final addressModel = AddressModel(
        id: id,
        title: title,
        address: address,
        apartment: apartment,
        entrance: entrance,
        floor: floor,
        latitude: latitude ?? existing.latitude,
        longitude: longitude ?? existing.longitude,
        isDefault: existing.isDefault,
      );

      await _addressRepo.updateAddress(addressModel);
      await loadAddresses();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteAddress(String id) async {
    try {
      await _addressRepo.deleteAddress(id);
      await loadAddresses();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> setDefaultAddress(String id) async {
    try {
      await _addressRepo.setDefaultAddress(id);
      await loadAddresses();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Alias for setDefaultAddress (for backward compatibility)
  Future<void> setAsDefault(String id) async {
    await setDefaultAddress(id);
  }
}
