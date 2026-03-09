import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';

class _FaqCategory {
  final String title;
  final IconData icon;
  final Color color;
  final List<_FaqItem> items;

  const _FaqCategory({
    required this.title,
    required this.icon,
    required this.color,
    required this.items,
  });
}

class _FaqItem {
  final String question;
  final String answer;

  const _FaqItem({required this.question, required this.answer});
}

class FaqScreen extends StatefulWidget {
  const FaqScreen({super.key});

  @override
  State<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends State<FaqScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int _expandedCategoryIndex = -1;
  final Set<String> _expandedQuestions = {};

  static final List<_FaqCategory> _categories = [
    _FaqCategory(
      title: 'Buyurtma berish',
      icon: Iconsax.shopping_cart,
      color: AppColors.primary,
      items: [
        _FaqItem(
          question: 'Qanday qilib buyurtma beraman?',
          answer:
              '1. Kerakli mahsulotni tanlang va "Savatga qo\'shish" tugmasini bosing.\n'
              '2. Savatga o\'ting va buyurtma tarkibini tekshiring.\n'
              '3. "Buyurtma berish" tugmasini bosing.\n'
              '4. Yetkazib berish manzilini kiriting.\n'
              '5. To\'lov usulini tanlang va buyurtmani tasdiqlang.\n\n'
              'Buyurtma tasdiqlangandan so\'ng sizga SMS orqali bildirishnoma yuboriladi.',
        ),
        _FaqItem(
          question: 'Buyurtmani bekor qilsam bo\'ladimi?',
          answer: 'Ha, buyurtma holatiga qarab bekor qilish mumkin:\n\n'
              '• "Yangi" holatda — bepul bekor qilish mumkin.\n'
              '• "Tayyorlanmoqda" holatda — qo\'llab-quvvatlash xizmatiga murojaat qiling.\n'
              '• "Yo\'lda" holatda — bekor qilish imkoni yo\'q.\n\n'
              'Bekor qilish uchun: Profilim → Buyurtmalarim → Buyurtmani tanlang → "Bekor qilish".',
        ),
        _FaqItem(
          question: 'Minimal buyurtma summasi bormi?',
          answer:
              'Minimal buyurtma summasi yo\'q. Siz istalgan miqdordagi mahsulotni buyurtma qilishingiz mumkin. '
              'Lekin yetkazib berish narxi buyurtma summasiga qarab hisoblanadi.',
        ),
        _FaqItem(
          question: 'Buyurtma holatini qanday kuzataman?',
          answer:
              'Buyurtma holatini quyidagi usullar bilan kuzatishingiz mumkin:\n\n'
              '• Ilovada: Profilim → Buyurtmalarim\n'
              '• SMS orqali: Har bir holat o\'zgarganda SMS yuboriladi\n'
              '• Push-bildirishnoma orqali: Ilovada bildirishnomalarni yoqing',
        ),
      ],
    ),
    _FaqCategory(
      title: 'Yetkazib berish',
      icon: Iconsax.truck_fast,
      color: Colors.orange,
      items: [
        _FaqItem(
          question: 'Yetkazib berish qancha vaqt oladi?',
          answer: '• Toshkent shahri: 1-3 ish kuni\n'
              '• Viloyat markazlari: 2-5 ish kuni\n'
              '• Tuman va qishloqlar: 3-7 ish kuni\n\n'
              'Aniq muddat mahsulot turi va do\'kon joylashuviga bog\'liq. '
              'Buyurtma sahifasida taxminiy yetkazib berish sanasi ko\'rsatiladi.',
        ),
        _FaqItem(
          question: 'Yetkazib berish narxi qancha?',
          answer: 'Yetkazib berish narxi buyurtma summasiga qarab belgilanadi. '
              'Aniq narx buyurtma rasmiylashtirilayotganda ko\'rsatiladi.\n\n'
              'Ba\'zi aksiya va maxsus kunlarda yetkazib berish bepul bo\'lishi mumkin.',
        ),
        _FaqItem(
          question: 'Yetkazib berish manzilini o\'zgartira olamanmi?',
          answer:
              'Buyurtma "Yangi" holatida bo\'lsa, manzilni o\'zgartirishingiz mumkin. '
              'Buning uchun qo\'llab-quvvatlash xizmatiga yozing yoki buyurtmani bekor qilib, '
              'yangi manzilga qayta buyurtma bering.',
        ),
      ],
    ),
    _FaqCategory(
      title: 'To\'lov',
      icon: Iconsax.card,
      color: Colors.green,
      items: [
        _FaqItem(
          question: 'Qanday to\'lov usullari mavjud?',
          answer: 'Quyidagi to\'lov usullari qo\'llab-quvvatlanadi:\n\n'
              '• 💳 UzCard / Humo kartasi\n'
              '• 💰 Naqd pul (yetkazib berishda)\n\n'
              'To\'lov xavfsizligi kafolatlanadi.',
        ),
        _FaqItem(
          question: 'To\'lov xavfsizmi?',
          answer:
              'Ha, barcha to\'lovlar shifrlangan aloqa kanali orqali amalga oshiriladi. '
              'Sizning karta ma\'lumotlaringiz serverlarimizda saqlanmaydi. '
              'To\'lov tizimlari (Payme, Click) xavfsizlik sertifikatlariga ega.',
        ),
        _FaqItem(
          question: 'Pul qaytarilishi qancha vaqt oladi?',
          answer: 'Buyurtma bekor qilinganda yoki mahsulot qaytarilganda:\n\n'
              '• Karta orqali to\'langan bo\'lsa: 1-3 ish kuni ichida kartaga qaytariladi\n'
              '• Naqd to\'langan bo\'lsa: yetkazib beruvchi orqali qaytariladi\n\n'
              'Agar pul belgilangan muddatda qaytmasa, qo\'llab-quvvatlash xizmatiga murojaat qiling.',
        ),
      ],
    ),
    _FaqCategory(
      title: 'Qaytarish va almashtirish',
      icon: Iconsax.refresh,
      color: Colors.purple,
      items: [
        _FaqItem(
          question: 'Mahsulotni qaytarish mumkinmi?',
          answer:
              'Ha, mahsulotni qabul qilgan kundan boshlab 7 kun ichida qaytarishingiz mumkin.\n\n'
              'Qaytarish shartlari:\n'
              '• Mahsulot ishlatilmagan bo\'lishi kerak\n'
              '• Original qadoqda bo\'lishi kerak\n'
              '• Etiketka va yorliqlar saqlanishi kerak\n\n'
              'Qaytarish uchun: Profilim → Buyurtmalarim → Buyurtmani tanlang → "Qaytarish".',
        ),
        _FaqItem(
          question: 'Qaysi mahsulotlarni qaytarib bo\'lmaydi?',
          answer: 'Quyidagi mahsulotlarni qaytarib bo\'lmaydi:\n\n'
              '• Shaxsiy gigiena mahsulotlari\n'
              '• Ichki kiyimlar\n'
              '• Atir-upa mahsulotlari (ochilgan)\n'
              '• Oziq-ovqat mahsulotlari\n'
              '• Maxsus buyurtma asosida tayyorlangan mahsulotlar',
        ),
        _FaqItem(
          question: 'Nuqsonli mahsulot kelsa nima qilaman?',
          answer: 'Nuqsonli mahsulot olsangiz:\n\n'
              '1. Mahsulotni suratga oling\n'
              '2. Yordam chatiga yozing va suratni yuboring\n'
              '3. Biz 24 soat ichida javob beramiz\n\n'
              'Nuqsonli mahsulot uchun to\'liq qaytarish yoki almashtirish kafolatlanadi.',
        ),
      ],
    ),
    _FaqCategory(
      title: 'Hisob va xavfsizlik',
      icon: Iconsax.shield_tick,
      color: Colors.teal,
      items: [
        _FaqItem(
          question: 'Ro\'yxatdan qanday o\'taman?',
          answer: 'Ro\'yxatdan o\'tish juda oddiy:\n\n'
              '1. Ilovani oching\n'
              '2. Telefon raqamingizni kiriting\n'
              '3. SMS orqali kelgan kodni tasdiqlang\n'
              '4. Ism va familiyangizni kiriting\n\n'
              'Tayyor! Endi xarid qilishingiz mumkin.',
        ),
        _FaqItem(
          question: 'Telefon raqamimni o\'zgartira olamanmi?',
          answer:
              'Hozircha telefon raqamni ilova orqali o\'zgartirib bo\'lmaydi. '
              'Raqamni o\'zgartirish uchun qo\'llab-quvvatlash xizmatiga murojaat qiling.',
        ),
        _FaqItem(
          question: 'Shaxsiy ma\'lumotlarim xavfsizmi?',
          answer:
              'Ha, biz sizning shaxsiy ma\'lumotlaringizni himoya qilamiz:\n\n'
              '• Barcha ma\'lumotlar shifrlangan holda saqlanadi\n'
              '• Uchinchi tomonlarga ma\'lumot berilmaydi\n'
              '• Maxfiylik siyosatimiz O\'zbekiston qonunchiligiga mos\n\n'
              'Batafsil ma\'lumot uchun Maxfiylik siyosati sahifasini o\'qing.',
        ),
      ],
    ),
    _FaqCategory(
      title: 'Texnik savollar',
      icon: Iconsax.setting_2,
      color: Colors.blueGrey,
      items: [
        _FaqItem(
          question: 'Ilova ishlamayapti, nima qilaman?',
          answer: 'Quyidagi qadamlarni bajaring:\n\n'
              '1. Internetga ulanishni tekshiring\n'
              '2. Ilovani yopib, qayta oching\n'
              '3. Ilovani eng so\'nggi versiyaga yangilang\n'
              '4. Telefonni qayta ishga tushiring\n\n'
              'Muammo davom etsa, yordam chatiga yozing.',
        ),
        _FaqItem(
          question: 'Bildirishnomalarni qanday yoqaman?',
          answer: 'Bildirishnomalarni yoqish uchun:\n\n'
              '1. Telefon Sozlamalari → Ilovalar → TOPLA\n'
              '2. Bildirishnomalar → Ruxsat berish\n\n'
              'Shundan so\'ng buyurtma holati, aksiyalar va yangiliklar haqida bildirishnomalar olasiz.',
        ),
        _FaqItem(
          question: 'Ilova qaysi qurilmalarda ishlaydi?',
          answer: '• Android: 6.0 (Marshmallow) va undan yuqori\n'
              '• iOS: 13.0 va undan yuqori\n\n'
              'Ilovaning eng so\'nggi versiyasini Google Play yoki App Store\'dan yuklab olishingiz mumkin.',
        ),
      ],
    ),
  ];

