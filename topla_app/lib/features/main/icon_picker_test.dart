import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

/// Vaqtinchalik test sahifasi — ikonlarni tanlash uchun
class IconPickerTest extends StatelessWidget {
  const IconPickerTest({super.key});

  @override
  Widget build(BuildContext context) {
    const blue = Color(0xFF3B82F6);
    const black = Colors.black;

    final iconSets = <String, List<List<dynamic>>>{
      'Asosiy (Home)': [
        [Iconsax.home, 'home'],
        [Iconsax.home_1, 'home_1'],
        [Iconsax.home_2, 'home_2'],
        [Iconsax.home_copy, 'home_copy'],
        [Iconsax.home_1_copy, 'home_1_copy'],
        [Iconsax.home_2_copy, 'home_2_copy'],
        [Iconsax.home_hashtag, 'home_hashtag'],
        [Iconsax.home_trend_up, 'home_trend_up'],
        [Iconsax.home_wifi, 'home_wifi'],
        [Icons.home_outlined, 'M:home_outlined'],
        [Icons.home_rounded, 'M:home_rounded'],
        [Icons.home_filled, 'M:home_filled'],
        [Icons.cottage_outlined, 'M:cottage_out'],
        [Icons.cottage_rounded, 'M:cottage'],
      ],
      'Katalog (Category)': [
        [Iconsax.category, 'category'],
        [Iconsax.category_copy, 'category_copy'],
        [Iconsax.category_2, 'category_2'],
        [Iconsax.category_2_copy, 'category_2_copy'],
        [Iconsax.element_3, 'element_3'],
        [Iconsax.element_3_copy, 'element_3_copy'],
        [Iconsax.element_4, 'element_4'],
        [Iconsax.element_4_copy, 'element_4_copy'],
        [Icons.grid_view_rounded, 'M:grid_view'],
        [Icons.grid_view_outlined, 'M:grid_out'],
        [Icons.apps_rounded, 'M:apps'],
        [Icons.dashboard_outlined, 'M:dashboard_out'],
        [Icons.dashboard_rounded, 'M:dashboard'],
      ],
      'Savat (Cart/Bag)': [
        [Iconsax.bag, 'bag'],
        [Iconsax.bag_copy, 'bag_copy'],
        [Iconsax.bag_2, 'bag_2'],
        [Iconsax.bag_2_copy, 'bag_2_copy'],
        [Iconsax.shopping_bag, 'shopping_bag'],
        [Iconsax.shopping_bag_copy, 'shopping_bag_copy'],
        [Iconsax.shopping_cart, 'shopping_cart'],
        [Iconsax.shopping_cart_copy, 'shopping_cart_copy'],
        [Icons.shopping_bag_outlined, 'M:bag_out'],
        [Icons.shopping_bag_rounded, 'M:bag'],
        [Icons.shopping_cart_outlined, 'M:cart_out'],
        [Icons.shopping_cart_rounded, 'M:cart'],
      ],
      'Buyurtmalar (Orders)': [
        [Iconsax.note, 'note'],
        [Iconsax.note_copy, 'note_copy'],
        [Iconsax.note_2, 'note_2'],
        [Iconsax.note_2_copy, 'note_2_copy'],
        [Iconsax.receipt, 'receipt'],
        [Iconsax.receipt_copy, 'receipt_copy'],
        [Iconsax.receipt_2, 'receipt_2'],
        [Iconsax.receipt_2_copy, 'receipt_2_copy'],
        [Iconsax.clipboard_text, 'clipboard_text'],
        [Iconsax.clipboard_text_copy, 'clipboard_txt_copy'],
        [Iconsax.document_text, 'document_text'],
        [Iconsax.document_text_copy, 'document_text_copy'],
        [Icons.receipt_long_outlined, 'M:receipt_out'],
        [Icons.receipt_long_rounded, 'M:receipt'],
      ],
      'Profil (Profile)': [
        [Iconsax.profile_circle, 'profile_circle'],
        [Iconsax.profile_circle_copy, 'profile_circle_copy'],
        [Iconsax.user, 'user'],
        [Iconsax.user_copy, 'user_copy'],
        [Iconsax.personalcard, 'personalcard'],
        [Iconsax.personalcard_copy, 'personalcard_copy'],
        [Icons.person_outline_rounded, 'M:person_out'],
        [Icons.person_rounded, 'M:person'],
        [Icons.account_circle_outlined, 'M:account_out'],
        [Icons.account_circle_rounded, 'M:account'],
      ],
    };

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Ikon tanlash', style: TextStyle(fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: iconSets.entries.map((entry) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                entry.key,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              // Row 1: Active (blue)
              Row(
                children: [
                  SizedBox(
                    width: 50,
                    child: Text('Faol',
                        style: TextStyle(
                            fontSize: 10, color: Colors.grey.shade500)),
                  ),
                  ...entry.value.map((item) {
                    return Padding(
                      padding: const EdgeInsets.all(6),
                      child: Column(
                        children: [
                          Icon(item[0] as IconData, size: 26, color: blue),
                        ],
                      ),
                    );
                  }),
                ],
              ),
              // Row 2: Inactive (black)
              Row(
                children: [
                  SizedBox(
                    width: 50,
                    child: Text('Nofoal',
                        style: TextStyle(
                            fontSize: 10, color: Colors.grey.shade500)),
                  ),
                  ...entry.value.map((item) {
                    return Padding(
                      padding: const EdgeInsets.all(6),
                      child: Column(
                        children: [
                          Icon(item[0] as IconData, size: 26, color: black),
                        ],
                      ),
                    );
                  }),
                ],
              ),
              // Row 3: Labels
              Row(
                children: [
                  const SizedBox(width: 50),
                  ...entry.value.map((item) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: SizedBox(
                        width: 26,
                        child: Text(
                          '${entry.value.indexOf(item) + 1}',
                          style: TextStyle(
                              fontSize: 9, color: Colors.grey.shade400),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    );
                  }),
                ],
              ),
              const SizedBox(height: 4),
              // Names row
              Wrap(
                children: entry.value.asMap().entries.map((e) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8, bottom: 2),
                    child: Text(
                      '${e.key + 1}: ${e.value[1]}',
                      style:
                          TextStyle(fontSize: 9, color: Colors.grey.shade500),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              Divider(color: Colors.grey.shade200),
              const SizedBox(height: 12),
            ],
          );
        }).toList(),
      ),
    );
  }
}
