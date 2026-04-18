import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:credential_manager/credential_manager.dart';
import '../../core/repositories/i_auth_repository.dart';
import '../../core/services/api_client.dart';
import '../../models/models.dart';

/// Auth repository - Node.js backend implementation
/// Eskiz SMS OTP authentication
class ApiAuthRepositoryImpl implements IAuthRepository {
  final ApiClient _api;
  static const _profileCacheKey = 'cached_user_profile';

  String? _userId;
  UserProfile? _cachedProfile;
  bool _lastVerifyIsNewUser = false;
  ApiAuthRepositoryImpl(this._api);

  @override
  String? get currentUserId => _userId;

  @override
  bool get isLoggedIn => _api.hasToken && _userId != null;

  @override
  bool get lastVerifyIsNewUser => _lastVerifyIsNewUser;

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
    _lastVerifyIsNewUser = data['isNewUser'] == true;
    await _api.setTokens(
      accessToken: data['accessToken'] ?? data['token'],
      refreshToken: data['refreshToken'] ?? '',
    );

    // Backend javobidan user ma'lumotlarini olish
    final userData = data['user'];
    if (userData is Map<String, dynamic>) {
      _cachedProfile = UserProfile.fromJson(userData);
      _userId = _cachedProfile!.id;
      _cacheProfileLocally(_cachedProfile!);
    } else {
      await _fetchAndSetUser();
    }
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

    final signUpUser = data['user'];
    if (signUpUser is Map<String, dynamic>) {
      _cachedProfile = UserProfile.fromJson(signUpUser);
      _userId = _cachedProfile!.id;
      _cacheProfileLocally(_cachedProfile!);
    } else {
      await _fetchAndSetUser();
    }
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

