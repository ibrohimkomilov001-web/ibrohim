import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          'Maxfiylik siyosati',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        leading: IconButton(
          icon: const Icon(Iconsax.arrow_left),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.primary,
                    AppColors.primary.withValues(alpha: 0.8),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Iconsax.shield_tick,
                        color: Colors.white,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Maxfiylik Siyosati',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Kuchga kirgan sana: 25 fevral 2026-yil',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            _section('1. Kirish',
                'Ushbu Maxfiylik siyosati TOPLA mobil ilovasi ("Ilova") foydalanuvchilarining shaxsiy ma\u2018lumotlarini qanday yig\u2018ishi, ishlatishi, saqlashi va himoya qilishini tushuntiradi.\n\n'
                'Ilovadan foydalanish orqali Siz ushbu siyosatga roziligingizni tasdiqlaysiz.\n\n'
                'TOPLA O\u2018zbekiston Respublikasi "Shaxsga doir ma\u2018lumotlar to\u2018g\u2018risida"gi qonuniga muvofiq faoliyat yuritadi.'),

            _section('2. Yig\u2018iladigan ma\u2018lumotlar',
                '2.1. Siz taqdim etadigan ma\u2018lumotlar:\n'
                '  \u2022 Telefon raqami (ro\u2018yxatdan o\u2018tish uchun)\n'
                '  \u2022 Ism va familiya\n'
                '  \u2022 Yetkazib berish manzillari\n'
                '  \u2022 Profil rasmi (ixtiyoriy)\n\n'
                '2.2. Avtomatik yig\u2018iladigan ma\u2018lumotlar:\n'
                '  \u2022 Qurilma turi va modeli\n'
                '  \u2022 Operatsion tizim versiyasi\n'
                '  \u2022 IP manzil\n'
                '  \u2022 Ilova versiyasi\n'
                '  \u2022 Geolokatsiya (faqat ruxsat berilganda, yetkazib berish maqsadida)\n\n'
                '2.3. Tranzaksiya ma\u2018lumotlari:\n'
                '  \u2022 Buyurtma tarixi\n'
                '  \u2022 To\u2018lov usuli (karta raqamining faqat oxirgi 4 raqami)\n'
                '  \u2022 Sevimli mahsulotlar va savat tarixi\n\n'
                'MUHIM: Biz to\u2018liq karta raqamlarini saqlamaymiz. Barcha to\u2018lovlar xavfsiz kanal orqali amalga oshiriladi.'),

            _section('3. Ma\u2018lumotlardan foydalanish maqsadlari',
                'Sizning ma\u2018lumotlaringiz quyidagi maqsadlarda ishlatiladi:\n\n'
                '  \u2022 Buyurtmalarni qayta ishlash va yetkazib berish\n'
                '  \u2022 Hisob qaydnomasini yaratish va boshqarish\n'
                '  \u2022 Mijozlarga xizmat ko\u2018rsatish va yordam\n'
                '  \u2022 Ilova xavfsizligini ta\u2018minlash\n'
                '  \u2022 Xizmat sifatini yaxshilash va personalizatsiya\n'
                '  \u2022 Yangiliklar va aksiyalar haqida xabar berish (faqat roziligingiz bilan)\n'
                '  \u2022 Firibgarlikni aniqlash va oldini olish\n'
                '  \u2022 Qonuniy talablarni bajarish\n\n'
                'Siz istalgan vaqtda marketing xabarlaridan voz kechishingiz mumkin.'),

            _section('4. Ma\u2018lumotlarni uchinchi tomonlar bilan ulashish',
                'Ma\u2018lumotlaringiz quyidagi tomonlar bilan ulashilishi mumkin:\n\n'
                'SOTUVCHILAR (Vendorlar):\n'
                'Buyurtmangizni bajarish uchun zarur bo\u2018lgan ma\u2018lumotlar (ism, telefon, manzil).\n\n'
                'YETKAZIB BERISH XIZMATI:\n'
                'Kuryer buyurtmani yetkazib berish uchun manzilingiz va aloqa ma\u2018lumotlaringizni oladi.\n\n'
                'TO\u2018LOV PROVAYDERLARI:\n'
                'To\u2018lovlarni xavfsiz qayta ishlash uchun. To\u2018lov ma\u2018lumotlari shifrlangan holda uzatiladi.\n\n'
                'ANALITIKA XIZMATLARI:\n'
                'Firebase Analytics \u2014 faqat anonim va yig\u2018ma statistik ma\u2018lumotlar.\n\n'
                'Biz sizning ma\u2018lumotlaringizni hech qachon uchinchi tomonlarga sotmaymiz yoki ijaraga bermaymiz.'),

            _section('5. Ma\u2018lumotlar xavfsizligi',
                'Sizning ma\u2018lumotlaringizni himoya qilish uchun quyidagi choralar ko\u2018rilgan:\n\n'
                'Texnik choralar:\n'
                '  \u2022 SSL/TLS shifrlash (barcha ma\u2018lumotlar shifrlangan holda uzatiladi)\n'
                '  \u2022 Xavfsiz serverlar\n'
                '  \u2022 Ma\u2018lumotlar bazasi shifrlash\n'
                '  \u2022 Muntazam xavfsizlik tekshiruvlari\n\n'
                'Tashkiliy choralar:\n'
                '  \u2022 Ma\u2018lumotlarga kirish cheklangan\n'
                '  \u2022 Xodimlar maxfiylik bo\u2018yicha o\u2018qitilgan\n\n'
                'To\u2018lov xavfsizligi:\n'
                '  \u2022 To\u2018liq karta raqamlari saqlanmaydi\n'
                '  \u2022 Tokenizatsiya texnologiyasi qo\u2018llaniladi'),

            _section('6. Ma\u2018lumotlarni saqlash muddati',
                '  \u2022 Hisob ma\u2018lumotlari \u2014 hisob faol bo\u2018lguncha\n'
                '  \u2022 Buyurtma tarixi \u2014 3 yil (soliq qonunchiligiga muvofiq)\n'
                '  \u2022 To\u2018lov yozuvlari \u2014 3 yil\n'
                '  \u2022 Texnik loglar \u2014 90 kun\n'
                '  \u2022 Faoliyatsiz hisob \u2014 2 yildan so\u2018ng o\u2018chirilishi mumkin\n\n'
                'Siz istalgan vaqtda ma\u2018lumotlaringizni o\u2018chirishni so\u2018rashingiz mumkin.'),

            _section('7. Sizning huquqlaringiz',
                'O\u2018zbekiston qonunchiligiga muvofiq sizda quyidagi huquqlar mavjud:\n\n'
                'Kirish huquqi \u2014 ma\u2018lumotlaringiz qanday ishlatilayotganini bilish.\n\n'
                'Tuzatish huquqi \u2014 noto\u2018g\u2018ri ma\u2018lumotlarni tuzattirish.\n\n'
                'O\u2018chirish huquqi \u2014 ma\u2018lumotlaringizni o\u2018chirishni so\u2018rash.\n\n'
                'Cheklash huquqi \u2014 ma\u2018lumotlardan foydalanishni cheklash.\n\n'
                'E\u2018tiroz huquqi \u2014 marketing xabarlaridan voz kechish.\n\n'
                'Huquqlaringizdan foydalanish uchun ilova ichidagi yordam chatiga yozing yoki +998 95 000 94 16 ga qo\u2018ng\u2018iroq qiling.'),

            _section('8. Geolokatsiya ma\u2018lumotlari',
                '8.1. Ilova joylashuv ma\u2018lumotlarini faqat Siz ruxsat berganingizda oladi.\n\n'
                '8.2. Geolokatsiya faqat quyidagi maqsadlarda ishlatiladi:\n'
                '  \u2022 Yetkazib berish manzilini aniqlash\n'
                '  \u2022 Yaqin atrofdagi topshirish punktlarini ko\u2018rsatish\n\n'
                '8.3. Siz qurilma sozlamalarida geolokatsiya ruxsatini istalgan vaqtda o\u2018chirishingiz mumkin.'),

            _section('9. Push-bildirishnomalar',
                '9.1. Ilova buyurtma holati va boshqa xabarlar uchun push-bildirishnomalar yuborishi mumkin.\n\n'
                '9.2. Siz qurilma sozlamalarida bildirishnomalarni istalgan vaqtda o\u2018chirishingiz mumkin.\n\n'
                '9.3. Marketing bildirishnomalari faqat roziligingiz bilan yuboriladi.'),

            _section('10. Bolalar maxfiyligi',
                'TOPLA ilovasi 16 yoshdan kichik shaxslarga mo\u2018ljallanmagan.\n\n'
                'Biz ataylab 16 yoshgacha bo\u2018lgan shaxslarning shaxsiy ma\u2018lumotlarini yig\u2018maymiz.\n\n'
                'Agar 16 yoshgacha bo\u2018lgan shaxsning ma\u2018lumotlari topilsa, ular darhol o\u2018chiriladi.'),

            _section('11. Siyosatni o\u2018zgartirish',
                '11.1. Biz ushbu Maxfiylik siyosatini istalgan vaqtda yangilashimiz mumkin.\n\n'
                '11.2. Muhim o\u2018zgarishlar haqida ilova orqali bildirishnoma yuboriladi.\n\n'
                '11.3. Yangilangan sana sahifa boshida ko\u2018rsatiladi.'),

            _section('12. Bog\u2018lanish',
                'Maxfiylik savollaringiz uchun:\n\n'
                'Telefon: +998 95 000 94 16\n'
                'Ish vaqti: Dushanba \u2014 Shanba, 09:00 \u2014 21:00\n\n'
                'Ilova ichidagi "Yordam" bo\u2018limida chat orqali ham murojaat qilishingiz mumkin.'),

            const SizedBox(height: 16),

            // Security badge
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.success.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.shield_tick, color: AppColors.success, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Ma\u2018lumotlaringiz xavfsiz',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Biz shaxsiy ma\u2018lumotlaringizni himoya qilish uchun zamonaviy texnologiyalardan foydalanamiz.',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              content,
              style: TextStyle(
                fontSize: 14,
                height: 1.6,
                color: Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
