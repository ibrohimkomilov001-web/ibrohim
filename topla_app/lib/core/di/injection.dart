import 'package:get_it/get_it.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase;

// Repositories - Interfaces
import 'package:topla_app/core/repositories/repositories.dart';

// Repositories - API Implementations
import 'package:topla_app/data/repositories/repositories.dart';

// Services
import 'package:topla_app/core/services/api_client.dart';
import 'package:topla_app/core/services/tracking_service.dart';
import 'package:topla_app/services/secure_storage_service.dart';

// Providers
import 'package:topla_app/providers/providers.dart';

/// GetIt instance - global service locator
final getIt = GetIt.instance;

/// Dependency Injection setup
/// Bu funksiya app boshida chaqirilishi kerak
Future<void> setupDependencies() async {
  // ==================== EXTERNAL ====================

  // Firebase Auth (OTP uchun hali kerak)
  getIt.registerLazySingleton<firebase.FirebaseAuth>(
    () => firebase.FirebaseAuth.instance,
  );

  // ==================== SERVICES ====================

  // API Client (singleton)
  getIt.registerLazySingleton<ApiClient>(
    () => ApiClient(),
  );

  // Tracking service (real-time kuryer kuzatish)
  getIt.registerLazySingleton<TrackingService>(
    () => TrackingService(),
  );

  // Cache service
  getIt.registerLazySingleton<CacheService>(
    () => CacheService(),
  );

  // Secure storage service
  getIt.registerLazySingleton<SecureStorageService>(
    () => SecureStorageService(),
  );

  // ==================== REPOSITORIES ====================

  // Auth repository
  getIt.registerLazySingleton<IAuthRepository>(
    () => ApiAuthRepositoryImpl(getIt<ApiClient>()),
  );

  // Product repository
  getIt.registerLazySingleton<IProductRepository>(
    () => ApiProductRepositoryImpl(getIt<ApiClient>()),
  );

  // Category repository
  getIt.registerLazySingleton<ICategoryRepository>(
    () => ApiCategoryRepositoryImpl(getIt<ApiClient>()),
  );

  // Cart repository
  getIt.registerLazySingleton<ICartRepository>(
    () => ApiCartRepositoryImpl(getIt<ApiClient>()),
  );

  // Order repository
  getIt.registerLazySingleton<IOrderRepository>(
    () => ApiOrderRepositoryImpl(getIt<ApiClient>()),
  );

  // Address repository
  getIt.registerLazySingleton<IAddressRepository>(
    () => ApiAddressRepositoryImpl(getIt<ApiClient>()),
  );

  // Favorites repository
  getIt.registerLazySingleton<IFavoritesRepository>(
    () => ApiFavoritesRepositoryImpl(getIt<ApiClient>()),
  );

  // Banner repository
  getIt.registerLazySingleton<IBannerRepository>(
    () => ApiBannerRepositoryImpl(getIt<ApiClient>()),
  );

  // Shop repository (public shop access)
  getIt.registerLazySingleton<IShopRepository>(
    () => ApiShopRepositoryImpl(getIt<ApiClient>()),
  );

  // Courier repository (Yandex Go uslubi)
  getIt.registerLazySingleton<ICourierRepository>(
    () => ApiCourierRepositoryImpl(getIt<ApiClient>()),
  );

  // Lucky Wheel repository
  getIt.registerLazySingleton<ILuckyWheelRepository>(
    () => ApiLuckyWheelRepositoryImpl(getIt<ApiClient>()),
  );

  // ==================== PROVIDERS ====================

  getIt.registerLazySingleton<AuthProvider>(
    () => AuthProvider(getIt<IAuthRepository>()),
  );

  getIt.registerLazySingleton<ProductsProvider>(
    () => ProductsProvider(
      getIt<IProductRepository>(),
      getIt<ICategoryRepository>(),
      getIt<IBannerRepository>(),
      getIt<IFavoritesRepository>(),
    ),
  );

  getIt.registerLazySingleton<CartProvider>(
    () => CartProvider(getIt<ICartRepository>()),
  );

  getIt.registerLazySingleton<OrdersProvider>(
    () => OrdersProvider(getIt<IOrderRepository>()),
  );

  getIt.registerLazySingleton<AddressesProvider>(
    () => AddressesProvider(getIt<IAddressRepository>()),
  );

  getIt.registerLazySingleton<ShopProvider>(
    () => ShopProvider(getIt<IShopRepository>()),
  );

  getIt.registerLazySingleton<LuckyWheelProvider>(
    () => LuckyWheelProvider(getIt<ILuckyWheelRepository>()),
  );
}

/// Reset all dependencies (for testing)
Future<void> resetDependencies() async {
  await getIt.reset();
}

/// Check if dependencies are registered
bool areDependenciesRegistered() {
  return getIt.isRegistered<IAuthRepository>();
}
