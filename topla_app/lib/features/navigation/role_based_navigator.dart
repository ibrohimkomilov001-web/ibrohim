import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/providers.dart';
import '../main/main_screen.dart';

/// Foydalanuvchi roliga qarab navigatsiya
class RoleBasedNavigator extends StatelessWidget {
  const RoleBasedNavigator({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        // Profil hali yuklanmagan bo'lsa - loading ko'rsatish
        if (authProvider.isLoggedIn &&
            authProvider.profile == null &&
            authProvider.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Oddiy foydalanuvchi va Admin - asosiy ekran
        // Admin uchun web panel ishlatiladi
        return const MainScreen();
      },
    );
  }
}
