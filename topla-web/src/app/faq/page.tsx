'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocaleStore } from '@/store/locale-store'
import { useTelegramLink, useTelegramHandle, useSupportPhone, useSupportEmail } from '@/hooks/useSettings'

/* ─── Types ─── */
type FaqItem = { id: string; q: string; a: string[] }
type FaqSection = { id: string; title: string; note?: string; items: FaqItem[] }

/* ─── UZ Content ─── */
const faqUz: FaqSection[] = [
  {
    id: 'umumiy',
    title: 'Umumiy savollar',
    items: [
      {
        id: 's-topla-nima',
        q: 'TOPLA nima? Bu yerda nima qilaman?',
        a: [
          'TOPLA — O\'zbekistonning zamonaviy online marketplace platformasi bo\'lib, minglab do\'konlar va millionlab mahsulotlarni bir joyga jamlaydi. Platforma orqali siz istalgan mahsulotni — elektronikadan tortib kiyim-kechak, uy-ro\'zg\'or buyumlari va go\'zallik mahsulotlarigacha — qulay narxlarda tanlashingiz va buyurtma qilishingiz mumkin.',
          'TOPLA mobil ilovasi (Android) va topla.uz veb-sayti orqali ishlaydi. Mahsulotlarni ko\'rish, taqqoslash, savatga qo\'shish va buyurtma berish — barchasi bir necha bosish orqali amalga oshiriladi. Har bir buyurtma holati real vaqtda kuzatiladi va SMS bildirishnomalar yuboriladi.',
          'Platformada faqat verifikatsiyadan o\'tgan sotuvchilar ishlaydi — ular YaTT yoki MCHJ sifatida ro\'yxatdan o\'tgan va Didox tizimi orqali shartnoma imzolagan ishonchli savdogarlar.',
        ],
      },
      {
        id: 's-kimlar-uchun',
        q: 'TOPLA kimlar uchun?',
        a: [
          'TOPLA O\'zbekistondagi barcha iste\'molchilar uchun mo\'ljallangan. Agar siz qulay narxlarda sifatli mahsulotlar qidirayotgan bo\'lsangiz, TOPLA aynan siz uchun. Oddiy xaridorlardan tortib kichik biznes egalari va ulgurji xaridorlar ham platformadan foydalanishi mumkin.',
          'Sotuvchilar uchun ham keng imkoniyatlar mavjud. Agar sizda o\'z do\'koningiz bo\'lsa — YaTT yoki MCHJ sifatida vendor.topla.uz orqali ro\'yxatdan o\'ting va minglab xaridorlarga o\'z mahsulotlaringizni taklif qiling. Platforma mahsulot joylashtirish, buyurtmalarni boshqarish, moliyaviy hisobot va kuryer xizmati imkoniyatlarini taqdim etadi.',
        ],
      },
      {
        id: 's-farqi-nima',
        q: 'TOPLA boshqa marketplace\'lardan nimasi bilan farq qiladi?',
        a: [
          'TOPLA O\'zbekiston bozori uchun maxsus ishlab chiqilgan. Platforma mahalliy to\'lov tizimlari — Uzcard va Humo kartalarini qo\'llab-quvvatlaydi. Barcha to\'lovlar Octobank xavfsiz processing orqali amalga oshiriladi. Interfeys o\'zbek va rus tillarida to\'liq ishlaydi.',
          'Sotuvchilar 1-2 ish kunida verifikatsiyadan o\'tadi va mahsulotlarini joylashtira boshlaydi. Komissiya stavkalari bozorda eng raqobatbardoshlari orasida — kategoriyaga qarab 5-15%. Platforma FBS (sotuvchi jo\'natadi) va DBS (Topla kuryer yetkazadi) modellarini qo\'llab-quvvatlaydi.',
          'Xaridorlar uchun — qulay qidiruv, kategoriyalar bo\'yicha navigatsiya, mahsulot taqqoslash, sevimlilar ro\'yxati, push-bildirishnomalar va real vaqtda buyurtma kuzatish.',
        ],
      },
      {
        id: 's-qachon-ishga-tushgan',
        q: 'TOPLA qachon ishga tushgan?',
        a: [
          'TOPLA 2025-yilda O\'zbekistonda ishga tushirilgan. Platforma doimiy ravishda yangi funksiyalar va imkoniyatlar bilan yangilanib boradi. Bizning maqsadimiz — O\'zbekistondagi eng qulay va ishonchli online savdo platformasini yaratish.',
        ],
      },
      {
        id: 's-qayerda-joylashgan',
        q: 'TOPLA qayerda joylashgan?',
        a: [
          'TOPLA jamoasi Toshkent shahrida joylashgan. Kompaniya ООО «VELUNA MARKET» nomi ostida faoliyat yuritadi. Barcha yetkazib berish xizmatlari O\'zbekiston bo\'ylab amalga oshiriladi — Toshkent shahri va viloyatlarga, shuningdek respublikaning chekka hududlariga ham.',
        ],
      },
      {
        id: 's-pul-ishlash',
        q: 'TOPLA qanday qilib pul ishlaydi?',
        a: [
          'TOPLA har bir muvaffaqiyatli sotilgan mahsulot uchun sotuvchidan komissiya oladi. Komissiya miqdori mahsulot kategoriyasiga qarab 5% dan 15% gacha. Bu degani — xaridorlar uchun platforma xizmatlaridan foydalanish mutlaqo bepul.',
          'Kelajakda sotuvchilar uchun qo\'shimcha xizmatlar ham taklif etiladi: mahsulot reklamasi, premium joylashtirish va boshqa marketing vositalari.',
        ],
      },
      {
        id: 's-maxfiylik',
        q: 'Maxfiylik haqida nima deysizlar?',
        a: [
          'Biz foydalanuvchilarning shaxsiy ma\'lumotlarini himoya qilishni jiddiy qabul qilamiz. Barcha ma\'lumotlar shifrlangan holda saqlanadi va uchinchi tomonlarga ruxsatsiz uzatilmaydi. Biz O\'zbekiston Respublikasining «Shaxsiy ma\'lumotlar to\'g\'risida» qonuniga to\'liq amal qilamiz.',
          'Karta ma\'lumotlaringiz bizning serverlarimizda saqlanmaydi — barcha to\'lovlar Octobank processing orqali xavfsiz amalga oshiriladi. Cookie fayllar faqat saytni yaxshilash maqsadida ishlatiladi. Batafsil ma\'lumot maxfiylik siyosati sahifamizda.',
        ],
      },
    ],
  },
  {
    id: 'buyurtma',
    title: 'Buyurtma berish',
    note: 'Buyurtma berishdan oldin mahsulot tavsifi, narxi va yetkazib berish shartlari bilan tanishishni tavsiya etamiz.',
    items: [
      {
        id: 's-qanday-buyurtma',
        q: 'Qanday qilib buyurtma beraman?',
        a: [
          'Buyurtma berish juda oddiy. Avval kerakli mahsulotni toping — buni qidiruv orqali yoki kategoriyalar bo\'yicha ko\'rib chiqish orqali amalga oshirishingiz mumkin. Mahsulot sahifasida rang, o\'lcham va miqdorni tanlang, so\'ng «Savatga qo\'shish» tugmasini bosing.',
          'Savatga o\'ting va buyurtma tarkibini tekshiring. Yetkazib berish manzilini kiriting yoki avval saqlangan manzillardan birini tanlang. To\'lov usulini belgilang — bank kartasi (Uzcard/Humo) yoki naqd pul. «Buyurtma berish» tugmasini bosing.',
          'Buyurtma tasdiqlangandan so\'ng sizga SMS orqali bildirishnoma yuboriladi. Buyurtma holatini «Profilim → Buyurtmalarim» bo\'limida real vaqtda kuzatishingiz mumkin. Har bir holat o\'zgarganda — yangi SMS keladi.',
        ],
      },
      {
        id: 's-bekor-qilish',
        q: 'Buyurtmani bekor qilsam bo\'ladimi?',
        a: [
          'Ha, buyurtmani bekor qilish mumkin, lekin bu buyurtma holatiga bog\'liq. «Yangi» holatida — buyurtmani istalgan vaqtda bepul bekor qilishingiz mumkin. «Tayyorlanmoqda» holatida — qo\'llab-quvvatlash xizmatiga murojaat qiling, bekor qilish sotuvchi bilan kelishiladi. «Yo\'lda» holatida — buyurtma jo\'natilgan bo\'lib, bekor qilish imkoni yo\'q.',
          'Bekor qilish uchun: ilovada «Profilim → Buyurtmalarim» bo\'limiga o\'ting, kerakli buyurtmani tanlang va «Bekor qilish» tugmasini bosing. Agar onlayn to\'lov qilgan bo\'lsangiz — pul 1-3 ish kuni ichida kartangizga qaytariladi.',
        ],
      },
      {
        id: 's-minimal-summa',
        q: 'Minimal buyurtma summasi bormi?',
        a: [
          'Yo\'q, TOPLA da minimal buyurtma summasi yo\'q. Siz istalgan miqdordagi mahsulotni buyurtma qilishingiz mumkin — bitta kichik aksessuardan tortib yirik texnikagacha. Lekin yetkazib berish narxi buyurtma summasiga, mahsulot og\'irligiga va yetkazish masofasiga qarab hisoblanadi.',
          'Ba\'zi sotuvchilar ma\'lum summadan oshgan buyurtmalarda bepul yetkazish taklif qiladi. Bu ma\'lumot mahsulot sahifasida va buyurtma rasmiylashtirishda ko\'rsatiladi.',
        ],
      },
      {
        id: 's-buyurtma-holat',
        q: 'Buyurtma holatini qanday kuzataman?',
        a: [
          'Buyurtma holatini ilovada «Profilim → Buyurtmalarim» bo\'limida kuzatishingiz mumkin. Har bir buyurtma quyidagi holatlardan birida bo\'ladi: Yangi — buyurtma qabul qilindi; Tayyorlanmoqda — sotuvchi buyurtmani tayyorlamoqda; Yo\'lda — buyurtma kuryerga topshirildi; Yetkazildi — buyurtma manzilga yetib keldi; Bekor qilingan — buyurtma bekor qilingan.',
          'Har bir holat o\'zgarganda sizga SMS yuboriladi. Shuningdek, push-bildirishnomalarni yoqib qo\'ysangiz — real vaqtda xabar olasiz. Agar buyurtma bilan muammo bo\'lsa — qo\'llab-quvvatlash xizmatiga yozing.',
        ],
      },
      {
        id: 's-turli-dokonlar',
        q: 'Turli do\'konlardan bir buyurtma qilsam bo\'ladimi?',
        a: [
          'Ha, siz bir nechta sotuvchidan mahsulotlarni savatga qo\'shishingiz mumkin. Buyurtma tasdiqlanganda har bir sotuvchi uchun alohida buyurtma yaratiladi. Bu degani — har bir sotuvchidan tovar alohida vaqtda va alohida kuryerlar orqali yetkazilishi mumkin.',
          'Har bir alohida buyurtmaning holati mustaqil ravishda kuzatiladi. To\'lov bir marta amalga oshiriladi — platforma summani sotuvchilar orasida taqsimlaydi.',
        ],
      },
      {
        id: 's-narx-ozgarishi',
        q: 'Buyurtma tasdiqlanganidan keyin narx o\'zgarishi mumkinmi?',
        a: [
          'Yo\'q. Buyurtma tasdiqlangan paytdagi narx yakuniy hisoblanadi. Agar sotuvchi narxni o\'zgartirsa ham, sizning buyurtmangiz asl narxda saqlanadi. Bu TOPLA platformasining kafolati.',
        ],
      },
    ],
  },
  {
    id: 'yetkazish',
    title: 'Yetkazib berish',
    items: [
      {
        id: 's-yetkazish-vaqt',
        q: 'Yetkazib berish qancha vaqt oladi?',
        a: [
          'Yetkazib berish muddati sizning joylashuvingiz va sotuvchining manzilga qarab farq qiladi. Toshkent shahri bo\'ylab — odatda 1–3 ish kuni. O\'zbekiston viloyat markazlariga — 2–5 ish kuni. Masofadagi tuman va shaharchalar uchun — 3–7 ish kuni.',
          'Aniq yetkazish muddati mahsulot sahifasida va buyurtma rasmiylashtirishda ko\'rsatiladi. Agar sotuvchi mahsulotni zudlik bilan jo\'nata olsa — yetkazish tezroq bo\'lishi mumkin. Bayram va dam olish kunlari yetkazish muddati uzayishi mumkin.',
        ],
      },
      {
        id: 's-yetkazish-narx',
        q: 'Yetkazib berish narxi qancha?',
        a: [
          'Yetkazib berish narxi bir nechta omilga bog\'liq: buyurtma summasi, mahsulot og\'irligi va hajmi, yetkazish masofasi. Aniq narx buyurtma rasmiylashtirishda hisoblanadi va ko\'rsatiladi — hech qanday yashirin to\'lovlar yo\'q.',
          'Ba\'zi sotuvchilar ma\'lum summadan yuqori buyurtmalarda bepul yetkazish taklif qiladi. Masalan, 100,000 so\'mdan oshgan buyurtmalarda yetkazish bepul bo\'lishi mumkin. Bu ma\'lumot mahsulot sahifasida aniq ko\'rsatiladi.',
        ],
      },
      {
        id: 's-manzil-ozgartirish',
        q: 'Manzilimni buyurtmadan keyin o\'zgartira olamanmi?',
        a: [
          'Agar buyurtma hali jo\'natilmagan bo\'lsa — ha, manzilni o\'zgartirish mumkin. Buning uchun qo\'llab-quvvatlash xizmatiga Telegram bot yoki email orqali murojaat qiling. Buyurtma raqamingizni va yangi manzilingizni ko\'rsating.',
          'Buyurtma allaqachon jo\'natilgan bo\'lsa — manzilni o\'zgartirish imkoni yo\'q. Bunday holda buyurtmani qabul qilib, qaytarish jarayonini boshlashingiz mumkin.',
        ],
      },
      {
        id: 's-olib-ketish',
        q: 'O\'zim borib olsam bo\'ladimi?',
        a: [
          'Hozircha TOPLA orqali faqat yetkazib berish xizmati mavjud. Tez orada O\'zbekiston bo\'ylab olib ketish punktlari (pickup point) ishga tushiriladi. Bu yangilik haqida ilovadagi bildirishnomalar va ijtimoiy tarmoqlarimiz orqali xabar beramiz.',
        ],
      },
      {
        id: 's-fbs-dbs',
        q: 'FBS va DBS nima?',
        a: [
          'TOPLA da ikki xil yetkazib berish modeli mavjud. FBS (Fulfilled by Seller) — sotuvchi mahsulotni o\'zi qadoqlaydi, jo\'natadi va yetkazadi. Bu holda yetkazish muddati va narxi sotuvchiga bog\'liq.',
          'DBS (Delivery by Service) — sotuvchi mahsulotni tayyorlaydi va qadoqlaydi, TOPLA kuryer xizmati esa xaridorga yetkazadi. Bu model yetkazish sifati va tezligi TOPLA tomonidan nazorat qilinadi.',
          'Qaysi model qo\'llanilishi mahsulot sahifasida ko\'rsatiladi. Ikkala holda ham buyurtma holati real vaqtda kuzatiladi.',
        ],
      },
      {
        id: 's-hudud',
        q: 'Qaysi hududlarga yetkazib berasiz?',
        a: [
          'TOPLA butun O\'zbekiston Respublikasi bo\'ylab yetkazib berish xizmatini taqdim etadi. Toshkent shahri va viloyati, Samarqand, Buxoro, Namangan, Farg\'ona, Andijon, Xorazm, Navoiy, Qashqadaryo, Surxondaryo, Jizzax, Sirdaryo va Qoraqalpog\'iston Respublikasiga yetkazamiz.',
          'Katta shahar va viloyat markazlariga yetkazish tezroq va arzonroq. Chekka hududlarga yetkazish biroz ko\'proq vaqt olishi mumkin.',
        ],
      },
    ],
  },
  {
    id: 'tolov',
    title: 'To\'lov',
    items: [
      {
        id: 's-tolov-usullari',
        q: 'Qanday to\'lov usullari mavjud?',
        a: [
          'TOPLA da quyidagi to\'lov usullari mavjud. Bank kartasi orqali onlayn to\'lov — Uzcard va Humo kartalari qabul qilinadi. Barcha kartali to\'lovlar Octobank xavfsiz processing orqali amalga oshiriladi. Karta ma\'lumotlaringiz bizning serverlarimizda saqlanmaydi.',
          'Naqd pul — yetkazib berishda kuryerga to\'lash. Bu usul barcha hududlarda mavjud. Kuryer sizga to\'lov cheki beradi.',
          'Barcha onlayn tranzaksiyalar SSL-shifrlash bilan himoyalangan. To\'lov xatoliklari yuz berganda summa avtomatik ravishda kartangizga qaytariladi.',
        ],
      },
      {
        id: 's-tolov-xavfsiz',
        q: 'Onlayn to\'lov xavfsizmi?',
        a: [
          'Ha, onlayn to\'lov mutlaqo xavfsiz. Barcha tranzaksiyalar Octobank — O\'zbekistondagi litsenziyalangan to\'lov processingi orqali amalga oshiriladi. Karta raqamingiz, amal qilish muddati va CVV kodi bizning serverlarimizda saqlanmaydi.',
          'To\'lov jarayoni SSL-shifrlash (HTTPS) bilan himoyalangan. Bank sizga SMS orqali tasdiqlash kodi yuboradi — bu qo\'shimcha xavfsizlik qatlami (3D Secure). Hech kim sizning roziligingiz bilmasdan to\'lov amalga oshira olmaydi.',
        ],
      },
      {
        id: 's-pul-qaytarish',
        q: 'Pul qaytarish qancha vaqt oladi?',
        a: [
          'Onlayn to\'lov uchun — pul 1–3 ish kuni ichida bank kartangizga qaytariladi. Ba\'zi hollarda bank tomonidan qayta ishlash 5 ish kunigacha cho\'zilishi mumkin. Qaytarish holati ilovada va SMS orqali bildiriladi.',
          'Naqd to\'lov uchun — agar siz hali yetkazilmagan buyurtmani bekor qilsangiz, hech qanday to\'lov olinmaydi. Agar mahsulotni qaytarayotgan bo\'lsangiz — qaytarish jarayonida pul kuryer orqali yoki keyingi buyurtmangizdan chegirma sifatida qaytariladi.',
        ],
      },
      {
        id: 's-chek',
        q: 'Chek olamanmi?',
        a: [
          'Ha, har bir buyurtma uchun elektron chek avtomatik ravishda yaratiladi. Chek SMS va email (agar ko\'rsatgan bo\'lsangiz) orqali yuboriladi. Shuningdek, buyurtma sahifasida chekni ko\'rish va yuklab olish imkoniyati mavjud.',
          'Elektron chek O\'zbekiston Respublikasi soliq qonunchiligiga muvofiq rasmiylashtiriladi va yuridik kuchga ega.',
        ],
      },
      {
        id: 's-bolib-tolash',
        q: 'Bo\'lib to\'lash mavjudmi?',
        a: [
          'Ha, TOPLA platformasida bo\'lib to\'lash (nasiya/muddatli to\'lov) imkoniyati mavjud. Bu xizmat bank kartalari orqali Octobank installment tizimi yordamida amalga oshiriladi. Bo\'lib to\'lash muddati 3 oydan 24 oygacha tanlash mumkin.',
          'Bo\'lib to\'lash foiz stavkasi va oylik to\'lov miqdori buyurtma rasmiylashtirishda aniq ko\'rsatiladi. Har oylik to\'lov avtomatik ravishda kartangizdan yechilib olinadi.',
        ],
      },
    ],
  },
  {
    id: 'qaytarish',
    title: 'Qaytarish va almashtirish',
    note: 'Qaytarish siyosatimiz xaridorlarning huquqlarini himoya qilishga qaratilgan. Batafsil — Qaytarish siyosati sahifamizda.',
    items: [
      {
        id: 's-qaytarish',
        q: 'Mahsulotni qaytarsam bo\'ladimi?',
        a: [
          'Ha, sifatli mahsulotni qabul qilgan kundan boshlab 14 kun ichida qaytarish mumkin. Qaytarish uchun mahsulot ishlatilmagan, tovar ko\'rinishi saqlangan va asl qadoqda bo\'lishi kerak. Sotib olganingizni tasdiqlovchi hujjat (elektron chek yoki buyurtma raqami) talab qilinadi.',
          'Sifatsiz (nuqsonli) mahsulotlarni esa 30 kun ichida qaytarish mumkin — ishlab chiqarish nuqsoni, noto\'g\'ri mahsulot yoki yetkazish jarayonida shikastlangan tovarlar bunga kiradi. Bunday hollarda qaytarish xarajatlarini TOPLA yoki sotuvchi to\'laydi.',
        ],
      },
      {
        id: 's-qaytarib-bolmaydi',
        q: 'Qaysi mahsulotlarni qaytarib bo\'lmaydi?',
        a: [
          'Quyidagi mahsulotlar qaytarilmaydi: shaxsiy gigiena vositalari (ochilgan qadoqda), ichki kiyim va cho\'milish kostiumlari, ochilgan yoki ishlatilgan parfyumeriya va kosmetika mahsulotlari, maxsus buyurtma asosida tayyorlangan mahsulotlar, faollashtirilgan kompyuter dasturlari va raqamli kontentlar.',
          'Agar sifatsiz mahsulot kelgan bo\'lsa — yuqoridagi ro\'yxatga qo\'shimcha ravishda ham qaytarish mumkin. Masalan, nuqsonli ichki kiyim yoki shikastlangan parfyumeriya qaytariladi.',
        ],
      },
      {
        id: 's-nosoz-mahsulot',
        q: 'Nosoz yoki buzilgan mahsulot kelsa nima qilaman?',
        a: [
          'Agar nosoz, buzilgan yoki noto\'g\'ri mahsulot kelgan bo\'lsa — 24 soat ichida qo\'llab-quvvatlash xizmatiga murojaat qiling. Muammoni tasvirlab yozing va mahsulotning rasmini yoki videosini yuboring — bu muammoni tezroq hal qilishga yordam beradi.',
          'Biz 24 soat ichida javob beramiz va qaytarish jarayonini boshlaymiz. Nosoz mahsulot qaytarilganda yetkazish xarajatlarini biz to\'laymiz. Pul 1-3 ish kuni ichida kartangizga qaytariladi yoki yangi mahsulot almashtiriladi.',
        ],
      },
      {
        id: 's-almashtirish',
        q: 'Mahsulotni almashtirib bersam bo\'ladimi?',
        a: [
          'Ha, mahsulotni boshqa rangga, o\'lchamga yoki modelga almashtirish mumkin — agar sotuvchida kerakli variant mavjud bo\'lsa. Almashtirish uchun qo\'llab-quvvatlash xizmatiga murojaat qiling va qaysi variantni xohlayotganingizni ko\'rsating.',
          'Almashtirish 14 kun ichida amalga oshiriladi. Mahsulot ishlatilmagan va asl qadoqda bo\'lishi kerak. Agar yangi variant narxi farq qilsa — farq to\'lanadi yoki qaytariladi.',
        ],
      },
      {
        id: 's-qaytarish-jarayon',
        q: 'Qaytarish jarayoni qanday?',
        a: [
          'Qaytarish 4 bosqichda amalga oshiriladi. 1-bosqich: Qo\'llab-quvvatlashga murojaat — Telegram bot yoki support@topla.uz orqali ariza yuboring, buyurtma raqami va sababini ko\'rsating. 2-bosqich: Ariza ko\'rib chiqiladi — 24 soat ichida javob beramiz.',
          '3-bosqich: Mahsulotni qaytarish — kuryer mahsulotni olib ketadi yoki siz pochta orqali yuborasiz (sifatsiz tovarlar uchun xarajat bizning hisobimizga). 4-bosqich: Pul qaytarish — mahsulot tekshirilgandan so\'ng 1-3 ish kuni ichida pul kartangizga qaytariladi.',
        ],
      },
    ],
  },
  {
    id: 'hisob',
    title: 'Hisob va xavfsizlik',
    items: [
      {
        id: 's-royxatdan-otish',
        q: 'Qanday ro\'yxatdan o\'taman?',
        a: [
          'Ro\'yxatdan o\'tish juda oddiy va 1 daqiqa oladi. Telefon raqamingizni kiriting — SMS orqali 6 xonali tasdiqlash kodi yuboriladi. Kodni kiritgandan so\'ng ismingizni yozing va profil tayyor!',
          'Shuningdek, Google hisobi orqali ham bir bosishda kirish mumkin. «Google orqali kirish» tugmasini bosing, Google hisobingizni tanlang — avtomatik ravishda profil yaratiladi yoki mavjud profilga ulanadi. Telefon raqami va Google hisobi bitta profilga ulanishi mumkin.',
        ],
      },
      {
        id: 's-google-kirish',
        q: 'Google orqali kirsam bo\'ladimi?',
        a: [
          'Ha, TOPLA da Google orqali kirish imkoniyati mavjud. Kirish sahifasida «Google orqali kirish» tugmasini bosing va Google hisobingizni tanlang. Agar siz birinchi marta kirayotgan bo\'lsangiz — avtomatik ravishda yangi profil yaratiladi. Agar avval telefon raqami bilan hisob ochgan bo\'lsangiz — Google hisobingiz mavjud profilga ulanadi.',
        ],
      },
      {
        id: 's-telefon-ozgartirish',
        q: 'Telefon raqamimni o\'zgartira olamanmi?',
        a: [
          'Hozircha telefon raqamni to\'g\'ridan-to\'g\'ri ilovadan o\'zgartirish imkoniyati mavjud emas. Agar raqamingiz o\'zgargan bo\'lsa — qo\'llab-quvvatlash xizmatiga murojaat qiling. Shaxsingizni tasdiqlash uchun eski raqamingiz va boshqa ma\'lumotlar so\'ralishi mumkin.',
          'Xavfsizlik sababli telefon raqamini o\'zgartirish jarayoni qo\'lda amalga oshiriladi. Tez orada ilovadan raqamni o\'zgartirish funksiyasi ham qo\'shiladi.',
        ],
      },
      {
        id: 's-malumotlar-xavfsiz',
        q: 'Ma\'lumotlarim xavfsizmi?',
        a: [
          'Ha, biz shaxsiy ma\'lumotlaringiz xavfsizligini jiddiy qabul qilamiz. Barcha ma\'lumotlar serverlarimizda AES-256 shifrlash standarti bilan himoyalangan holda saqlanadi. Ma\'lumotlar bazasi redund (zaxira) nusxalari muntazam ravishda olinadi.',
          'Biz O\'zbekiston Respublikasining «Shaxsiy ma\'lumotlar to\'g\'risida» qonuniga amal qilamiz. Shaxsiy ma\'lumotlaringiz roziligingiz bo\'lmasdan uchinchi tomonlarga uzatilmaydi (qonuniy holatlar bundan mustasno). Batafsil ma\'lumot — Maxfiylik siyosati sahifamizda.',
        ],
      },
      {
        id: 's-hisob-ochirish',
        q: 'Hisobimni o\'chirib tashlasam bo\'ladimi?',
        a: [
          'Ha, siz hisobingizni istalgan vaqtda o\'chirib tashlashingiz mumkin. Buning uchun «Profil → Sozlamalar → Hisobni o\'chirish» bo\'limiga o\'ting yoki topla.uz/delete-account sahifasiga tashrif buyuring.',
          'Hisobni o\'chirganda barcha shaxsiy ma\'lumotlaringiz, buyurtma tarixi, sevimlilar ro\'yxati va saqlangan manzillar o\'chiriladi. Bu jarayon qaytarib bo\'lmaydi. Agar faol buyurtmalaringiz bo\'lsa — avval ularni yakunlang yoki bekor qiling.',
        ],
      },
    ],
  },
  {
    id: 'sotuvchilar',
    title: 'Sotuvchilar uchun',
    items: [
      {
        id: 's-sotuvchi-bolish',
        q: 'TOPLA da sotuvchi bo\'lsam bo\'ladimi?',
        a: [
          'Ha! O\'zbekistonda ro\'yxatdan o\'tgan har qanday YaTT (yakka tartibdagi tadbirkor) yoki MCHJ (mas\'uliyati cheklangan jamiyat) sotuvchi bo\'lishi mumkin. vendor.topla.uz sahifasiga o\'ting, ro\'yxatdan o\'ting va kerakli hujjatlarni yuklang.',
          'Hujjatlar 1-2 ish kuni ichida tekshiriladi. Tasdiqlangandan so\'ng mahsulotlarni joylashtira boshlashingiz mumkin. Platforma sizga mahsulot boshqaruvi, buyurtmalar kuzatish, moliyaviy hisobot va xaridorlar bilan chat imkoniyatlarini taqdim etadi.',
        ],
      },
      {
        id: 's-hujjatlar',
        q: 'Qanday hujjatlar kerak?',
        a: [
          'Sotuvchi sifatida ro\'yxatdan o\'tish uchun quyidagi hujjatlar talab qilinadi: YaTT guvohnomasi yoki MCHJ ta\'sis hujjatlari, INN (soliq to\'lovchi identifikatsiya raqami), bank rekvizitlari (hisob raqami, bank nomi, MFO), pasport nusxasi (YaTT uchun), va Didox tizimi orqali elektron shartnomaga imzo.',
          'Barcha hujjatlar vendor.topla.uz tizimida yuklash orqali topshiriladi. Hujjatlar 1-2 ish kuni ichida moderatorlar tomonidan tekshiriladi. Agar hujjatlarda xatolik bo\'lsa — sizga tuzatish to\'g\'risida xabar beriladi.',
        ],
      },
      {
        id: 's-komissiya',
        q: 'Komissiya qancha?',
        a: [
          'TOPLA har bir muvaffaqiyatli sotilgan mahsulot uchun komissiya oladi. Komissiya miqdori mahsulot kategoriyasiga bog\'liq va 5% dan 15% gacha. Masalan, elektronika uchun — 7-10%, kiyim-kechak uchun — 10-15%, oziq-ovqat uchun — 5-8%.',
          'Komissiya faqat muvaffaqiyatli yakunlangan buyurtmalardan olinadi. Bekor qilingan yoki qaytarilgan buyurtmalar uchun komissiya olinmaydi. Aniq komissiya stavkalari sotuvchi shaxsiy kabinetida ko\'rsatilgan.',
        ],
      },
      {
        id: 's-reyting',
        q: 'Sotuvchi reytingi qanday hisoblanadi?',
        a: [
          'Sotuvchi reytingi bir nechta ko\'rsatkichlar asosida hisoblanadi: xaridorlar baholari (1-5 yulduz), yetkazish muddatiga rioya etish, qaytarish darajasi (kam bo\'lsa yaxshi), mijozlarga javob berish tezligi, va mahsulot tavsifi to\'g\'riligi.',
          'Yuqori reytingli sotuvchilar qidiruv natijalarida yuqoriroq ko\'rsatiladi va xaridorlar ishonchini osonroq qozonadi. Reyting muntazam ravishda yangilanadi va sotuvchi kabinetida ko\'rish mumkin.',
        ],
      },
      {
        id: 's-mahsulot-joylashtirish',
        q: 'Mahsulotlarni qanday joylashtiraman?',
        a: [
          'Mahsulot joylashtirish vendor.topla.uz sotuvchi kabinetida amalga oshiriladi. «Mahsulotlar → Yangi qo\'shish» bo\'limiga o\'ting. Mahsulot nomi, tavsifi (o\'zbek va rus tillarida), narxi, kategoriyasi, rasmlar (kamida 3 ta sifatli rasm), va qo\'shimcha xususiyatlarni (rang, o\'lcham, og\'irlik) kiriting.',
          'Mahsulot moderatsiyadan o\'tgandan so\'ng platformada ko\'rinadi. Moderatsiya odatda 2-4 soat ichida amalga oshiriladi. Agar mahsulot tavsifida muammo bo\'lsa — sizga tuzatish to\'g\'risida xabar beriladi.',
        ],
      },
    ],
  },
  {
    id: 'texnik',
    title: 'Texnik savollar',
    items: [
      {
        id: 's-qurilmalar',
        q: 'TOPLA qaysi qurilmalarda ishlaydi?',
        a: [
          'TOPLA mobil ilovasi Android 6.0 va undan yuqori versiyalarda ishlaydi. Ilova Google Play do\'konidan bepul yuklab olinadi. iOS (iPhone) versiyasi tez orada ishga tushiriladi.',
          'Veb-versiya (topla.uz) barcha zamonaviy brauzerlarda ishlaydi — Google Chrome, Safari, Mozilla Firefox, Microsoft Edge. Veb-sayt mobil qurilmalarga ham moslashtirilgan, shuning uchun telefon brauzeridan ham qulay foydalanish mumkin.',
        ],
      },
      {
        id: 's-bildirishnomalar',
        q: 'Bildirishnomalar kelmayapti, nima qilaman?',
        a: [
          'Avval telefon sozlamalarida TOPLA ilovasiga bildirishnoma yuborish ruxsati berilganligini tekshiring. Android da: Sozlamalar → Ilovalar → TOPLA → Bildirishnomalar — barcha bildirishnomalar yoqilgan bo\'lishi kerak.',
          'Batareya tejash rejimi bildirishnomalarni bloklashi mumkin. Samsung va Xiaomi qurilmalarida ilovani «himoyalangan ilovalar» ro\'yxatiga qo\'shing. Muammo davom etsa — ilovani qayta o\'rnating.',
        ],
      },
      {
        id: 's-sekin-ishlayapti',
        q: 'Ilova sekin ishlayapti, nima qilaman?',
        a: [
          'Ilovani oxirgi versiyaga yangilang — Google Play da «Yangilash» tugmasini bosing. Telefon keshini tozalang: Sozlamalar → Ilovalar → TOPLA → Xotira → Keshni tozalash. Internet aloqangizni tekshiring — Wi-Fi yoki mobil internet barqaror ishlayotganini tasdiqlang.',
          'Agar muammo davom etsa — ilovani o\'chirib qayta o\'rnating. Hisobingiz bulutda saqlanadi, shuning uchun qayta kirganingizda barcha ma\'lumotlaringiz tiklangan bo\'ladi.',
        ],
      },
      {
        id: 's-til-ozgartirish',
        q: 'Tilni qanday o\'zgartiraman?',
        a: [
          'Veb-saytda sahifaning yuqori qismida til almashtirgichni bosing — «UZ» yoki «RU» ni tanlang. Til darhol o\'zgaradi va tanlovingiz saqlanadi.',
          'Mobil ilovada: Profil → Sozlamalar → Til bo\'limida kerakli tilni tanlang. Hozirda o\'zbek va rus tillari qo\'llab-quvvatlanadi.',
        ],
      },
    ],
  },
]

