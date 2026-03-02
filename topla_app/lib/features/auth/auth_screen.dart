import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_client.dart';
import '../../core/constants/constants.dart';
import '../../providers/auth_provider.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _phoneFocusNode = FocusNode();

  bool _isLoading = false;
  bool _isOtpSent = false;
  bool _isGoogleLoading = false;
  bool _isPhoneFocused = false;

  // Countdown timer
  int _resendCountdown = 0;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(() {
      setState(() {});
    });
    _otpController.addListener(() {
      setState(() {});
    });
    _phoneFocusNode.addListener(() {
      setState(() {
        _isPhoneFocused = _phoneFocusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _phoneFocusNode.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  String _formatPhoneNumber(String phone) {
    String cleaned = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.startsWith('998')) {
      return '+$cleaned';
    } else if (cleaned.length == 9) {
      return '+998$cleaned';
    }
    return '+998$cleaned';
  }

  void _startResendCountdown() {
    _resendCountdown = 60;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _resendCountdown--;
        if (_resendCountdown <= 0) {
          timer.cancel();
        }
      });
    });
  }

  /// Backend orqali OTP yuborish (Eskiz SMS)
  Future<void> _sendOtp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final phone = _formatPhoneNumber(_phoneController.text.trim());
      final api = ApiClient();

      await api.post(
        '/auth/send-otp',
        body: {
          'phone': phone,
          'channel': 'sms',
        },
        auth: false,
      );

      if (mounted) {
        setState(() {
          _isOtpSent = true;
          _isLoading = false;
        });
        _startResendCountdown();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('SMS kod yuborildi'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        final message =
            e is ApiException ? e.message : _getErrorMessage(e.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  /// Backend'da OTP tekshirish va JWT olish
  Future<void> _verifyOtp() async {
    if (_otpController.text.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('4 xonali kodni kiriting'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final phone = _formatPhoneNumber(_phoneController.text.trim());
      final api = ApiClient();

      final response = await api.post(
        '/auth/verify-otp',
        body: {
          'phone': phone,
          'code': _otpController.text.trim(),
        },
        auth: false,
      );

      final data = response.dataMap;
      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;
      final isNewUser = data['isNewUser'] == true;

      if (accessToken != null) {
        await api.setTokens(
          accessToken: accessToken,
          refreshToken: refreshToken ?? '',
        );
      }

      // AuthProvider state'ni yangilash
      if (mounted) {
        await context.read<AuthProvider>().loadProfile();
        if (mounted && context.read<AuthProvider>().isLoggedIn) {
          if (isNewUser) {
            // Yangi foydalanuvchi — ism va familiya kiritish ekraniga o'tish
            Navigator.pushNamedAndRemoveUntil(
                context, '/complete-profile', (route) => false);
          } else {
            Navigator.pushNamedAndRemoveUntil(
                context, '/main', (route) => false);
          }
        }
      }
    } catch (e) {
      if (mounted) {
        final message =
            e is ApiException ? e.message : _getErrorMessage(e.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  /// Google orqali kirish
  Future<void> _signInWithGoogle() async {
    setState(() => _isGoogleLoading = true);

    try {
      // AuthProvider orqali to'liq Google Sign-In jarayoni
      // Bu repository'ning signInWithGoogle() metodini chaqiradi
      // U _fetchAndSetUser() orqali _userId ni o'rnatadi
      final authProvider = context.read<AuthProvider>();
      await authProvider.signInWithGoogle();

      if (mounted && authProvider.isLoggedIn) {
        Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
      }
    } catch (e) {
      debugPrint('=== GOOGLE SIGN-IN ERROR: $e ===');
      if (mounted) {
        final errorStr = e.toString().toLowerCase();

        // Foydalanuvchi bekor qildi - xabar ko'rsatmaymiz
        if (errorStr.contains('cancelled') ||
            errorStr.contains('canceled') ||
            errorStr.contains('bekor qilindi')) {
          setState(() => _isGoogleLoading = false);
          return;
        }

        String message =
            'Google kirish xatoligi: ${e.toString().length > 100 ? e.toString().substring(0, 100) : e.toString()}';
        if (errorStr.contains('network') ||
            errorStr.contains('internet') ||
            errorStr.contains('socket') ||
            errorStr.contains('connection') ||
            errorStr.contains('unreachable') ||
            errorStr.contains('timeout')) {
          message = 'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  String _getErrorMessage(String error) {
    final lower = error.toLowerCase();
    if (lower.contains('network') ||
        lower.contains('internet') ||
        lower.contains('socket') ||
        lower.contains('connection') ||
        lower.contains('unreachable') ||
        lower.contains('timeout')) {
      return 'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring';
    }
    if (lower.contains('invalid phone')) {
      return 'Noto\'g\'ri telefon raqami';
    }
    if (lower.contains('invalid otp') || lower.contains('token has expired')) {
      return 'Kod xato yoki muddati tugagan';
    }
    if (lower.contains('phone not confirmed')) {
      return 'Telefon tasdiqlanmagan';
    }
    return error;
  }

  @override
  Widget build(BuildContext context) {
    // Check if keyboard is visible
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardVisible = bottomInset > 0.0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),

                // Back button
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_back_ios_new, size: 18),
                    ),
                  ),
                ),

                const SizedBox(height: 40),

                // Profile Icon
                Center(
                  child: Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      color: const Color(
                          0xFFEEF2FF), // Light purple/blue background
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person_outline_rounded,
                      color: Color(0xFF2855C5), // Blue icon color
                      size: 32,
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Title
                Text(
                  _isOtpSent ? 'Tasdiqlash' : 'Kirish',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 6),

                Text(
                  _isOtpSent
                      ? '${_formatPhoneNumber(_phoneController.text.trim())} ga yuborilgan kodni kiriting'
                      : 'Telefon raqamingizni kiriting',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
                    height: 1.3,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 32),

                // Phone field
                if (!_isOtpSent) ...[
                  // Phone input - minimal style with dividers
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Divider(height: 1, color: Colors.grey.shade200),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal:
                                    0), // Removed padding to align better
                            width: 80, // Fixed width for prefix
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  '+998',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.black,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Container(
                                  width: 1,
                                  height: 24,
                                  color: Colors.grey.shade300,
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: TextFormField(
                              controller: _phoneController,
                              focusNode: _phoneFocusNode,
                              keyboardType: TextInputType.phone,
                              textInputAction: TextInputAction.done,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 1,
                              ),
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(9),
                                UzPhoneInputFormatter(),
                              ],
                              decoration: InputDecoration(
                                hintText: '00 000 00 00',
                                hintStyle: TextStyle(
                                  color: Colors.grey.shade300,
                                  fontWeight: FontWeight.w400,
                                  fontSize: 18,
                                ),
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding:
                                    const EdgeInsets.fromLTRB(12, 16, 0, 16),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Telefon raqamni kiriting';
                                }
                                final digits = value.replaceAll(' ', '');
                                if (digits.length != 9) {
                                  return 'Telefon raqam to\'liq emas';
                                }
                                return null;
                              },
                              onFieldSubmitted: (_) => _sendOtp(),
                            ),
                          ),
                        ],
                      ),
                      Divider(height: 1, color: Colors.grey.shade200),
                    ],
                  ),
                ] else ...[
                  // OTP field - modern
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.grey.shade50,
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      textAlign: TextAlign.center,
                      autofocus: true,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 16,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(4),
                      ],
                      cursorColor: AppColors.primary,
                      decoration: InputDecoration(
                        hintText: '••••',
                        hintStyle: TextStyle(
                          fontSize: 24,
                          letterSpacing: 16,
                          color: Colors.grey.shade300,
                        ),
                        border: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        errorBorder: InputBorder.none,
                        focusedErrorBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                      onFieldSubmitted: (_) => _verifyOtp(),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Timer yoki qaytadan yuborish
                  Center(
                    child: _resendCountdown > 0
                        ? Text(
                            '00:${_resendCountdown.toString().padLeft(2, '0')}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade500,
                              fontWeight: FontWeight.w500,
                            ),
                          )
                        : TextButton(
                            onPressed: _isLoading ? null : _sendOtp,
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              padding: EdgeInsets.zero,
                              minimumSize: const Size(0, 36),
                            ),
                            child: const Text(
                              'Qaytadan yuborish',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                  ),
                ],

                const SizedBox(height: 24),

                // Submit button - pill-shaped
                SizedBox(
                  height: 48,
                  child: Builder(builder: (context) {
                    final isPhoneValid = _phoneController.text
                            .replaceAll(RegExp(r'\D'), '')
                            .length ==
                        9;
                    final isButtonEnabled = _isOtpSent
                        ? _otpController.text.length == 4
                        : isPhoneValid;

                    return ElevatedButton(
                      onPressed: _isLoading || !isButtonEnabled
                          ? null
                          : (_isOtpSent ? _verifyOtp : _sendOtp),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.grey.shade200,
                        disabledForegroundColor: Colors.grey.shade400,
                        elevation: 0,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              _isOtpSent ? 'Tasdiqlash' : 'Davom etish',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    );
                  }),
                ),

                // Google Sign In - faqat telefon kiritish sahifasida va klaviatura yopiq paytda ko'rsatish
                if (!_isOtpSent && !isKeyboardVisible) ...[
                  const SizedBox(height: 20),

                  // Divider
                  Row(
                    children: [
                      Expanded(
                          child:
                              Divider(color: Colors.grey.shade200, height: 1)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'yoki',
                          style: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      Expanded(
                          child:
                              Divider(color: Colors.grey.shade200, height: 1)),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Google Sign In Button - pill-shaped
                  SizedBox(
                    height: 48,
                    child: OutlinedButton(
                      onPressed: _isGoogleLoading ? null : _signInWithGoogle,
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                        side: BorderSide(color: Colors.grey.shade200),
                        elevation: 0,
                      ),
                      child: _isGoogleLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _buildGoogleLogo(),
                                const SizedBox(width: 12),
                                const Text(
                                  'Google orqali kirish',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ],

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Center(
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primary,
              AppColors.primary.withValues(alpha: 0.8),
            ],
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: const Icon(
          Iconsax.user,
          color: Colors.white,
          size: 32,
        ),
      ),
    );
  }

  // Google original logo
  Widget _buildGoogleLogo() {
    return SizedBox(
      width: 24,
      height: 24,
      child: SvgPicture.asset('assets/icon/google_logo.svg'),
    );
  }
}

class UzPhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // 1. Faqat raqamlarni ajratib olamiz
    final digits = newValue.text.replaceAll(RegExp(r'[^\d]'), '');

    // 2. Maksimal uzunlikni cheklaymiz (9 ta raqam)
    if (digits.length > 9) {
      return oldValue;
    }

    // 3. Formatlash (XX XXX XX XX)
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      // 2, 5, 7 indekslardan oldin bo'sh joy qo'shamiz
      if (i == 2 || i == 5 || i == 7) {
        buffer.write(' ');
      }
      buffer.write(digits[i]);
    }

    final result = buffer.toString();

    // 4. Kursor pozitsiyasini hisoblash
    // Agar o'chirish bo'lyotgan bo'lsa va oxiridan o'chsa
    if (oldValue.text.length > newValue.text.length) {
      return TextEditingValue(
        text: result,
        selection: TextSelection.collapsed(offset: result.length),
      );
    }

    // Yozish paytida kursorni oxiriga qo'yamiz
    return TextEditingValue(
      text: result,
      selection: TextSelection.collapsed(offset: result.length),
    );
  }
}
