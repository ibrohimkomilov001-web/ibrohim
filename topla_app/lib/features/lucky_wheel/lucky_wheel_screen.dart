import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_fortune_wheel/flutter_fortune_wheel.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';

import '../../core/repositories/i_lucky_wheel_repository.dart';
import '../../providers/lucky_wheel_provider.dart';

class LuckyWheelScreen extends StatefulWidget {
  const LuckyWheelScreen({super.key});

  @override
  State<LuckyWheelScreen> createState() => _LuckyWheelScreenState();
}

class _LuckyWheelScreenState extends State<LuckyWheelScreen>
    with TickerProviderStateMixin {
  final StreamController<int> _selectedController =
      StreamController<int>.broadcast();
  bool _isAnimating = false;
  SpinResult? _showResult;
  int? _targetIndex;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _glowController;
  late Animation<double> _glowAnimation;

  // Timer for countdown
  Timer? _countdownTimer;
  String _countdownText = '';

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.96, end: 1.04).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _glowAnimation = Tween<double>(begin: 0.3, end: 0.8).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LuckyWheelProvider>().loadAll();
      _startCountdownTimer();
    });
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      final provider = context.read<LuckyWheelProvider>();
      if (!provider.canSpin && provider.nextSpinAt != null) {
        final newText = _getTimeUntilNextSpin(provider.nextSpinAt);
        if (newText != _countdownText) {
          setState(() => _countdownText = newText);
        }
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _selectedController.close();
    _pulseController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  Color _parseColor(String hex) {
    try {
      hex = hex.replaceFirst('#', '');
      if (hex.length == 6) hex = 'FF$hex';
      return Color(int.parse(hex, radix: 16));
    } catch (_) {
      return Colors.grey;
    }
  }

  Future<void> _spin() async {
    final provider = context.read<LuckyWheelProvider>();
    if (_isAnimating || !provider.canSpin || provider.prizes.isEmpty) return;

    setState(() {
      _isAnimating = true;
      _showResult = null;
    });

    HapticFeedback.mediumImpact();

    final result = await provider.spin();
    if (result == null) {
      setState(() => _isAnimating = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Xatolik yuz berdi'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    final prizes = provider.prizes;
    _targetIndex = prizes.indexWhere((p) => p.id == result.prize.id);
    if (_targetIndex == -1) _targetIndex = 0;

    _selectedController.add(_targetIndex!);
  }

  void _onAnimationEnd() {
    final provider = context.read<LuckyWheelProvider>();
    HapticFeedback.heavyImpact();

    setState(() {
      _isAnimating = false;
      _showResult = provider.lastResult;
    });

    if (_showResult != null) {
      _showResultDialog(_showResult!);
    }
  }

  void _showResultDialog(SpinResult result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _ResultDialog(
        result: result,
        onClose: () {
          Navigator.of(ctx).pop();
          setState(() => _showResult = null);
        },
      ),
    );
  }

  String _getTimeUntilNextSpin(DateTime? nextSpinAt) {
    if (nextSpinAt == null) return '';
    final now = DateTime.now();
    final diff = nextSpinAt.difference(now);
    if (diff.isNegative) return "Aylantiring!";
    final hours = diff.inHours;
    final minutes = diff.inMinutes % 60;
    final seconds = diff.inSeconds % 60;
    return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFFFF6127), // Top orange-red
                Color(0xFFFF7131), // Middle orange
                Color(0xFFFF813B), // Bottom orange
              ],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                _buildAppBar(),
                Expanded(
                  child: Consumer<LuckyWheelProvider>(
                    builder: (context, provider, _) {
                      if (provider.isLoading) {
                        return const Center(
                          child: CircularProgressIndicator(
                            color: Colors.white,
                          ),
                        );
                      }

                      if (provider.prizes.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.casino,
                                  size: 64, color: Colors.white70),
                              const SizedBox(height: 16),
                              const Text(
                                'G\'ildirak hozircha ishlamayapti',
                                style: TextStyle(
                                    color: Colors.white70, fontSize: 16),
                              ),
                            ],
                          ),
                        );
                      }

                      return _buildBody(provider);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(
        children: [
          // Circular back button
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chevron_left_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
          ),
          const Expanded(
            child: Text(
              'Omad G\'ildiragi',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 19,
                letterSpacing: 0.3,
              ),
            ),
          ),
          // Barcha sovg'alar
          Tooltip(
            message: 'Sovg\'alar',
            child: GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/lucky-wheel/prizes'),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Iconsax.medal_star,
                    color: Colors.white, size: 18),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Yutganlarim
          Tooltip(
            message: 'Tarix',
            child: GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/lucky-wheel/history'),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Iconsax.clock, color: Colors.white, size: 18),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(LuckyWheelProvider provider) {
    return Column(
      children: [
        const SizedBox(height: 4),

        // Status text
        if (provider.canSpin)
          const Text(
            'Omadingizni sinab ko\'ring! 🎰',
            style: TextStyle(
              color: Color(0xFFFF8C00),
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),

        // Wheel — takes remaining space
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Subtle shadow
                AnimatedBuilder(
                  animation: _glowAnimation,
                  builder: (context, _) {
                    return Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFFD700)
                                .withValues(alpha: _glowAnimation.value * 0.12),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                    );
                  },
                ),

                // Wheel
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _isAnimating ? 1.0 : _pulseAnimation.value,
                      child: child,
                    );
                  },
                  child: FortuneWheel(
                    selected: _selectedController.stream,
                    animateFirst: false,
                    onAnimationEnd: _onAnimationEnd,
                    physics: CircularPanPhysics(
                      duration: const Duration(seconds: 1),
                      curve: Curves.decelerate,
                    ),
                    onFling: () {
                      if (provider.canSpin && !_isAnimating) {
                        _spin();
                      }
                    },
                    indicators: [
                      FortuneIndicator(
                        alignment: Alignment.topCenter,
                        child: TriangleIndicator(
                          color: const Color(0xFFFFD700),
                          width: 28,
                          height: 36,
                        ),
                      ),
                    ],
                    styleStrategy: UniformStyleStrategy(
                      borderColor: const Color(0xFFFFD700),
                      borderWidth: 3,
                    ),
                    items: provider.prizes.map((prize) {
                      final color = _parseColor(prize.color);
                      return FortuneItem(
                        style: FortuneItemStyle(
                          color: color,
                          borderColor: const Color(0xFFFFD700),
                          borderWidth: 2,
                          textStyle: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            shadows: [
                              Shadow(
                                blurRadius: 4,
                                color: Colors.black54,
                                offset: Offset(1, 1),
                              ),
                            ],
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.only(left: 40),
                          child: Text(
                            prize.nameUz,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              shadows: [
                                Shadow(
                                  blurRadius: 4,
                                  color: Colors.black54,
                                  offset: Offset(1, 1),
                                ),
                              ],
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Spin button — pill shaped, light gray when disabled
        Padding(
          padding: const EdgeInsets.fromLTRB(32, 0, 32, 24),
          child: _buildSpinButton(provider),
        ),
      ],
    );
  }

  Widget _buildSpinButton(LuckyWheelProvider provider) {
    final canSpin = provider.canSpin && !_isAnimating;

    if (canSpin) {
      // Active — gold glowing button
      return AnimatedBuilder(
        animation: _glowAnimation,
        builder: (context, child) {
          return Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFFD700)
                      .withValues(alpha: _glowAnimation.value * 0.4),
                  blurRadius: 16,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: child,
          );
        },
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _spin,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFD700),
              foregroundColor: const Color(0xFF1A0A3E),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
              elevation: 0,
            ),
            child: _isAnimating
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Color(0xFF1A0A3E),
                      strokeWidth: 2.5,
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.casino_rounded, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'AYLANTIRISH',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      );
    }

    // Disabled — light gray pill with countdown
    final timeText = _getTimeUntilNextSpin(provider.nextSpinAt);
    return Container(
      width: double.infinity,
      height: 52,
      decoration: BoxDecoration(
        color: const Color(0xFFE8E9F0),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.timer_1, size: 18, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            timeText.isNotEmpty ? timeText : 'Ertaga qaytadan',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 15,
              fontWeight: FontWeight.w600,
              fontFamily: timeText.isNotEmpty ? 'monospace' : null,
              letterSpacing: timeText.isNotEmpty ? 1.5 : 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

/// Result dialog after spin
class _ResultDialog extends StatefulWidget {
  final SpinResult result;
  final VoidCallback onClose;

  const _ResultDialog({required this.result, required this.onClose});

  @override
  State<_ResultDialog> createState() => _ResultDialogState();
}

class _ResultDialogState extends State<_ResultDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnim = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.elasticOut),
    );
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isWin = widget.result.isWin;

    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        return Opacity(
          opacity: _fadeAnim.value,
          child: Transform.scale(
            scale: _scaleAnim.value,
            child: child,
          ),
        );
      },
      child: Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isWin
                  ? [
                      const Color(0xFF1A0A3E),
                      const Color(0xFF2D1B69),
                      const Color(0xFF1A0A3E),
                    ]
                  : [
                      const Color(0xFF1A1A2E),
                      const Color(0xFF2D2D44),
                    ],
            ),
            border: Border.all(
              color: isWin
                  ? const Color(0xFFFFD700).withValues(alpha: 0.5)
                  : Colors.grey.shade700,
              width: 2,
            ),
            boxShadow: isWin
                ? [
                    BoxShadow(
                      color: const Color(0xFFFFD700).withValues(alpha: 0.3),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: isWin
                        ? [
                            const Color(0xFFFFD700),
                            const Color(0xFFFF8C00),
                          ]
                        : [Colors.grey.shade400, Colors.grey.shade700],
                  ),
                  boxShadow: isWin
                      ? [
                          BoxShadow(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.4),
                            blurRadius: 20,
                            spreadRadius: 3,
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  isWin
                      ? Icons.emoji_events_rounded
                      : Icons.sentiment_dissatisfied_outlined,
                  size: 44,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),

              Text(
                isWin ? 'Tabriklaymiz! 🎉' : 'Keyingi safar!',
                style: TextStyle(
                  color: isWin ? const Color(0xFFFFD700) : Colors.grey.shade300,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),

              Text(
                widget.result.prizeName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),

              Text(
                _prizeTypeDescription(widget.result.prizeType),
                style: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),

              if (widget.result.promoCode != null) ...[
                const SizedBox(height: 20),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Sizning promo kodingiz:',
                        style: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Flexible(
                            child: Text(
                              widget.result.promoCode!,
                              style: const TextStyle(
                                color: Color(0xFFFFD700),
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(
                                ClipboardData(text: widget.result.promoCode!),
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Promo kod nusxalandi!'),
                                  backgroundColor: Colors.green.shade700,
                                  behavior: SnackBarBehavior.floating,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color:
                                    const Color(0xFFFFD700).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.copy_rounded,
                                color: Color(0xFFFFD700),
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '30 kun ichida ishlating',
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              if (widget.result.prizeType == 'physical_gift') ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE91E63).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFFE91E63).withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline,
                          color: Color(0xFFE91E63), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Sovg\'angizni olish uchun operatorimiz siz bilan bog\'lanadi',
                          style: TextStyle(
                            color: Colors.grey.shade300,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: widget.onClose,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        isWin ? const Color(0xFFFFD700) : Colors.grey.shade700,
                    foregroundColor:
                        isWin ? const Color(0xFF1A0A3E) : Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    isWin ? 'Ajoyib! 🎊' : 'Yopish',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _prizeTypeDescription(String type) {
    switch (type) {
      case 'discount_percent':
        return 'Chegirma promo kodi';
      case 'discount_fixed':
        return 'Chegirma promo kodi';
      case 'free_delivery':
        return 'Bepul yetkazib berish';
      case 'physical_gift':
        return 'Jismoniy sovg\'a';
      default:
        return 'Omadingiz ertaga kulib boqadi!';
    }
  }
}