/* ─── RU Content ─── */
const faqRu: FaqSection[] = [
  {
    id: 'umumiy',
    title: 'Общие вопросы',
    items: [
      {
        id: 's-topla-nima',
        q: 'Что такое TOPLA? Что тут можно делать?',
        a: [
          'TOPLA — современная онлайн маркетплейс-платформа Узбекистана, объединяющая тысячи магазинов и миллионы товаров в одном месте. Через платформу вы можете выбрать и заказать любые товары — от электроники до одежды, товаров для дома и косметики — по выгодным ценам.',
          'TOPLA работает через мобильное приложение (Android) и веб-сайт topla.uz. Просмотр, сравнение, добавление в корзину и оформление заказа — всё за несколько нажатий. Статус каждого заказа отслеживается в реальном времени, SMS-уведомления приходят автоматически.',
          'На платформе работают только верифицированные продавцы — это ИП или ООО, прошедшие проверку и подписавшие договор через систему Didox.',
        ],
      },
      {
        id: 's-kimlar-uchun',
        q: 'Для кого TOPLA?',
        a: [
          'TOPLA предназначена для всех потребителей в Узбекистане. Если вы ищете качественные товары по доступным ценам — TOPLA для вас. Платформой могут пользоваться обычные покупатели, владельцы малого бизнеса и оптовые закупщики.',
          'Для продавцов также предусмотрены широкие возможности. Если у вас есть свой магазин — зарегистрируйтесь как ИП или ООО на vendor.topla.uz и предлагайте свои товары тысячам покупателей. Платформа предоставляет инструменты размещения товаров, управления заказами, финансовой отчётности и курьерской службы.',
        ],
      },
      {
        id: 's-farqi-nima',
        q: 'Чем TOPLA отличается от других маркетплейсов?',
        a: [
          'TOPLA разработан специально для рынка Узбекистана. Платформа поддерживает местные платёжные системы — карты Uzcard и Humo. Все платежи проходят через безопасный процессинг Octobank. Интерфейс полностью работает на узбекском и русском языках.',
          'Продавцы проходят верификацию за 1-2 рабочих дня и начинают размещать товары. Комиссионные ставки — одни из самых конкурентных на рынке: от 5% до 15% в зависимости от категории. Платформа поддерживает модели FBS (продавец отправляет) и DBS (курьер Topla доставляет).',
          'Для покупателей — удобный поиск, навигация по категориям, сравнение товаров, список избранного, push-уведомления и отслеживание заказов в реальном времени.',
        ],
      },
      {
        id: 's-qachon-ishga-tushgan',
        q: 'Когда был запущен TOPLA?',
        a: [
          'TOPLA был запущен в Узбекистане в 2025 году. Платформа постоянно обновляется новыми функциями и возможностями. Наша цель — создать самую удобную и надёжную платформу онлайн-торговли в Узбекистане.',
        ],
      },
      {
        id: 's-qayerda-joylashgan',
        q: 'Где находится TOPLA?',
        a: [
          'Команда TOPLA расположена в Ташкенте. Компания работает под названием ООО «VELUNA MARKET». Доставка осуществляется по всему Узбекистану — в Ташкент и области, а также в удалённые районы республики.',
        ],
      },
      {
        id: 's-pul-ishlash',
        q: 'Как TOPLA зарабатывает?',
        a: [
          'TOPLA взимает комиссию с продавца за каждый успешно проданный товар. Размер комиссии зависит от категории товара и составляет от 5% до 15%. Это значит — для покупателей использование платформы абсолютно бесплатно.',
          'В будущем для продавцов будут предложены дополнительные услуги: реклама товаров, премиум-размещение и другие маркетинговые инструменты.',
        ],
      },
      {
        id: 's-maxfiylik',
        q: 'Что насчёт конфиденциальности?',
        a: [
          'Мы серьёзно относимся к защите персональных данных пользователей. Все данные хранятся в зашифрованном виде и не передаются третьим лицам без вашего согласия. Мы полностью соблюдаем Закон Республики Узбекистан «О персональных данных».',
          'Данные вашей карты не хранятся на наших серверах — все платежи безопасно проходят через процессинг Octobank. Cookie-файлы используются только для улучшения работы сайта. Подробная информация — на странице политики конфиденциальности.',
        ],
      },
    ],
  },
  {
    id: 'buyurtma',
    title: 'Оформление заказа',
    note: 'Перед оформлением заказа рекомендуем ознакомиться с описанием товара, ценой и условиями доставки.',
    items: [
      {
        id: 's-qanday-buyurtma',
        q: 'Как оформить заказ?',
        a: [
          'Оформление заказа очень простое. Сначала найдите нужный товар — через поиск или через просмотр категорий. На странице товара выберите цвет, размер и количество, затем нажмите «В корзину».',
          'Перейдите в корзину и проверьте состав заказа. Укажите адрес доставки или выберите один из ранее сохранённых адресов. Выберите способ оплаты — банковская карта (Uzcard/Humo) или наличные. Нажмите «Оформить заказ».',
          'После подтверждения вы получите SMS-уведомление. Статус заказа можно отслеживать в реальном времени в разделе «Профиль → Мои заказы». При каждом изменении статуса придёт новое SMS.',
        ],
      },
      {
        id: 's-bekor-qilish',
        q: 'Можно ли отменить заказ?',
        a: [
          'Да, заказ можно отменить, но это зависит от его статуса. В статусе «Новый» — бесплатная отмена в любое время. В статусе «Готовится» — свяжитесь с поддержкой, отмена согласовывается с продавцом. В статусе «В пути» — заказ уже отправлен, отмена невозможна.',
          'Для отмены: в приложении перейдите в «Профиль → Мои заказы», выберите нужный заказ и нажмите «Отменить». При онлайн-оплате деньги вернутся на карту в течение 1-3 рабочих дней.',
        ],
      },
      {
        id: 's-minimal-summa',
        q: 'Есть ли минимальная сумма заказа?',
        a: [
          'Нет, на TOPLA нет минимальной суммы заказа. Вы можете заказать любое количество товаров — от небольшого аксессуара до крупной техники. Однако стоимость доставки рассчитывается в зависимости от суммы заказа, веса и расстояния.',
          'Некоторые продавцы предлагают бесплатную доставку при заказе от определённой суммы. Эта информация отображается на странице товара и при оформлении заказа.',
        ],
      },
      {
        id: 's-buyurtma-holat',
        q: 'Как отследить статус заказа?',
        a: [
          'Статус заказа можно отслеживать в приложении: «Профиль → Мои заказы». Каждый заказ может быть в одном из статусов: Новый — заказ принят; Готовится — продавец готовит заказ; В пути — заказ передан курьеру; Доставлен — заказ прибыл по адресу; Отменён.',
          'При каждом изменении статуса вам отправляется SMS. Также можно включить push-уведомления для получения информации в реальном времени. При возникновении проблем — обращайтесь в поддержку.',
        ],
      },
      {
        id: 's-turli-dokonlar',
        q: 'Можно ли заказать у разных магазинов?',
        a: [
          'Да, вы можете добавить товары от нескольких продавцов в корзину. При подтверждении заказа для каждого продавца создаётся отдельный заказ. Это означает, что товары от разных продавцов могут быть доставлены в разное время и разными курьерами.',
          'Статус каждого отдельного заказа отслеживается независимо. Оплата производится один раз — платформа распределяет сумму между продавцами.',
        ],
      },
      {
        id: 's-narx-ozgarishi',
        q: 'Может ли измениться цена после подтверждения заказа?',
        a: [
          'Нет. Цена на момент подтверждения заказа является окончательной. Даже если продавец изменит цену — ваш заказ сохраняется по первоначальной стоимости. Это гарантия платформы TOPLA.',
        ],
      },
    ],
  },
  {
    id: 'yetkazish',
    title: 'Доставка',
    items: [
      {
        id: 's-yetkazish-vaqt',
        q: 'Сколько времени занимает доставка?',
        a: [
          'Сроки доставки зависят от вашего местоположения и адреса продавца. По Ташкенту — обычно 1–3 рабочих дня. В областные центры Узбекистана — 2–5 рабочих дней. В отдалённые районы и посёлки — 3–7 рабочих дней.',
          'Точные сроки указаны на странице товара и при оформлении заказа. В праздничные и выходные дни сроки могут увеличиться.',
        ],
      },
      {
        id: 's-yetkazish-narx',
        q: 'Сколько стоит доставка?',
        a: [
          'Стоимость доставки зависит от нескольких факторов: сумма заказа, вес и габариты товара, расстояние доставки. Точная стоимость рассчитывается при оформлении заказа — никаких скрытых платежей.',
          'Некоторые продавцы предлагают бесплатную доставку при заказах выше определённой суммы. Например, при заказе от 100,000 сум доставка может быть бесплатной. Это чётко указано на странице товара.',
        ],
      },
      {
        id: 's-manzil-ozgartirish',
        q: 'Можно ли изменить адрес после заказа?',
        a: [
          'Если заказ ещё не отправлен — да, адрес можно изменить. Для этого свяжитесь с поддержкой через Telegram-бот или email. Укажите номер заказа и новый адрес.',
          'Если заказ уже отправлен — изменение адреса невозможно. В таком случае вы можете принять заказ и при необходимости начать процедуру возврата.',
        ],
      },
      {
        id: 's-olib-ketish',
        q: 'Есть ли самовывоз?',
        a: [
          'Пока через TOPLA доступна только доставка. В ближайшее время по Узбекистану будут открыты пункты самовывоза (pickup points). Об этом мы сообщим через уведомления в приложении и в наших социальных сетях.',
        ],
      },
      {
        id: 's-fbs-dbs',
        q: 'Что такое FBS и DBS?',
        a: [
          'На TOPLA существуют две модели доставки. FBS (Fulfilled by Seller) — продавец сам упаковывает, отправляет и доставляет товар. В этом случае сроки и стоимость доставки зависят от продавца.',
          'DBS (Delivery by Service) — продавец готовит и упаковывает товар, а курьерская служба TOPLA доставляет покупателю. При этой модели качество и скорость доставки контролируются TOPLA.',
          'Какая модель используется — указано на странице товара. В обоих случаях статус заказа отслеживается в реальном времени.',
        ],
      },
      {
        id: 's-hudud',
        q: 'В какие регионы осуществляется доставка?',
        a: [
          'TOPLA доставляет по всей Республике Узбекистан. Ташкент и Ташкентская область, Самарканд, Бухара, Наманган, Фергана, Андижан, Хорезм, Навои, Кашкадарья, Сурхандарья, Джизак, Сырдарья и Республика Каракалпакстан.',
          'Доставка в крупные города и областные центры — быстрее и дешевле. В удалённые районы доставка может занять немного больше времени.',
        ],
      },
    ],
  },
  {
    id: 'tolov',
    title: 'Оплата',
    items: [
      {
        id: 's-tolov-usullari',
        q: 'Какие способы оплаты доступны?',
        a: [
          'На TOPLA доступны следующие способы оплаты. Банковская карта — принимаются карты Uzcard и Humo. Все карточные платежи проходят через безопасный процессинг Octobank. Данные вашей карты не хранятся на наших серверах.',
          'Наличные — оплата курьеру при получении. Этот способ доступен во всех регионах. Курьер выдаст вам чек.',
          'Все онлайн-транзакции защищены SSL-шифрованием. При ошибках в платеже сумма автоматически возвращается на карту.',
        ],
      },
      {
        id: 's-tolov-xavfsiz',
        q: 'Безопасна ли онлайн-оплата?',
        a: [
          'Да, онлайн-оплата полностью безопасна. Все транзакции проходят через Octobank — лицензированный платёжный процессинг в Узбекистане. Номер карты, срок действия и CVV-код не хранятся на наших серверах.',
          'Процесс оплаты защищён SSL-шифрованием (HTTPS). Банк отправляет SMS с кодом подтверждения — это дополнительный уровень безопасности (3D Secure). Никто не сможет совершить платёж без вашего согласия.',
        ],
      },
      {
        id: 's-pul-qaytarish',
        q: 'Сколько времени занимает возврат денег?',
        a: [
          'При онлайн-оплате — деньги возвращаются на карту в течение 1–3 рабочих дней. В некоторых случаях обработка банком может занять до 5 рабочих дней. О статусе возврата вы будете уведомлены в приложении и по SMS.',
          'При оплате наличными — если вы отменили ещё не доставленный заказ, никакая оплата не взимается. При возврате товара деньги возвращаются через курьера или засчитываются как скидка к следующему заказу.',
        ],
      },
      {
        id: 's-chek',
        q: 'Выдаётся ли чек?',
        a: [
          'Да, для каждого заказа автоматически создаётся электронный чек. Чек отправляется по SMS и email (если указан). Также на странице заказа доступна возможность просмотра и скачивания чека.',
          'Электронный чек оформляется в соответствии с налоговым законодательством Республики Узбекистан и имеет юридическую силу.',
        ],
      },
      {
        id: 's-bolib-tolash',
        q: 'Есть ли рассрочка?',
        a: [
          'Да, на платформе TOPLA доступна рассрочка (оплата в рассрочку). Услуга работает через систему Octobank installment для банковских карт. Срок рассрочки — от 3 до 24 месяцев на выбор.',
          'Процентная ставка и сумма ежемесячного платежа точно указываются при оформлении заказа. Ежемесячные платежи автоматически списываются с карты.',
        ],
      },
    ],
  },
  {
    id: 'qaytarish',
    title: 'Возврат и обмен',
    note: 'Наша политика возврата направлена на защиту прав покупателей. Подробнее — на странице Политики возврата.',
    items: [
      {
        id: 's-qaytarish',
        q: 'Можно ли вернуть товар?',
        a: [
          'Да, товар надлежащего качества можно вернуть в течение 14 дней с момента получения. Для возврата товар должен быть неиспользованным, сохранять товарный вид и находиться в оригинальной упаковке. Потребуется документ, подтверждающий покупку (электронный чек или номер заказа).',
          'Товары ненадлежащего качества (с дефектами) можно вернуть в течение 30 дней — это касается производственного брака, неправильного товара или повреждения при доставке. В таких случаях расходы на возврат покрывает TOPLA или продавец.',
        ],
      },
      {
        id: 's-qaytarib-bolmaydi',
        q: 'Какие товары нельзя вернуть?',
        a: [
          'Не подлежат возврату: средства личной гигиены (во вскрытой упаковке), нижнее бельё и купальники, вскрытая или использованная парфюмерия и косметика, товары, изготовленные по индивидуальному заказу, активированные компьютерные программы и цифровой контент.',
          'Если товар с дефектом — он подлежит возврату даже из вышеуказанного списка. Например, бракованное нижнее бельё или повреждённая парфюмерия подлежат возврату.',
        ],
      },
      {
        id: 's-nosoz-mahsulot',
        q: 'Пришёл бракованный товар, что делать?',
        a: [
          'Если пришёл бракованный, повреждённый или неправильный товар — обратитесь в поддержку в течение 24 часов. Опишите проблему и отправьте фото или видео товара — это поможет быстрее решить вопрос.',
          'Мы ответим в течение 24 часов и начнём процедуру возврата. При возврате бракованного товара доставку оплачиваем мы. Деньги вернутся на карту в течение 1-3 рабочих дней или будет произведена замена.',
        ],
      },
      {
        id: 's-almashtirish',
        q: 'Можно ли обменять товар?',
        a: [
          'Да, товар можно обменять на другой цвет, размер или модель — если нужный вариант есть у продавца. Для обмена обратитесь в службу поддержки и укажите, какой вариант вам нужен.',
          'Обмен осуществляется в течение 14 дней. Товар должен быть неиспользованным и в оригинальной упаковке. Если новый вариант отличается по цене — разница доплачивается или возвращается.',
        ],
      },
      {
        id: 's-qaytarish-jarayon',
        q: 'Как проходит процесс возврата?',
        a: [
          'Возврат проходит в 4 этапа. 1 этап: Обращение в поддержку — отправьте заявку через Telegram-бот или на support@topla.uz, укажите номер заказа и причину. 2 этап: Рассмотрение заявки — мы ответим в течение 24 часов.',
          '3 этап: Возврат товара — курьер заберёт товар или вы отправите его почтой (для бракованных товаров — за наш счёт). 4 этап: Возврат денег — после проверки товара деньги вернутся на карту в течение 1-3 рабочих дней.',
        ],
      },
    ],
  },
  {
    id: 'hisob',
    title: 'Аккаунт и безопасность',
    items: [
      {
        id: 's-royxatdan-otish',
        q: 'Как зарегистрироваться?',
        a: [
          'Регистрация очень проста и занимает 1 минуту. Введите номер телефона — по SMS придёт 6-значный код подтверждения. После ввода кода укажите имя — и профиль готов!',
          'Также можно войти в один клик через Google. Нажмите «Войти через Google», выберите аккаунт — профиль создастся автоматически или привяжется к существующему. Номер телефона и аккаунт Google могут быть привязаны к одному профилю.',
        ],
      },
      {
        id: 's-google-kirish',
        q: 'Можно ли войти через Google?',
        a: [
          'Да, на TOPLA доступен вход через Google. На странице входа нажмите «Войти через Google» и выберите аккаунт. Если вы входите впервые — автоматически создастся новый профиль. Если ранее создавали аккаунт по номеру телефона — Google-аккаунт привяжется к существующему профилю.',
        ],
      },
      {
        id: 's-telefon-ozgartirish',
        q: 'Можно ли сменить номер телефона?',
        a: [
          'Пока смена номера телефона напрямую из приложения недоступна. Если номер изменился — обратитесь в поддержку. Для подтверждения личности могут запросить старый номер и другую информацию.',
          'В целях безопасности смена номера выполняется вручную. В ближайшее время функция смены номера через приложение будет добавлена.',
        ],
      },
      {
        id: 's-malumotlar-xavfsiz',
        q: 'В безопасности ли мои данные?',
        a: [
          'Да, мы серьёзно относимся к безопасности ваших данных. Все данные хранятся на серверах с шифрованием по стандарту AES-256. Резервные копии базы данных создаются регулярно.',
          'Мы соблюдаем Закон Республики Узбекистан «О персональных данных». Ваши данные не передаются третьим лицам без вашего согласия (за исключением случаев, предусмотренных законом). Подробности — на странице Политики конфиденциальности.',
        ],
      },
      {
        id: 's-hisob-ochirish',
        q: 'Можно ли удалить аккаунт?',
        a: [
          'Да, вы можете удалить аккаунт в любое время. Для этого перейдите в «Профиль → Настройки → Удалить аккаунт» или посетите страницу topla.uz/delete-account.',
          'При удалении аккаунта все ваши персональные данные, история заказов, избранное и сохранённые адреса будут удалены. Этот процесс необратим. При наличии активных заказов — сначала завершите или отмените их.',
        ],
      },
    ],
  },
  {
    id: 'sotuvchilar',
    title: 'Для продавцов',
    items: [
      {
        id: 's-sotuvchi-bolish',
        q: 'Можно ли стать продавцом на TOPLA?',
        a: [
          'Да! Любое зарегистрированное в Узбекистане ИП или ООО может стать продавцом. Перейдите на vendor.topla.uz, зарегистрируйтесь и загрузите необходимые документы.',
          'Проверка документов занимает 1-2 рабочих дня. После одобрения вы сможете начать размещать товары. Платформа предоставляет инструменты управления товарами, отслеживания заказов, финансовой отчётности и чата с покупателями.',
        ],
      },
      {
        id: 's-hujjatlar',
        q: 'Какие документы нужны?',
        a: [
          'Для регистрации в качестве продавца необходимы: свидетельство ИП или учредительные документы ООО, ИНН, банковские реквизиты (номер счёта, название банка, МФО), копия паспорта (для ИП) и электронная подпись договора через Didox.',
          'Все документы подаются через загрузку в системе vendor.topla.uz. Проверка модераторами занимает 1-2 рабочих дня. При ошибках в документах вас уведомят о необходимости исправлений.',
        ],
      },
      {
        id: 's-komissiya',
        q: 'Какая комиссия?',
        a: [
          'TOPLA взимает комиссию за каждый успешно проданный товар. Размер зависит от категории товара: от 5% до 15%. Например, электроника — 7-10%, одежда — 10-15%, продукты питания — 5-8%.',
          'Комиссия взимается только за успешно завершённые заказы. За отменённые или возвращённые заказы комиссия не берётся. Точные ставки указаны в личном кабинете продавца.',
        ],
      },
      {
        id: 's-reyting',
        q: 'Как формируется рейтинг продавца?',
        a: [
          'Рейтинг продавца рассчитывается на основе нескольких показателей: оценки покупателей (1-5 звёзд), соблюдение сроков доставки, уровень возвратов (чем меньше — тем лучше), скорость ответа клиентам и точность описания товаров.',
          'Продавцы с высоким рейтингом отображаются выше в результатах поиска и легче завоёвывают доверие покупателей. Рейтинг регулярно обновляется и доступен в кабинете продавца.',
        ],
      },
      {
        id: 's-mahsulot-joylashtirish',
        q: 'Как разместить товары?',
        a: [
          'Размещение товаров осуществляется в кабинете продавца на vendor.topla.uz. Перейдите в раздел «Товары → Добавить». Укажите название, описание (на узбекском и русском), цену, категорию, загрузите фотографии (минимум 3 качественных снимка) и дополнительные характеристики (цвет, размер, вес).',
          'После прохождения модерации товар появится на платформе. Модерация обычно занимает 2-4 часа. При проблемах с описанием вас уведомят о необходимости исправлений.',
        ],
      },
    ],
  },
  {
    id: 'texnik',
    title: 'Технические вопросы',
    items: [
      {
        id: 's-qurilmalar',
        q: 'На каких устройствах работает TOPLA?',
        a: [
          'Мобильное приложение TOPLA работает на Android 6.0 и выше. Приложение бесплатно доступно в Google Play. Версия для iOS (iPhone) будет запущена в ближайшее время.',
          'Веб-версия (topla.uz) работает во всех современных браузерах — Google Chrome, Safari, Mozilla Firefox, Microsoft Edge. Сайт адаптирован под мобильные устройства, поэтому удобен и в мобильном браузере.',
        ],
      },
      {
        id: 's-bildirishnomalar',
        q: 'Не приходят уведомления, что делать?',
        a: [
          'Сначала проверьте, разрешены ли уведомления для TOPLA в настройках телефона. На Android: Настройки → Приложения → TOPLA → Уведомления — все уведомления должны быть включены.',
          'Режим энергосбережения может блокировать уведомления. На Samsung и Xiaomi добавьте приложение в список «защищённых приложений». Если проблема сохраняется — переустановите приложение.',
        ],
      },
      {
        id: 's-sekin-ishlayapti',
        q: 'Приложение тормозит, что делать?',
        a: [
          'Обновите приложение до последней версии — нажмите «Обновить» в Google Play. Очистите кэш: Настройки → Приложения → TOPLA → Хранилище → Очистить кэш. Проверьте стабильность интернет-соединения.',
          'Если проблема сохраняется — удалите и установите приложение заново. Ваш аккаунт хранится в облаке, поэтому при повторном входе все данные восстановятся.',
        ],
      },
      {
        id: 's-til-ozgartirish',
        q: 'Как сменить язык?',
        a: [
          'На сайте нажмите на переключатель языка в верхней части страницы — выберите «UZ» или «RU». Язык сменится мгновенно, и ваш выбор сохранится.',
          'В мобильном приложении: Профиль → Настройки → Язык. Сейчас поддерживаются узбекский и русский языки.',
        ],
      },
    ],
  },
]

