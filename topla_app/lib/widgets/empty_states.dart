import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../core/constants/app_colors.dart';

/// Empty State Widget - Zamonaviy animatsiyali bo'sh holatlar
class EmptyStateWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final String? lottieAsset;
  final Widget? customIllustration;
  final String? actionText;
  final VoidCallback? onAction;
  final Color? iconColor;
  final double iconSize;

  const EmptyStateWidget({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.lottieAsset,
    this.customIllustration,
    this.actionText,
    this.onAction,
    this.iconColor,
    this.iconSize = 120,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Illustration
            if (customIllustration != null)
              customIllustration!
            else if (lottieAsset != null)
              Lottie.asset(
                lottieAsset!,
                width: iconSize,
                height: iconSize,
                repeat: true,
              )
            else if (icon != null)
              _AnimatedIcon(
                icon: icon!,
                color: iconColor ?? AppColors.primary.withValues(alpha: 0.6),
                size: iconSize,
              ),

            const SizedBox(height: 28),

            // Title
            Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),

            // Subtitle
            if (subtitle != null) ...[
              const SizedBox(height: 10),
              Text(
                subtitle!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade500,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
            ],

            // Action button
            if (actionText != null && onAction != null) ...[
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  elevation: 0,
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40,
                    vertical: 14,
                  ),
                  shape: const StadiumBorder(),
                  textStyle: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                child: Text(actionText!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Animated Icon with pulse + floating effect
class _AnimatedIcon extends StatefulWidget {
  final IconData icon;
  final Color color;
  final double size;

  const _AnimatedIcon({
    required this.icon,
    required this.color,
    required this.size,
  });

  @override
  State<_AnimatedIcon> createState() => _AnimatedIconState();
}

class _AnimatedIconState extends State<_AnimatedIcon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.92, end: 1.08).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _floatAnimation = Tween<double>(begin: -6, end: 6).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    widget.color.withValues(alpha: 0.15),
                    widget.color.withValues(alpha: 0.05),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                widget.icon,
                size: widget.size * 0.45,
                color: widget.color,
              ),
            ),
          ),
        );
      },
    );
  }
}

// ════════════════════════════════════════════════════════
// NOTIFICATIONS - Animated Bell Empty State
// ════════════════════════════════════════════════════════

class EmptyNotificationsWidget extends StatefulWidget {
  const EmptyNotificationsWidget({super.key});

  @override
  State<EmptyNotificationsWidget> createState() =>
      _EmptyNotificationsWidgetState();
}