  List<_FaqCategory> get _filteredCategories {
    if (_searchQuery.isEmpty) return _categories;

    final query = _searchQuery.toLowerCase();
    return _categories
        .map((cat) {
          final filteredItems = cat.items
              .where((item) =>
                  item.question.toLowerCase().contains(query) ||
                  item.answer.toLowerCase().contains(query))
              .toList();
          if (filteredItems.isEmpty) return null;
          return _FaqCategory(
            title: cat.title,
            icon: cat.icon,
            color: cat.color,
            items: filteredItems,
          );
        })
        .whereType<_FaqCategory>()
        .toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredCategories;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          'Ko\'p so\'raladigan savollar',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: Column(
        children: [
          // ── Search bar ──
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            color:
                Theme.of(context).appBarTheme.backgroundColor ?? Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
              decoration: InputDecoration(
                hintText: 'Savol qidirish...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon: Icon(Iconsax.search_normal,
                    color: Colors.grey.shade400, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey.shade100,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // ── Content ──
          Expanded(
            child: filtered.isEmpty
                ? _buildEmpty()
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) =>
                        _buildCategory(filtered[index], index),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Iconsax.search_status, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'Hech narsa topilmadi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Boshqa so\'z bilan qidirib ko\'ring',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }

  Widget _buildCategory(_FaqCategory category, int catIndex) {
    final isExpanded =
        _searchQuery.isNotEmpty || _expandedCategoryIndex == catIndex;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category header
          InkWell(
            onTap: _searchQuery.isEmpty
                ? () {
                    setState(() {
                      _expandedCategoryIndex =
                          _expandedCategoryIndex == catIndex ? -1 : catIndex;
                    });
                  }
                : null,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: category.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(category.icon, color: category.color, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      category.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Text(
                    '${category.items.length}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade400,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (_searchQuery.isEmpty)
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.grey.shade400,
                      ),
                    ),
                ],
              ),
            ),
          ),

          // FAQ items
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Container(
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                children: category.items.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final item = entry.value;
                  final key = '${category.title}_$idx';
                  final isOpen = _expandedQuestions.contains(key);

                  return Column(
                    children: [
                      if (idx > 0)
                        Divider(height: 1, color: Colors.grey.shade100),
                      InkWell(
                        onTap: () {
                          setState(() {
                            if (isOpen) {
                              _expandedQuestions.remove(key);
                            } else {
                              _expandedQuestions.add(key);
                            }
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(top: 2),
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: category.color.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(7),
                                ),
                                child: Center(
                                  child: Text(
                                    '${idx + 1}',
                                    style: TextStyle(
                                      color: category.color,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.question,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                        color: isOpen
                                            ? category.color
                                            : Colors.black87,
                                      ),
                                    ),
                                    if (isOpen) ...[
                                      const SizedBox(height: 10),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(14),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade50,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          item.answer,
                                          style: TextStyle(
                                            color: Colors.grey.shade700,
                                            fontSize: 13.5,
                                            height: 1.6,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: AnimatedRotation(
                                  turns: isOpen ? 0.5 : 0,
                                  duration: const Duration(milliseconds: 200),
                                  child: Icon(
                                    Icons.keyboard_arrow_down,
                                    size: 20,
                                    color: Colors.grey.shade400,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
            crossFadeState: isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 250),
          ),
        ],
      ),
    );
  }
}
