import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../../services/connectivity_service.dart';
import '../../services/push_notification_service.dart';
import '../home/home_screen.dart';
import '../catalog/catalog_screen.dart';
import '../cart/cart_screen.dart';
import '../orders/orders_screen.dart';
import '../profile/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => MainScreenState();
}

class MainScreenState extends State<MainScreen> with WidgetsBindingObserver {
  static MainScreenState? _instance;
  int _currentIndex = 0;
  DateTime? _lastBackPressTime;
  late final PageController _pageController;

  final List<Widget> _screens = [
    const HomeScreen(),
    const CatalogScreen(),
    const CartScreen(),
    const OrdersScreen(),
    const ProfileScreen(),
  ];

  static const Color _activeColor =
      AppColors.accent; // #FF6B35 — Temu uslubida yorqin
  static const Color _inactiveColor = Colors.black; // Qora rang

  static void switchToTab(int index) {
    _instance?._onNavTap(index);
  }

  @override
  void initState() {
    super.initState();
    _instance = this;
    _pageController = PageController();
    WidgetsBinding.instance.addObserver(this);
    _startRealtimeSubscriptions();
  }

  void _startRealtimeSubscriptions() {
    if (context.read<AuthProvider>().isLoggedIn) {
      context.read<CartProvider>().initAfterLogin();
      context.read<OrdersProvider>().initAfterLogin();
      // Push notification xizmatini to'liq ishga tushirish (FCM token, foreground, background, local notifications)
      PushNotificationService().initialize();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    switch (state) {
      case AppLifecycleState.resumed:
        // Ilova qayta ochilganda internet tekshirish va ulanishlarni tiklash
        debugPrint('📱 App resumed - reconnecting...');
        ConnectivityService().checkNow();
        if (context.read<AuthProvider>().isLoggedIn) {
          context.read<CartProvider>().startRealtimeSubscription();
          context.read<OrdersProvider>().startRealtimeSubscription();
        }
        break;
      case AppLifecycleState.paused:
        debugPrint('📱 App paused');
        break;
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        break;
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    if (_instance == this) {
      _instance = null;
    }
    super.dispose();
  }

  void _onNavTap(int index) {
    if (_currentIndex == index) return;
    HapticFeedback.selectionClick();
    // Yonma-yon sahifalar — smooth animatsiya, uzoq sahifalar — darhol o'tish
    if ((index - _currentIndex).abs() == 1) {
      _pageController.animateToPage(
        index,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
      );
    } else {
      _pageController.jumpToPage(index);
    }
  }

  /// Orqaga tugmasi - boshqa tabda bo'lsa Home'ga qaytaradi, Home'da 2 marta bosish kerak
  Future<bool> _onWillPop() async {
    // Agar Asosiy (Home) tabda bo'lmasa - Home tabga qaytarish
    if (_currentIndex != 0) {
      _pageController.jumpToPage(0);
      setState(() => _currentIndex = 0);
      return false;
    }

    // Home tabda - ikki marta bosish bilan chiqish
    final now = DateTime.now();
    if (_lastBackPressTime == null ||
        now.difference(_lastBackPressTime!) > const Duration(seconds: 2)) {
      _lastBackPressTime = now;

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Chiqish uchun yana bir marta bosing',
              textAlign: TextAlign.center,
            ),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.only(bottom: 80, left: 50, right: 50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
      return false;
    }

    return true;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        body: PageView(
          controller: _pageController,
          physics: const NeverScrollableScrollPhysics(),
          onPageChanged: (index) {
            setState(() => _currentIndex = index);
          },
          children: _screens,
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(
              top: BorderSide(
                color: Colors.black.withValues(alpha: 0.08),
                width: 0.5,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: SafeArea(
            child: SizedBox(
              height: 56,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(
                    index: 0,
                    icon: Iconsax.home_1_copy,
                    activeIcon: Iconsax.home_1,
                    label: l10n?.home ?? 'Asosiy',
                  ),
                  _buildNavItem(
                    index: 1,
                    icon: Iconsax.category_copy,
                    activeIcon: Iconsax.category,
                    label: l10n?.catalog ?? 'Katalog',
                  ),
                  // Cart badge faqat o'zi yangilanadi
                  Selector<CartProvider, int>(
                    selector: (_, cart) => cart.totalQuantity,
                    builder: (_, cartCount, __) => _buildNavItem(
                      index: 2,
                      icon: Iconsax.bag_2_copy,
                      activeIcon: Iconsax.bag_2,
                      label: l10n?.cart ?? 'Savat',
                      badge: cartCount,
                    ),
                  ),
                  _buildNavItem(
                    index: 3,
                    icon: Iconsax.note_2_copy,
                    activeIcon: Iconsax.note_2,
                    label: l10n?.myOrders ?? 'Buyurtmal...',
                  ),
                  _buildNavItem(
                    index: 4,
                    icon: Iconsax.profile_circle_copy,
                    activeIcon: Iconsax.profile_circle,
                    label: l10n?.profile ?? 'Profil',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    int badge = 0,
  }) {
    final isActive = _currentIndex == index;

    return _NavItemButton(
      onTap: () => _onNavTap(index),
      isActive: isActive,
      icon: icon,
      activeIcon: activeIcon,
      label: label,
      badge: badge,
      activeColor: _activeColor,
      inactiveColor: _inactiveColor,
    );
  }
}

/// Scale animatsiyali nav item tugmasi
class _NavItemButton extends StatefulWidget {
  final VoidCallback onTap;
  final bool isActive;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;
  final Color activeColor;
  final Color inactiveColor;

  const _NavItemButton({
    required this.onTap,
    required this.isActive,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.badge,
    required this.activeColor,
    required this.inactiveColor,
  });

  @override
  State<_NavItemButton> createState() => _NavItemButtonState();
}

class _NavItemButtonState extends State<_NavItemButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.85).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    _controller.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    _controller.reverse();
    widget.onTap();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: SizedBox(
          width: 64,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    widget.isActive ? widget.activeIcon : widget.icon,
                    size: 24,
                    color: widget.isActive
                        ? widget.activeColor
                        : widget.inactiveColor,
                  ),
                  if (widget.badge > 0)
                    Positioned(
                      right: -8,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        constraints:
                            const BoxConstraints(minWidth: 14, minHeight: 14),
                        child: Text(
                          widget.badge > 99 ? '99+' : '${widget.badge}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: widget.isActive ? 11 : 10,
                  fontWeight:
                      widget.isActive ? FontWeight.w700 : FontWeight.w400,
                  color: widget.isActive
                      ? widget.activeColor
                      : widget.inactiveColor,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