class _EmptyNotificationsWidgetState extends State<EmptyNotificationsWidget>
    with TickerProviderStateMixin {
  late AnimationController _bellController;
  late AnimationController _pulseController;
  late Animation<double> _bellSwing;
  late Animation<double> _pulseScale;
  late Animation<double> _pulseOpacity;

  @override
  void initState() {
    super.initState();

    // Bell swing animation
    _bellController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _bellSwing = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 0.15), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 0.15, end: -0.12), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -0.12, end: 0.08), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 0.08, end: -0.04), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -0.04, end: 0.0), weight: 1),
    ]).animate(CurvedAnimation(parent: _bellController, curve: Curves.easeOut));

    // Pulse ring animation
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
    _pulseScale = Tween<double>(begin: 0.8, end: 1.6).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );
    _pulseOpacity = Tween<double>(begin: 0.6, end: 0.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );

    // Repeat bell swing every 3 seconds
    _startBellLoop();
  }

  void _startBellLoop() async {
    while (mounted) {
      await _bellController.forward(from: 0);
      await Future.delayed(const Duration(milliseconds: 2500));
    }
  }

  @override
  void dispose() {
    _bellController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      title: 'Bildirishnomalar yo\'q',
      subtitle: 'Yangi xabarlar va aksiyalar\nbu yerda ko\'rinadi',
      customIllustration: SizedBox(
        width: 160,
        height: 160,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Pulse rings
            AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                return Transform.scale(
                  scale: _pulseScale.value,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.warning
                            .withValues(alpha: _pulseOpacity.value),
                        width: 2,
                      ),
                    ),
                  ),
                );
              },
            ),
            // Background circle
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFFFFF3E0),
                    const Color(0xFFFFE0B2),
                  ],
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.warning.withValues(alpha: 0.2),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
            // Bell icon with swing
            AnimatedBuilder(
              animation: _bellController,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _bellSwing.value,
                  alignment: const Alignment(0, -0.5),
                  child: const Icon(
                    Icons.notifications_rounded,
                    size: 52,
                    color: Color(0xFFF57C00),
                  ),
                );
              },
            ),
            // Small dot indicator
            Positioned(
              top: 32,
              right: 40,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════
// FAVORITES - Animated Heart Empty State
// ════════════════════════════════════════════════════════

class EmptyFavoritesWidget extends StatefulWidget {
  final VoidCallback onExplore;

  const EmptyFavoritesWidget({super.key, required this.onExplore});

  @override
  State<EmptyFavoritesWidget> createState() => _EmptyFavoritesWidgetState();
}

class _EmptyFavoritesWidgetState extends State<EmptyFavoritesWidget>
    with TickerProviderStateMixin {
  late AnimationController _heartController;
  late AnimationController _particlesController;
  late Animation<double> _heartScale;

  @override
  void initState() {
    super.initState();

    // Heart beat animation
    _heartController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _heartScale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.2), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 1.2, end: 1.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.15), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 1.15, end: 1.0), weight: 2),
    ]).animate(
        CurvedAnimation(parent: _heartController, curve: Curves.easeInOut));

    // Floating particles
    _particlesController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();
  }

  @override
  void dispose() {
    _heartController.dispose();
    _particlesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      title: 'Sevimlilar ro\'yxati bo\'sh',
      subtitle: 'Yoqtirgan mahsulotlaringizni\n❤️ bosib saqlang',
      actionText: 'Mahsulotlarni ko\'rish',
      onAction: widget.onExplore,
      customIllustration: SizedBox(
        width: 180,
        height: 180,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Floating mini hearts
            ...List.generate(5, (i) {
              return AnimatedBuilder(
                animation: _particlesController,
                builder: (context, child) {
                  final progress = (_particlesController.value + i * 0.2) % 1.0;
                  final angle = i * (2 * math.pi / 5);
                  final radius = 50.0 + progress * 30;
                  final x = math.cos(angle + progress * 2) * radius;
                  final y = math.sin(angle + progress * 2) * radius;
                  final opacity =
                      (1.0 - (progress - 0.5).abs() * 2).clamp(0.0, 0.5);
                  return Transform.translate(
                    offset: Offset(x, y),
                    child: Opacity(
                      opacity: opacity,
                      child: Icon(
                        Icons.favorite,
                        size: 12.0 + i * 2,
                        color: [
                          const Color(0xFFFF6B6B),
                          const Color(0xFFFF8E8E),
                          const Color(0xFFFFB3B3),
                          const Color(0xFFFF5252),
                          const Color(0xFFFFA0A0),
                        ][i],
                      ),
                    ),
                  );
                },
              );
            }),
            // Background circle
            Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFFFEBEE),
                    const Color(0xFFFCE4EC),
                    Colors.white.withValues(alpha: 0.3),
                  ],
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF5252).withValues(alpha: 0.15),
                    blurRadius: 25,
                    spreadRadius: 5,
                  ),
                ],
              ),
            ),
            // Animated heart
            AnimatedBuilder(
              animation: _heartController,
              builder: (context, child) {
                return Transform.scale(
                  scale: _heartScale.value,
                  child: ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFF5252), Color(0xFFFF1744)],
                    ).createShader(bounds),
                    child: const Icon(
                      Icons.favorite_rounded,
                      size: 56,
                      color: Colors.white,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════
// PURCHASED PRODUCTS - Animated Shopping Bag Empty State
// ════════════════════════════════════════════════════════

class EmptyPurchasedWidget extends StatefulWidget {
  final VoidCallback onShopNow;

  const EmptyPurchasedWidget({super.key, required this.onShopNow});

  @override
  State<EmptyPurchasedWidget> createState() => _EmptyPurchasedWidgetState();
}

class _EmptyPurchasedWidgetState extends State<EmptyPurchasedWidget>
    with TickerProviderStateMixin {
  late AnimationController _bounceController;
  late AnimationController _sparkleController;
  late Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();

    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _bounceAnimation = Tween<double>(begin: 0, end: -12).animate(
      CurvedAnimation(parent: _bounceController, curve: Curves.easeInOut),
    );

    _sparkleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat();
  }

  @override
  void dispose() {
    _bounceController.dispose();
    _sparkleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      title: 'Xaridlar yo\'q',
      subtitle:
          'Siz hali hech narsa sotib olmadingiz.\nBirinchi xaridingizni qiling!',
      actionText: 'Xarid qilish',
      onAction: widget.onShopNow,
      customIllustration: SizedBox(
        width: 180,
        height: 180,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Sparkle particles
            ...List.generate(6, (i) {
              return AnimatedBuilder(
                animation: _sparkleController,
                builder: (context, child) {
                  final progress = (_sparkleController.value + i * 0.167) % 1.0;
                  final angle = i * (math.pi / 3);
                  final radius = 45.0 + progress * 35;
                  final x = math.cos(angle) * radius;
                  final y = math.sin(angle) * radius - 10;
                  final opacity = (1.0 - progress).clamp(0.0, 0.7);
                  final scale = 1.0 - progress * 0.5;
                  return Transform.translate(
                    offset: Offset(x, y),
                    child: Transform.scale(
                      scale: scale,
                      child: Opacity(
                        opacity: opacity,
                        child: Icon(
                          Icons.star_rounded,
                          size: 10 + (i % 3) * 4.0,
                          color: [
                            const Color(0xFF90CAF9),
                            const Color(0xFFBBDEFB),
                            const Color(0xFF64B5F6),
                            const Color(0xFFE3F2FD),
                            const Color(0xFF42A5F5),
                            const Color(0xFF90CAF9),
                          ][i],
                        ),
                      ),
                    ),
                  );
                },
              );
            }),
            // Background circle
            Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFFE3F2FD),
                    const Color(0xFFBBDEFB),
                  ],
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    blurRadius: 20,
                    spreadRadius: 3,
                  ),
                ],
              ),
            ),
            // Bouncing bag icon
            AnimatedBuilder(
              animation: _bounceController,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, _bounceAnimation.value),
                  child: ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF42A5F5), Color(0xFF1976D2)],
                    ).createShader(bounds),
                    child: const Icon(
                      Icons.shopping_bag_rounded,
                      size: 56,
                      color: Colors.white,
                    ),
                  ),
                );
              },
            ),
            // Check badge
            Positioned(
              bottom: 38,
              right: 38,
              child: AnimatedBuilder(
                animation: _sparkleController,
                builder: (context, child) {
                  final scale = 0.9 +
                      0.1 * math.sin(_sparkleController.value * math.pi * 2);
                  return Transform.scale(
                    scale: scale,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF66BB6A), Color(0xFF43A047)],
                        ),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color:
                                const Color(0xFF43A047).withValues(alpha: 0.3),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.check_rounded,
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════
// HOME - Animated Products Loading State
// ════════════════════════════════════════════════════════

class ProductsLoadingWidget extends StatefulWidget {
  const ProductsLoadingWidget({super.key});

  @override
  State<ProductsLoadingWidget> createState() => _ProductsLoadingWidgetState();
}

class _ProductsLoadingWidgetState extends State<ProductsLoadingWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.grey.shade50,
            Colors.grey.shade100,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Stack(
        children: [
          // Shimmer overlay
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: ShaderMask(
                  blendMode: BlendMode.srcATop,
                  shaderCallback: (bounds) {
                    return LinearGradient(
                      begin: Alignment(-1.0 + 2.0 * _controller.value, 0),
                      end: Alignment(1.0 + 2.0 * _controller.value, 0),
                      colors: [
                        Colors.transparent,
                        Colors.white.withValues(alpha: 0.3),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ).createShader(bounds);
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              );
            },
          ),
          // Content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Animated loading icon
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    return Transform.rotate(
                      angle: _controller.value * 2 * math.pi,
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              blurRadius: 12,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.local_mall_rounded,
                          size: 28,
                          color: AppColors.primary.withValues(alpha: 0.7),
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                Text(
                  'Mahsulotlar yuklanmoqda',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                // Progress dots
                SizedBox(
                  height: 10,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (i) {
                      return AnimatedBuilder(
                        animation: _controller,
                        builder: (context, child) {
                          final delay = i * 0.2;
                          final progress = ((_controller.value - delay) % 1.0)
                              .clamp(0.0, 1.0);
                          final scale =
                              0.5 + 0.5 * math.sin(progress * math.pi);
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: 8,
                            height: 8,
                            child: Transform.scale(
                              scale: scale,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  color: AppColors.primary
                                      .withValues(alpha: 0.3 + 0.5 * scale),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          );
                        },
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════
// EXISTING WIDGETS (updated)
// ════════════════════════════════════════════════════════

/// Empty Cart Widget
class EmptyCartWidget extends StatelessWidget {
  final VoidCallback onShopNow;

  const EmptyCartWidget({super.key, required this.onShopNow});

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      lottieAsset: 'assets/lottie/empty_cart.json',
      iconSize: 200,
      title: 'Savatingiz bo\'sh',
      subtitle: 'Mahsulotlarni savatga qo\'shing va buyurtma bering',
      actionText: 'Xarid qilish',
      onAction: onShopNow,
    );
  }
}

/// Empty Orders Widget
class EmptyOrdersWidget extends StatelessWidget {
  final VoidCallback onShopNow;

  const EmptyOrdersWidget({super.key, required this.onShopNow});

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      lottieAsset: 'assets/lottie/empty_orders.json',
      iconSize: 200,
      title: 'Buyurtmalar yo\'q',
      subtitle: 'Siz hali hech narsa buyurtma qilmagansiz',
      actionText: 'Xarid qilish',
      onAction: onShopNow,
    );
  }
}

/// Empty Search Results Widget
class EmptySearchWidget extends StatelessWidget {
  final String query;
  final VoidCallback? onClear;

  const EmptySearchWidget({
    super.key,
    required this.query,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.search_off,
      iconColor: Colors.grey,
      title: 'Natija topilmadi',
      subtitle:
          '"$query" bo\'yicha hech narsa topilmadi.\nBoshqa so\'z bilan qidirib ko\'ring.',
      actionText: onClear != null ? 'Tozalash' : null,
      onAction: onClear,
    );
  }
}

/// No Internet Widget
class NoInternetWidget extends StatelessWidget {
  final VoidCallback onRetry;

  const NoInternetWidget({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.wifi_off,
      iconColor: AppColors.error,
      title: 'Internet aloqasi yo\'q',
      subtitle: 'Iltimos, internet ulanishingizni tekshiring',
      actionText: 'Qayta urinish',
      onAction: onRetry,
    );
  }
}

/// Error Widget
class ErrorStateWidget extends StatelessWidget {
  final String? message;
  final VoidCallback onRetry;

  const ErrorStateWidget({
    super.key,
    this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.error_outline,
      iconColor: AppColors.error,
      title: 'Xatolik yuz berdi',
      subtitle:
          message ?? 'Nimadir noto\'g\'ri ketdi.\nQaytadan urinib ko\'ring.',
      actionText: 'Qayta urinish',
      onAction: onRetry,
    );
  }
}
