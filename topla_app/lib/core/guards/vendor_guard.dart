import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../localization/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_role.dart';

/// Vendor Guard - Faqat vendor kirishiga ruxsat
/// Agar vendor emas - do'kon ochish sahifasiga yo'naltiradi
class VendorGuard extends StatelessWidget {
  final Widget child;
  final bool redirectToCreateShop;

  const VendorGuard({
    super.key,
    required this.child,
    this.redirectToCreateShop = true,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (!authProvider.isLoggedIn) {
          return _buildNotLoggedIn(context);
        }

        final user = authProvider.profile;
        final isVendor = user?.role == UserRole.vendor;

        if (!isVendor) {
          if (redirectToCreateShop) {
            return _buildNotVendor(context);
          }
          return _buildNotVendor(context);
        }

        return child;
      },
    );
  }

  Widget _buildNotLoggedIn(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('login_to_system')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.person_off_outlined,
                  size: 50,
                  color: Colors.grey.shade400,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.l10n.translate('login_to_system'),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                context.l10n.translate('login_for_vendor_panel'),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/auth'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(context.l10n.translate('login')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotVendor(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.translate('become_vendor')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.store_outlined,
                  size: 50,
                  color: Colors.blue.shade400,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.l10n.translate('open_shop_title'),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                context.l10n.translate('open_shop_to_sell'),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    launchUrl(
                      Uri.parse('https://vendor.topla.uz/register'),
                      mode: LaunchMode.externalApplication,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                  ),
                  child: Text(context.l10n.translate('open_shop')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Vendor route helper - navigation uchun
class VendorRouteGuard {
  static Future<T?> push<T>(
    BuildContext context,
    Widget screen, {
    bool redirectToCreateShop = true,
  }) async {
    final authProvider = context.read<AuthProvider>();

    if (!authProvider.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('login_first')),
          backgroundColor: Colors.orange,
        ),
      );
      Navigator.pushNamed(context, '/auth');
      return null;
    }

    final isVendor = authProvider.profile?.role == UserRole.vendor;

    if (!isVendor && redirectToCreateShop) {
      launchUrl(
        Uri.parse('https://vendor.topla.uz/register'),
        mode: LaunchMode.externalApplication,
      );
      return null;
    }

    if (!isVendor) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.translate('vendor_permission_needed')),
          backgroundColor: Colors.red,
        ),
      );
      return null;
    }

    return Navigator.push<T>(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }
}
