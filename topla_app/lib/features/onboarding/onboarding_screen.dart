import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dots_indicator/dots_indicator.dart';
import 'package:lottie/lottie.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/notification_permission_dialog.dart';
import '../../widgets/location_permission_dialog.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  List<OnboardingData> _getPages(BuildContext context) {
    return [
      OnboardingData(
        lottieAsset: 'assets/lottie/onboarding/onboarding_1.json',
        title: context.l10n.translate('onboarding_1_title'),
        description: context.l10n.translate('onboarding_1_desc'),
        color: AppColors.primary,
      ),
      OnboardingData(
        lottieAsset: 'assets/lottie/onboarding/onboarding_2.json',
        title: context.l10n.translate('onboarding_2_title'),
        description: context.l10n.translate('onboarding_2_desc'),
        color: AppColors.accent,
      ),
      OnboardingData(
        lottieAsset: 'assets/lottie/onboarding/onboarding_3.json',
        title: context.l10n.translate('onboarding_3_title'),
        description: context.l10n.translate('onboarding_3_desc'),
        color: AppColors.success,
      ),
      OnboardingData(
        title: context.l10n.translate('onboarding_4_title'),
        description: context.l10n.translate('onboarding_4_desc'),
        color: AppColors.success,
        customWidget: const _LocationIllustration(),
      ),
    ];
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNextPressed(List<OnboardingData> pages) {
    if (_currentPage < pages.length - 1) {
      _pageController.nextPage(
        duration: AppSizes.animNormal,
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstTime', false);

    if (!mounted) return;

    // Bildirishnoma ruxsatini so'rash
    await showNotificationPermissionDialog(context);

    if (!mounted) return;

    // Joylashuv ruxsatini so'rash
    await showLocationPermissionDialog(context);

    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/main');
  }

  @override
  Widget build(BuildContext context) {
    final pages = _getPages(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(AppSizes.lg),
                child: TextButton(
                  onPressed: _completeOnboarding,
                  child: Text(
                    context.l10n.translate('skip'),
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),

            // Page View
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: pages.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemBuilder: (context, index) {
                  return OnboardingPage(data: pages[index]);
                },
              ),
            ),

            // Bottom section
            Padding(
              padding: const EdgeInsets.all(AppSizes.xl),
              child: Column(
                children: [
                  // Page indicator
                  DotsIndicator(
                    dotsCount: pages.length,
                    position: _currentPage.toDouble(),
                    decorator: DotsDecorator(
                      activeColor: pages[_currentPage].color,
                      color: Colors.grey.shade300,
                      size: const Size.square(8),
                      activeSize: const Size(32, 8),
                      activeShape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      spacing: const EdgeInsets.symmetric(horizontal: 3),
                    ),
                  ),

                  const SizedBox(height: AppSizes.xxl),

                  // Next/Start button
                  SizedBox(
                    width: double.infinity,
                    height: AppSizes.buttonHeightLg,
                    child: ElevatedButton(
                      onPressed: () => _onNextPressed(pages),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: pages[_currentPage].color,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppSizes.radiusFull),
                        ),
                        elevation: 0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _currentPage == pages.length - 1
                                ? context.l10n.translate('get_started')
                                : context.l10n.next,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: AppSizes.sm),
                          Icon(
                            _currentPage == pages.length - 1
                                ? Icons.check_rounded
                                : Icons.arrow_forward_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingData {
  final String? lottieAsset;
  final String title;
  final String description;
  final Color color;
  final Widget? customWidget;

  OnboardingData({
    this.lottieAsset,
    required this.title,
    required this.description,
    required this.color,
    this.customWidget,
  });
}

class OnboardingPage extends StatelessWidget {
  final OnboardingData data;

  const OnboardingPage({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.xxl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Illustratsiya
          SizedBox(
            width: 280,
            height: 280,
            child: data.customWidget ??
                Lottie.asset(
                  data.lottieAsset!,
                  fit: BoxFit.contain,
                  repeat: true,
                ),
          ),

          const SizedBox(height: AppSizes.xl),

          // Sarlavha
          Text(
            data.title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: data.color,
              letterSpacing: 0.3,
            ),
          ),

          const SizedBox(height: AppSizes.md),

          // Tavsif
          Text(
            data.description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey.shade600,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// 4-sahifa uchun joylashuv illustratsiyasi
class _LocationIllustration extends StatefulWidget {
  const _LocationIllustration();

  @override
  State<_LocationIllustration> createState() => _LocationIllustrationState();
}

class _LocationIllustrationState extends State<_LocationIllustration>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final AnimationController _pinController;
  late final Animation<double> _pulseAnimation;
  late final Animation<double> _pinAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _pinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pinAnimation = Tween<double>(begin: 0, end: -12).animate(
      CurvedAnimation(parent: _pinController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseController, _pinController]),
      builder: (context, child) {
        return CustomPaint(
          painter: _LocationPainter(
            pulseValue: _pulseAnimation.value,
            pinOffset: _pinAnimation.value,
          ),
          size: const Size(280, 280),
        );
      },
    );
  }
}

class _LocationPainter extends CustomPainter {
  final double pulseValue;
  final double pinOffset;

  _LocationPainter({required this.pulseValue, required this.pinOffset});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2 + 10);

    // Pulsatsiya halqalari
    for (var i = 3; i >= 1; i--) {
      final radius = 40.0 + (i * 28.0 * pulseValue);
      final opacity = (0.12 - (i * 0.03)).clamp(0.02, 0.12);
      final paint = Paint()
        ..color = AppColors.success.withValues(alpha: opacity)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius, paint);
    }

    // Markaziy doira (gradient effekt)
    final centerCirclePaint = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.success.withValues(alpha: 0.2),
          AppColors.success.withValues(alpha: 0.05),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: 60));
    canvas.drawCircle(center, 60, centerCirclePaint);

    // Do'kon ikonkalari (atrofda)
    final storePositions = [
      Offset(center.dx - 85, center.dy - 70),
      Offset(center.dx + 80, center.dy - 50),
      Offset(center.dx - 75, center.dy + 65),
      Offset(center.dx + 85, center.dy + 55),
    ];

    final storeIcons = [
      Icons.store_rounded,
      Icons.shopping_bag_rounded,
      Icons.local_grocery_store_rounded,
      Icons.storefront_rounded,
    ];

    for (var i = 0; i < storePositions.length; i++) {
      // Do'kon fon doirasi
      final bgPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(storePositions[i], 22, bgPaint);

      // Soya
      final shadowPaint = Paint()
        ..color = Colors.black.withValues(alpha: 0.08)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
      canvas.drawCircle(
          storePositions[i] + const Offset(0, 2), 22, shadowPaint);

      // Oq fon
      canvas.drawCircle(storePositions[i], 22, bgPaint);

      // Ikonka
      final textPainter = TextPainter(textDirection: TextDirection.ltr);
      textPainter.text = TextSpan(
        text: String.fromCharCode(storeIcons[i].codePoint),
        style: TextStyle(
          fontSize: 20,
          fontFamily: storeIcons[i].fontFamily,
          package: storeIcons[i].fontPackage,
          color: AppColors.success,
        ),
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        storePositions[i] -
            Offset(textPainter.width / 2, textPainter.height / 2),
      );

      // Chiziqcha (do'kondan markazga)
      final linePaint = Paint()
        ..color = AppColors.success.withValues(alpha: 0.15)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke;

      final path = Path();
      path.moveTo(storePositions[i].dx, storePositions[i].dy);

      // Egri chiziq
      final controlPoint = Offset(
        (storePositions[i].dx + center.dx) / 2 + (i.isEven ? 15 : -15),
        (storePositions[i].dy + center.dy) / 2,
      );
      path.quadraticBezierTo(
          controlPoint.dx, controlPoint.dy, center.dx, center.dy);

      // Nuqtali chiziq effekti
      final dashPath = Path();
      for (final metric in path.computeMetrics()) {
        var distance = 0.0;
        while (distance < metric.length) {
          final segment = metric.extractPath(distance, distance + 4);
          dashPath.addPath(segment, Offset.zero);
          distance += 8;
        }
      }
      canvas.drawPath(dashPath, linePaint);
    }

    // Joylashuv pin (markazda, yuqoriga-pastga)
    final pinCenter = Offset(center.dx, center.dy + pinOffset);

    // Pin soyasi
    final pinShadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.15)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawCircle(Offset(center.dx, center.dy + 8), 8, pinShadowPaint);

    // Pin tanasi
    final pinPath = Path();
    pinPath.moveTo(pinCenter.dx, pinCenter.dy + 28);
    pinPath.quadraticBezierTo(pinCenter.dx - 20, pinCenter.dy + 2,
        pinCenter.dx - 20, pinCenter.dy - 8);
    pinPath.arcTo(
      Rect.fromCircle(
          center: Offset(pinCenter.dx, pinCenter.dy - 8), radius: 20),
      math.pi,
      -math.pi,
      false,
    );
    pinPath.quadraticBezierTo(
        pinCenter.dx + 20, pinCenter.dy + 2, pinCenter.dx, pinCenter.dy + 28);

    final pinPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppColors.success,
          AppColors.success.withValues(alpha: 0.85),
        ],
      ).createShader(
          Rect.fromLTWH(pinCenter.dx - 20, pinCenter.dy - 28, 40, 56));
    canvas.drawPath(pinPath, pinPaint);

    // Pin ichidagi oq doira
    final innerCirclePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
        Offset(pinCenter.dx, pinCenter.dy - 8), 10, innerCirclePaint);

    // Pin ichidagi kichik yashil doira
    final dotPaint = Paint()
      ..color = AppColors.success
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(pinCenter.dx, pinCenter.dy - 8), 5, dotPaint);
  }

  @override
  bool shouldRepaint(_LocationPainter oldDelegate) {
    return oldDelegate.pulseValue != pulseValue ||
        oldDelegate.pinOffset != pinOffset;
  }
}
