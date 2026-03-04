import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../models/shop_model.dart';
import '../../models/vendor_stats.dart';
import '../../services/vendor_service.dart';
import 'vendor_products_screen.dart';
import 'vendor_orders_screen.dart';
import 'vendor_payouts_screen.dart';
import 'vendor_analytics_screen.dart';
import 'vendor_commissions_screen.dart';
import 'vendor_documents_screen.dart';
import 'vendor_chats_screen.dart';
import 'vendor_reviews_screen.dart';
import 'vendor_returns_screen.dart';
import 'vendor_promo_codes_screen.dart';
import 'shop_settings_screen.dart';
import 'package:url_launcher/url_launcher.dart';

/// Vendor Dashboard ekrani
class VendorDashboardScreen extends StatefulWidget {
  const VendorDashboardScreen({super.key});

  @override
  State<VendorDashboardScreen> createState() => _VendorDashboardScreenState();
}

class _VendorDashboardScreenState extends State<VendorDashboardScreen> {
  ShopModel? _shop;
  VendorStatsModel? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final shop = await VendorService.getMyShop();
      setState(() => _shop = shop);

      if (shop != null) {
        final stats = await VendorService.getMyStats();
        setState(() => _stats = stats);
      }
    } catch (e) {
      debugPrint('Error loading data: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // Agar do'kon yo'q bo'lsa, saytga yo'naltirish
    if (_shop == null) {
      return _buildNoShopState();
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text(_shop!.name),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ShopSettingsScreen(shop: _shop!),
              ),
            ).then((_) => _loadData()),
            icon: const Icon(Iconsax.setting_2),
          ),
          IconButton(
            onPressed: _loadData,
            icon: const Icon(Iconsax.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Holat
              if (!_shop!.isVerified)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange),
                  ),
                  child: Row(
                    children: [
                      const Icon(Iconsax.warning_2, color: Colors.orange),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.translate('shop_not_verified_msg'),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.orange,
                              ),
                            ),
                            Text(
                              context.l10n.translate('admin_review_pending'),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // Balans
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withValues(alpha: 0.8)
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          context.l10n.translate('balance'),
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white24,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Iconsax.star,
                                size: 14,
                                color: Colors.yellow.shade600,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _stats?.formattedRating ?? '0.0',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _stats?.formattedBalance ??
                          '0 ${context.l10n.translate('currency')}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const VendorPayoutsScreen(),
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                      ),
                      child: Text(context.l10n.translate('withdraw')),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Bugungi statistika
              _buildSectionTitle(context.l10n.translate('today')),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      context.l10n.translate('orders'),
                      '${_stats?.todayOrders ?? 0}',
                      Iconsax.shopping_bag,
                      Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      context.l10n.translate('revenue'),
                      _stats?.formattedTodayRevenue ?? '0',
                      Iconsax.money,
                      Colors.green,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Mahsulotlar statistikasi
              _buildSectionTitle(context.l10n.translate('products')),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildProductStat(
                      context.l10n.translate('active'),
                      _stats?.activeProducts ?? 0,
                      Colors.green,
                    ),
                  ),
                  Expanded(
                    child: _buildProductStat(
                      context.l10n.translate('pending'),
                      _stats?.pendingProducts ?? 0,
                      Colors.orange,
                    ),
                  ),
                  Expanded(
                    child: _buildProductStat(
                      context.l10n.translate('rejected'),
                      _stats?.rejectedProducts ?? 0,
                      Colors.red,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Oylik statistika
              _buildSectionTitle(context.l10n.translate('this_month')),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    _buildStatRow(
                      context.l10n.translate('revenue'),
                      _stats?.formattedMonthlyRevenue ?? '0',
                      Iconsax.money,
                    ),
                    const Divider(),
                    _buildStatRow(
                      context.l10n.translate('orders'),
                      '${_stats?.monthlyOrders ?? 0} ${context.l10n.translate('pcs')}',
                      Iconsax.shopping_bag,
                    ),
                    const Divider(),
                    _buildStatRow(
                      '${context.l10n.translate('commission_label')} (${_shop?.commissionRate ?? 10}%)',
                      '${_stats?.monthlyCommission.toStringAsFixed(0) ?? 0} ${context.l10n.translate('currency')}',
                      Iconsax.percentage_circle,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Tezkor harakatlar
              _buildSectionTitle(context.l10n.translate('management')),
              const SizedBox(height: 12),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _buildActionCard(
                    context.l10n.translate('products'),
                    Iconsax.box,
                    Colors.blue,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorProductsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('orders'),
                    Iconsax.shopping_bag,
                    Colors.orange,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorOrdersScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('messages'),
                    Iconsax.message,
                    Colors.cyan,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorChatsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('payments'),
                    Iconsax.wallet,
                    Colors.green,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorPayoutsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('analytics'),
                    Iconsax.chart,
                    Colors.teal,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorAnalyticsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('commissions'),
                    Iconsax.percentage_circle,
                    Colors.pink,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorCommissionsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('reviews'),
                    Iconsax.star,
                    Colors.amber,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorReviewsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('returns'),
                    Iconsax.box_remove,
                    Colors.red.shade400,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorReturnsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('promo_codes'),
                    Iconsax.ticket_discount,
                    Colors.deepPurple,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorPromoCodesScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('documents'),
                    Iconsax.document_text,
                    Colors.indigo,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const VendorDocumentsScreen(),
                      ),
                    ),
                  ),
                  _buildActionCard(
                    context.l10n.translate('settings'),
                    Iconsax.setting_2,
                    Colors.purple,
                    () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ShopSettingsScreen(shop: _shop!),
                      ),
                    ).then((_) => _loadData()),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductStat(String label, int count, Color color) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoShopState() {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: Text(context.l10n.translate('shop')),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Iconsax.shop_add,
                  size: 48,
                  color: Colors.orange.shade600,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.l10n.translate('no_shop'),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                context.l10n.translate('no_shop_desc'),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    launchUrl(
                      Uri.parse('https://vendor.topla.uz/register'),
                      mode: LaunchMode.externalApplication,
                    );
                  },
                  icon: const Icon(Iconsax.global),
                  label: Text(context.l10n.translate('go_to_website')),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange.shade600,
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: const StadiumBorder(),
                    textStyle: const TextStyle(
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
}
