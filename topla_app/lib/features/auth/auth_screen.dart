import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_client.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
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
  final _otpFocusNode = FocusNode();

  bool _isLoading = false;
  bool _isOtpSent = false;
  bool _isGoogleLoading = false;

  // Countdown timer
  int _resendCountdown = 0;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(() => setState(() {}));
    _otpController.addListener(() {
      setState(() {});
      if (_otpController.text.length == 5 && _isOtpSent && !_isLoading) {
        _verifyOtp();
      }
    });
    _phoneFocusNode.addListener(() => setState(() {}));
    _otpFocusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _phoneFocusNode.dispose();
    _otpFocusNode.dispose();
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
    final phoneDigits = _phoneController.text.replaceAll(' ', '');
    if (phoneDigits.isEmpty || phoneDigits.length < 9) {
      final l10n = AppLocalizations.of(context);
      final msg = phoneDigits.isEmpty
          ? (l10n?.translate('phone_required') ?? 'Telefon raqamni kiriting')
          : (l10n?.translate('phone_incomplete') ??
              'Telefon raqam to\'liq emas');
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
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _otpFocusNode.requestFocus();
        });
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

  bool _isVerifying = false;

  /// Backend'da OTP tekshirish va JWT olish
  Future<void> _verifyOtp() async {
    if (_otpController.text.length != 5 || _isVerifying) return;

    _isVerifying = true;
    setState(() => _isLoading = true);

    try {
      final phone = _formatPhoneNumber(_phoneController.text.trim());
      final authProvider = context.read<AuthProvider>();

      await authProvider.verifyOtp(phone, _otpController.text.trim());

      if (mounted && authProvider.isLoggedIn) {
        if (authProvider.lastVerifyIsNewUser) {
          Navigator.pushNamedAndRemoveUntil(
              context, '/complete-profile', (route) => false);
        } else {
          Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
        }
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                const Text('Kirish amalga oshmadi. Qaytadan urinib ko\'ring.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      debugPrint('=== OTP: XATOLIK: $e ===');
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
      _isVerifying = false;
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
      debugPrint('=== GOOGLE SIGN-IN ERROR TYPE: ${e.runtimeType} ===');
      debugPrint('=== GOOGLE SIGN-IN ERROR: $e ===');
      if (mounted) {
        final errorStr = e.toString().toLowerCase();

        // Foydalanuvchi bekor qildi - xabar ko'rsatmaymiz
        if (errorStr.contains('cancelled') ||
            errorStr.contains('canceled') ||
            errorStr.contains('sign_in_canceled') ||
            errorStr.contains('bekor qilindi')) {
          setState(() => _isGoogleLoading = false);
          return;
        }

        // PlatformException (Google Sign-In native xatoligi)
        String message;
        if (e is PlatformException) {
          debugPrint(
              '=== PlatformException code: ${e.code} message: ${e.message} ===');
          // code 12501 = user cancelled (native)
          if (e.code == '12501') {
            setState(() => _isGoogleLoading = false);
            return;
          }
          if (e.code == 'sign_in_failed' || e.code == '10') {
            message =
                'Google Sign-In konfiguratsiyasi to\'g\'ri emas. Iltimos, qo\'llab-quvvatlash xizmatiga murojaat qiling.';
          } else if (e.code == '12500') {
            message =
                'Google Play Services eski versiyada. Iltimos, yangilang.';
          } else if (e.code == '7' || e.code == 'network_error') {
            message = 'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring.';
          } else {
            message =
                'Google kirish xatoligi [${e.code}]. Qaytadan urinib ko\'ring.';
          }
        } else if (e is ApiException) {
          message = 'Server xatoligi: ${e.message}';
        } else {
          final l10n = AppLocalizations.of(context);
          message = errorStr.contains('network') ||
                  errorStr.contains('internet') ||
                  errorStr.contains('socket') ||
                  errorStr.contains('connection') ||
                  errorStr.contains('unreachable') ||
                  errorStr.contains('timeout')
              ? (l10n?.translate('no_internet_check') ??
                  'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring')
              : 'Google kirish xatoligi: ${e.toString().length > 150 ? e.toString().substring(0, 150) : e.toString()}';
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 6),
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
    final l10n = AppLocalizations.of(context);
    final lower = error.toLowerCase();
    if (lower.contains('network') ||
        lower.contains('internet') ||
        lower.contains('socket') ||
        lower.contains('connection') ||
        lower.contains('unreachable') ||
        lower.contains('timeout')) {
      return l10n?.translate('no_internet_check') ??
          'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring';
    }
    if (lower.contains('invalid phone')) {
      return l10n?.translate('invalid_phone') ?? 'Noto\'g\'ri telefon raqami';
    }
    if (lower.contains('invalid otp') || lower.contains('token has expired')) {
      return l10n?.translate('invalid_otp') ?? 'Kod xato yoki muddati tugagan';
    }
    if (lower.contains('phone not confirmed')) {
      return l10n?.translate('phone_not_confirmed') ?? 'Telefon tasdiqlanmagan';
    }
    return error;
  }

  /// Orqaga qaytish dialog
  Future<bool> _onWillPop() async {
    if (!_isOtpSent) {
      return true;
    }
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Tasdiqlash jarayonini to\'xtatishni xohlaysizmi?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100)),
                  ),
                  child: const Text('To\'xtatish',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey.shade100,
                    elevation: 0,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100)),
                  ),
                  child: const Text('Davom ettirish',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.black87)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    // OTP sahifasi — alohida dizayn
    if (_isOtpSent) {
      return _buildOtpPage(l10n);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
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
                            child:
                                const Icon(Icons.arrow_back_ios_new, size: 18),
                          ),
                        ),
                      ),

                      const SizedBox(height: 40),

                      // Phone Icon
                      const Center(
                        child: Text('☎️', style: TextStyle(fontSize: 56)),
                      ),

                      const SizedBox(height: 24),

                      // Title
                      const Text(
                        'Telefon raqamingiz',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 8),

                      // Subtitle
                      Text(
                        l10n?.translate('enter_phone') ??
                            'Telefon raqamingizni kiriting',
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
                                  child: TextField(
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
                                      errorBorder: InputBorder.none,
                                      focusedErrorBorder: InputBorder.none,
                                      contentPadding: const EdgeInsets.fromLTRB(
                                          12, 16, 0, 16),
                                    ),
                                    onSubmitted: (_) => _sendOtp(),
                                  ),
                                ),
                              ],
                            ),
                            Divider(height: 1, color: Colors.grey.shade200),
                          ],
                        ),
                      ],

                      const SizedBox(height: 32),

                      // Submit button - pill-shaped
                      SizedBox(
                        height: 48,
                        child: Builder(builder: (context) {
                          final isPhoneValid = _phoneController.text
                                  .replaceAll(RegExp(r'\D'), '')
                                  .length ==
                              9;

                          return ElevatedButton(
                            onPressed:
                                _isLoading || !isPhoneValid ? null : _sendOtp,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: Colors.transparent,
                              disabledForegroundColor: Colors.grey.shade400,
                              elevation: 0,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(100),
                                side: BorderSide(color: Colors.grey.shade200),
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
                                    l10n?.translate('continue') ??
                                        'Davom etish',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          );
                        }),
                      ),
                      // Google Sign In
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          Expanded(
                              child: Divider(
                                  color: Colors.grey.shade200, height: 1)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              l10n?.translate('or_text') ?? 'yoki',
                              style: TextStyle(
                                  color: Colors.grey.shade400, fontSize: 13),
                            ),
                          ),
                          Expanded(
                              child: Divider(
                                  color: Colors.grey.shade200, height: 1)),
                        ],
                      ),

                      const SizedBox(height: 16),

                      SizedBox(
                        height: 48,
                        child: OutlinedButton(
                          onPressed:
                              _isGoogleLoading ? null : _signInWithGoogle,
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
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    _buildGoogleLogo(),
                                    const SizedBox(width: 12),
                                    Text(
                                      l10n?.translate('login_with_google') ??
                                          'Google orqali kirish',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ], // <-- END of Column children
                  ),
                ),
              ),
            ),
          ], // <-- END of Scaffold body Column children
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

  // ============ OTP SAHIFASI ============
  Widget _buildOtpPage(AppLocalizations? l10n) {
    final phone = _formatPhoneNumber(_phoneController.text.trim());
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && mounted) {
          _otpFocusNode.unfocus();
          setState(() {
            _isOtpSent = false;
            _otpController.clear();
          });
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: 16),

                // Back button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: GestureDetector(
                      onTap: () async {
                        final shouldPop = await _onWillPop();
                        if (shouldPop && mounted) {
                          _otpFocusNode.unfocus();
                          setState(() {
                            _isOtpSent = false;
                            _otpController.clear();
                          });
                        }
                      },
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
                ),

                const SizedBox(height: 40),

                // Message bubble icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('💬', style: TextStyle(fontSize: 36)),
                  ),
                ),

                const SizedBox(height: 24),

                const Text(
                  'Kodni kiriting',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 12),

                // Phone message
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: TextStyle(
                          fontSize: 15,
                          color: Colors.grey.shade600,
                          height: 1.4),
                      children: [
                        TextSpan(
                          text: phone,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, color: Colors.black),
                        ),
                        const TextSpan(
                            text:
                                ' telefon raqamingizga SMS orqali faollashtirish kodi yuborildi.'),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 40),

                // OTP boxes + hidden native keyboard input
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: GestureDetector(
                    onTap: () {
                      _otpFocusNode.requestFocus();
                      // Android'da keyboard chiqishini ta'minlash
                      SystemChannels.textInput.invokeMethod('TextInput.show');
                    },
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Visible 5 digit boxes
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: List.generate(5, (index) {
                            final hasDigit = _otpController.text.length > index;
                            final isActive = _otpFocusNode.hasFocus &&
                                _otpController.text.length == index;
                            return Container(
                              width: 52,
                              height: 60,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isActive
                                      ? AppColors.primary
                                      : hasDigit
                                          ? Colors.grey.shade300
                                          : Colors.grey.shade200,
                                  width: isActive ? 2 : 1,
                                ),
                              ),
                              alignment: Alignment.center,
                              child:
                                  _isLoading && _otpController.text.length == 5
                                      ? SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: AppColors.primary),
                                        )
                                      : Text(
                                          hasDigit
                                              ? _otpController.text[index]
                                              : '',
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                            );
                          }),
                        ),

                        // Hidden TextField: native keyboard + SMS autofill
                        AutofillGroup(
                          child: SizedBox(
                            width: double.infinity,
                            height: 60,
                            child: Opacity(
                              opacity: 0,
                              child: TextField(
                                controller: _otpController,
                                focusNode: _otpFocusNode,
                                autofocus: true,
                                keyboardType: TextInputType.number,
                                autofillHints: const [
                                  AutofillHints.oneTimeCode,
                                ],
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(5),
                                ],
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // Resend timer
                _resendCountdown > 0
                    ? Text(
                        'Qayta yuborish: ${_resendCountdown ~/ 60}:${(_resendCountdown % 60).toString().padLeft(2, '0')}',
                        style: TextStyle(
                            fontSize: 13, color: Colors.grey.shade500),
                      )
                    : TextButton(
                        onPressed: _isLoading ? null : _sendOtp,
                        child: Text(
                          l10n?.translate('resend') ?? 'Qaytadan yuborish',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
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
