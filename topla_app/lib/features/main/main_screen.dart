import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
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

  static const Color _activeColor = Color(0xFF3B82F6);
  static const Color _inactiveColor = Color(0xFF9CA3AF);

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
                color: Colors.black.withValues(alpha: 0.4),
                width: 1,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, -2),
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
                    icon: Iconsax.home_2,
                    activeIcon: Iconsax.home_2,
                    label: l10n?.home ?? 'Asosiy',
                  ),
                  _buildNavItem(
                    index: 1,
                    icon: Iconsax.category,
                    activeIcon: Iconsax.category,
                    label: l10n?.catalog ?? 'Katalog',
                  ),
                  // Cart badge faqat o'zi yangilanadi
                  Selector<CartProvider, int>(
                    selector: (_, cart) => cart.totalQuantity,
                    builder: (_, cartCount, __) => _buildNavItem(
                      index: 2,
                      icon: Iconsax.bag,
                      activeIcon: Iconsax.bag,
                      label: l10n?.cart ?? 'Savat',
                      badge: cartCount,
                    ),
                  ),
                  _buildNavItem(
                    index: 3,
                    icon: Iconsax.clipboard_text,
                    activeIcon: Iconsax.clipboard_text,
                    label: l10n?.myOrders ?? 'Buyurtmalar',
                  ),
                  _buildNavItem(
                    index: 4,
                    icon: Iconsax.user,
                    activeIcon: Iconsax.user,
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

    return GestureDetector(
      onTap: () => _onNavTap(index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  size: 22,
                  color: isActive ? _activeColor : _inactiveColor,
                ),
                if (badge > 0)
                  Positioned(
                    right: -8,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      constraints:
                          const BoxConstraints(minWidth: 14, minHeight: 14),
                      child: Text(
                        badge > 99 ? '99+' : '$badge',
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
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? _activeColor : _inactiveColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