    final signInUser = data['user'];
    if (signInUser is Map<String, dynamic>) {
      _cachedProfile = UserProfile.fromJson(signInUser);
      _userId = _cachedProfile!.id;
      _cacheProfileLocally(_cachedProfile!);
    } else {
      await _fetchAndSetUser();
    }
  }

  @override
  Future<void> resetPassword(String email) async {
    await _api.post('/auth/reset-password',
        body: {'email': email}, auth: false);
  }

  @override
  Future<void> signInWithGoogle() async {
    // 1. Google Sign-In
    final googleSignIn = GoogleSignIn(
      serverClientId:
          '541689366619-lj413c9ff4i5lf29upaopiu10b78ukn4.apps.googleusercontent.com',
    );
    // Oldingi sessiyani tozalash - har doim akkaunt tanlash oynasi chiqishi uchun
    await googleSignIn.signOut();
    debugPrint('=== GoogleSignIn.signIn() boshlanmoqda ===');
    final googleUser = await googleSignIn.signIn();

    if (googleUser == null) {
      throw Exception('Google kirish bekor qilindi');
    }
    debugPrint('=== Google user: ${googleUser.email} ===');

    // 2. Google auth tokenlarini olish
    final googleAuth = await googleUser.authentication;
    final googleAccessToken = googleAuth.accessToken;
    debugPrint(
        '=== Google accessToken: ${googleAccessToken != null ? "mavjud" : "YO'Q"} ===');
    debugPrint(
        '=== Google idToken: ${googleAuth.idToken != null ? "mavjud" : "YO'Q"} ===');

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
        debugPrint('=== Firebase token: mavjud ===');
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

    debugPrint(
        '=== Backend /auth/google ga POST yuborilmoqda, body keys: ${body.keys.toList()} ===');
    final response = await _api.post(
      '/auth/google',
      body: body,
      auth: false,
    );
    debugPrint(
        '=== Backend javob keldi, dataMap keys: ${response.dataMap.keys.toList()} ===');

    final data = response.dataMap;
    _lastVerifyIsNewUser = data['isNewUser'] == true;
    await _api.setTokens(
      accessToken: data['accessToken'] ?? data['token'],
      refreshToken: data['refreshToken'] ?? '',
    );

    // Backend javobidan user ma'lumotlarini olish (qayta /auth/me so'rash shart emas)
    final userData = data['user'];
    if (userData is Map<String, dynamic>) {
      _cachedProfile = UserProfile.fromJson(userData);
      _userId = _cachedProfile!.id;
      _cacheProfileLocally(_cachedProfile!);
      debugPrint('=== User set from /auth/google response: $_userId ===');
    } else {
      // Fallback: alohida so'rash
      debugPrint('=== Fallback: _fetchAndSetUser() chaqirilmoqda ===');
      await _fetchAndSetUser();
    }
    debugPrint('=== signInWithGoogle muvaffaqiyatli tugadi ===');
  }

  @override
  Future<void> signInWithPasskey() async {
    // 1. Backend'dan authentication options olish
    debugPrint('=== Passkey: login/begin so\'ralmoqda ===');
    final beginResponse = await _api.post(
      '/auth/passkey/login/begin',
      body: {},
      auth: false,
    );

    final data = beginResponse.dataMap;
    final sessionId = data['sessionId'] as String;
    final options = data['options'] as Map<String, dynamic>;
    final challenge = options['challenge'] as String;
    final rpId = options['rpId'] as String;

    debugPrint('=== Passkey: challenge=$challenge, rpId=$rpId ===');

    // 2. Credential Manager orqali passkey autentifikatsiya
    final credentialManager = CredentialManager();
    if (!credentialManager.isSupportedPlatform) {
      throw Exception('Bu qurilmada Passkey qo\'llab-quvvatlanmaydi');
    }

    await credentialManager.init(preferImmediatelyAvailableCredentials: true);

    final credentials = await credentialManager.getCredentials(
      passKeyOption: CredentialLoginOptions(
        challenge: challenge,
        rpId: rpId,
        userVerification: 'required',
      ),
    );

    final publicKeyCredential = credentials.publicKeyCredential;
    if (publicKeyCredential == null) {
      throw Exception('Passkey orqali kirish bekor qilindi');
    }

    debugPrint('=== Passkey: credential olindi, server ga yuborilmoqda ===');

    // 3. Backend'ga javobni yuborish
    final verifyResponse = await _api.post(
      '/auth/passkey/login/verify',
      body: {
        'sessionId': sessionId,
        'credential': publicKeyCredential.toJson(),
        'platform': 'android',
      },
      auth: false,
    );

    final verifyData = verifyResponse.dataMap;
    await _api.setTokens(
      accessToken: verifyData['accessToken'] ?? verifyData['token'],
      refreshToken: verifyData['refreshToken'] ?? '',
    );

    final userData = verifyData['user'];
    if (userData is Map<String, dynamic>) {
      _cachedProfile = UserProfile.fromJson(userData);
      _userId = _cachedProfile!.id;
      _cacheProfileLocally(_cachedProfile!);
      debugPrint('=== User set from passkey response: $_userId ===');
    } else {
      await _fetchAndSetUser();
    }
    debugPrint('=== signInWithPasskey muvaffaqiyatli tugadi ===');
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
      await _clearCachedProfile();
      // Google va Firebase sessiyalarni ham tozalash
      try {
        await GoogleSignIn().signOut();
        await FirebaseAuth.instance.signOut();
      } catch (e) {
        debugPrint('Google/Firebase sign-out error: $e');
      }
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
      _cacheProfileLocally(_cachedProfile!);
      return _cachedProfile;
    } catch (e) {
      debugPrint('Get profile error: $e');
      // Server xato bersa lokal keshdan yuklash
      final cached = await _loadCachedProfile();
      if (cached != null) {
        _cachedProfile = cached;
        _userId = cached.id;
        debugPrint('Profile loaded from local cache: ${cached.id}');
        return cached;
      }
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
    String? gender,
    String? region,
    String? birthDate,
  }) async {
    final body = <String, dynamic>{};
    if (firstName != null && firstName.isNotEmpty) {
      body['firstName'] = firstName;
    }
    if (lastName != null && lastName.isNotEmpty) body['lastName'] = lastName;
    if (firstName != null || lastName != null) {
      body['fullName'] = [firstName, lastName]
          .where((s) => s != null && s.isNotEmpty)
          .join(' ');
    }
    if (email != null) body['email'] = email;
    if (phone != null) body['phone'] = phone;
    if (avatarUrl != null) body['avatarUrl'] = avatarUrl;
    if (gender != null) body['gender'] = gender;
    if (region != null) body['region'] = region;
    if (birthDate != null) body['birthDate'] = birthDate;

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
  @override
  Future<bool> restoreSession() async {
    await _api.loadTokens();
    if (!_api.hasToken) return false;

    try {
      await _fetchAndSetUser();
      if (_userId != null) return true;

      // /auth/me xato bersa ham token haqiqiy bo'lishi mumkin
      // JWT payload'dan userId ni decode qilish (base64 — signature tekshirilmaydi)
      final token = _api.accessToken;
      if (token != null) {
        final userId = _extractUserIdFromJwt(token);
        if (userId != null) {
          _userId = userId;
          // Lokal keshdan profilni yuklash
          _cachedProfile = await _loadCachedProfile();
          debugPrint('Session restored from JWT payload: $_userId');
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('Restore session error: $e');
      final token = _api.accessToken;
      if (token != null) {
        final userId = _extractUserIdFromJwt(token);
        if (userId != null) {
          _userId = userId;
          _cachedProfile = await _loadCachedProfile();
          return true;
        }
      }
      await _api.clearTokens();
      return false;
    }
  }

  /// JWT payload'dan userId ni olish (signature tekshirilmaydi — faqat local cache uchun)
  String? _extractUserIdFromJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      // Base64 padding qo'shish
      String payload = parts[1];
      final remainder = payload.length % 4;
      if (remainder == 2) payload += '==';
      if (remainder == 3) payload += '=';
      final decoded = String.fromCharCodes(
        base64Url.decode(payload),
      );
      final Map<String, dynamic> json = Map<String, dynamic>.from(
        const JsonDecoder().convert(decoded) as Map,
      );
      return json['userId'] as String?;
    } catch (_) {
      return null;
    }
  }

  /// Profilni lokal xotiraga saqlash (app qayta ochilganda ishlashi uchun)
  Future<void> _cacheProfileLocally(UserProfile profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_profileCacheKey, jsonEncode(profile.toJson()));
    } catch (_) {}
  }

  /// Lokal keshdan profilni yuklash
  Future<UserProfile?> _loadCachedProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_profileCacheKey);
      if (str == null) return null;
      return UserProfile.fromJson(jsonDecode(str) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  /// Lokal profil keshini tozalash
  Future<void> _clearCachedProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_profileCacheKey);
    } catch (_) {}
  }
}
