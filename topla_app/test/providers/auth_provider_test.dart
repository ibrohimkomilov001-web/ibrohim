import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:topla_app/core/repositories/repositories.dart';
import 'package:topla_app/models/models.dart';
import 'package:topla_app/providers/auth_provider.dart';

// ==================== MOCK ====================
class MockAuthRepository implements IAuthRepository {
  bool _isLoggedIn = false;
  String? _userId;
  UserProfile? _profile;
  bool sendOtpCalled = false;
  bool verifyOtpCalled = false;
  bool signOutCalled = false;
  bool updateProfileCalled = false;
  String? lastPhone;
  String? lastOtp;
  Exception? nextError;

  void setLoggedIn(String userId, {UserProfile? profile}) {
    _isLoggedIn = true;
    _userId = userId;
    _profile = profile ??
        UserProfile(
          id: userId,
          firstName: 'Test',
          lastName: 'User',
          phone: '+998901234567',
          role: UserRole.user,
        );
  }

  @override
  String? get currentUserId => _userId;
  @override
  bool get isLoggedIn => _isLoggedIn;

  @override
  Future<void> sendOTP(String phone) async {
    if (nextError != null) throw nextError!;
    sendOtpCalled = true;
    lastPhone = phone;
  }

  @override
  Future<void> verifyOTP(String phone, String otp) async {
    if (nextError != null) throw nextError!;
    verifyOtpCalled = true;
    lastPhone = phone;
    lastOtp = otp;
    _isLoggedIn = true;
    _userId = 'user-123';
    _profile = UserProfile(
      id: 'user-123',
      firstName: 'Test',
      phone: phone,
      role: UserRole.user,
    );
  }

  @override
  Future<UserProfile?> getProfile() async {
    if (nextError != null) throw nextError!;
    return _profile;
  }

  @override
  Future<void> signOut() async {
    if (nextError != null) throw nextError!;
    signOutCalled = true;
    _isLoggedIn = false;
    _userId = null;
    _profile = null;
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
  }) async {
    if (nextError != null) throw nextError!;
    updateProfileCalled = true;
    _profile = UserProfile(
      id: _userId ?? '',
      firstName: firstName ?? _profile?.firstName,
      lastName: lastName ?? _profile?.lastName,
      email: email ?? _profile?.email,
      phone: phone ?? _profile?.phone,
      role: _profile?.role ?? UserRole.user,
    );
  }

  @override
  Future<void> upsertProfile(UserProfile profile) async {
    _profile = profile;
  }

  @override
  Future<void> signUp(String email, String password) async {}

  @override
  Future<void> signIn(String email, String password) async {}

  @override
  Future<void> resetPassword(String email) async {}

  @override
  Future<void> signInWithGoogle() async {
    _isLoggedIn = true;
    _userId = 'google-123';
    _profile = UserProfile(
      id: 'google-123',
      firstName: 'Google',
      lastName: 'User',
      role: UserRole.user,
    );
  }

  @override
  Future<UserRole> getUserRole() async => _profile?.role ?? UserRole.user;

  @override
  Future<bool> restoreSession() async {
    return _isLoggedIn;
  }
}

void main() {
  late MockAuthRepository mockRepo;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    mockRepo = MockAuthRepository();
  });

  group('AuthProvider', () {
    test('boshlang\'ich holat — profil null, loading false', () {
      final provider = AuthProvider(mockRepo);
      expect(provider.profile, isNull);
      expect(provider.isLoading, isFalse);
      expect(provider.error, isNull);
      expect(provider.isLoggedIn, isFalse);
    });

    test('isLoggedIn mockRepo ga delegatsiya qiladi', () {
      final provider = AuthProvider(mockRepo);
      expect(provider.isLoggedIn, isFalse);

      mockRepo.setLoggedIn('user-1');
      expect(provider.isLoggedIn, isTrue);
    });

    test('sendOtp muvaffaqiyatli chaqiriladi', () async {
      final provider = AuthProvider(mockRepo);
      await provider.sendOtp('+998901234567');
      expect(mockRepo.sendOtpCalled, isTrue);
      expect(mockRepo.lastPhone, '+998901234567');
    });

    test('sendOtp xatolikda error qo\'yadi va rethrow qiladi', () async {
      mockRepo.nextError = Exception('Network error');
      final provider = AuthProvider(mockRepo);

      await expectLater(
        () => provider.sendOtp('+998901234567'),
        throwsException,
      );
      expect(provider.error, contains('Network error'));
      expect(provider.isLoading, isFalse);
    });

    test('verifyOtp muvaffaqiyatli — profil yuklanadi', () async {
      final provider = AuthProvider(mockRepo);
      await provider.verifyOtp('+998901234567', '1234');

      expect(mockRepo.verifyOtpCalled, isTrue);
      expect(provider.isLoggedIn, isTrue);
      // loadProfile chaqiriladi
      expect(provider.isLoading, isFalse);
    });

    test('verifyOtp xatolikda rethrow qiladi', () async {
      mockRepo.nextError = Exception('Invalid OTP');
      final provider = AuthProvider(mockRepo);

      await expectLater(
        () => provider.verifyOtp('+998901234567', '0000'),
        throwsException,
      );
      expect(provider.error, contains('Invalid OTP'));
    });

    test('loadProfile muvaffaqiyatli profil yuklaydi', () async {
      mockRepo.setLoggedIn('user-1');
      final provider = AuthProvider(mockRepo);

      // _init() avtomatik loadProfile chaqiradi, kutamiz
      await Future.delayed(Duration.zero);

      expect(provider.profile, isNotNull);
      expect(provider.profile!.id, 'user-1');
      expect(provider.profile!.firstName, 'Test');
    });

    test('signOut profil tozalanadi', () async {
      mockRepo.setLoggedIn('user-1');
      final provider = AuthProvider(mockRepo);
      await Future.delayed(Duration.zero);

      await provider.signOut();

      expect(mockRepo.signOutCalled, isTrue);
      expect(provider.profile, isNull);
      expect(provider.isLoggedIn, isFalse);
    });

    test('signOut xatolikda rethrow', () async {
      mockRepo.setLoggedIn('user-1');
      final provider = AuthProvider(mockRepo);
      await Future.delayed(Duration.zero);

      mockRepo.nextError = Exception('Sign out failed');
      await expectLater(() => provider.signOut(), throwsException);
    });

    test('updateProfile yangilaydi va qayta yuklaydi', () async {
      mockRepo.setLoggedIn('user-1');
      final provider = AuthProvider(mockRepo);
      await Future.delayed(Duration.zero);

      await provider.updateProfile(firstName: 'Updated');
      expect(mockRepo.updateProfileCalled, isTrue);
      expect(provider.isLoading, isFalse);
    });

    test('getUserRole rolni qaytaradi', () async {
      mockRepo.setLoggedIn('user-1',
          profile: UserProfile(id: 'user-1', role: UserRole.vendor));
      final provider = AuthProvider(mockRepo);

      final role = await provider.getUserRole();
      expect(role, UserRole.vendor);
    });

    test('currentUserId to\'g\'ri delegatsiya qiladi', () {
      mockRepo.setLoggedIn('abc-123');
      final provider = AuthProvider(mockRepo);
      expect(provider.currentUserId, 'abc-123');
    });
  });
}
