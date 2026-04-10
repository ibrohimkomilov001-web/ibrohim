import 'dart:async';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import '../core/repositories/repositories.dart';
import '../models/models.dart';
import '../services/cache_service.dart';

/// Auth holati uchun Provider
/// Repository pattern bilan - backend o'zgarganda bu kod o'zgarmaydi
class AuthProvider extends ChangeNotifier {
  final IAuthRepository _authRepo;

  AuthProvider(this._authRepo) {
    _init();
  }

  // State
  UserProfile? _profile;
  bool _isLoading = false;
  String? _error;

  // Getters
  UserProfile? get profile => _profile;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _authRepo.isLoggedIn;
  String? get error => _error;
  String? get currentUserId => _authRepo.currentUserId;
  String? get phoneNumber => _profile?.phone;
  bool get lastVerifyIsNewUser => _authRepo.lastVerifyIsNewUser;

  void _init() {
    // App qayta ochilganda sessiyani tiklash
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final restored = await _authRepo.restoreSession();
      if (restored) {
        await _loadOrCreateProfile();
      }
    } catch (e) {
      debugPrint('Session restore error: $e');
    }
  }

  Future<void> _loadOrCreateProfile() async {
    if (!isLoggedIn) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await _authRepo.getProfile();

      // Crashlytics'da user identifikatsiya qilish
      if (_profile != null && !kIsWeb && !kDebugMode) {
        FirebaseCrashlytics.instance
            .setUserIdentifier(currentUserId ?? 'unknown');
        FirebaseCrashlytics.instance
            .setCustomKey('user_role', _profile!.role.name);
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Profile load error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadProfile() async {
    await _loadOrCreateProfile();
  }

  Future<void> sendOtp(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authRepo.sendOTP(phone);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> verifyOtp(String phone, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authRepo.verifyOTP(phone, otp);
      await loadProfile();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authRepo.signInWithGoogle();
      await loadProfile();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithPasskey() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authRepo.signInWithPasskey();
      await loadProfile();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authRepo.signOut();
      _profile = null;

      // Foydalanuvchiga tegishli keshlarni tozalash
      await PersistentCache.remove(CacheKeys.favorites);
      await PersistentCache.remove(CacheKeys.orders);
      await PersistentCache.remove(CacheKeys.cart);
      await PersistentCache.remove(CacheKeys.userProfile);
      await PersistentCache.remove(CacheKeys.addresses);

      // Crashlytics user identifikatsiyani tozalash
      if (!kIsWeb && !kDebugMode) {
        FirebaseCrashlytics.instance.setUserIdentifier('');
      }
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? avatarUrl,
    String? gender,
    String? region,
    String? birthDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authRepo.updateProfile(
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        avatarUrl: avatarUrl,
        gender: gender,
        region: region,
        birthDate: birthDate,
      );
      await loadProfile();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<UserRole> getUserRole() async {
    return await _authRepo.getUserRole();
  }
}
