import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'core/services/api_client.dart';
import 'core/theme/app_theme.dart';
import 'core/localization/app_localizations.dart';
import 'core/di/injection.dart';
import 'providers/providers.dart';
import 'providers/connectivity_provider.dart';
import 'services/connectivity_service.dart';
import 'widgets/connectivity_wrapper.dart';
import 'features/splash/splash_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/navigation/role_based_navigator.dart';
import 'features/auth/auth_screen.dart';
import 'features/auth/phone_auth_screen.dart';
import 'features/auth/otp_screen.dart';
import 'features/favorites/favorites_screen.dart';
import 'features/addresses/addresses_screen.dart';
import 'features/payment/payment_methods_screen.dart';
import 'features/help/help_screen.dart';
import 'features/invite/invite_friend_screen.dart';
import 'features/vendor/vendor_dashboard_screen.dart';
import 'features/orders/orders_screen.dart';
import 'features/profile/purchased_products_screen.dart';
import 'features/profile/returns_screen.dart';
import 'features/profile/reviews_questions_screen.dart';
import 'features/profile/devices_screen.dart';
import 'features/auth/complete_profile_screen.dart';
import 'core/widgets/auth_guard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase - platform-specific options bilan ishga tushirish
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    debugPrint('=== TOPLA: Firebase initialized ===');
  } catch (e) {
    debugPrint('Firebase init error: $e');
    // google-services.json / GoogleService-Info.plist orqali fallback
    try {
      await Firebase.initializeApp();
    } catch (_) {
      debugPrint('Firebase fallback init also failed');
    }
  }

  // API Client - saqlangan tokenlarni yuklash
  try {
    await ApiClient().loadTokens();
  } catch (e) {
    debugPrint('API Client init error: $e');
  }

  // Dependency Injection ni sozlash — bu MAJBURIY, xato bo'lsa ilova ishlamaydi
  try {
    await setupDependencies();
  } catch (e) {
    debugPrint('=== TOPLA CRITICAL: DI init FAILED: $e ===');
    runApp(MaterialApp(
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Ilovani ishga tushirishda xatolik yuz berdi.\n'
              'Iltimos, ilovani qayta ishga tushiring.\n\n$e',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Colors.red),
            ),
          ),
        ),
      ),
    ));
    return; // DI fail bo'lsa ilovani davom ettirmaslik
  }

  // Internet aloqasini kuzatish
  try {
    await ConnectivityService().initialize();
  } catch (e) {
    debugPrint('Connectivity init error: $e');
  }

  // Status bar va navigation bar ni sozlash
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Faqat portret rejim
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  debugPrint('=== TOPLA: Starting app ===');
  runApp(const ToplaApp());
}

class ToplaApp extends StatelessWidget {
  const ToplaApp({super.key});

  /// Global navigator key - push notification navigation uchun
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => getIt<AuthProvider>()),
        ChangeNotifierProvider(create: (_) => getIt<CartProvider>()),
        ChangeNotifierProvider(create: (_) => getIt<ProductsProvider>()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => getIt<OrdersProvider>()),
        ChangeNotifierProvider(create: (_) => getIt<AddressesProvider>()),
        ChangeNotifierProvider(create: (_) => getIt<VendorProvider>()),
        ChangeNotifierProvider(create: (_) => getIt<ShopProvider>()),
        ChangeNotifierProvider(
          create: (_) => ConnectivityProvider(ConnectivityService()),
        ),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return MaterialApp(
            navigatorKey: ToplaApp.navigatorKey,
            title: 'TOPLA',
            debugShowCheckedModeBanner: false,

            // Theme
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: settings.themeMode,

            // Localization
            locale: settings.locale,
            supportedLocales: const [
              Locale('uz'),
              Locale('ru'),
            ],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],

            // Initial route - Web uchun landing page, mobile uchun splash
            initialRoute: kIsWeb ? '/' : '/mobile',

            // Internet aloqasi banner'i
            builder: (context, child) {
              if (kIsWeb) return child ?? const SizedBox.shrink();
              return ConnectivityWrapper(
                  child: child ?? const SizedBox.shrink());
            },

            // Routes
            routes: {
              // Mobile routes
              '/mobile': (context) => const SplashScreen(),
              '/onboarding': (context) => const OnboardingScreen(),
              '/main': (context) => const RoleBasedNavigator(),
              '/auth': (context) => const AuthScreen(),
              '/phone-auth': (context) => const PhoneAuthScreen(),
              '/otp': (context) => const OtpScreen(),
              '/complete-profile': (context) => const CompleteProfileScreen(),
              '/favorites': (context) =>
                  const AuthGuard(child: FavoritesScreen()),
              '/addresses': (context) =>
                  const AuthGuard(child: AddressesScreen()),
              '/payment-methods': (context) =>
                  const AuthGuard(child: PaymentMethodsScreen()),
              '/help': (context) => const HelpScreen(),
              '/invite': (context) =>
                  const AuthGuard(child: InviteFriendScreen()),
              '/orders': (context) =>
                  const AuthGuard(child: OrdersScreen(showBackButton: true)),
              '/purchased-products': (context) =>
                  const AuthGuard(child: PurchasedProductsScreen()),
              '/returns': (context) => const AuthGuard(child: ReturnsScreen()),
              '/reviews-questions': (context) =>
                  const AuthGuard(child: ReviewsQuestionsScreen()),
              '/devices': (context) => const AuthGuard(child: DevicesScreen()),
              '/mobile-vendor': (context) =>
                  const AuthGuard(child: VendorDashboardScreen()),

              '/': (context) => const SplashScreen(),
              '/vendor/dashboard': (context) =>
                  const AuthGuard(child: VendorDashboardScreen()),
            },
          );
        },
      ),
    );
  }
}
