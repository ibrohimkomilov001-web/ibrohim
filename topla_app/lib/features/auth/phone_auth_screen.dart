import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/services/api_client.dart';
import '../../providers/auth_provider.dart';

class PhoneAuthScreen extends StatefulWidget {
  const PhoneAuthScreen({super.key});

  @override
  State<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends State<PhoneAuthScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String _selectedCountryCode = '+998';

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.replaceAll(' ', '');
    if (phone.isEmpty || phone.length < 9) {
      final msg = phone.isEmpty
          ? (AppLocalizations.of(context)?.translate('phone_required') ??
              'Telefon raqamini kiriting')
          : (AppLocalizations.of(context)?.translate('phone_incomplete') ??
              'Telefon raqami to\'liq emas');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg,
              style: const TextStyle(
                  color: Color(0xFF333333),
                  fontSize: 13,
                  fontWeight: FontWeight.w500)),
          backgroundColor: const Color(0xFFF0F0F0),
          behavior: SnackBarBehavior.floating,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
          margin: const EdgeInsets.only(left: 40, right: 40, bottom: 80),
          duration: const Duration(seconds: 2),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final phoneNumber =
        '$_selectedCountryCode${_phoneController.text.replaceAll(' ', '')}';

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Android: Avtomatik tekshirish
          try {
            final userCredential =
                await FirebaseAuth.instance.signInWithCredential(credential);
            final firebaseUser = userCredential.user;
            if (firebaseUser != null) {
              final token = await firebaseUser.getIdToken();
              if (token != null && mounted) {
                // Backend'ga kirish
                final api = ApiClient();
                final res = await api.post('/auth/login',
                    body: {
                      'firebaseToken': token,
                      'phone': phoneNumber,
                    },
                    auth: false);
                final data = res.data as Map<String, dynamic>?;
                if (data != null) {
                  final accessToken = data['accessToken'] as String?;
                  final refreshToken = data['refreshToken'] as String?;
                  if (accessToken != null) {
                    await api.setTokens(
                        accessToken: accessToken,
                        refreshToken: refreshToken ?? '');
                  }
                }
                if (mounted) {
                  await context.read<AuthProvider>().loadProfile();
                  if (!mounted) return;
                  Navigator.pushNamedAndRemoveUntil(
                      context, '/main', (route) => false);
                }
              }
            }
          } catch (e) {
            debugPrint('Auto-verify error: $e');
          }
        },
        verificationFailed: (FirebaseAuthException e) {
          setState(() => _isLoading = false);
          final l10n = AppLocalizations.of(context);
          String message =
              l10n?.translate('error_occurred') ?? 'Xatolik yuz berdi';
          if (e.code == 'invalid-phone-number') {
            message = l10n?.translate('invalid_phone') ??
                'Telefon raqami noto\'g\'ri';
          } else if (e.code == 'too-many-requests') {
            message = l10n?.translate('too_many_requests') ??
                'Juda ko\'p urinish. Keyinroq qayta urinib ko\'ring';
          } else if (e.code == 'web-context-cancelled') {
            message = l10n?.translate('recaptcha_cancelled') ??
                'reCAPTCHA bekor qilindi';
          } else if (e.code == 'captcha-check-failed') {
            message = l10n?.translate('recaptcha_failed') ??
                'reCAPTCHA tekshiruvi muvaffaqiyatsiz';
          } else if (e.code == 'missing-client-identifier') {
            message = l10n?.translate('try_on_device') ??
                'Iltimos, Android yoki iOS qurilmada sinab ko\'ring';
          } else {
            message =
                '${l10n?.translate('error_prefix') ?? 'Xatolik'}: ${e.message ?? e.code}';
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message), backgroundColor: Colors.red),
          );
        },
        codeSent: (String verificationId, int? resendToken) {
          setState(() => _isLoading = false);
          Navigator.pushNamed(
            context,
            '/otp',
            arguments: {
              'verificationId': verificationId,
              'phoneNumber': phoneNumber,
              'resendToken': resendToken,
            },
          );
        },
        codeAutoRetrievalTimeout: (String verificationId) {},
      );
    } catch (e) {
      setState(() => _isLoading = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                '${AppLocalizations.of(context)?.translate('error_prefix') ?? 'Xatolik'}: $e'),
            backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Iconsax.arrow_left, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  l10n?.translate('enter_phone') ??
                      'Telefon raqamingizni kiriting',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n?.translate('we_will_send_code') ??
                      'Sizga SMS kod yuboramiz',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 40),

                // Phone Input
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    children: [
                      // Country Code prefix (static +998 as requested mostly for cleanness but keeping minimal logic if needed, or just Text)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: const Text(
                          '+998',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w500),
                        ),
                      ),

                      // Divider
                      Container(
                        height: 24,
                        width: 1,
                        color: Colors.grey.shade300,
                      ),

                      // Phone Number Input
                      Expanded(
                        child: TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.done,
                          style:
                              const TextStyle(fontSize: 18, letterSpacing: 1),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(9),
                            _PhoneNumberFormatter(),
                          ],
                          decoration: InputDecoration(
                            hintText: '00 000 00 00',
                            hintStyle: TextStyle(color: Colors.grey.shade300),
                            border: InputBorder.none,
                            errorBorder: InputBorder.none,
                            focusedErrorBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 16,
                            ),
                          ),
                          onSubmitted: (_) => _sendOtp(),
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Continue Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _sendOtp,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            l10n?.translate('continue') ?? 'Davom etish',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 16),

                // Terms
                Center(
                  child: Text(
                    l10n?.translate('terms_agree') ??
                        'Davom etish orqali siz foydalanish shartlariga rozilik bildirasiz',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Phone number formatter (XX XXX XX XX)
class _PhoneNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(' ', '');
    final buffer = StringBuffer();

    for (int i = 0; i < text.length; i++) {
      if (i == 2 || i == 5 || i == 7) {
        buffer.write(' ');
      }
      buffer.write(text[i]);
    }

    return TextEditingValue(
      text: buffer.toString(),
      selection: TextSelection.collapsed(offset: buffer.length),
    );
  }
}