/* ─── Language Dropdown ─── */
function LanguageSwitcher() {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const languages = [
    { code: 'uz' as const, label: "O'zbek" },
    { code: 'ru' as const, label: 'Русский' },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[15px] text-[#168acd] hover:text-[#0e6dad] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span className="font-medium">{locale.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l3 3 3-3"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-[14px] transition-colors ${
                locale === lang.code
                  ? 'text-[#168acd] bg-blue-50 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── TOC Link ─── */
function TocLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${id}`}
      className="text-[#168acd] hover:text-[#0e6dad] hover:underline transition-colors text-[14px] leading-relaxed"
      onClick={(e) => {
        e.preventDefault()
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.history.replaceState(null, '', `/faq#${id}`)
        }
      }}
    >
      {children}
    </a>
  )
}

/* ─── Main FAQ Page ─── */
export default function FaqPage() {
  const locale = useLocaleStore((s) => s.locale)
  const isRu = locale === 'ru'
  const sections = isRu ? faqRu : faqUz
  const telegramLink = useTelegramLink()
  const telegramHandle = useTelegramHandle()
  const supportPhone = useSupportPhone()
  const email = useSupportEmail()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Telegram-style Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-[720px] mx-auto px-4 h-[50px] flex items-center justify-between">
          <div className="flex items-center gap-0">
            <Link
              href="/"
              className="px-3 py-2 text-[15px] text-[#168acd] hover:text-[#0e6dad] transition-colors"
            >
              {isRu ? 'Главная' : 'Bosh sahifa'}
            </Link>
            <span className="text-[15px] font-semibold text-gray-900 px-3 py-2 border-b-[3px] border-[#168acd] -mb-[1px]">
              FAQ
            </span>
            <Link
              href="https://play.google.com/store/apps/details?id=uz.topla.app"
              className="px-3 py-2 text-[15px] text-[#168acd] hover:text-[#0e6dad] transition-colors"
              target="_blank"
            >
              {isRu ? 'Приложение' : 'Ilovalar'}
            </Link>
          </div>
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="max-w-[720px] mx-auto px-4">
        {/* Title */}
        <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 mt-8 mb-6">
          TOPLA FAQ
        </h1>

        {/* Intro */}
        <blockquote className="border-l-[3px] border-[#168acd] pl-4 my-6 text-[15px] text-gray-600 leading-relaxed">
          {isRu
            ? 'Этот FAQ содержит ответы на основные вопросы о платформе TOPLA.UZ. Для подробной информации о политике возврата, условиях использования и конфиденциальности — перейдите на соответствующие страницы.'
            : 'Ushbu FAQ TOPLA.UZ platformasi haqidagi asosiy savollarga javob beradi. Qaytarish siyosati, foydalanish shartlari va maxfiylik haqida batafsil ma\'lumot — tegishli sahifalarda.'}
        </blockquote>

        <hr className="border-gray-200 my-6" />

        <blockquote className="border-l-[3px] border-[#168acd] pl-4 my-6 text-[15px] text-gray-600 leading-relaxed">
          {isRu
            ? 'TOPLA постоянно развивается и добавляет новые возможности. Некоторые ответы могут быть обновлены по мере изменения функционала.'
            : 'TOPLA doimiy ravishda rivojlanib, yangi imkoniyatlar qo\'shib boradi. Ba\'zi javoblar funksionallik o\'zgarishi bilan yangilanishi mumkin.'}
        </blockquote>

        <hr className="border-gray-200 my-6" />

        {/* Table of Contents */}
        <div className="space-y-6 mb-10">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{section.title}</h3>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <div key={item.id}>
                    <TocLink id={item.id}>{item.q}</TocLink>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <hr className="border-gray-200 my-8" />

        {/* FAQ Sections */}
        {sections.map((section, si) => (
          <div key={section.id}>
            <section id={section.id} className="scroll-mt-16">
              <h2 className="text-[22px] font-bold text-gray-900 mt-10 mb-4">
                {section.title}
              </h2>

              {section.note && (
                <blockquote className="border-l-[3px] border-[#168acd] pl-4 mb-6 text-[15px] text-gray-600 leading-relaxed">
                  {section.note}
                </blockquote>
              )}

              {section.items.map((item) => (
                <div key={item.id} id={item.id} className="scroll-mt-16 mb-8">
                  <h4 className="text-[16px] font-bold text-gray-900 mb-3">
                    {isRu ? 'В' : 'S'}: {item.q}
                  </h4>
                  <div className="space-y-3">
                    {item.a.map((paragraph, pi) => (
                      <p key={pi} className="text-[15px] text-gray-600 leading-[1.75]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {si < sections.length - 1 && <hr className="border-gray-200 my-4" />}
          </div>
        ))}

        {/* Support Section */}
        <hr className="border-gray-200 my-8" />

        <section className="mb-8" id="qollab-quvvatlash">
          <h2 className="text-[22px] font-bold text-gray-900 mb-4">
            {isRu ? 'Поддержка TOPLA' : 'TOPLA qo\'llab-quvvatlash'}
          </h2>
          <p className="text-[15px] text-gray-600 leading-[1.75] mb-4">
            {isRu
              ? 'Если вы не нашли ответ на свой вопрос — свяжитесь со службой поддержки. Мы ответим в течение 5 минут.'
              : 'Agar savolingizga javob topolmagan bo\'lsangiz — qo\'llab-quvvatlash xizmatiga murojaat qiling. 5 daqiqada javob beramiz.'}
          </p>
          <div className="space-y-2 text-[15px]">
            <p>
              <span className="text-gray-500">{isRu ? 'Telegram:' : 'Telegram:'}</span>{' '}
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="text-[#168acd] hover:underline">
                {telegramHandle}
              </a>
            </p>
            <p>
              <span className="text-gray-500">{isRu ? 'Телефон:' : 'Telefon:'}</span>{' '}
              <a href={`tel:+${supportPhone.replace(/\D/g, '')}`} className="text-[#168acd] hover:underline">
                {supportPhone}
              </a>
            </p>
            <p>
              <span className="text-gray-500">Email:</span>{' '}
              <a href={`mailto:${email}`} className="text-[#168acd] hover:underline">
                {email}
              </a>
            </p>
          </div>
        </section>

        {/* Related Pages */}
        <hr className="border-gray-200 my-6" />

        <div className="flex flex-wrap gap-4 text-[14px] mb-4">
          <Link href="/terms" className="text-[#168acd] hover:underline font-medium">
            {isRu ? 'Условия использования' : 'Foydalanish shartlari'}
          </Link>
          <Link href="/privacy" className="text-[#168acd] hover:underline font-medium">
            {isRu ? 'Конфиденциальность' : 'Maxfiylik siyosati'}
          </Link>
          <Link href="/refund-policy" className="text-[#168acd] hover:underline font-medium">
            {isRu ? 'Политика возврата' : 'Qaytarish siyosati'}
          </Link>
        </div>
      </div>

      {/* Bottom footer */}
      <footer className="border-t border-gray-200 mt-10 bg-gray-50/80">
        <div className="max-w-[720px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-[13px]">
              <Link href="/" className="text-[#168acd] hover:underline">
                {isRu ? 'Главная' : 'Bosh sahifa'}
              </Link>
              <span className="text-gray-600 font-medium">FAQ</span>
              <Link
                href="https://play.google.com/store/apps/details?id=uz.topla.app"
                className="text-[#168acd] hover:underline"
                target="_blank"
              >
                {isRu ? 'Приложение' : 'Ilovalar'}
              </Link>
              <Link href="/terms" className="text-[#168acd] hover:underline">
                {isRu ? 'Условия' : 'Shartlar'}
              </Link>
              <Link href="/privacy" className="text-[#168acd] hover:underline">
                {isRu ? 'Конфиденциальность' : 'Maxfiylik'}
              </Link>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-[13px] text-[#168acd] hover:underline"
            >
              {isRu ? '↑ Наверх' : '↑ Yuqoriga'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocaleStore } from '@/store/locale-store'
import { useTelegramLink, useTelegramHandle, useSupportPhone, useSupportEmail } from '@/hooks/useSettings'

type FaqItem = { q: string; a: string }
type FaqCategory = { emoji: string; title: string; items: FaqItem[] }

const faqUz: FaqCategory[] = [
  {
    emoji: '🛒',
    title: 'Buyurtma berish',
    items: [
      { q: "Qanday qilib buyurtma beraman?", a: "Kerakli mahsulotni tanlang, \"Savatga qo'shish\" tugmasini bosing. Savatga o'tib buyurtma tarkibini tekshiring. Keyin yetkazib berish manzilini kiriting va to'lov usulini tanlang. Buyurtma tasdiqlangandan so'ng sizga SMS orqali bildirishnoma yuboriladi." },
      { q: "Buyurtmani bekor qilsam bo'ladimi?", a: "\"Yangi\" holatida bepul bekor qilish mumkin. \"Tayyorlanmoqda\" holatida qo'llab-quvvatlash xizmatiga murojaat qiling. \"Yo'lda\" holatida bekor qilish imkoni yo'q. Bekor qilish uchun: Profilim → Buyurtmalarim → Buyurtmani tanlang → \"Bekor qilish\"." },
      { q: "Minimal buyurtma summasi bormi?", a: "Minimal buyurtma summasi yo'q. Siz istalgan miqdordagi mahsulotni buyurtma qilishingiz mumkin. Lekin yetkazib berish narxi buyurtma summasiga qarab hisoblanadi." },
      { q: "Buyurtma holatini qanday kuzataman?", a: "Ilovada: Profilim → Buyurtmalarim. Har bir holat o'zgarganda SMS yuboriladi. Shuningdek, push-bildirishnomalarni yoqib real vaqtda kuzatishingiz mumkin." },
      { q: "Turli do'konlardan bir buyurtma qilsam bo'ladimi?", a: "Ha, turli sotuvchilardan mahsulotlarni savatga qo'shishingiz mumkin. Har bir sotuvchidan alohida buyurtma yaratiladi va alohida yetkaziladi." },
    ],
  },
  {
    emoji: '🚚',
    title: 'Yetkazib berish',
    items: [
      { q: "Yetkazib berish qancha vaqt oladi?", a: "Toshkent shahri bo'ylab 1–3 ish kuni. O'zbekiston viloyatlariga 2–5 ish kuni. Masofadagi hududlarga 3–7 ish kuni. Yetkazish muddati sotuvchining joylashuviga ham bog'liq." },
      { q: "Yetkazib berish narxi qancha?", a: "Yetkazib berish narxi buyurtma summasi, mahsulot og'irligi va yetkazish masofasiga bog'liq. Aniq narx buyurtma rasmiylashtirishda ko'rsatiladi. Ba'zi sotuvchilar ma'lum summadan oshgan buyurtmalarda bepul yetkazish taklif qiladi." },
      { q: "Manzilimni buyurtmadan keyin o'zgartira olamanmi?", a: "Agar buyurtma hali jo'natilmagan bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qilib manzilni o'zgartirish mumkin. Buyurtma jo'natilgandan keyin manzil o'zgartirilmaydi." },
      { q: "O'zim borib olsam bo'ladimi?", a: "Hozircha Topla.uz orqali faqat yetkazib berish xizmati mavjud. Tez orada olib ketish punktlari (pickup point) ham ishga tushiriladi." },
      { q: "Yetkazish FBS va DBS nima?", a: "FBS (Fulfilled by Seller) — sotuvchi o'zi jo'natadi va yetkazadi. DBS (Delivery by Service) — sotuvchi tayyorlaydi, Topla kuryer xizmati yetkazadi. Yetkazish modeli mahsulot sahifasida ko'rsatiladi." },
    ],
  },
  {
    emoji: '💳',
    title: "To'lov",
    items: [
      { q: "Qanday to'lov usullari mavjud?", a: "Bank kartasi (Uzcard, Humo) — Octobank xavfsiz processing orqali. Naqd pul — yetkazib berishda kuryerga to'lash. Barcha onlayn to'lovlar SSL-shifrlash bilan himoyalangan." },
      { q: "Onlayn to'lov xavfsizmi?", a: "Ha, barcha to'lovlar Octobank process orqali amalga oshiriladi. Karta ma'lumotlaringiz bizning serverlarimizda saqlanmaydi. To'lov jarayoni SSL-shifrlash bilan himoyalangan." },
      { q: "Pul qaytarish qancha vaqt oladi?", a: "Onlayn to'lov uchun — 1–3 ish kuni kartangizga qaytariladi. Naqd to'lov uchun — 1 ish kuni ichida kuryerga qaytariladi yoki keyingi buyurtmadan chegiriladi." },
      { q: "Chek olamanmi?", a: "Ha, har bir buyurtma uchun elektron chek SMS va email orqali yuboriladi. Buyurtma sahifasida ham yuklab olish mumkin." },
    ],
  },
  {
    emoji: '🔄',
    title: 'Qaytarish va almashtirish',
    items: [
      { q: "Mahsulotni qaytarsam bo'ladimi?", a: "Ha, mahsulot qabul qilingan kundan boshlab 7 kun ichida qaytarish mumkin. Mahsulot ishlatilmagan va asl qadoqda bo'lishi kerak." },
      { q: "Qaysi mahsulotlarni qaytarib bo'lmaydi?", a: "Shaxsiy gigiena vositalari (ochilgan), ichki kiyim, kompyuter dasturlari (faollashtirilgan), maxsus buyurtma asosida tayyorlangan mahsulotlar qaytarilmaydi." },
      { q: "Nosoz mahsulot kelsa nima qilaman?", a: "Nosoz yoki buzilgan mahsulot kelsa 24 soat ichida qo'llab-quvvatlash xizmatiga murojaat qiling. Rasm yoki video yuboring. Biz 24 soat ichida javob beramiz va qaytarishni bizning hisobimizga amalga oshiramiz." },
      { q: "Almashtirib bersam bo'ladimi?", a: "Ha, mahsulotni boshqa rangga yoki o'lchamga almashtirish mumkin, agar sotuvchida mavjud bo'lsa. Qo'llab-quvvatlash xizmatiga murojaat qiling." },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Hisob va xavfsizlik',
    items: [
      { q: "Qanday ro'yxatdan o'taman?", a: "Telefon raqamingizni kiriting — SMS orqali tasdiqlash kodi yuboriladi. Kodni kiritgandan so'ng ismingizni yozing. Tayyor! Shuningdek Google orqali ham kirishingiz mumkin." },
      { q: "Google orqali kirsam bo'ladimi?", a: "Ha, kirish sahifasida \"Google orqali kirish\" tugmasini bosing. Google hisobingizni tanlang — avtomatik ravishda profil yaratiladi yoki mavjud profilga ulanadi." },
      { q: "Telefon raqamimni o'zgartirsam bo'ladimi?", a: "Hozircha telefon raqamni o'zgartirish imkoni yo'q. Yangi raqam bilan yangi hisob ochishingiz mumkin. Bu borada qo'llab-quvvatlash xizmatiga murojaat qiling." },
      { q: "Ma'lumotlarim xavfsizmi?", a: "Ha, barcha shaxsiy ma'lumotlar shifrlangan holda saqlanadi. Biz O'zbekiston Respublikasining \"Shaxsiy ma'lumotlar to'g'risida\" qonuniga amal qilamiz. Batafsil: Maxfiylik siyosati sahifamizda." },
    ],
  },
  {
    emoji: '⚙️',
    title: 'Texnik savollar',
    items: [
      { q: "Ilova qaysi qurilmalarda ishlaydi?", a: "Android 6.0 va undan yuqori, iOS 13.0 va undan yuqori versiyalarda ishlaydi. Veb-versiya barcha zamonaviy brauzerlarda ishlaydi (Chrome, Safari, Firefox, Edge)." },
      { q: "Bildirishnomalar kelmayapti, nima qilaman?", a: "Telefon sozlamalarida Topla ilovasiga bildirishnoma yuborish ruxsatini tekshiring. Batareya tejash rejimi bildirishnomalarni bloklashi mumkin — uni o'chiring." },
      { q: "Ilova sekin ishlayapti, nima qilaman?", a: "Ilovani oxirgi versiyaga yangilang. Telefon keshini tozalang. Internet aloqangizni tekshiring. Muammo davom etsa, ilovani o'chirib qayta o'rnating." },
      { q: "Tilni qanday o'zgartiraman?", a: "Yuqori qismdagi bayroq ikonkasini bosing va kerakli tilni tanlang. Til darhol o'zgaradi." },
    ],
  },
  {
    emoji: '🏪',
    title: "Sotuvchilar haqida",
    items: [
      { q: "Topla.uz da sotuvchi bo'lsam bo'ladimi?", a: "Ha! Har qanday YaTT yoki MCHJ sotuvchi bo'lishi mumkin. vendor.topla.uz sahifasiga o'ting, ro'yxatdan o'ting, hujjatlaringizni yuklang — 1-2 ish kunida tekshiriladi." },
      { q: "Sotuvchi komissiya to'laydimi?", a: "Ha, har bir sotilgan mahsulot uchun platforma komissiyasi olinadi. Komissiya miqdori kategoriyaga bog'liq va 5-15% orasida." },
      { q: "Sotuvchining reytingi qanday hisoblanadi?", a: "Xaridorlar baholari, yetkazish tezligi, qaytarish darajasi va mijozlarga javob berish tezligiga qarab hisoblanadi." },
    ],
  },
  {
    emoji: '📦',
    title: 'Boshqa savollar',
    items: [
      { q: "Aksiya va chegirmalar haqida qanday bilaman?", a: "Bosh sahifadagi bannerlar va \"Chegirmalar\" bo'limida barcha joriy aksiyalar ko'rsatiladi. Push-bildirishnomalarni yoqsangiz yangi aksiyalar haqida xabar olasiz." },
      { q: "Ilova yangilanishlarini qanday olaman?", a: "Google Play yoki App Store orqali avtomatik yangilanadi. Sozlamalarda avtomatik yangilashni yoqing." },
      { q: "Topla.uz ilovasida muammo topdim. Kimga yozaman?", a: "Telegram bot orqali yoki support@topla.uz ga yozing. Muammoning skrinshotini ham yuboring — bu tezroq hal qilishga yordam beradi." },
    ],
  },
]

const faqRu: FaqCategory[] = [
  {
    emoji: '🛒',
    title: 'Оформление заказа',
    items: [
      { q: "Как сделать заказ?", a: "Выберите товар и нажмите \"В корзину\". Перейдите в корзину и проверьте состав заказа. Укажите адрес доставки и выберите способ оплаты. После подтверждения вы получите SMS-уведомление." },
      { q: "Можно отменить заказ?", a: "В статусе \"Новый\" — бесплатная отмена. В статусе \"Готовится\" — обратитесь в поддержку. В статусе \"В пути\" — отмена невозможна. Для отмены: Профиль → Мои заказы → выберите заказ → \"Отменить\"." },
      { q: "Есть минимальная сумма заказа?", a: "Минимальной суммы нет. Вы можете заказать товар на любую сумму. Стоимость доставки рассчитывается отдельно." },
      { q: "Как отследить статус заказа?", a: "В приложении: Профиль → Мои заказы. SMS-уведомления приходят при каждом изменении статуса. Также можно включить push-уведомления." },
      { q: "Можно заказать у разных продавцов?", a: "Да, вы можете добавить товары от разных продавцов в корзину. Для каждого продавца создаётся отдельный заказ и доставка." },
    ],
  },
  {
    emoji: '🚚',
    title: 'Доставка',
    items: [
      { q: "Сколько времени занимает доставка?", a: "По Ташкенту — 1–3 рабочих дня. По регионам — 2–5 рабочих дней. В отдалённые районы — 3–7 рабочих дней. Срок зависит от расположения продавца." },
      { q: "Сколько стоит доставка?", a: "Стоимость зависит от суммы заказа, веса товара и расстояния. Точная цена отображается при оформлении. Некоторые продавцы предлагают бесплатную доставку при заказе от определённой суммы." },
      { q: "Можно изменить адрес после заказа?", a: "Если заказ ещё не отправлен — обратитесь в поддержку для изменения адреса. После отправки изменение невозможно." },
      { q: "Есть самовывоз?", a: "Пока доступна только доставка. Пункты самовывоза скоро появятся." },
      { q: "Что такое FBS и DBS?", a: "FBS (Fulfilled by Seller) — продавец сам отправляет и доставляет. DBS (Delivery by Service) — продавец готовит, курьер Topla доставляет. Модель указана на странице товара." },
    ],
  },
  {
    emoji: '💳',
    title: 'Оплата',
    items: [
      { q: "Какие способы оплаты доступны?", a: "Банковская карта (Uzcard, Humo) — через безопасный процессинг Octobank. Наличные — оплата курьеру при получении." },
      { q: "Безопасна ли онлайн-оплата?", a: "Да, все платежи проходят через Octobank. Данные карты не хранятся на наших серверах. Процесс защищён SSL-шифрованием." },
      { q: "Как быстро возвращаются деньги?", a: "При онлайн-оплате — 1–3 рабочих дня на карту. При оплате наличными — 1 рабочий день или зачёт в следующем заказе." },
      { q: "Выдаётся ли чек?", a: "Да, электронный чек отправляется по SMS и email. Его также можно скачать на странице заказа." },
    ],
  },
  {
    emoji: '🔄',
    title: 'Возврат и обмен',
    items: [
      { q: "Можно вернуть товар?", a: "Да, в течение 7 дней с момента получения. Товар должен быть неиспользованным и в оригинальной упаковке." },
      { q: "Какие товары нельзя вернуть?", a: "Средства личной гигиены (вскрытые), нижнее бельё, компьютерные программы (активированные), товары по индивидуальному заказу." },
      { q: "Пришёл бракованный товар, что делать?", a: "Обратитесь в поддержку в течение 24 часов. Отправьте фото или видео. Мы ответим в течение 24 часов и организуем возврат за наш счёт." },
      { q: "Можно обменять товар?", a: "Да, обмен на другой цвет или размер возможен, если товар есть у продавца. Обратитесь в поддержку." },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Аккаунт и безопасность',
    items: [
      { q: "Как зарегистрироваться?", a: "Введите номер телефона — придёт SMS с кодом. После подтверждения введите имя. Также можно войти через Google." },
      { q: "Можно войти через Google?", a: "Да, нажмите \"Войти через Google\" на странице входа. Выберите аккаунт — профиль создастся автоматически или привяжется к существующему." },
      { q: "Можно сменить номер телефона?", a: "Пока смена номера недоступна. Можно создать новый аккаунт или обратиться в поддержку." },
      { q: "Мои данные в безопасности?", a: "Да, все данные хранятся в зашифрованном виде. Мы соблюдаем Закон РУз «О персональных данных». Подробнее — в нашей Политике конфиденциальности." },
    ],
  },
  {
    emoji: '⚙️',
    title: 'Технические вопросы',
    items: [
      { q: "На каких устройствах работает?", a: "Android 6.0+, iOS 13.0+. Веб-версия работает во всех современных браузерах (Chrome, Safari, Firefox, Edge)." },
      { q: "Не приходят уведомления", a: "Проверьте разрешения уведомлений для Topla в настройках телефона. Режим энергосбережения может блокировать уведомления — отключите его." },
      { q: "Приложение тормозит", a: "Обновите до последней версии. Очистите кэш телефона. Проверьте интернет-соединение. Если проблема сохраняется — переустановите приложение." },
      { q: "Как сменить язык?", a: "Нажмите на значок флага вверху страницы и выберите нужный язык. Смена происходит мгновенно." },
    ],
  },
  {
    emoji: '🏪',
    title: 'О продавцах',
    items: [
      { q: "Можно стать продавцом?", a: "Да! Любое ИП или ООО может стать продавцом. Перейдите на vendor.topla.uz, зарегистрируйтесь, загрузите документы — проверка занимает 1-2 рабочих дня." },
      { q: "Какая комиссия у продавцов?", a: "За каждый проданный товар взимается комиссия платформы. Размер зависит от категории — от 5% до 15%." },
      { q: "Как формируется рейтинг?", a: "На основе оценок покупателей, скорости доставки, уровня возвратов и скорости ответа клиентам." },
    ],
  },
  {
    emoji: '📦',
    title: 'Прочие вопросы',
    items: [
      { q: "Как узнать об акциях?", a: "Баннеры на главной и раздел \"Скидки\". Включите push-уведомления, чтобы получать информацию о новых акциях." },
      { q: "Как обновить приложение?", a: "Через Google Play или App Store. Включите автоматическое обновление в настройках." },
      { q: "Нашёл ошибку в приложении", a: "Напишите в Telegram-бот или на support@topla.uz. Приложите скриншот — это поможет быстрее решить проблему." },
    ],
  },
]

function FaqQuestion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 text-left group"
      >
        <ChevronDown className={`w-4 h-4 text-blue-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`} />
        <span className="text-[15px] text-blue-600 group-hover:text-blue-700 transition-colors">{item.q}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-6 pb-3 text-[14px] text-gray-600 leading-relaxed">{item.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqPage() {
  const locale = useLocaleStore((s) => s.locale)
  const isRu = locale === 'ru'
  const allCategories = isRu ? faqRu : faqUz
  const telegramLink = useTelegramLink()
  const telegramHandle = useTelegramHandle()
  const supportPhone = useSupportPhone()
  const email = useSupportEmail()

  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const categories = useMemo(() => {
    if (!search.trim()) return allCategories
    const q = search.toLowerCase()
    return allCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search, allCategories])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto px-4 py-10 md:py-14">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {isRu ? 'Часто задаваемые вопросы' : "Ko'p so'raladigan savollar"}
          </h1>
          <p className="mt-2 text-blue-100 text-[15px]">
            {isRu
              ? 'Ответы на популярные вопросы о TOPLA.UZ'
              : "TOPLA.UZ platformasi haqida savollar va javoblar"}
          </p>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRu ? 'Поиск по вопросам...' : 'Savollarni qidirish...'}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/15 backdrop-blur text-white placeholder:text-blue-200 border border-white/20 outline-none focus:bg-white/25 transition-colors text-[15px]"
            />
          </div>
        </div>
      </div>

      {/* Quick nav */}
      {!search && (
        <div className="border-b border-gray-100 bg-gray-50/50">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-1 py-3 overflow-x-auto no-scrollbar">
              {allCategories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSection(i)
                    document.getElementById(`faq-section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    activeSection === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat.emoji} {cat.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ sections */}
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-[15px]">
              {isRu ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat, ci) => (
              <section key={ci} id={`faq-section-${ci}`} className="scroll-mt-20">
                <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <span>{cat.emoji}</span> {cat.title}
                </h2>
                <div className="border-l-2 border-gray-100 pl-2">
                  {cat.items.map((item, i) => (
                    <FaqQuestion key={i} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Contact */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-2">
            {isRu ? 'Не нашли ответ?' : 'Javob topolmadingizmi?'}
          </h2>
          <p className="text-[14px] text-gray-500 mb-4">
            {isRu
              ? 'Свяжитесь с поддержкой — ответим за 5 минут.'
              : "Qo'llab-quvvatlash bilan bog'laning — 5 daqiqada javob beramiz."}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              {telegramHandle}
            </a>
            <a
              href={`tel:+${supportPhone.replace(/\D/g, '')}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              📞 {supportPhone}
            </a>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              ✉️ {email}
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 pb-8 flex flex-wrap gap-4 text-sm">
          <Link href="/help" className="text-blue-600 hover:underline">
            {isRu ? 'Центр помощи →' : 'Yordam markazi →'}
          </Link>
          <Link href="/terms" className="text-blue-600 hover:underline">
            {isRu ? 'Соглашение →' : 'Foydalanish shartlari →'}
          </Link>
          <Link href="/privacy" className="text-blue-600 hover:underline">
            {isRu ? 'Конфиденциальность →' : 'Maxfiylik siyosati →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
