import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/repositories/i_auth_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Auth repository - Node.js backend implementation
/// Eskiz SMS OTP authentication
class ApiAuthRepositoryImpl implements IAuthRepository {
  final ApiClient _api;

  String? _userId;
  UserProfile? _cachedProfile;
  ApiAuthRepositoryImpl(this._api);

  @override
  String? get currentUserId => _userId;

  @override
  bool get isLoggedIn => _api.hasToken && _userId != null;

  @override
  Future<void> sendOTP(String phone) async {
    await _api.post(
      '/auth/send-otp',
      body: {
        'phone': phone,
      },
      auth: false,
    );
  }

  @override
  Future<void> verifyOTP(String phone, String otp) async {
    final response = await _api.post(
      '/auth/verify-otp',
      body: {
        'phone': phone,
        'code': otp,
      },
      auth: false,
    );

    final data = response.dataMap;
    await _api.setTokens(
      accessToken: data['accessToken'] ?? data['token'],
      refreshToken: data['refreshToken'] ?? '',
    );

    // Profile olish
    await _fetchAndSetUser();
  }

  @override
  Future<void> signUp(String email, String password) async {
    final response = await _api.post(
      '/auth/vendor/register',
      body: {
        'email': email,
        'password': password,
        'fullName': email.split('@').first,
        'phone': '+998000000000',
        'shopName': 'My Shop',
      },
      auth: false,
    );

    final data = response.dataMap;
    await _api.setTokens(
      accessToken: data['accessToken'] ?? data['token'],
      refreshToken: data['refreshToken'] ?? '',
    );

    await _fetchAndSetUser();
  }

  @override
  Future<void> signIn(String email, String password) async {
    final response = await _api.post(
      '/auth/vendor/login',
      body: {'email': email, 'password': password},
      auth: false,
    );

    final data = response.dataMap;
    await _api.setTokens(
      accessToken: data['accessToken'] ?? data['token'],
      refreshToken: data['refreshToken'] ?? '',
    );

    await _fetchAndSetUser();
  }

  @override
  Future<void> resetPassword(String email) async {
    await _api.post('/auth/reset-password',
        body: {'email': email}, auth: false);
  }

  @override
  Future<void> signInWithGoogle() async {
    // 1. Google Sign-In — avval signOut qilib, account picker chiqishini ta'minlaymiz
    final googleSignIn = GoogleSignIn();
    await googleSignIn.signOut();
    final googleUser = await googleSignIn.signIn();

    if (googleUser == null) {
      throw Exception('Google kirish bekor qilindi');
    }

    // 2. Google auth tokenlarini olish
    final googleAuth = await googleUser.authentication;
    final googleAccessToken = googleAuth.accessToken;

    // 3. Firebase credential yaratish va kirish (token olish uchun)
    String? firebaseToken;
    try {
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential =
          await FirebaseAuth.instance.signInWithCredential(credential);
      final firebaseUser = userCredential.user;

      if (firebaseUser != null) {
        firebaseToken = await firebaseUser.getIdToken();
      }
    } catch (e) {
      debugPrint('Firebase sign-in failed (using Google direct): $e');
      // Firebase ishlamasa ham davom etamiz - Google access token bilan
    }

    // 4. Backend'ga yuborish - Firebase token VA Google access token
    final body = <String, dynamic>{};
    if (firebaseToken != null) {
      body['firebaseToken'] = firebaseToken;
    }
    if (googleAccessToken != null) {
      body['googleAccessToken'] = googleAccessToken;
    }

    if (body.isEmpty) {
      throw Exception('Google tokenlar olinmadi');
    }

    final response = await _api.post(
      '/auth/google',
      body: body,
      auth: false,
    );

    final data = response.dataMap;
    await _api.setTokens(
      accessToken: data['accessToken'] ?? data['token'],
      refreshToken: data['refreshToken'] ?? '',
    );

    // Profile olish
    await _fetchAndSetUser();
  }

  @override
  Future<void> signOut() async {
    try {
      await _api.post('/auth/logout');
    } catch (e) {
      debugPrint('Logout error: $e');
    } finally {
      await _api.clearTokens();
      _userId = null;
      _cachedProfile = null;
    }
  }

  @override
  Future<UserProfile?> getProfile() async {
    if (_cachedProfile != null) return _cachedProfile;

    try {
      final response = await _api.get('/auth/me');
      final data = response.dataMap;
      _cachedProfile = UserProfile.fromJson(data);
      _userId = _cachedProfile!.id;
      return _cachedProfile;
    } catch (e) {
      debugPrint('Get profile error: $e');
      return null;
    }
  }

  @override
  Future<void> upsertProfile(UserProfile profile) async {
    await _api.put('/auth/profile', body: profile.toJson());
    _cachedProfile = profile;
  }

  @override
  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? avatarUrl,
  }) async {
    final body = <String, dynamic>{};
    if (firstName != null || lastName != null) {
      body['fullName'] = [firstName, lastName]
          .where((s) => s != null && s.isNotEmpty)
          .join(' ');
    }
    if (email != null) body['email'] = email;
    if (phone != null) body['phone'] = phone;
    if (avatarUrl != null) body['avatarUrl'] = avatarUrl;

    final response = await _api.put('/auth/profile', body: body);
    _cachedProfile = UserProfile.fromJson(response.dataMap);
  }

  @override
  Future<UserRole> getUserRole() async {
    final profile = await getProfile();
    return profile?.role ?? UserRole.user;
  }

  /// Internal: User ma'lumotlarini olish va saqlash
  Future<void> _fetchAndSetUser() async {
    try {
      final response = await _api.get('/auth/me');
      final data = response.dataMap;
      _cachedProfile = UserProfile.fromJson(data);
      _userId = _cachedProfile!.id;
    } catch (e) {
      debugPrint('Fetch user error: $e');
    }
  }

  /// Token bilan tiklash (app qayta ochilganda)
  Future<bool> restoreSession() async {
    await _api.loadTokens();
    if (!_api.hasToken) return false;

    try {
      await _fetchAndSetUser();
      return _userId != null;
    } catch (e) {
      await _api.clearTokens();
      return false;
    }
  }
}
