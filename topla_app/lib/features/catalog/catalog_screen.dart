import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../providers/providers.dart';
import '../../models/models.dart';
import '../../widgets/topla_refresh_indicator.dart';
import 'category_detail_screen.dart';

/// Uzum/Ozon uslubidagi Katalog sahifasi
/// Oddiy list ko'rinishi - chapda ikona, o'ngda strelka
class CatalogScreen extends StatefulWidget {
  final String? initialCategoryId;

  const CatalogScreen({
    super.key,
    this.initialCategoryId,
  });

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen>
    with AutomaticKeepAliveClientMixin {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Har doim kategoriyalarni yuklashga harakat qilish (agar bo'sh bo'lsa)
      final productsProvider = context.read<ProductsProvider>();
      if (productsProvider.categories.isEmpty &&
          !productsProvider.isCategoriesLoading) {
        productsProvider.loadCategories();
      }
      if (widget.initialCategoryId != null) {
        _navigateToCategory(widget.initialCategoryId!);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _navigateToCategory(String categoryId) {
    final productsProvider = context.read<ProductsProvider>();
    final categories = productsProvider.categories;

    // firstWhereOrNull ishlatish - null qaytaradi, exception tashlamaydi
    final category = categories.where((c) => c.id == categoryId).firstOrNull;

    if (category == null) {
      // Kategoriya topilmadi - foydalanuvchiga xabar berish
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Kategoriya topilmadi'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CategoryDetailScreen(
          category: category,
          categoryColor: AppColors.primary,
        ),
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Consumer<ProductsProvider>(
          builder: (context, productsProvider, _) {
            final categories = productsProvider.categories;

            if (productsProvider.isCategoriesLoading) {
              return _buildLoadingState();
            }

            if (categories.isEmpty) {
              return _buildEmptyState();
            }

            return Column(
              children: [
                // Categories list
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    padding: EdgeInsets.zero,
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final category = categories[index];
                      return _buildCategoryItem(category, index);
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildCategoryItem(CategoryModel category, int index) {
    final icon = _getCategoryIcon(category.icon);
    final categories = context.read<ProductsProvider>().categories;

    return Column(
      children: [
        InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CategoryDetailScreen(
                  category: category,
                  categoryColor: AppColors.primary,
                ),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // Icon
                Icon(
                  icon,
                  size: 24,
                  color: Colors.black87,
                ),
                const SizedBox(width: 16),

                // Category name
                Expanded(
                  child: Text(
                    category.getName(context.l10n.locale.languageCode),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                  ),
                ),

                // Arrow
                Icon(
                  Icons.chevron_right,
                  size: 24,
                  color: Colors.grey.shade400,
                ),
              ],
            ),
          ),
        ),
        // Divider
        if (index < categories.length - 1) // Don't show divider after last item
          Padding(
            padding: const EdgeInsets.only(left: 56),
            child: Container(
              height: 1,
              color: Colors.grey.shade200,
            ),
          ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation(AppColors.primary),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            context.l10n.locale.languageCode == 'ru'
                ? 'Загрузка...'
                : 'Yuklanmoqda...',
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.box_1, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            context.l10n.locale.languageCode == 'ru'
                ? 'Категории не найдены'
                : 'Kategoriyalar topilmadi',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              context.read<ProductsProvider>().loadCategories();
            },
            icon: const Icon(Iconsax.refresh),
            label: Text(
              context.l10n.locale.languageCode == 'ru'
                  ? 'Обновить'
                  : 'Yangilash',
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String? iconName) {
    switch (iconName) {
      // 1. Elektronika - telefon
      case 'mobile':
        return Icons.phone_android_outlined;

      // 2. Noutbuklar - monitor
      case 'monitor':
        return Icons.laptop_mac_outlined;

      // 3. Maishiy texnika - blender
      case 'blend_2':
        return Icons.kitchen_outlined;

      // 4. TV - televizor
      case 'screenmirroring':
        return Icons.tv_outlined;

      // 5. Kiyim - kiyim belgisi
      case 'shirt':
        return Icons.checkroom_outlined;

      // 6. Sumkalar - sumka
      case 'bag_2':
        return Icons.shopping_bag_outlined;

      // 7. Zargarlik - olmos
      case 'diamonds':
        return Icons.diamond_outlined;

      // 8. Go'zallik - yulduz
      case 'magic_star':
        return Icons.auto_awesome_outlined;

      // 9. Parfyumeriya - tomchi
      case 'drop':
        return Icons.water_drop_outlined;

      // 10. Gigiena - cho'tka
      case 'brush_1':
        return Icons.brush_outlined;

      // 11. Dorixona - salomatlik
      case 'health':
        return Icons.local_pharmacy_outlined;

      // 12. Uy - uy
      case 'home_2':
        return Icons.home_outlined;

      // 13. Mebel - chiroq
      case 'lamp_charge':
        return Icons.chair_outlined;

      // 14. Qurilish - chizg'ich
      case 'ruler':
        return Icons.construction_outlined;

      // 15. Uy kimyoviy - quti
      case 'box_1':
        return Icons.inventory_2_outlined;

      // 16. Bolalar - bolalar
      case 'happyemoji':
        return Icons.child_care_outlined;

      // 17. O'yinchoqlar - o'yin
      case 'game':
        return Icons.toys_outlined;

      // 18. Maktab - qalam
      case 'pen_tool':
        return Icons.edit_outlined;

      // 19. Oziq-ovqat - sut
      case 'milk':
        return Icons.local_grocery_store_outlined;

      // 20. Shirinliklar - tort
      case 'cake':
        return Icons.cake_outlined;

      // 21. Ichimliklar - stakan
      case 'cup':
        return Icons.local_cafe_outlined;

      // 22. Avtomobil - mashina
      case 'car':
        return Icons.directions_car_outlined;

      // 23. Sport - og'irlik
      case 'weight_1':
        return Icons.fitness_center_outlined;

      // 24. O'yin konsol - o'yin qurilmasi
      case 'driver':
        return Icons.sports_esports_outlined;

      // 25. Kitoblar - kitob
      case 'book':
        return Icons.menu_book_outlined;

      // 26. Xobbi - rang
      case 'colorfilter':
        return Icons.palette_outlined;

      // 27. Uy hayvonlari - hayvon
      case 'pet':
        return Icons.pets_outlined;

      // 29. Bog' va tomorqa - daraxt
      case 'tree':
        return Icons.park_outlined;

      // 30. Sovg'alar - sovg'a
      case 'gift':
        return Icons.card_giftcard_outlined;

      // Subkategoriyalar uchun qo'shimcha ikonlar
      case 'cpu':
        return Icons.memory_outlined;
      case 'monitor_mobbile':
        return Icons.laptop_outlined;
      case 'headphone':
        return Icons.headphones_outlined;
      case 'watch':
        return Icons.watch_outlined;
      case 'battery_charging':
        return Icons.battery_charging_full_outlined;
      case 'keyboard':
        return Icons.keyboard_outlined;
      case 'mouse':
        return Icons.mouse_outlined;
      case 'coffee':
        return Icons.coffee_outlined;
      case 'book_1':
        return Icons.book_outlined;
      case 'crown_1':
        return Icons.workspace_premium_outlined;
      case 'tag':
        return Icons.sell_outlined;
      case 'man':
        return Icons.man_outlined;
      case 'woman':
        return Icons.woman_outlined;
      case 'wallet':
        return Icons.wallet_outlined;

      default:
        return Icons.category_outlined;
    }
  }
}
