import 'package:flutter/material.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import '../../core/constants/constants.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text(
          'Foydalanish shartlari',
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
                  const Text(
                    'TOPLA Foydalanish Shartlari',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
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

            _section('1. Umumiy qoidalar',
                '1.1. Ushbu Foydalanish shartlari ("Shartlar") TOPLA mobil ilovasi ("Ilova") va uning xizmatlaridan foydalanish tartibini belgilaydi.\n\n'
                '1.2. Ilova operatori \u2014 "TOPLA" yakka tartibdagi tadbirkor, O\u2018zbekiston Respublikasi qonunchiligiga muvofiq faoliyat yuritadi.\n\n'
                '1.3. Ilovani yuklab olish, o\u2018rnatish yoki undan foydalanish orqali Siz ushbu Shartlarni to\u2018liq o\u2018qib chiqqaningizni va ularga roziligingizni tasdiqlaysiz.\n\n'
                '1.4. Agar Siz ushbu Shartlarga rozi bo\u2018lmasangiz, Ilovadan foydalanishni to\u2018xtatishingiz lozim.'),

            _section('2. Xizmatlar tavsifi',
                '2.1. TOPLA \u2014 bu multi-vendor marketplace platformasi bo\u2018lib, foydalanuvchilarga turli do\u2018konlardan mahsulotlarni bitta ilovada xarid qilish imkonini beradi.\n\n'
                '2.2. Ilova orqali taqdim etiladigan xizmatlar:\n'
                '  \u2022 Mahsulotlarni ko\u2018rish, qidirish va xarid qilish\n'
                '  \u2022 Buyurtmalarni yetkazib berish yoki topshirish punktlaridan olish\n'
                '  \u2022 Onlayn to\u2018lov (naqd pul, UzCard, HUMO)\n'
                '  \u2022 Buyurtma holatini kuzatish\n'
                '  \u2022 Yordam xizmati bilan muloqot\n\n'
                '2.3. TOPLA platformada sotuvchilar (vendorlar) tomonidan joylashtiriladigan mahsulotlar va ularning sifati uchun vositachi sifatida xizmat qiladi.'),

            _section('3. Ro\u2018yxatdan o\u2018tish va hisob',
                '3.1. Ilovadan to\u2018liq foydalanish uchun telefon raqamingiz yoki Google hisobingiz orqali ro\u2018yxatdan o\u2018tishingiz talab etiladi.\n\n'
                '3.2. Ro\u2018yxatdan o\u2018tish 16 yoshdan katta shaxslar uchun ruxsat etiladi. 18 yoshgacha bo\u2018lgan foydalanuvchilar ota-onalar roziligiga ega bo\u2018lishi kerak.\n\n'
                '3.3. Siz taqdim etgan ma\u2018lumotlarning to\u2018g\u2018riligiga o\u2018zingiz javobgarsiz.\n\n'
                '3.4. Hisobingiz xavfsizligini ta\u2018minlash \u2014 sizning mas\u2018uliyatingiz. PIN-kod, parol va SMS tasdiqlash kodlarini boshqa shaxslarga bermang.\n\n'
                '3.5. Bitta shaxs faqat bitta hisob qaydnomasiga ega bo\u2018lishi mumkin.\n\n'
                '3.6. Biz quyidagi hollarda hisobingizni to\u2018xtatish yoki o\u2018chirish huquqini saqlab qolamiz:\n'
                '  \u2022 Ushbu Shartlarni buzganingizda\n'
                '  \u2022 Firibgarlik yoki aldov faoliyatida\n'
                '  \u2022 Qonunga zid harakatlar amalga oshirilganda'),

            _section('4. Buyurtma berish',
                '4.1. Mahsulotni savatga qo\u2018shish va buyurtma tasdiqlash orqali Siz ko\u2018rsatilgan narxda xarid qilishga rozlik bildirasiz.\n\n'
                '4.2. Buyurtma berilgandan so\u2018ng tizim tomonidan avtomatik tasdiqlanadi.\n\n'
                '4.3. Narxlar O\u2018zbekiston so\u2018mida ko\u2018rsatiladi. Narxlarga sotuvchi tomonidan belgilangan barcha soliqlar kiritilgan.\n\n'
                '4.4. TOPLA tovar narxlarini mustaqil ravishda belgilamaydi \u2014 narxlarni sotuvchilar (vendorlar) belgilaydi.\n\n'
                '4.5. Buyurtmani bekor qilish shartlari:\n'
                '  \u2022 Yetkazib berishdan oldin \u2014 buyurtma to\u2018liq bekor qilinadi\n'
                '  \u2022 Yetkazib berish jarayonida \u2014 yetkazib berish xarajatlari ushlab qolinishi mumkin'),

            _section('5. To\u2018lov shartlari',
                '5.1. To\u2018lov usullari:\n'
                '  \u2022 Naqd pul (yetkazib berish yoki olish vaqtida)\n'
                '  \u2022 UzCard / HUMO plastik kartalari\n\n'
                '5.2. Onlayn to\u2018lovlar xavfsiz kanal orqali amalga oshiriladi. TOPLA to\u2018liq karta raqamlarini saqlamaydi.\n\n'
                '5.3. To\u2018lov muvaffaqiyatli amalga oshirilgandan so\u2018ng buyurtma qayta ishlanadi.'),

            _section('6. Yetkazib berish va topshirish',
                '6.1. Yetkazib berish Nukus shahri va atrofida amalga oshiriladi.\n\n'
                '6.2. Yetkazib berish muddati buyurtma berishda ko\u2018rsatiladi va odatda 1-3 ish kunini tashkil etadi.\n\n'
                '6.3. Buyurtmalarni topshirish punktlaridan (Pickup Point) olish imkoniyati mavjud.\n\n'
                '6.4. Buyurtmachi ko\u2018rsatilgan manzilda yoki topshirish punktida o\u2018z vaqtida bo\u2018lishi kerak.\n\n'
                '6.5. Mahsulotni qabul qilishda uning yaxlitligini tekshiring. Shikastlangan yoki noto\u2018g\u2018ri mahsulot haqida darhol xabar bering.'),

            _section('7. Qaytarish va almashtirish',
                '7.1. Mahsulotlarni qabul qilganingizdan keyin 14 kun ichida qaytarishingiz mumkin (O\u2018zbekiston Iste\u2018molchilar huquqlarini himoya qilish to\u2018g\u2018risidagi qonuniga asosan).\n\n'
                '7.2. Qaytarish shartlari:\n'
                '  \u2022 Mahsulot foydalanilmagan va original qadoqda bo\u2018lishi kerak\n'
                '  \u2022 Buyurtma raqami yoki chek taqdim etilishi kerak\n\n'
                '7.3. Qaytarib bo\u2018lmaydigan mahsulotlar:\n'
                '  \u2022 Shaxsiy gigiena vositalari\n'
                '  \u2022 Ochilgan kosmetika mahsulotlari\n'
                '  \u2022 Maxsus buyurtma qilingan mahsulotlar\n\n'
                '7.4. Qaytarish so\u2018rovi ilova orqali yoki yordam xizmatiga murojaat qilish orqali amalga oshiriladi.\n\n'
                '7.5. Pul mablag\u2018lari 3-5 ish kunida qaytariladi.'),

            _section('8. Sotuvchilar (Vendorlar)',
                '8.1. TOPLA platformasida mustaqil sotuvchilar o\u2018z mahsulotlarini sotishadi.\n\n'
                '8.2. Har bir mahsulot sifati, tavsifi va muvofiqligi uchun tegishli sotuvchi javobgardir.\n\n'
                '8.3. TOPLA sotuvchilarni platformaga qo\u2018shishdan oldin tekshiradi, ammo har bir alohida mahsulot sifatiga kafolat bermaydi.\n\n'
                '8.4. Sotuvchi bilan bog\u2018liq muammolar yuzaga kelsa, TOPLA yordam xizmatiga murojaat qiling \u2014 biz vositachi sifatida muammoni hal qilishga yordam beramiz.'),

            _section('9. Intellektual mulk',
                '9.1. Ilovadagi barcha kontent, dizayn, logotiplar, dasturiy ta\u2018minot va texnologiyalar TOPLA intellektual mulki hisoblanadi.\n\n'
                '9.2. Ilovadagi kontentni ruxsatsiz nusxalash, tarqatish, o\u2018zgartirish yoki tijorat maqsadlarida foydalanish taqiqlanadi.\n\n'
                '9.3. Sotuvchilar tomonidan joylashtirilgan mahsulot rasmlari va ma\u2018lumotlar uchun tegishli sotuvchilar javobgardir.'),

            _section('10. Foydalanuvchi majburiyatlari',
                'Ilovadan foydalanishda Siz:\n'
                '  \u2022 O\u2018zbekiston Respublikasi qonunchiligiga rioya qilishga\n'
                '  \u2022 To\u2018g\u2018ri va aniq ma\u2018lumotlar kiritishga\n'
                '  \u2022 Boshqa foydalanuvchilar huquqlarini hurmat qilishga\n'
                '  \u2022 Soxta buyurtmalar bermaslikka\n'
                '  \u2022 Ilovani buzish yoki noto\u2018g\u2018ri foydalanmaslikka\n'
                '  \u2022 Hisobingiz xavfsizligini ta\u2018minlashga\nmajbursiz.'),

            _section('11. Javobgarlikni cheklash',
                '11.1. TOPLA quyidagilar uchun javobgar emas:\n'
                '  \u2022 Sotuvchilar tomonidan taqdim etilgan mahsulot sifati va mos kelmasligi\n'
                '  \u2022 Uchinchi tomon xizmatlari (to\u2018lov tizimlari) ishidagi uzilishlar\n'
                '  \u2022 Fors-major holatlar (tabiiy ofatlar, davlat qarorlari)\n'
                '  \u2022 Foydalanuvchining noto\u2018g\u2018ri harakatlari oqibatlari\n\n'
                '11.2. TOPLA javobgarligi buyurtmaning umumiy summasi bilan cheklangan.'),

            _section('12. Nizolarni hal qilish',
                '12.1. Barcha nizolar avvalo muzokaralar va kelishuvlar orqali hal qilinadi.\n\n'
                '12.2. Kelishuvga erishilmasa, nizolar O\u2018zbekiston Respublikasi qonunchiligi asosida vakolatli sudda ko\u2018rib chiqiladi.\n\n'
                '12.3. Ushbu Shartlarga O\u2018zbekiston Respublikasi qonunlari tatbiq etiladi.'),

            _section('13. Shartlarni o\u2018zgartirish',
                '13.1. TOPLA ushbu Shartlarni istalgan vaqtda yangilash va o\u2018zgartirish huquqini saqlab qoladi.\n\n'
                '13.2. Muhim o\u2018zgarishlar haqida ilova orqali bildirishnoma yuboriladi.\n\n'
                '13.3. O\u2018zgarishlardan so\u2018ng Ilovadan foydalanishni davom ettirishingiz yangi Shartlarga roziligingizni bildiradi.'),

            _section('14. Bog\u2018lanish',
                'Savollar, takliflar yoki shikoyatlar uchun:\n\n'
                'Telefon: +998 95 000 94 16\n'
                'Ish vaqti: Dushanba \u2014 Shanba, 09:00 \u2014 21:00\n\n'
                'Ilova ichidagi "Yordam" bo\u2018limida chat orqali murojaat qilishingiz mumkin.'),

            const SizedBox(height: 16),

            // Footer info box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Iconsax.info_circle, color: AppColors.primary, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Ilovadan foydalanish orqali Siz ushbu shartlarga rozilik bildirasiz.',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
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
