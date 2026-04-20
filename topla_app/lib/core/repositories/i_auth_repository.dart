import '../../models/models.dart';

/// Auth operatsiyalari uchun interface
/// Bu interface orqali backend'ga hech qanday kod o'zgartirmasdan o'tish mumkin
abstract class IAuthRepository {
  /// Joriy foydalanuvchi ID si
  String? get currentUserId;

  /// Tizimga kirganmi
  bool get isLoggedIn;

  /// Oxirgi OTP verify yangi foydalanuvchimi
  bool get lastVerifyIsNewUser;

  /// Telefon orqali OTP yuborish
  Future<void> sendOTP(String phone);

  /// OTP ni tasdiqlash
  Future<void> verifyOTP(String phone, String otp);

  /// Email + Password bilan ro'yxatdan o'tish
  Future<void> signUp(String email, String password);

  /// Email + Password bilan kirish
  Future<void> signIn(String email, String password);

  /// Parolni tiklash
  Future<void> resetPassword(String email);

  /// Google orqali kirish
  Future<void> signInWithGoogle();

  /// Tizimdan chiqish
  Future<void> signOut();

  /// Profil ma'lumotlarini olish
  Future<UserProfile?> getProfile();

  /// Profil yaratish/yangilash
  Future<void> upsertProfile(UserProfile profile);

  /// Profilni yangilash
  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? avatarUrl,
    String? gender,
    String? region,
    String? birthDate,
  });

  /// Foydalanuvchi rolini olish
  Future<UserRole> getUserRole();

  /// Sessiyani tiklash (app qayta ochilganda)
  Future<bool> restoreSession();
}
