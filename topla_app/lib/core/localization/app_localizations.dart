import 'package:flutter/material.dart';

/// Ilova tarjimalari
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'uz': {
      // Umumiy
      'app_name': 'TOPLA',
      'ok': 'OK',
      'cancel': 'Bekor qilish',
      'save': 'Saqlash',
      'delete': 'O\'chirish',
      'edit': 'Tahrirlash',
      'close': 'Yopish',
      'back': 'Orqaga',
      'next': 'Keyingi',
      'done': 'Tayyor',
      'loading': 'Yuklanmoqda...',
      'error': 'Xatolik',
      'success': 'Muvaffaqiyatli',
      'retry': 'Qayta urinish',
      'yes': 'Ha',
      'no': 'Yo\'q',

      // Auth
      'login': 'Kirish',
      'logout': 'Chiqish',
      'register': 'Ro\'yxatdan o\'tish',
      'phone_number': 'Telefon raqam',
      'password': 'Parol',
      'confirm_password': 'Parolni tasdiqlash',
      'forgot_password': 'Parolni unutdingizmi?',
      'or_continue_with': 'Yoki davom eting',
      'enter_phone': 'Telefon raqamingizni kiriting',
      'enter_code': 'SMS kodni kiriting',
      'verification_code': 'Tasdiqlash kodi',
      'verify': 'Tasdiqlash',
      'resend_code': 'Kodni qayta yuborish',
      'login_with_phone': 'Telefon orqali kirish',
      'we_will_send_code': 'Sizga SMS kod yuboramiz',
      'continue': 'Davom etish',
      'terms_agree':
          'Davom etish orqali siz foydalanish shartlariga rozilik bildirasiz',
      'code_sent_to': 'Kod yuborildi',
      'resend_in': 'Qayta yuborish',
      'or_text': 'yoki',
      'login_with_google': 'Google orqali kirish',
      'sms_code_sent': 'SMS kod yuborildi',
      'enter_4_digit_code': '4 xonali kodni kiriting',
      'phone_required': 'Telefon raqamni kiriting',
      'phone_incomplete': 'Telefon raqam to\'liq emas',
      'resend': 'Qaytadan yuborish',
      'code_sent_to_number': 'ga yuborilgan kodni kiriting',
      'google_sign_in_error': 'Google kirish xatoligi',
      'no_internet_check': 'Internet aloqasi yo\'q. Iltimos, tarmoqni tekshiring',
      'invalid_otp': 'Kod xato yoki muddati tugagan',
      'phone_not_confirmed': 'Telefon tasdiqlanmagan',

      // Navigation
      'home': 'Asosiy',
      'catalog': 'Katalog',
      'cart': 'Savat',
      'favorites': 'Sevimlilar',
      'profile': 'Profil',

      // Home
      'search_hint': 'Mahsulot qidirish...',
      'categories': 'Kategoriyalar',
      'discounts': 'Chegirmalar',
      'popular': 'Mashhur',
      'new_arrivals': 'Yangi kelganlar',
      'see_all': 'Hammasini ko\'rish',
      'recommended': 'Tavsiya etilgan',
      'coupons': 'Kuponlar',

      // Product
      'add_to_cart': 'Savatga qo\'shish',
      'buy_now': 'Hozir sotib olish',
      'description': 'Tavsif',
      'reviews': 'Sharhlar',
      'specifications': 'Xususiyatlar',
      'in_stock': 'Mavjud',
      'out_of_stock': 'Tugagan',
      'quantity': 'Miqdor',
      'price': 'Narx',
      'total': 'Jami',
      'discount': 'Chegirma',
      'sold': 'Sotildi',
      'rating': 'Reyting',
      'added_to_cart': 'Savatga qo\'shildi',
      'share': 'Ulashish',
      'shared': 'Ulashish uchun tayyorlandi',

      // Cart
      'your_cart': 'Sizning savatingiz',
      'empty_cart': 'Savatingiz bo\'sh',
      'empty_cart_desc': 'Mahsulotlarni savatga qo\'shing va buyurtma bering',
      'checkout': 'Rasmiylashtirish',
      'promo_code': 'Promo kod',
      'apply': 'Qo\'llash',
      'subtotal': 'Oraliq jami',
      'shipping': 'Yetkazib berish',
      'free_shipping': 'Bepul yetkazib berish',
      'clear_cart': 'Savatni tozalash',
      'remove_item': 'Mahsulotni o\'chirish',
      'remove_item_confirm': 'Ushbu mahsulotni o\'chirishni xohlaysizmi?',

      // Favorites
      'your_favorites': 'Sevimlilar',
      'empty_favorites': 'Sevimlilar ro\'yxati bo\'sh',
      'empty_favorites_desc': 'Yoqtirgan mahsulotlaringizni\n❤️ bosib saqlang',
      'add_to_favorites': 'Sevimlilarga qo\'shish',
      'remove_from_favorites': 'Sevimlilardan o\'chirish',
      'removed_from_favorites': 'Sevimlilardan olib tashlandi',
      'add_favorites_hint': 'Mahsulotlarni ❤️ bosib qo\'shing',
      'clear_favorites': 'Sevimlilarni tozalash',
      'clear_favorites_confirm':
          'Barcha sevimli mahsulotlarni o\'chirishni xohlaysizmi?',
      'clear': 'Tozalash',
      'shop_now': 'Xarid qilish',
      'sold_count': 'sotilgan',

      // Profile
      'my_profile': 'Mening profilim',
      'personal_info': 'Shaxsiy ma\'lumotlar',
      'my_orders': 'Buyurtmalarim',
      'my_addresses': 'Manzillarim',
      'payment_methods': 'To\'lov usullari',
      'notifications': 'Bildirishnomalar',
      'settings': 'Sozlamalar',
      'help_center': 'Yordam markazi',
      'about_us': 'Biz haqimizda',
      'privacy_policy': 'Maxfiylik siyosati',
      'terms_conditions': 'Foydalanish shartlari',
      'invite_friends': 'Do\'stlarni taklif qilish',
      'rate_app': 'Ilovani baholash',
      'language': 'Til',

      // Orders
      'order_history': 'Buyurtmalar tarixi',
      'active_orders': 'Faol buyurtmalar',
      'completed_orders': 'Tugallangan',
      'cancelled_orders': 'Bekor qilingan',
      'order_details': 'Buyurtma tafsilotlari',
      'order_number': 'Buyurtma raqami',
      'order_date': 'Sana',
      'order_status': 'Holat',
      'track_order': 'Buyurtmani kuzatish',
      'reorder': 'Qayta buyurtma',

      // Address
      'add_address': 'Manzil qo\'shish',
      'edit_address': 'Manzilni tahrirlash',
      'address': 'Manzil',
      'city': 'Shahar',
      'region': 'Viloyat',
      'street': 'Ko\'cha',
      'house': 'Uy',
      'apartment': 'Xonadon',
      'entrance': 'Podyezd',
      'floor': 'Qavat',
      'landmark': 'Mo\'ljal',
      'default_address': 'Asosiy manzil',
      'set_as_default': 'Asosiy qilish',

      // Payment
      'payment': 'To\'lov',
      'payment_method': 'To\'lov usuli',
      'cash': 'Naqd pul',
      'card': 'Plastik karta',
      'add_card': 'Karta qo\'shish',
      'card_number': 'Karta raqami',
      'expiry_date': 'Amal qilish muddati',
      'cvv': 'CVV',

      // Search
      'search': 'Qidiruv',
      'search_results': 'Qidiruv natijalari',
      'no_results': 'Hech narsa topilmadi',
      'search_history': 'Qidiruv tarixi',
      'popular_searches': 'Mashhur qidiruvlar',
      'clear_history': 'Tarixni tozalash',
      'sort_by': 'Saralash',
      'filter': 'Filtrlash',
      'price_low_high': 'Narx: Arzon → Qimmat',
      'price_high_low': 'Narx: Qimmat → Arzon',
      'newest': 'Eng yangi',
      'most_popular': 'Mashhur',
      'search_error': 'Qidiruvda xatolik',
      'add_to_cart_error': 'Qo\'shishda xatolik',

      // Checkout
      'delivery_address': 'Yetkazib berish manzili',
      'delivery_time': 'Yetkazib berish vaqti',
      'order_summary': 'Buyurtma xulosasi',
      'place_order': 'Buyurtma berish',
      'order_placed': 'Buyurtma berildi',
      'order_placed_desc': 'Buyurtmangiz muvaffaqiyatli qabul qilindi',

      // Errors
      'network_error': 'Internet aloqasi yo\'q',
      'server_error': 'Server xatosi',
      'try_again': 'Qayta urinib ko\'ring',
      'something_wrong': 'Nimadir xato ketdi',
      'field_required': 'Bu maydon to\'ldirilishi shart',
      'invalid_phone': 'Telefon raqam noto\'g\'ri',
      'invalid_code': 'Kod noto\'g\'ri',

      // Onboarding
      'onboarding_1_title': 'Xush kelibsiz!',
      'onboarding_1_desc': 'O\'zbekistonning eng katta online marketi',
      'onboarding_2_title': 'Eng arzon narxlar',
      'onboarding_2_desc': 'Minglab mahsulotlar zavod narxida',
      'onboarding_3_title': 'Tez yetkazib berish',
      'onboarding_3_desc': '30 daqiqadan boshlab eshigingizgacha',
      'onboarding_4_title': 'Xavfsiz to\'lov',
      'onboarding_4_desc': 'Xavfsiz va qulay to\'lov usullari',
      'skip': 'O\'tkazib yuborish',
      'get_started': 'Boshlash',

      // Currency
      'currency': 'so\'m',

      // Connectivity
      'no_internet': 'Internet aloqasi yo\'q',
      'internet_restored': 'Internet aloqasi tiklandi',
      'press_back_again_to_exit': 'Chiqish uchun yana bir marta bosing',

      // Profile extras
      'guest': 'Mehmon',
      'login_to_see': 'Barcha funksiyalardan foydalanish uchun kiring',
      'cashback': 'Cashback',
      'night_mode': 'Tungi rejim',

      // Orders extras
      'orders_empty': 'Buyurtmalar yo\'q',
      'orders_empty_desc': 'Siz hali hech narsa buyurtma qilmagansiz',
      'pending': 'Kutilmoqda',
      'processing': 'Tayyorlanmoqda',
      'on_the_way': 'Yo\'lda',
      'delivered': 'Yetkazildi',
      'cancelled': 'Bekor qilindi',
      'all': 'Hammasi',
      'in_progress': 'Jarayonda',
      'reload': 'Qayta yuklash',
      'start_shopping': 'Xarid qilish',
      'product': 'Mahsulot',
      'more_products': 'ta boshqa mahsulot',
      'cancel_order': 'Buyurtmani bekor qilish',
      'cancel_order_confirm': 'Haqiqatan ham buyurtmani bekor qilmoqchimisiz?',
      'yes_cancel': 'Ha, bekor qilish',
      'order_cancelled': 'Buyurtma bekor qilindi',
      'confirmed': 'Tasdiqlandi',
      'products_added_to_cart': 'Mahsulotlar savatchaga qo\'shildi',

      // Auth extras
      'get_sms_code': 'SMS kod olish',
      'enter_sms_code': 'SMS kodni kiriting',
      'continue_as_guest': 'Mehmon sifatida davom etish',
      'seconds': 'soniya',

      // Auth screen
      'registration_success': 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
      'invalid_credentials': 'Email yoki parol noto\'g\'ri',
      'email_not_confirmed': 'Email tasdiqlanmagan. Pochtangizni tekshiring.',
      'user_already_registered': 'Bu email allaqachon ro\'yxatdan o\'tgan',
      'password_min_length_error':
          'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      'invalid_email_format': 'Email formati noto\'g\'ri',
      'enter_email_first': 'Avval email kiriting',
      'password_reset_sent': 'Parolni tiklash havolasi yuborildi',
      'email': 'Email',
      'enter_email': 'Email kiriting',
      'invalid_email': 'To\'g\'ri email kiriting',
      'enter_password': 'Parol kiriting',
      'password_min_length': 'Kamida 6 ta belgi bo\'lishi kerak',
      'reenter_password': 'Parolni qayta kiriting',
      'passwords_not_match': 'Parollar mos kelmaydi',
      'welcome': 'Xush kelibsiz!',
      'login_to_account': 'Hisobingizga kiring',
      'create_new_account': 'Yangi hisob yarating',
      'confirm_password_label': 'Parolni tasdiqlang',
      'or': 'yoki',
      'no_account': 'Hisobingiz yo\'qmi?',
      'have_account': 'Allaqachon hisobingiz bormi?',
      'register_link': 'Ro\'yxatdan o\'ting',
      'skip_demo': 'O\'tkazib yuborish (demo)',

      // Cart & Search extras
      'start_shopping_btn': 'Xarid qilishni boshlash',
      'search_products': 'Mahsulotlarni qidiring...',
      'search_again': 'Qayta qidirish',
      'results_count': 'ta natija',

      // Catalog extras
      'all_categories': 'Barchasi',
      'all_products': 'Barcha mahsulotlar',
      'products_count': 'ta mahsulot',
      'sort_label': 'Saralash:',
      'sort_popular': 'Mashhur',
      'sort_cheap': 'Arzon',
      'sort_expensive': 'Qimmat',
      'sort_rating': 'Reyting',
      'products_not_found': 'Mahsulotlar topilmadi',
      'data_not_loaded': 'Ma\'lumotlar yuklanmadi',
      'cat_food': 'Oziq-ovqat',
      'cat_drinks': 'Ichimliklar',
      'cat_household': 'Uy-ro\'zg\'or',
      'cat_electronics': 'Elektronika',
      'cat_beauty': 'Go\'zallik',

      // Profile extras - yangi
      'user': 'Foydalanuvchi',
      'piece': 'ta',
      'invite_reward': 'Har bir do\'st uchun 50,000 so\'m',
      'admin_panel': 'Admin Panel',
      'my_shop': 'Do\'konim',
      'open_shop': 'Do\'kon ochish',
      'become_seller': 'Sotuvchi bo\'ling',
      'open_pickup_point': 'Topshirish punkti ochish',
      'become_pickup_partner': 'Hamkor bo\'ling',
      'version': 'Versiya',
      'logout_confirm': 'Haqiqatan ham chiqmoqchimisiz?',
      'about_app': 'Ilova haqida',
      'app_description':
          'TOPLA - O\'zbekistonning eng katta online marketi. Minglab mahsulotlar zavod narxida.',
      'purchased_products': 'Sotib olingan mahsulotlar',
      'returns': 'Qaytarish',
      'reviews_and_questions': 'Sharhlar va savollar',
      'shopping': 'Xaridlar',
      'account': 'Hisob',
      'returns_empty': 'Qaytarishlar yo\'q',
      'returns_empty_desc': 'Qaytarilgan mahsulotlar yo\'q',
      'return_request': 'Qaytarish so\'rovi',
      'return_reason': 'Qaytarish sababi',
      'return_status': 'Qaytarish holati',
      'return_policy': 'Qaytarish siyosati',
      'return_policy_desc': 'Mahsulotni 14 kun ichida qaytarishingiz mumkin',
      'return_policy_1':
          'Mahsulot yetkazilgandan keyin 14 kun ichida qaytarish mumkin',
      'return_policy_2':
          'Mahsulot ishlatilmagan va original qadoqda bo\'lishi kerak',
      'return_policy_3': 'Qaytarish uchun buyurtma raqamini ko\'rsating',
      'reviews_empty': 'Sharhlar yo\'q',
      'reviews_empty_desc': 'Siz hali sharh yozmadingiz',
      'write_review': 'Sharh yozish',
      'my_reviews': 'Mening sharhlarim',
      'my_questions': 'Mening savollarim',
      'purchased_empty': 'Xaridlar yo\'q',
      'purchased_empty_desc':
          'Siz hali hech narsa sotib olmadingiz.\nBirinchi xaridingizni qiling!',

      // Bildirishnomalar
      'notification_permission_title': 'Bildirishnomalarni yoqing',
      'notification_permission_desc':
          'Chegirmalar, buyurtma holati va maxsus takliflardan xabardor bo\'ling',
      'notification_feature_1':
          'Chegirmalar va aksiyalar haqida birinchi bo\'lib biling',
      'notification_feature_2': 'Buyurtma holatini kuzatib boring',
      'notification_feature_3': 'Maxsus takliflarni qo\'ldan boy bermang',
      'allow': 'Ruxsat berish',
      'later': 'Keyinroq',

      // Yordam markazi
      'help': 'Yordam',
      'help_needed': 'Yordam kerakmi?',
      'help_subtitle': 'Biz sizga 24/7 yordam berishga tayyormiz',
      'call': 'Qo\'ng\'iroq',
      'faq_title': 'Ko\'p so\'raladigan savollar',
      'terms_of_use': 'Foydalanish shartlari',
      'call_error': 'Qo\'ng\'iroq qilishda xatolik',
      'telegram_error': 'Telegramni ochishda xatolik',
      'faq_q1': 'Qanday buyurtma beraman?',
      'faq_a1':
          'Mahsulotni tanlang, savatchaga qo\'shing va buyurtmani rasmiylashting. To\'lov usulini tanlang va manzilni kiriting.',
      'faq_q2': 'Yetkazib berish qancha vaqt oladi?',
      'faq_a2':
          'Toshkent shahri bo\'ylab 2-4 soat ichida. Viloyatlarga 1-3 kun ichida yetkazib beramiz.',
      'faq_q3': 'Mahsulotni qaytarish mumkinmi?',
      'faq_a3':
          'Ha, 14 kun ichida mahsulotni qaytarishingiz mumkin. Mahsulot ishlatilmagan va original qadoqda bo\'lishi kerak.',
      'faq_q4': 'Cashback qanday ishlaydi?',
      'faq_a4':
          'Har bir xarid uchun cashback olasiz. Cashbackni keyingi xaridlaringizda ishlatishingiz mumkin.',
      'faq_q5': 'To\'lov qanday amalga oshiriladi?',
      'faq_a5':
          'Naqd pul, UzCard, Humo, Click yoki Payme orqali to\'lashingiz mumkin.',
      'faq_q6': 'Buyurtmani bekor qilsam bo\'ladimi?',
      'faq_a6':
          'Ha, buyurtma jo\'natilmaguncha uni bekor qilishingiz mumkin. Ilovadagi buyurtmalar bo\'limidan bekor qiling.',
      'faq_q7': 'Yetkazib berish narxi qancha?',
      'faq_a7':
          'Yetkazib berish narxi buyurtma summasiga qarab 10,000 so\'mdan boshlanadi. 200,000 so\'mdan yuqori buyurtmalarga bepul yetkazib berish.',
      'faq_q8': 'Promokodam ishlashni to\'xtatdi, nima qilaman?',
      'faq_a8':
          'Promokodning amal qilish muddati tugagan yoki ishlatish chegarasiga yetgan bo\'lishi mumkin. Yangi promokodlar uchun bildirishnomalarni kuzating.',
      'free_and_secure': 'Bepul va xavfsiz',

      // Empty states & Errors
      'no_image': 'Rasm yo\'q',
      'notifications_empty': 'Bildirishnomalar yo\'q',
      'notifications_empty_desc':
          'Yangi xabarlar va aksiyalar\nbu yerda ko\'rinadi',
      'view_products': 'Mahsulotlarni ko\'rish',
      'products_loading': 'Mahsulotlar yuklanmoqda',
      'check_internet': 'Iltimos, internet ulanishingizni tekshiring',
      'error_occurred': 'Xatolik yuz berdi',
      'too_many_requests': 'Juda ko\'p urinish. Keyinroq qayta urinib ko\'ring',
      'recaptcha_cancelled': 'reCAPTCHA bekor qilindi',
      'recaptcha_failed': 'reCAPTCHA tekshiruvi muvaffaqiyatsiz',
      'try_on_device': 'Iltimos, Android yoki iOS qurilmada sinab ko\'ring',
      'something_went_wrong_desc':
          'Nimadir noto\'g\'ri ketdi.\nQaytadan urinib ko\'ring.',
      'check_internet_connection': 'Iltimos, internet aloqasini tekshiring',
      'server_no_connection': 'Server bilan aloqa yo\'q',
      'try_again_later': 'Keyinroq qayta urinib ko\'ring',
      'permission_required': 'Ruxsat talab qilinadi',
      'permission_desc': 'Bu funksiyadan foydalanish uchun ruxsat bering',
      'retry_short': 'Qayta',
      'search_no_results_for':
          'bo\'yicha hech narsa topilmadi.\nBoshqa so\'z bilan qidirib ko\'ring.',

      // Home screen
      'for_you': 'Siz uchun',
      'wow_price': 'WOW narx',
      'clothing': 'Kiyim',
      'search_products_hint': 'Mahsulotlarni qidirish',
      'login_to_add_cart': 'Savatga qo\'shish uchun tizimga kiring',
      'login_to_add_favorites': 'Sevimlilarga qo\'shish uchun tizimga kiring',

      // Cart screen
      'items_count_suffix': 'ta mahsulot',
      'clear_all_confirm': 'Barcha mahsulotlarni o\'chirmoqchimisiz?',
      'available_stock': 'Mavjud',
      'pieces_short': 'dona',
      'remove_from_cart_confirm': 'ni savatdan o\'chirmoqchimisiz?',
      'free_label': 'Bepul',
      'enter_promo': 'Promokodni kiriting',
      'invalid_promo': 'Noto\'g\'ri yoki muddati o\'tgan promokod',
      'min_order_sum': 'Minimal buyurtma summasi:',
      'promo_applied': 'Promokod qo\'llandi!',
      'discount_amount': 'chegirma',

      // Profile screen
      'login_to_profile': 'Profilga kirish',
      'via_phone': 'Telefon raqam orqali',
      'devices': 'Qurilmalar',
      'manage_devices': 'Ulangan qurilmalarni boshqarish',
      'cannot_open_site': 'Saytni ochib bo\'lmadi',
      'choose_language': 'Tilni tanlang',
      'uzbek_lang': 'O\'zbekcha',
      'russian_lang': 'Русский',
      'logout_question': 'Hisobingizdan chiqmoqchimisiz?',
      'logout_action': 'Hisobdan chiqish',

      // Order status strings
      'status_order_received': 'Buyurtma qabul qilindi',
      'status_order_confirmed': 'Buyurtma tasdiqlandi',
      'status_store_preparing': 'Do\'kon tayyorlamoqda',
      'status_order_ready': 'Buyurtma tayyor',
      'status_courier_assigned': 'Kuryer tayinlandi',
      'status_courier_picked_up': 'Kuryer oldi, yo\'lga chiqdi',
      'status_on_the_way': 'Buyurtma yo\'lda',
      'status_delivered_info': 'Yetkazib berildi',
      'status_at_pickup': 'Punktda kutmoqda',
      'status_cancelled_info': 'Bekor qilingan',
      'order_status_title': 'Buyurtma holati',
      'order_cancelled_title': 'Buyurtma bekor qilindi',
      'show_qr': 'QR kodni ko\'rsating',
      'show_qr_desc': 'Topshirish punktida shu QR kodni skanerga ko\'rsating',
      'or_tell_code': 'Yoki kodni ayting:',
      'pickup_point': 'Topshirish punkti',
      'address_not_found': 'Manzil topilmadi',
      'payment_info': 'To\'lov ma\'lumotlari',
      'plastic_card': 'Plastik karta',
      'cash_payment': 'Naqd pul',
      'all_tab': 'Barchasi',
      'in_process_tab': 'Jarayonda',
      'cancelled_tab': 'Bekor',
      'and_more': 'va yana',
      'confirmed_timeline': 'Tasdiqlandi',
      'picked_up': 'Olib ketildi',

      // Checkout screen
      'order_checkout': 'Buyurtmani rasmiylashtirish',
      'pickup_point_select': 'Punktni tanlang',
      'free_delivery': 'bepul',
      'courier': 'Kuryer',
      'tomorrow_or_later': 'Ertaga yoki keyinroq',
      'select_address': 'Manzilni tanlang',
      'recipient': 'Qabul qiluvchi',
      'select_option': 'Tanlang',
      'name_not_entered': 'Ism kiritilmagan',
      'add_other_recipient': 'Boshqa qabul qiluvchi qo\'shish',
      'name_label': 'Ism',
      'enter_name': 'Ismni kiriting',
      'do_not_call': 'Telefon qilinmasin',
      'delivery_date': 'Yetkazish sanasi',
      'tomorrow': 'Ertaga',
      'day_after_tomorrow': 'Ertadan keyin',
      'monday': 'Dushanba',
      'tuesday': 'Seshanba',
      'wednesday': 'Chorshanba',
      'thursday': 'Payshanba',
      'friday': 'Juma',
      'saturday': 'Shanba',
      'sunday': 'Yakshanba',
      'delivery_time_info': '9:00 dan 21:00 gacha yetkazib beriladi',
      'select_payment_method': 'To\'lov usulini tanlang',
      'courier_note': 'Kuryer uchun izoh',
      'courier_note_hint': 'Masalan: Domofon kodi, qavat, mo\'ljal...',
      'delivery_addresses': 'Yetkazish manzillari',
      'enter_home_address': 'Uy manzilini kiritish',
      'enter_work_address': 'Ish manzilini kiritish',
      'via_courier': 'Kuryer orqali',
      'address_type_label': 'manzili',
      'district_street_hint': 'Tuman, ko\'cha, uy raqami...',
      'select_from_map': 'Xaritadan tanlash',
      'additional_optional': 'Qo\'shimcha (ixtiyoriy)',
      'apartment_entrance_hint': 'Kvartira, podyezd, qavat',
      'enter_address': 'Manzilni kiriting',
      'address_added': 'Manzil qo\'shildi!',
      'secure_payment': 'Xavfsiz to\'lov kafolatlanadi',
      'select_address_please': 'Iltimos, manzilni tanlang',
      'select_pickup_please': 'Iltimos, topshirish punktini tanlang',
      'enter_recipient_name': 'Qabul qiluvchi ismini kiriting',
      'enter_recipient_phone': 'Qabul qiluvchi telefon raqamini kiriting',
      'select_delivery_date': 'Yetkazish sanasini tanlang',
      'select_card_please': 'Iltimos, karta tanlang',
      'order_create_error': 'Buyurtma yaratishda xatolik',
      'payment_failed': 'To\'lov amalga oshmadi',
      'payment_error': 'To\'lov xatosi',
      'confirm_3d_secure': 'Bank sahifasida to\'lovni tasdiqladingizmi?',
      'yes_confirmed': 'Ha, tasdiqladim',
      'new_card_add': 'Yangi karta qo\'shish',
      'expiry_label': 'Muddati',
      'products_with_count': 'Mahsulotlar',
      'add_new_card': 'Karta qo\'shish',
      'your_rating': 'Bahoyingiz',
      'write_your_opinion': 'Fikringizni yozing...',
      'review_submitted': 'Sharhingiz yuborildi!',
      'submit': 'Yuborish',
      'how_it_works': 'Qanday ishlaydi?',
      'your_code': 'Sizning kodingiz',
      'code_copied': 'Kod nusxalandi',
      'copy_code': 'Nusxalash',
      'link_copied': 'Havola nusxalandi',
      'copy_link': 'Havolani nusxalash',
      'have_friend_code': 'Do\'stingiz kodi bormi?',
      'enter_code_hint': 'Kodni kiriting',
      'statistics': 'Statistika',
      'invited_count': 'Taklif qilingan',
      'earned': 'Topilgan',
      'last_invitations': 'Oxirgi takliflar',
      'step_share': 'Kodni ulashing',
      'step_register': 'Do\'stingiz ro\'yxatdan o\'tadi',
      'step_purchase': 'Do\'stingiz xarid qiladi',
      'step_bonus': 'Ikkalangiz bonus olasiz',
      'for_each_friend': 'Har bir do\'st uchun',
      'code_applied': 'Kod qo\'llandi!',
      'share_text':
          'TOPLA ilovasini yuklab oling va mening taklif kodim bilan ro\'yxatdan o\'ting',
      'get_and_gift': 'oling va do\'stingizga ham bering!',
      // Ball tizimi
      'my_points': 'Mening ballarim',
      'points_short': 'ball',
      'points_history': 'Ball tarixi',
      'rewards_catalog': 'Sovg\'alar',
      'claim_reward': 'Olish',
      'not_enough_points': 'Ballar yetarli emas',
      'reward_claimed': 'So\'rov yuborildi!',
      'reward_pending': 'Kutilmoqda',
      'friends_count': 'Do\'stlar',
      'reg_bonus_info': 'Do\'st ro\'yxatdan o\'tsa',
      'purchase_bonus_info': 'Do\'st xarid qilsa',
      'min_purchase_info': 'Minimal xarid summasi',
      'friend_registered': 'Ro\'yxatdan o\'tdi',
      'friend_purchased': 'Xarid qildi',
      'out_of_stock': 'Tugagan',
      'points_label': 'ball',
      'my_returns': 'Qaytarishlarim',
      'return_rules': 'Qoidalar',
      'new_return': 'Yangi qaytarish',
      'approved': 'Tasdiqlangan',
      'rejected': 'Rad etilgan',
      'returned': 'Qaytarilgan',
      'waiting': 'Kutilmoqda',
      'order_label': 'Buyurtma',
      'cancel_action': 'Bekor qilish',
      'return_guarantee_title': '14 kunlik qaytarish kafolati',
      'return_guarantee_desc': 'Biz mablag\'ni qaytarishni kafolatlaymiz',
      'return_step1_title': 'So\'rov yarating',
      'return_step1_desc':
          'Buyurtmani tanlang va qaytarish sababini ko\'rsating. Kerak bo\'lsa rasm qo\'shing.',
      'return_step2_title': 'Tekshiruvni kuting',
      'return_step2_desc':
          'Bizning jamoamiz so\'rovingizni 24 soat ichida ko\'rib chiqadi.',
      'return_step3_title': 'Mablag\' qaytariladi',
      'return_step3_desc':
          'Tasdiqlangandan so\'ng mablag\' 3-5 ish kuni ichida qaytariladi.',
      'return_conditions': 'Qaytarish shartlari',
      'return_rule_14_days':
          'Qaytarish yetkazib berilgandan keyin 14 kun ichida mumkin',
      'return_rule_packaging': 'Mahsulot asl qadoqda bo\'lishi kerak',
      'return_rule_receipt': 'Chek va hujjatlarni saqlang',
      'return_rule_photo': 'So\'rovga mahsulot rasmini qo\'shing',
      'return_rule_hygiene': 'Shaxsiy gigiena mahsulotlari qaytarilmaydi',
      'no_delivered_orders':
          'Sizda qaytarish uchun yetkazilgan buyurtmalar yo\'q',
      'cancel_return_question': 'Qaytarishni bekor qilish?',
      'cancel_return_confirm': 'Qaytarish so\'rovini bekor qilmoqchimisiz?',
      'request_cancelled': 'So\'rov bekor qilindi',
      'return_created': 'Qaytarish so\'rovi yaratildi',
      'select_order': 'Buyurtmani tanlang',
      'describe_problem_hint': 'Muammoni batafsil tasvirlab bering...',
      'photo_optional': 'Rasm (ixtiyoriy)',
      'submit_request': 'So\'rov yuborish',
      'reason_defective': 'Nuqsonli mahsulot',
      'reason_wrong_item': 'Noto\'g\'ri mahsulot yuborilgan',
      'reason_not_as_described': 'Ta\'rifga mos kelmaydi',
      'reason_damaged': 'Shikastlangan mahsulot',
      'reason_size_issue': 'O\'lcham mos kelmadi',
      'reason_changed_mind': 'Fikrimi o\'zgartirdim',
      'returns_empty_subtitle': 'Bu yerda qaytarish so\'rovlaringiz ko\'rinadi',
      'items_count_label': 'mahsulot',

      // Profile, Address, Payment screens
      'camera_coming_soon': 'Kamera funksiyasi tez orada...',
      'gallery_coming_soon': 'Galereya funksiyasi tez orada...',
      'enter_full_name': 'Ism va familiyangizni kiriting',
      'profile_updated': 'Profil yangilandi',
      'sms_send_error': 'SMS yuborishda xatolik',
      'address_deleted': 'Manzil o\'chirildi',
      'default_address_changed': 'Asosiy manzil o\'zgartirildi',
      'understood': 'Tushunarli',
      'delete_card': 'Kartani o\'chirish',
      'card_deleted': 'Karta o\'chirildi',

      // Vendor - Promo codes
      'promo_codes': 'Promo kodlar',
      'create': 'Yaratish',
      'new_promo_code': 'Yangi promo kod',
      'promo_code_label': 'Promo kod',
      'discount_type': 'Chegirma turi',
      'percentage': 'Foiz (%)',
      'fixed_amount': 'Qat\'iy summa',
      'discount_amount_label': 'Chegirma miqdori',
      'min_order_amount': 'Min. buyurtma summasi',
      'max_usage': 'Maksimal foydalanish',
      'validity_period': 'Amal qilish muddati',
      'enter_code_and_amount': 'Kod va chegirma miqdorini kiriting',
      'invalid_discount_amount': 'Noto\'g\'ri chegirma miqdori',
      'promo_code_created': 'Promo kod yaratildi',
      'delete_promo_code': 'Promo kodni o\'chirish',
      'promo_code_deleted': 'Promo kod o\'chirildi',
      'no_promo_codes': 'Promo kodlar yo\'q',
      'create_promo_hint': 'Mijozlar uchun chegirma kodi yarating',
      'used_count': 'foydalanilgan',
      'expired': 'Muddati tugagan',
      'valid_until': 'Gacha',
      'unlimited': 'Muddatsiz',
      'optional_hint': 'Ixtiyoriy',
      'unlimited_uses': 'Cheksiz',
      'delete_promo_confirm': 'promo kodini o\'chirishni xohlaysizmi?',

      // Vendor - Documents
      'documents': 'Hujjatlar',
      'copied': 'Nusxalandi',
      'download': 'Yuklash',
      'upload_document': 'Hujjat yuklash',
      'document_type': 'Hujjat turi',
      'document_name': 'Hujjat nomi',
      'example_passport': 'Masalan: Shahsiy pasport',
      'enter_document_name': 'Hujjat nomini kiriting',
      'select_image': 'Rasmni tanlash',
      'document_uploaded': 'Hujjat muvaffaqiyatli yuklandi',
      'delete_document': 'Hujjatni o\'chirish',
      'delete_document_confirm': 'Hujjatni o\'chirishni xohlaysizmi?',
      'document_deleted': 'Hujjat o\'chirildi',
      'view_contract': 'Shartnomani ko\'rish',
      'shop_info': 'Do\'kon ma\'lumotlari',
      'status_label': 'Holati',
      'verified': 'Tasdiqlangan',
      'not_verified': 'Tasdiqlanmagan',
      'registered_date': 'Ro\'yxatdan o\'tgan',
      'commission_rate_label': 'Komissiya stavkasi',
      'my_documents': 'Mening hujjatlarim',
      'upload': 'Yuklash',
      'no_documents': 'Hujjatlar yuklanmagan',
      'upload_docs_hint': 'Pasport, INN yoki litsenziya yuklang',
      'document_default_name': 'Hujjat',
      'approved_status': 'Tasdiqlangan',
      'rejected_status': 'Rad etilgan',
      'pending_status': 'Tekshirilmoqda',
      'contract': 'Shartnoma',
      'offer_accepted': 'Oferta shartnomasi qabul qilingan',
      'commission_terms': 'Komissiya shartlari',
      'standard_commission': 'Standart komissiya',
      'deducted_per_sale': 'Har bir sotuvdan ushlab qolinadi',
      'withdrawal_commission': 'To\'lov uchun komissiya',
      'withdrawal_commission_desc': 'Mablag\' yechib olishda',
      'min_withdrawal': 'Minimal to\'lov',
      'min_withdrawal_desc': 'Yechib olish uchun minimal summa',
      'rules': 'Qoidalar',
      'product_moderation': 'Mahsulot moderatsiyasi',
      'product_moderation_desc':
          'Barcha mahsulotlar moderatsiyadan o\'tishi kerak',
      'quality_requirements': 'Sifat talablari',
      'quality_requirements_desc':
          'Mahsulot rasmlari aniq va sifatli bo\'lishi kerak',
      'price_accuracy': 'Narx aniqligi',
      'price_accuracy_desc':
          'Ko\'rsatilgan narx haqiqiy narxga mos kelishi kerak',
      'order_fulfillment': 'Buyurtmalarni bajarish',
      'order_fulfillment_desc':
          'Buyurtmalar 24 soat ichida tasdiqlanishi kerak',
      'customer_service': 'Mijozlarga xizmat',
      'customer_service_desc': 'Mijozlar bilan professional muloqot qilish',
      'offer_contract': 'Oferta shartnomasi',

      // Vendor - Shop settings
      'logo_uploaded': 'Logo yuklandi',
      'banner_uploaded': 'Banner yuklandi',
      'enter_shop_name': 'Do\'kon nomini kiriting',
      'settings_saved': 'Sozlamalar saqlandi',
      'shop_settings': 'Do\'kon sozlamalari',
      'change_logo': 'Logoni o\'zgartirish',
      'shop_name': 'Do\'kon nomi',
      'current_rate': 'Joriy stavka:',
      'banner_image_hint': 'Banner rasmi (1200x400)',
      'basic_info': 'Asosiy ma\'lumotlar',
      'description_label': 'Tavsif',
      'contact_info': 'Bog\'lanish',
      'phone_label': 'Telefon',
      'address_section': 'Manzil',
      'city_label': 'Shahar',
      'commission_label': 'Komissiya',
      'shop_active': 'Do\'koningiz faol',
      'awaiting_verification': 'Admin tekshiruvini kutmoqda',
      'saving': 'Saqlanmoqda...',
      'deducted_per_sale_short': 'Har bir sotuvdan ushlanadi',

      // Vendor - Product form
      'select_category': 'Kategoriya tanlang',
      'please_select_category': 'Iltimos, kategoriya tanlang',
      'subcategory_optional': 'Subkategoriya (ixtiyoriy)',
      'name_uz': 'Nomi (O\'zbekcha)',
      'name_ru': 'Nomi (Ruscha)',
      'description_uz': 'Tavsif (O\'zbekcha)',
      'description_ru': 'Tavsif (Ruscha)',
      'old_price': 'Eski narx',
      'stock_count': 'Qoldiq',
      'edit_product': 'Mahsulotni tahrirlash',
      'new_product': 'Yangi mahsulot',
      'product_images': 'Mahsulot rasmlari',
      'enter_product_name': 'Mahsulot nomini kiriting',
      'price_label': 'Narx',
      'enter_price': 'Narxni kiriting',
      'invalid_format': 'Noto\'g\'ri format',
      'enter_quantity': 'Miqdorni kiriting',
      'invalid_value': 'Noto\'g\'ri',
      'product_updated': 'Mahsulot yangilandi',
      'product_added': 'Mahsulot qo\'shildi',
      'images_uploading': 'Rasmlar yuklanmoqda...',
      'pending_moderation_info':
          'Mahsulot admin tekshiruvidan o\'tgandan so\'ng faollashadi.',
      'category_required': 'Kategoriya *',

      // Vendor - Products screen
      'my_products': 'Mahsulotlarim',
      'add_product': 'Mahsulot qo\'shish',
      'add': 'Qo\'shish',
      'product_deleted': 'Mahsulot o\'chirildi',
      'delete_product': 'Mahsulotni o\'chirish',
      'product_resubmitted': 'Mahsulot qayta yuborildi',
      'resubmit': 'Qayta yuborish',
      'active_tab': 'Faol',
      'pending_tab': 'Kutilmoqda',
      'rejected_tab': 'Rad etilgan',
      'no_products': 'Mahsulotlar yo\'q',
      'edit_label': 'Tahrirlash',
      'stock_with_colon': 'Qoldiq:',
      'delete_product_confirm': 'mahsulotini o\'chirmoqchimisiz?',

      // Vendor - Reviews
      'reply': 'Javob berish',
      'reply_to_review': 'Sharhga javob',
      'write_reply': 'Javob matnini yozing...',
      'reply_sent': 'Javob yuborildi',
      'send': 'Yuborish',
      'no_reviews': 'Hozircha sharhlar yo\'q',
      'wait_first_review': 'Birinchi sharhni kutib turing',
      'unknown_user': 'Noma\'lum',
      'vendor_reply': 'Sotuvchi javobi',

      // Vendor - Order detail
      'confirm': 'Tasdiqlash',
      'order_process': 'Buyurtma jarayoni',
      'customer_info': 'Mijoz ma\'lumotlari',
      'note_label': 'Izoh',
      'update_status_confirm': 'Buyurtma holatini yangilamoqchimisiz?',
      'status_updated': 'Holat yangilandi',
      'delivery_label': 'Yetkazish',
      'method_label': 'Usul',
      'date_label': 'Sana',
      'time_label': 'Vaqt',
      'point_label': 'Punkt',
      'pickup_code_label': 'Pickup kod',
      'total_label': 'Jami',
      'start_processing': 'Tayyorlashni boshlash',
      'ready_for_courier': 'Tayyor \u2014 kuryerga berish',
      'delivered_to_point': 'Punktga topshirildi',
      'payment_method_label': 'To\'lov usuli',
      'payment_status_label': 'To\'lov holati',
      'order_cancelled_text': 'Buyurtma bekor qilindi',

      // Vendor - Dashboard & Analytics & Orders
      'shop_not_verified': 'Do\'kon hali tasdiqlanmagan',
      'admin_review_pending': 'Admin tekshiruvidan keyin faollashadi',
      'balance': 'Balans',
      'withdraw': 'Pul yechish',
      'today': 'Bugun',
      'orders': 'Buyurtmalar',
      'revenue': 'Daromad',
      'products': 'Mahsulotlar',
      'active': 'Faol',
      'this_month': 'Shu oy',
      'pcs': 'ta',
      'management': 'Boshqaruv',
      'messages': 'Xabarlar',
      'payments': 'To\'lovlar',
      'analytics': 'Analitika',
      'commissions': 'Komissiyalar',
      'shop': 'Do\'kon',
      'no_shop': 'Do\'koningiz yo\'q',
      'no_shop_desc':
          'Do\'kon ochish uchun saytimizga o\'ting va ro\'yxatdan o\'ting',
      'go_to_website': 'Saytga o\'tish',
      'week': 'Hafta',
      'month': 'Oy',
      'year': 'Yil',
      'general_stats': 'Umumiy ko\'rsatkichlar',
      'net_revenue': 'Sof daromad',
      'no_sales_data': 'Sotuv ma\'lumoti yo\'q',
      'sales_dynamics': 'Sotuvlar dinamikasi',
      'top_products': 'Top mahsulotlar',
      'no_data': 'Ma\'lumot yo\'q',
      'pcs_sold': 'dona sotildi',
      'in_process': 'Jarayonda',
      'completed': 'Bajarilgan',
      'new_orders': 'Yangi',
      'ready': 'Tayyor',
      'no_orders': 'Buyurtmalar yo\'q',
      'manage': 'Boshqarish',
      'all_filter': 'Barchasi',

      // Vendor - Commissions
      'monthly_commission': 'Oylik komissiya',
      'total_commission': 'Jami komissiya',
      'no_commissions': 'Komissiyalar yo\'q',
      'order': 'Buyurtma',
      'sale': 'Sotuv',

      // Vendor - Chat
      'customer': 'Mijoz',
      'quick_reply_hello': 'Assalomu alaykum! Sizga qanday yordam bera olaman?',
      'quick_reply_order_ready': 'Buyurtmangiz tayyor!',
      'quick_reply_available': 'Ha, mahsulot mavjud',
      'quick_reply_not_available': 'Kechirasiz, hozircha mavjud emas',
      'chat_empty': 'Chat bo\'sh',
      'send_message_to_customer': 'Mijozga xabar yuboring',
      'yesterday': 'Kecha',
      'write_message': 'Xabar yozing...',
      'chats_load_error': 'Chatlarni yuklashda xatolik',
      'refresh': 'Yangilash',
      'chat_started': 'Chat boshlandi',
      'no_messages': 'Xabarlar yo\'q',
      'no_messages_desc': 'Mijozlardan xabarlar shu yerda ko\'rinadi',

      // Vendor - Payouts
      'amount': 'Summa',
      'send_request': 'So\'rov yuborish',
      'request_sent': 'So\'rov yuborildi',
      'bank_transfer': 'Bank o\'tkazmasi',
      'available_balance': 'Mavjud balans',
      'no_payouts_history': 'To\'lovlar tarixi yo\'q',

      // Vendor - Returns
      'no_returns': 'Qaytarishlar yo\'q',
      'admin_note': 'Admin izohi',
      'reason': 'Sabab',

      // Vendor - Documents (types)
      'doc_passport': 'Pasport nusxasi',
      'doc_inn': 'INN (STIR) guvohnomasi',
      'doc_license': 'Litsenziya',
      'doc_certificate': 'Sertifikat',
      'doc_other': 'Boshqa hujjat',

      // Vendor - Other missing
      'shop_not_verified_msg': 'Do\'koningiz hali tasdiqlanmagan',
      'delivery': 'Yetkazish',
      'payment_status': 'To\'lov holati',
      'pickup_code': 'Topshirish kodi',
      'product_moderation_info':
          'Mahsulot admin tekshiruvidan o\'tgandan so\'ng faollashadi.',
      'month_period': 'Oy',
      'completed_status': 'Bajarilgan',

      // Shop detail screen
      'login_required_feature': 'Bu funksiya uchun tizimga kiring',
      'shop_label': 'Do\'kon',
      'sold_label': 'Sotilgan',
      'followers': 'Obunachilar',
      'review_count_suffix': 'sharh',
      'shop_not_found': 'Do\'kon topilmadi',
      'shop_not_found_desc': 'Bu do\'kon mavjud emas yoki o\'chirilgan',
      'subscribed_btn': 'Obuna',
      'subscribe_btn': 'Obuna bo\'lish',
      'message_btn': 'Xabar',
      'no_products_yet': 'Mahsulotlar hali mavjud emas',
      'products_coming_soon': 'Tez orada yangi mahsulotlar qo\'shiladi',
      'contact_section': 'Aloqa',
      'total_sales': 'Jami sotuvlar',
      'total_orders': 'Jami buyurtmalar',
      'member_since': 'A\'zo bo\'lgan sana',
      'rating_suffix': 'reyting',

      // Shop reviews screen
      'login_to_review': 'Sharh qoldirish uchun tizimga kiring',
      'add_review': 'Sharh qoldirish',
      'no_reviews_yet': 'Hali sharhlar yo\'q',
      'be_first_reviewer': 'Birinchi bo\'lib sharh qoldiring!',
      'default_user': 'Foydalanuvchi',
      'select_rating_please': 'Iltimos, baho tanlang',
      'review_added_success': 'Sharh muvaffaqiyatli qo\'shildi!',
      'error_try_again': 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.',
      'share_opinion_about_shop': 'Bu do\'kon haqida fikringizni bildiring',
      'rating_label': 'Baho',
      'comment_optional': 'Izoh (ixtiyoriy)',
      'review_hint': 'Do\'kon haqida fikringizni yozing...',
      'submit_review': 'Sharh qo\'shish',
      'rating_very_bad': 'Juda yomon',
      'rating_bad': 'Yomon',
      'rating_average': 'O\'rtacha',
      'rating_good': 'Yaxshi',
      'rating_excellent': 'A\'lo',

      // Shop chat screen
      'start_conversation': 'Suhbatni boshlang',
      'chat_with_shop_desc': 'Do\'kon bilan savol-javob qilishingiz mumkin',
      'go_to_shop': 'Do\'konga o\'tish',
      'delete_conversation': 'Suhbatni o\'chirish',
      'delete_conversation_confirm':
          'Bu suhbat butunlay o\'chiriladi. Davom etasizmi?',

      // OTP screen
      'enter_6_digit_code': 'Iltimos, 6 xonali kodni kiriting',
      'verification_id_error': 'Xatolik: Verification ID topilmadi',
      'wrong_code': 'Noto\'g\'ri kod. Qayta tekshiring',
      'code_expired': 'Kod muddati tugagan. Qayta yuboring',
      'code_resent': 'Kod qayta yuborildi',
      'error_prefix': 'Xatolik',

      // Complete profile screen
      'enter_name_please': 'Iltimos, ismingizni kiriting',
      'enter_name_to_continue': 'Davom etish uchun ismingizni kiriting',
      'first_name_required': 'Ism *',
      'enter_your_name': 'Ismingizni kiriting',
      'last_name': 'Familiya',
      'enter_your_surname': 'Familiyangizni kiriting',

      // Vendor guard
      'login_to_system': 'Tizimga kiring',
      'login_for_vendor_panel':
          'Vendor paneliga kirish uchun avval tizimga kiring',
      'become_vendor': 'Vendor bo\'lish',
      'open_shop_title': 'Do\'kon oching',
      'open_shop_to_sell': 'Mahsulot sotish uchun o\'z do\'koningizni oching',
      'login_first': 'Avval tizimga kiring',
      'vendor_permission_needed': 'Vendor huquqi kerak',

      // Swipeable cart item
      'delete_confirm_msg': '{name} ni o\'chirmoqchimisiz?',
    },
    'ru': {
      // Общие
      'app_name': 'TOPLA',
      'ok': 'ОК',
      'cancel': 'Отмена',
      'save': 'Сохранить',
      'delete': 'Удалить',
      'edit': 'Редактировать',
      'close': 'Закрыть',
      'back': 'Назад',
      'next': 'Далее',
      'done': 'Готово',
      'loading': 'Загрузка...',
      'error': 'Ошибка',
      'success': 'Успешно',
      'retry': 'Повторить',
      'yes': 'Да',
      'no': 'Нет',

      // Авторизация
      'login': 'Войти',
      'logout': 'Выйти',
      'register': 'Регистрация',
      'phone_number': 'Номер телефона',
      'password': 'Пароль',
      'confirm_password': 'Подтвердить пароль',
      'forgot_password': 'Забыли пароль?',
      'or_continue_with': 'Или продолжить с',
      'enter_phone': 'Введите номер телефона',
      'enter_code': 'Введите код из SMS',
      'verification_code': 'Код подтверждения',
      'verify': 'Подтвердить',
      'resend_code': 'Отправить код повторно',
      'login_with_phone': 'Войти по телефону',
      'we_will_send_code': 'Мы отправим вам SMS код',
      'continue': 'Продолжить',
      'terms_agree': 'Продолжая, вы соглашаетесь с условиями использования',
      'code_sent_to': 'Код отправлен на',
      'resend_in': 'Повторить через',
      'or_text': 'или',
      'login_with_google': 'Войти через Google',
      'sms_code_sent': 'SMS код отправлен',
      'enter_4_digit_code': 'Введите 4-значный код',
      'phone_required': 'Введите номер телефона',
      'phone_incomplete': 'Номер телефона неполный',
      'resend': 'Отправить повторно',
      'code_sent_to_number': 'Введите код, отправленный на',
      'google_sign_in_error': 'Ошибка входа через Google',
      'no_internet_check': 'Нет подключения к интернету. Проверьте сеть',
      'invalid_otp': 'Неверный код или срок действия истёк',
      'phone_not_confirmed': 'Телефон не подтверждён',

      // Навигация
      'home': 'Главная',
      'catalog': 'Каталог',
      'cart': 'Корзина',
      'favorites': 'Избранное',
      'profile': 'Профиль',

      // Главная
      'search_hint': 'Поиск товаров...',
      'categories': 'Категории',
      'discounts': 'Скидки',
      'popular': 'Популярное',
      'new_arrivals': 'Новинки',
      'see_all': 'Все',
      'recommended': 'Рекомендуемое',
      'coupons': 'Купоны',

      // Товар
      'add_to_cart': 'В корзину',
      'buy_now': 'Купить сейчас',
      'description': 'Описание',
      'reviews': 'Отзывы',
      'specifications': 'Характеристики',
      'in_stock': 'В наличии',
      'out_of_stock': 'Нет в наличии',
      'quantity': 'Количество',
      'price': 'Цена',
      'total': 'Итого',
      'discount': 'Скидка',
      'sold': 'Продано',
      'rating': 'Рейтинг',
      'added_to_cart': 'Добавлено в корзину',
      'share': 'Поделиться',
      'shared': 'Готово к отправке',

      // Корзина
      'your_cart': 'Ваша корзина',
      'empty_cart': 'Корзина пуста',
      'empty_cart_desc': 'Добавьте товары в корзину и оформите заказ',
      'checkout': 'Оформить заказ',
      'promo_code': 'Промокод',
      'apply': 'Применить',
      'subtotal': 'Подитог',
      'shipping': 'Доставка',
      'free_shipping': 'Бесплатная доставка',
      'clear_cart': 'Очистить корзину',
      'remove_item': 'Удалить товар',
      'remove_item_confirm': 'Вы хотите удалить этот товар?',

      // Избранное
      'your_favorites': 'Избранное',
      'empty_favorites': 'Список избранного пуст',
      'empty_favorites_desc': 'Сохраняйте понравившиеся товары\nнажав ❤️',
      'add_to_favorites': 'В избранное',
      'remove_from_favorites': 'Удалить из избранного',
      'removed_from_favorites': 'Удалено из избранного',
      'add_favorites_hint': 'Нажмите ❤️ чтобы добавить товары',
      'clear_favorites': 'Очистить избранное',
      'clear_favorites_confirm': 'Вы хотите удалить все избранные товары?',
      'clear': 'Очистить',
      'shop_now': 'За покупками',
      'sold_count': 'продано',

      // Профиль
      'my_profile': 'Мой профиль',
      'personal_info': 'Личные данные',
      'my_orders': 'Мои заказы',
      'my_addresses': 'Мои адреса',
      'payment_methods': 'Способы оплаты',
      'notifications': 'Уведомления',
      'settings': 'Настройки',
      'help_center': 'Центр помощи',
      'about_us': 'О нас',
      'privacy_policy': 'Политика конфиденциальности',
      'terms_conditions': 'Условия использования',
      'invite_friends': 'Пригласить друзей',
      'rate_app': 'Оценить приложение',
      'language': 'Язык',

      // Заказы
      'order_history': 'История заказов',
      'active_orders': 'Активные заказы',
      'completed_orders': 'Завершённые',
      'cancelled_orders': 'Отменённые',
      'order_details': 'Детали заказа',
      'order_number': 'Номер заказа',
      'order_date': 'Дата',
      'order_status': 'Статус',
      'track_order': 'Отследить заказ',
      'reorder': 'Повторить заказ',

      // Адрес
      'add_address': 'Добавить адрес',
      'edit_address': 'Редактировать адрес',
      'address': 'Адрес',
      'city': 'Город',
      'region': 'Область',
      'street': 'Улица',
      'house': 'Дом',
      'apartment': 'Квартира',
      'entrance': 'Подъезд',
      'floor': 'Этаж',
      'landmark': 'Ориентир',
      'default_address': 'Основной адрес',
      'set_as_default': 'Сделать основным',

      // Оплата
      'payment': 'Оплата',
      'payment_method': 'Способ оплаты',
      'cash': 'Наличные',
      'card': 'Банковская карта',
      'add_card': 'Добавить карту',
      'card_number': 'Номер карты',
      'expiry_date': 'Срок действия',
      'cvv': 'CVV',

      // Поиск
      'search': 'Поиск',
      'search_results': 'Результаты поиска',
      'no_results': 'Ничего не найдено',
      'search_history': 'История поиска',
      'popular_searches': 'Популярные запросы',
      'clear_history': 'Очистить историю',
      'sort_by': 'Сортировка',
      'filter': 'Фильтр',
      'price_low_high': 'Цена: по возрастанию',
      'price_high_low': 'Цена: по убыванию',
      'newest': 'Новые',
      'most_popular': 'Популярные',
      'search_error': 'Ошибка поиска',
      'add_to_cart_error': 'Ошибка при добавлении',

      // Оформление заказа
      'delivery_address': 'Адрес доставки',
      'delivery_time': 'Время доставки',
      'order_summary': 'Итог заказа',
      'place_order': 'Оформить заказ',
      'order_placed': 'Заказ оформлен',
      'order_placed_desc': 'Ваш заказ успешно принят',

      // Ошибки
      'network_error': 'Нет подключения к интернету',
      'server_error': 'Ошибка сервера',
      'try_again': 'Попробуйте ещё раз',
      'something_wrong': 'Что-то пошло не так',
      'field_required': 'Это поле обязательно',
      'invalid_phone': 'Неверный номер телефона',
      'invalid_code': 'Неверный код',

      // Onboarding
      'onboarding_1_title': 'Добро пожаловать!',
      'onboarding_1_desc': 'Крупнейший онлайн-маркет Узбекистана',
      'onboarding_2_title': 'Самые низкие цены',
      'onboarding_2_desc': 'Тысячи товаров по заводским ценам',
      'onboarding_3_title': 'Быстрая доставка',
      'onboarding_3_desc': 'От 30 минут до вашей двери',
      'onboarding_4_title': 'Безопасная оплата',
      'onboarding_4_desc': 'Безопасные и удобные способы оплаты',
      'skip': 'Пропустить',
      'get_started': 'Начать',

      // Currency
      'currency': 'сум',

      // Connectivity
      'no_internet': 'Нет подключения к интернету',
      'internet_restored': 'Подключение к интернету восстановлено',
      'press_back_again_to_exit': 'Нажмите ещё раз для выхода',

      // Profile extras
      'guest': 'Гость',
      'login_to_see': 'Войдите, чтобы использовать все функции',
      'cashback': 'Кешбэк',
      'night_mode': 'Ночной режим',

      // Orders extras
      'orders_empty': 'Заказов пока нет',
      'orders_empty_desc': 'Вы ещё ничего не заказывали',
      'pending': 'Ожидает',
      'processing': 'Готовится',
      'on_the_way': 'В пути',
      'delivered': 'Доставлен',
      'cancelled': 'Отменён',
      'all': 'Все',
      'in_progress': 'В процессе',
      'reload': 'Обновить',
      'start_shopping': 'Начать покупки',
      'product': 'Товар',
      'more_products': 'ещё товаров',
      'cancel_order': 'Отменить заказ',
      'cancel_order_confirm': 'Вы уверены, что хотите отменить заказ?',
      'yes_cancel': 'Да, отменить',
      'order_cancelled': 'Заказ отменён',
      'confirmed': 'Подтверждён',
      'products_added_to_cart': 'Товары добавлены в корзину',

      // Auth extras
      'get_sms_code': 'Получить SMS код',
      'enter_sms_code': 'Введите SMS код',
      'continue_as_guest': 'Продолжить как гость',
      'seconds': 'секунд',

      // Auth screen
      'registration_success': 'Вы успешно зарегистрировались!',
      'invalid_credentials': 'Неверный email или пароль',
      'email_not_confirmed': 'Email не подтверждён. Проверьте почту.',
      'user_already_registered': 'Этот email уже зарегистрирован',
      'password_min_length_error': 'Пароль должен содержать минимум 6 символов',
      'invalid_email_format': 'Неверный формат email',
      'enter_email_first': 'Сначала введите email',
      'password_reset_sent': 'Ссылка для сброса пароля отправлена',
      'email': 'Email',
      'enter_email': 'Введите email',
      'invalid_email': 'Введите корректный email',
      'enter_password': 'Введите пароль',
      'password_min_length': 'Минимум 6 символов',
      'reenter_password': 'Повторите пароль',
      'passwords_not_match': 'Пароли не совпадают',
      'welcome': 'Добро пожаловать!',
      'login_to_account': 'Войдите в аккаунт',
      'create_new_account': 'Создайте новый аккаунт',
      'confirm_password_label': 'Подтвердите пароль',
      'or': 'или',
      'no_account': 'Нет аккаунта?',
      'have_account': 'Уже есть аккаунт?',
      'register_link': 'Зарегистрируйтесь',
      'skip_demo': 'Пропустить (демо)',

      // Cart & Search extras
      'start_shopping_btn': 'Начать покупки',
      'search_products': 'Поиск товаров...',
      'search_again': 'Искать снова',
      'results_count': 'результатов',

      // Catalog extras
      'all_categories': 'Все',
      'all_products': 'Все товары',
      'products_count': 'товаров',
      'sort_label': 'Сортировка:',
      'sort_popular': 'Популярные',
      'sort_cheap': 'Дешёвые',
      'sort_expensive': 'Дорогие',
      'sort_rating': 'Рейтинг',
      'products_not_found': 'Товары не найдены',
      'data_not_loaded': 'Данные не загружены',
      'cat_food': 'Продукты',
      'cat_drinks': 'Напитки',
      'cat_household': 'Бытовое',
      'cat_electronics': 'Электроника',
      'cat_beauty': 'Красота',

      // Profile extras - новые
      'user': 'Пользователь',
      'piece': 'шт',
      'invite_reward': '50 000 сум за каждого друга',
      'admin_panel': 'Админ-панель',
      'my_shop': 'Мой магазин',
      'open_shop': 'Открыть магазин',
      'become_seller': 'Стать продавцом',
      'open_pickup_point': 'Открыть пункт выдачи',
      'become_pickup_partner': 'Стать партнёром',
      'version': 'Версия',
      'logout_confirm': 'Вы уверены, что хотите выйти?',
      'about_app': 'О приложении',
      'app_description':
          'TOPLA - крупнейший онлайн-маркет Узбекистана. Тысячи товаров по заводским ценам.',
      'purchased_products': 'Купленные товары',
      'returns': 'Возвраты',
      'reviews_and_questions': 'Отзывы и вопросы',
      'shopping': 'Покупки',
      'account': 'Аккаунт',
      'returns_empty': 'Возвратов нет',
      'returns_empty_desc': 'Нет возвращённых товаров',
      'return_request': 'Запрос на возврат',
      'return_reason': 'Причина возврата',
      'return_status': 'Статус возврата',
      'return_policy': 'Политика возврата',
      'return_policy_desc': 'Вы можете вернуть товар в течение 14 дней',
      'return_policy_1': 'Возврат возможен в течение 14 дней после доставки',
      'return_policy_2':
          'Товар должен быть неиспользованным и в оригинальной упаковке',
      'return_policy_3': 'Для возврата укажите номер заказа',
      'reviews_empty': 'Отзывов нет',
      'reviews_empty_desc': 'Вы ещё не написали отзывов',
      'write_review': 'Написать отзыв',
      'my_reviews': 'Мои отзывы',
      'my_questions': 'Мои вопросы',
      'purchased_empty': 'Покупок нет',
      'purchased_empty_desc':
          'Вы ещё ничего не купили.\nСделайте первую покупку!',

      // Уведомления
      'notification_permission_title': 'Включите уведомления',
      'notification_permission_desc':
          'Будьте в курсе скидок, статуса заказа и специальных предложений',
      'notification_feature_1': 'Узнавайте первыми о скидках и акциях',
      'notification_feature_2': 'Отслеживайте статус заказа',
      'notification_feature_3': 'Не пропустите специальные предложения',
      'allow': 'Разрешить',
      'later': 'Позже',

      // Центр помощи
      'help': 'Помощь',
      'help_needed': 'Нужна помощь?',
      'help_subtitle': 'Мы готовы помочь вам 24/7',
      'call': 'Позвонить',
      'faq_title': 'Часто задаваемые вопросы',
      'terms_of_use': 'Условия использования',
      'call_error': 'Ошибка при звонке',
      'telegram_error': 'Ошибка при открытии Telegram',
      'faq_q1': 'Как сделать заказ?',
      'faq_a1':
          'Выберите товар, добавьте в корзину и оформите заказ. Выберите способ оплаты и укажите адрес доставки.',
      'faq_q2': 'Сколько времени занимает доставка?',
      'faq_a2': 'По Ташкенту 2-4 часа. В регионы 1-3 рабочих дня.',
      'faq_q3': 'Можно ли вернуть товар?',
      'faq_a3':
          'Да, вы можете вернуть товар в течение 14 дней. Товар должен быть неиспользованным и в оригинальной упаковке.',
      'faq_q4': 'Как работает кешбэк?',
      'faq_a4':
          'За каждую покупку вы получаете кешбэк. Его можно использовать при следующих покупках.',
      'faq_q5': 'Как производится оплата?',
      'faq_a5': 'Наличными, через UzCard, Humo, Click или Payme.',
      'faq_q6': 'Можно ли отменить заказ?',
      'faq_a6':
          'Да, вы можете отменить заказ до его отправки в разделе «Мои заказы».',
      'faq_q7': 'Сколько стоит доставка?',
      'faq_a7':
          'Стоимость доставки от 10 000 сумов в зависимости от суммы заказа. Бесплатная доставка при заказе от 200 000 сумов.',
      'faq_q8': 'Промокод не работает, что делать?',
      'faq_a8':
          'Возможно, срок действия промокода истек или достигнут лимит использования. Следите за новыми промокодами в уведомлениях.',
      'free_and_secure': 'Бесплатно и безопасно',

      // Empty states & Errors
      'no_image': 'Нет фото',
      'notifications_empty': 'Уведомлений нет',
      'notifications_empty_desc': 'Новые сообщения и акции\nпоявятся здесь',
      'view_products': 'Посмотреть товары',
      'products_loading': 'Товары загружаются',
      'check_internet': 'Пожалуйста, проверьте подключение к интернету',
      'error_occurred': 'Произошла ошибка',
      'too_many_requests': 'Слишком много попыток. Попробуйте позже',
      'recaptcha_cancelled': 'reCAPTCHA отменена',
      'recaptcha_failed': 'Проверка reCAPTCHA не удалась',
      'try_on_device': 'Пожалуйста, попробуйте на устройстве Android или iOS',
      'something_went_wrong_desc': 'Что-то пошло не так.\nПопробуйте ещё раз.',
      'check_internet_connection':
          'Пожалуйста, проверьте подключение к интернету',
      'server_no_connection': 'Нет связи с сервером',
      'try_again_later': 'Попробуйте позже',
      'permission_required': 'Требуется разрешение',
      'permission_desc': 'Разрешите доступ для использования этой функции',
      'retry_short': 'Повторить',
      'search_no_results_for':
          'по запросу ничего не найдено.\nПопробуйте другой запрос.',

      // Home screen
      'for_you': 'Для вас',
      'wow_price': 'WOW цена',
      'clothing': 'Одежда',
      'search_products_hint': 'Поиск товаров',
      'login_to_add_cart': 'Войдите, чтобы добавить в корзину',
      'login_to_add_favorites': 'Войдите, чтобы добавить в избранное',

      // Cart screen
      'items_count_suffix': 'товаров',
      'clear_all_confirm': 'Удалить все товары?',
      'available_stock': 'В наличии',
      'pieces_short': 'шт',
      'remove_from_cart_confirm': 'удалить из корзины?',
      'free_label': 'Бесплатно',
      'enter_promo': 'Введите промокод',
      'invalid_promo': 'Неверный или просроченный промокод',
      'min_order_sum': 'Минимальная сумма заказа:',
      'promo_applied': 'Промокод применён!',
      'discount_amount': 'скидка',

      // Profile screen
      'login_to_profile': 'Войти в профиль',
      'via_phone': 'По номеру телефона',
      'devices': 'Устройства',
      'manage_devices': 'Управление подключёнными устройствами',
      'cannot_open_site': 'Не удалось открыть сайт',
      'choose_language': 'Выберите язык',
      'uzbek_lang': 'Узбекский',
      'russian_lang': 'Русский',
      'logout_question': 'Вы хотите выйти из аккаунта?',
      'logout_action': 'Выйти из аккаунта',

      // Order status strings
      'status_order_received': 'Заказ принят',
      'status_order_confirmed': 'Заказ подтверждён',
      'status_store_preparing': 'Магазин готовит',
      'status_order_ready': 'Заказ готов',
      'status_courier_assigned': 'Курьер назначен',
      'status_courier_picked_up': 'Курьер забрал, в пути',
      'status_on_the_way': 'Заказ в пути',
      'status_delivered_info': 'Доставлен',
      'status_at_pickup': 'Ожидает в пункте',
      'status_cancelled_info': 'Отменён',
      'order_status_title': 'Статус заказа',
      'order_cancelled_title': 'Заказ отменён',
      'show_qr': 'Покажите QR код',
      'show_qr_desc': 'Покажите этот QR код сканеру в пункте выдачи',
      'or_tell_code': 'Или назовите код:',
      'pickup_point': 'Пункт выдачи',
      'address_not_found': 'Адрес не найден',
      'payment_info': 'Информация об оплате',
      'plastic_card': 'Банковская карта',
      'cash_payment': 'Наличные',
      'all_tab': 'Все',
      'in_process_tab': 'В процессе',
      'cancelled_tab': 'Отменённые',
      'and_more': 'и ещё',
      'confirmed_timeline': 'Подтверждён',
      'picked_up': 'Забран',

      // Checkout screen
      'order_checkout': 'Оформление заказа',
      'pickup_point_select': 'Выберите пункт',
      'free_delivery': 'бесплатно',
      'courier': 'Курьер',
      'tomorrow_or_later': 'Завтра или позже',
      'select_address': 'Выберите адрес',
      'recipient': 'Получатель',
      'select_option': 'Выберите',
      'name_not_entered': 'Имя не указано',
      'add_other_recipient': 'Добавить другого получателя',
      'name_label': 'Имя',
      'enter_name': 'Введите имя',
      'do_not_call': 'Не звонить',
      'delivery_date': 'Дата доставки',
      'tomorrow': 'Завтра',
      'day_after_tomorrow': 'Послезавтра',
      'monday': 'Понедельник',
      'tuesday': 'Вторник',
      'wednesday': 'Среда',
      'thursday': 'Четверг',
      'friday': 'Пятница',
      'saturday': 'Суббота',
      'sunday': 'Воскресенье',
      'delivery_time_info': 'Доставка с 9:00 до 21:00',
      'select_payment_method': 'Выберите способ оплаты',
      'courier_note': 'Комментарий курьеру',
      'courier_note_hint': 'Например: код домофона, этаж, ориентир...',
      'delivery_addresses': 'Адреса доставки',
      'enter_home_address': 'Домашний адрес',
      'enter_work_address': 'Рабочий адрес',
      'via_courier': 'Курьером',
      'address_type_label': 'адрес',
      'district_street_hint': 'Район, улица, номер дома...',
      'select_from_map': 'Выбрать на карте',
      'additional_optional': 'Дополнительно (необязательно)',
      'apartment_entrance_hint': 'Квартира, подъезд, этаж',
      'enter_address': 'Введите адрес',
      'address_added': 'Адрес добавлен!',
      'secure_payment': 'Гарантия безопасной оплаты',
      'select_address_please': 'Пожалуйста, выберите адрес',
      'select_pickup_please': 'Пожалуйста, выберите пункт выдачи',
      'enter_recipient_name': 'Введите имя получателя',
      'enter_recipient_phone': 'Введите телефон получателя',
      'select_delivery_date': 'Выберите дату доставки',
      'select_card_please': 'Пожалуйста, выберите карту',
      'order_create_error': 'Ошибка при создании заказа',
      'payment_failed': 'Оплата не прошла',
      'payment_error': 'Ошибка оплаты',
      'confirm_3d_secure': 'Вы подтвердили оплату на странице банка?',
      'yes_confirmed': 'Да, подтвердил',
      'new_card_add': 'Добавить новую карту',
      'expiry_label': 'Срок',
      'products_with_count': 'Товары',
      'add_new_card': 'Добавить карту',
      'your_rating': 'Ваша оценка',
      'write_your_opinion': 'Напишите ваше мнение...',
      'review_submitted': 'Ваш отзыв отправлен!',
      'submit': 'Отправить',
      'how_it_works': 'Как это работает?',
      'your_code': 'Ваш код',
      'code_copied': 'Код скопирован',
      'copy_code': 'Копировать',
      'link_copied': 'Ссылка скопирована',
      'copy_link': 'Скопировать ссылку',
      'have_friend_code': 'Есть код друга?',
      'enter_code_hint': 'Введите код',
      'statistics': 'Статистика',
      'invited_count': 'Приглашено',
      'earned': 'Заработано',
      'last_invitations': 'Последние приглашения',
      'step_share': 'Поделитесь кодом',
      'step_register': 'Друг регистрируется',
      'step_purchase': 'Друг совершает покупку',
      'step_bonus': 'Оба получаете бонус',
      'for_each_friend': 'За каждого друга',
      'code_applied': 'Код применён!',
      'share_text':
          'Скачайте приложение TOPLA и зарегистрируйтесь по моему коду приглашения',
      'get_and_gift': 'получите и подарите другу!',
      // Система баллов
      'my_points': 'Мои баллы',
      'points_short': 'б.',
      'points_history': 'История баллов',
      'rewards_catalog': 'Подарки',
      'claim_reward': 'Получить',
      'not_enough_points': 'Недостаточно баллов',
      'reward_claimed': 'Заявка отправлена!',
      'reward_pending': 'Ожидание',
      'friends_count': 'Друзья',
      'reg_bonus_info': 'Друг зарегистрируется',
      'purchase_bonus_info': 'Друг купит',
      'min_purchase_info': 'Минимальная сумма покупки',
      'friend_registered': 'Зарегистрировался',
      'friend_purchased': 'Совершил покупку',
      'out_of_stock': 'Закончился',
      'points_label': 'балл',
      'my_returns': 'Мои возвраты',
      'return_rules': 'Правила',
      'new_return': 'Новый возврат',
      'approved': 'Одобрено',
      'rejected': 'Отклонено',
      'returned': 'Возвращено',
      'waiting': 'Ожидание',
      'order_label': 'Заказ',
      'cancel_action': 'Отменить',
      'return_guarantee_title': 'Гарантия возврата 14 дней',
      'return_guarantee_desc': 'Мы гарантируем возврат средств',
      'return_step1_title': 'Создайте заявку',
      'return_step1_desc':
          'Выберите заказ и укажите причину возврата. Приложите фото при необходимости.',
      'return_step2_title': 'Ожидайте проверку',
      'return_step2_desc':
          'Наша команда рассмотрит вашу заявку в течение 24 часов.',
      'return_step3_title': 'Возврат средств',
      'return_step3_desc':
          'После одобрения средства будут возвращены в течение 3-5 рабочих дней.',
      'return_conditions': 'Условия возврата',
      'return_rule_14_days':
          'Возврат возможен в течение 14 дней после доставки',
      'return_rule_packaging': 'Товар должен быть в оригинальной упаковке',
      'return_rule_receipt': 'Сохраните чек и документы к товару',
      'return_rule_photo': 'Приложите фото товара к заявке',
      'return_rule_hygiene': 'Товары личной гигиены возврату не подлежат',
      'no_delivered_orders': 'У вас нет доставленных заказов для возврата',
      'cancel_return_question': 'Отменить возврат?',
      'cancel_return_confirm':
          'Вы уверены, что хотите отменить заявку на возврат?',
      'request_cancelled': 'Заявка отменена',
      'return_created': 'Заявка на возврат создана',
      'select_order': 'Выберите заказ',
      'describe_problem_hint': 'Опишите проблему подробнее...',
      'photo_optional': 'Фото (необязательно)',
      'submit_request': 'Отправить заявку',
      'reason_defective': 'Дефектный товар',
      'reason_wrong_item': 'Отправлен не тот товар',
      'reason_not_as_described': 'Не соответствует описанию',
      'reason_damaged': 'Поврежденный товар',
      'reason_size_issue': 'Не подошел размер',
      'reason_changed_mind': 'Передумал(а)',
      'returns_empty_subtitle':
          'Здесь будут отображаться ваши запросы на возврат',
      'items_count_label': 'товаров',

      // Profile, Address, Payment screens
      'camera_coming_soon': 'Функция камеры скоро...',
      'gallery_coming_soon': 'Функция галереи скоро...',
      'enter_full_name': 'Введите имя и фамилию',
      'profile_updated': 'Профиль обновлён',
      'sms_send_error': 'Ошибка при отправке SMS',
      'address_deleted': 'Адрес удалён',
      'default_address_changed': 'Основной адрес изменён',
      'understood': 'Понятно',
      'delete_card': 'Удалить карту',
      'card_deleted': 'Карта удалена',

      // Vendor - Promo codes
      'promo_codes': 'Промокоды',
      'create': 'Создать',
      'new_promo_code': 'Новый промокод',
      'promo_code_label': 'Промокод',
      'discount_type': 'Тип скидки',
      'percentage': 'Процент (%)',
      'fixed_amount': 'Фиксированная сумма',
      'discount_amount_label': 'Сумма скидки',
      'min_order_amount': 'Мин. сумма заказа',
      'max_usage': 'Максимальное использование',
      'validity_period': 'Срок действия',
      'enter_code_and_amount': 'Введите код и сумму скидки',
      'invalid_discount_amount': 'Неверная сумма скидки',
      'promo_code_created': 'Промокод создан',
      'delete_promo_code': 'Удалить промокод',
      'promo_code_deleted': 'Промокод удалён',
      'no_promo_codes': 'Нет промокодов',
      'create_promo_hint': 'Создайте промокод для клиентов',
      'used_count': 'использовано',
      'expired': 'Истёк',
      'valid_until': 'До',
      'unlimited': 'Бессрочно',
      'optional_hint': 'Необязательно',
      'unlimited_uses': 'Без ограничений',
      'delete_promo_confirm': 'Удалить промокод?',

      // Vendor - Documents
      'documents': 'Документы',
      'copied': 'Скопировано',
      'download': 'Скачать',
      'upload_document': 'Загрузить документ',
      'document_type': 'Тип документа',
      'document_name': 'Название документа',
      'example_passport': 'Например: Личный паспорт',
      'enter_document_name': 'Введите название документа',
      'select_image': 'Выбрать фото',
      'document_uploaded': 'Документ успешно загружен',
      'delete_document': 'Удалить документ',
      'delete_document_confirm': 'Удалить документ?',
      'document_deleted': 'Документ удалён',
      'view_contract': 'Просмотр договора',
      'shop_info': 'Информация о магазине',
      'status_label': 'Статус',
      'verified': 'Подтверждён',
      'not_verified': 'Не подтверждён',
      'registered_date': 'Дата регистрации',
      'commission_rate_label': 'Ставка комиссии',
      'my_documents': 'Мои документы',
      'upload': 'Загрузить',
      'no_documents': 'Документы не загружены',
      'upload_docs_hint': 'Загрузите паспорт, ИНН или лицензию',
      'document_default_name': 'Документ',
      'approved_status': 'Одобрено',
      'rejected_status': 'Отклонено',
      'pending_status': 'На проверке',
      'contract': 'Договор',
      'offer_accepted': 'Договор оферты принят',
      'commission_terms': 'Условия комиссии',
      'standard_commission': 'Стандартная комиссия',
      'deducted_per_sale': 'Удерживается с каждой продажи',
      'withdrawal_commission': 'Комиссия за вывод',
      'withdrawal_commission_desc': 'При выводе средств',
      'min_withdrawal': 'Минимальный вывод',
      'min_withdrawal_desc': 'Минимальная сумма для вывода',
      'rules': 'Правила',
      'product_moderation': 'Модерация товаров',
      'product_moderation_desc': 'Все товары проходят модерацию',
      'quality_requirements': 'Требования к качеству',
      'quality_requirements_desc':
          'Фото товаров должны быть чёткими и качественными',
      'price_accuracy': 'Точность цен',
      'price_accuracy_desc': 'Указанная цена должна соответствовать реальной',
      'order_fulfillment': 'Выполнение заказов',
      'order_fulfillment_desc':
          'Заказы должны быть подтверждены в течение 24 часов',
      'customer_service': 'Обслуживание клиентов',
      'customer_service_desc': 'Профессиональное общение с клиентами',
      'offer_contract': 'Договор оферты',

      // Vendor - Shop settings
      'logo_uploaded': 'Логотип загружен',
      'banner_uploaded': 'Баннер загружен',
      'enter_shop_name': 'Введите название магазина',
      'settings_saved': 'Настройки сохранены',
      'shop_settings': 'Настройки магазина',
      'change_logo': 'Изменить логотип',
      'shop_name': 'Название магазина',
      'current_rate': 'Текущая ставка:',
      'banner_image_hint': 'Баннер (1200x400)',
      'basic_info': 'Основная информация',
      'description_label': 'Описание',
      'contact_info': 'Контакты',
      'phone_label': 'Телефон',
      'address_section': 'Адрес',
      'city_label': 'Город',
      'commission_label': 'Комиссия',
      'shop_active': 'Ваш магазин активен',
      'awaiting_verification': 'Ожидает проверки администратора',
      'saving': 'Сохранение...',
      'deducted_per_sale_short': 'Удерживается с каждой продажи',

      // Vendor - Product form
      'select_category': 'Выберите категорию',
      'please_select_category': 'Пожалуйста, выберите категорию',
      'subcategory_optional': 'Подкатегория (необязательно)',
      'name_uz': 'Название (узб.)',
      'name_ru': 'Название (рус.)',
      'description_uz': 'Описание (узб.)',
      'description_ru': 'Описание (рус.)',
      'old_price': 'Старая цена',
      'stock_count': 'Остаток',
      'edit_product': 'Редактирование товара',
      'new_product': 'Новый товар',
      'product_images': 'Фото товара',
      'enter_product_name': 'Введите название товара',
      'price_label': 'Цена',
      'enter_price': 'Введите цену',
      'invalid_format': 'Неверный формат',
      'enter_quantity': 'Введите количество',
      'invalid_value': 'Неверно',
      'product_updated': 'Товар обновлён',
      'product_added': 'Товар добавлен',
      'images_uploading': 'Загрузка фото...',
      'pending_moderation_info':
          'Товар станет активным после проверки администратором.',
      'category_required': 'Категория *',

      // Vendor - Products screen
      'my_products': 'Мои товары',
      'add_product': 'Добавить товар',
      'add': 'Добавить',
      'product_deleted': 'Товар удалён',
      'delete_product': 'Удалить товар',
      'product_resubmitted': 'Товар отправлен повторно',
      'resubmit': 'Отправить повторно',
      'active_tab': 'Активные',
      'pending_tab': 'Ожидание',
      'rejected_tab': 'Отклонённые',
      'no_products': 'Товаров нет',
      'edit_label': 'Редактировать',
      'stock_with_colon': 'Остаток:',
      'delete_product_confirm': 'Удалить этот товар?',

      // Vendor - Reviews
      'reply': 'Ответить',
      'reply_to_review': 'Ответ на отзыв',
      'write_reply': 'Напишите текст ответа...',
      'reply_sent': 'Ответ отправлен',
      'send': 'Отправить',
      'no_reviews': 'Пока нет отзывов',
      'wait_first_review': 'Ожидайте первый отзыв',
      'unknown_user': 'Неизвестный',
      'vendor_reply': 'Ответ продавца',

      // Vendor - Order detail
      'confirm': 'Подтвердить',
      'order_process': 'Процесс заказа',
      'customer_info': 'Данные клиента',
      'note_label': 'Примечание',
      'update_status_confirm': 'Обновить статус заказа?',
      'status_updated': 'Статус обновлён',
      'delivery_label': 'Доставка',
      'method_label': 'Способ',
      'date_label': 'Дата',
      'time_label': 'Время',
      'point_label': 'Пункт',
      'pickup_code_label': 'Код самовывоза',
      'total_label': 'Итого',
      'start_processing': 'Начать подготовку',
      'ready_for_courier': 'Готово \u2014 передать курьеру',
      'delivered_to_point': 'Передано в пункт',
      'payment_method_label': 'Способ оплаты',
      'payment_status_label': 'Статус оплаты',
      'order_cancelled_text': 'Заказ отменён',

      // Vendor - Dashboard & Analytics & Orders
      'shop_not_verified': 'Магазин ещё не подтверждён',
      'admin_review_pending': 'Активируется после проверки администратором',
      'balance': 'Баланс',
      'withdraw': 'Вывести',
      'today': 'Сегодня',
      'orders': 'Заказы',
      'revenue': 'Доход',
      'products': 'Товары',
      'active': 'Активные',
      'this_month': 'Этот месяц',
      'pcs': 'шт',
      'management': 'Управление',
      'messages': 'Сообщения',
      'payments': 'Платежи',
      'analytics': 'Аналитика',
      'commissions': 'Комиссии',
      'shop': 'Магазин',
      'no_shop': 'У вас нет магазина',
      'no_shop_desc':
          'Перейдите на наш сайт и зарегистрируйтесь, чтобы открыть магазин',
      'go_to_website': 'Перейти на сайт',
      'week': 'Неделя',
      'month': 'Месяц',
      'year': 'Год',
      'general_stats': 'Общие показатели',
      'net_revenue': 'Чистый доход',
      'no_sales_data': 'Нет данных о продажах',
      'sales_dynamics': 'Динамика продаж',
      'top_products': 'Топ товары',
      'no_data': 'Нет данных',
      'pcs_sold': 'шт продано',
      'in_process': 'В процессе',
      'completed': 'Выполнен',
      'new_orders': 'Новые',
      'ready': 'Готов',
      'no_orders': 'Заказов нет',
      'manage': 'Управлять',
      'all_filter': 'Все',

      // Vendor - Commissions
      'monthly_commission': 'Месячная комиссия',
      'total_commission': 'Общая комиссия',
      'no_commissions': 'Нет комиссий',
      'order': 'Заказ',
      'sale': 'Продажа',

      // Vendor - Chat
      'customer': 'Покупатель',
      'quick_reply_hello': 'Здравствуйте! Чем могу помочь?',
      'quick_reply_order_ready': 'Ваш заказ готов!',
      'quick_reply_available': 'Да, товар в наличии',
      'quick_reply_not_available': 'К сожалению, сейчас нет в наличии',
      'chat_empty': 'Чат пуст',
      'send_message_to_customer': 'Отправьте сообщение покупателю',
      'yesterday': 'Вчера',
      'write_message': 'Напишите сообщение...',
      'chats_load_error': 'Ошибка загрузки чатов',
      'refresh': 'Обновить',
      'chat_started': 'Чат начат',
      'no_messages': 'Нет сообщений',
      'no_messages_desc': 'Здесь будут сообщения от покупателей',

      // Vendor - Payouts
      'amount': 'Сумма',
      'send_request': 'Отправить запрос',
      'request_sent': 'Запрос отправлен',
      'bank_transfer': 'Банковский перевод',
      'available_balance': 'Доступный баланс',
      'no_payouts_history': 'Нет истории выплат',

      // Vendor - Returns
      'no_returns': 'Нет возвратов',
      'admin_note': 'Примечание администратора',
      'reason': 'Причина',

      // Vendor - Documents (types)
      'doc_passport': 'Копия паспорта',
      'doc_inn': 'Свидетельство ИНН',
      'doc_license': 'Лицензия',
      'doc_certificate': 'Сертификат',
      'doc_other': 'Другой документ',

      // Vendor - Other missing
      'shop_not_verified_msg': 'Ваш магазин ещё не подтверждён',
      'delivery': 'Доставка',
      'payment_status': 'Статус оплаты',
      'pickup_code': 'Код получения',
      'product_moderation_info':
          'Товар будет активирован после проверки администратором.',
      'month_period': 'Месяц',
      'completed_status': 'Выполнено',

      // Shop detail screen
      'login_required_feature': 'Для этой функции необходимо войти',
      'shop_label': 'Магазин',
      'sold_label': 'Продано',
      'followers': 'Подписчики',
      'review_count_suffix': 'отзыв',
      'shop_not_found': 'Магазин не найден',
      'shop_not_found_desc': 'Этот магазин не существует или был удалён',
      'subscribed_btn': 'Подписка',
      'subscribe_btn': 'Подписаться',
      'message_btn': 'Сообщение',
      'no_products_yet': 'Товаров пока нет',
      'products_coming_soon': 'Скоро появятся новые товары',
      'contact_section': 'Контакты',
      'total_sales': 'Всего продаж',
      'total_orders': 'Всего заказов',
      'member_since': 'Дата регистрации',
      'rating_suffix': 'рейтинг',

      // Shop reviews screen
      'login_to_review': 'Войдите, чтобы оставить отзыв',
      'add_review': 'Оставить отзыв',
      'no_reviews_yet': 'Отзывов пока нет',
      'be_first_reviewer': 'Будьте первым, кто оставит отзыв!',
      'default_user': 'Пользователь',
      'select_rating_please': 'Пожалуйста, выберите оценку',
      'review_added_success': 'Отзыв успешно добавлен!',
      'error_try_again': 'Произошла ошибка. Попробуйте снова.',
      'share_opinion_about_shop': 'Поделитесь мнением о магазине',
      'rating_label': 'Оценка',
      'comment_optional': 'Комментарий (необязательно)',
      'review_hint': 'Напишите ваше мнение о магазине...',
      'submit_review': 'Добавить отзыв',
      'rating_very_bad': 'Очень плохо',
      'rating_bad': 'Плохо',
      'rating_average': 'Средне',
      'rating_good': 'Хорошо',
      'rating_excellent': 'Отлично',

      // Shop chat screen
      'start_conversation': 'Начните беседу',
      'chat_with_shop_desc': 'Вы можете задать вопросы магазину',
      'go_to_shop': 'Перейти в магазин',
      'delete_conversation': 'Удалить беседу',
      'delete_conversation_confirm':
          'Эта беседа будет полностью удалена. Продолжить?',

      // OTP screen
      'enter_6_digit_code': 'Пожалуйста, введите 6-значный код',
      'verification_id_error': 'Ошибка: Verification ID не найден',
      'wrong_code': 'Неверный код. Проверьте ещё раз',
      'code_expired': 'Срок действия кода истёк. Отправьте повторно',
      'code_resent': 'Код отправлен повторно',
      'error_prefix': 'Ошибка',

      // Complete profile screen
      'enter_name_please': 'Пожалуйста, введите ваше имя',
      'enter_name_to_continue': 'Введите ваше имя, чтобы продолжить',
      'first_name_required': 'Имя *',
      'enter_your_name': 'Введите ваше имя',
      'last_name': 'Фамилия',
      'enter_your_surname': 'Введите вашу фамилию',

      // Vendor guard
      'login_to_system': 'Войдите в систему',
      'login_for_vendor_panel':
          'Войдите в систему для доступа к панели продавца',
      'become_vendor': 'Стать продавцом',
      'open_shop_title': 'Откройте магазин',
      'open_shop_to_sell': 'Откройте свой магазин для продажи товаров',
      'login_first': 'Сначала войдите в систему',
      'vendor_permission_needed': 'Необходимы права продавца',

      // Swipeable cart item
      'delete_confirm_msg': 'Удалить {name}?',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }

  // Convenience getters
  String get appName => translate('app_name');
  String get ok => translate('ok');
  String get cancel => translate('cancel');
  String get save => translate('save');
  String get delete => translate('delete');
  String get edit => translate('edit');
  String get close => translate('close');
  String get back => translate('back');
  String get next => translate('next');
  String get done => translate('done');
  String get loading => translate('loading');
  String get error => translate('error');
  String get success => translate('success');
  String get retry => translate('retry');
  String get yes => translate('yes');
  String get no => translate('no');

  // Auth
  String get login => translate('login');
  String get logout => translate('logout');
  String get register => translate('register');
  String get phoneNumber => translate('phone_number');
  String get password => translate('password');
  String get confirmPassword => translate('confirm_password');
  String get forgotPassword => translate('forgot_password');
  String get enterPhone => translate('enter_phone');
  String get enterCode => translate('enter_code');
  String get verificationCode => translate('verification_code');
  String get verify => translate('verify');
  String get resendCode => translate('resend_code');
  String get orContinueWith => translate('or_continue_with');

  // Navigation
  String get home => translate('home');
  String get catalog => translate('catalog');
  String get cart => translate('cart');
  String get favorites => translate('favorites');
  String get profile => translate('profile');

  // Home
  String get searchHint => translate('search_hint');
  String get categories => translate('categories');
  String get discounts => translate('discounts');
  String get popular => translate('popular');
  String get newArrivals => translate('new_arrivals');
  String get seeAll => translate('see_all');
  String get recommended => translate('recommended');

  // Product
  String get addToCart => translate('add_to_cart');
  String get buyNow => translate('buy_now');
  String get description => translate('description');
  String get reviews => translate('reviews');
  String get specifications => translate('specifications');
  String get inStock => translate('in_stock');
  String get outOfStock => translate('out_of_stock');
  String get quantity => translate('quantity');
  String get price => translate('price');
  String get total => translate('total');
  String get discount => translate('discount');
  String get sold => translate('sold');
  String get rating => translate('rating');
  String get addedToCart => translate('added_to_cart');

  // Cart
  String get yourCart => translate('your_cart');
  String get emptyCart => translate('empty_cart');
  String get emptyCartDesc => translate('empty_cart_desc');
  String get checkout => translate('checkout');
  String get promoCode => translate('promo_code');
  String get apply => translate('apply');
  String get subtotal => translate('subtotal');
  String get shipping => translate('shipping');
  String get freeShipping => translate('free_shipping');
  String get clearCart => translate('clear_cart');
  String get removeItem => translate('remove_item');
  String get removeItemConfirm => translate('remove_item_confirm');

  // Favorites
  String get yourFavorites => translate('your_favorites');
  String get emptyFavorites => translate('empty_favorites');
  String get emptyFavoritesDesc => translate('empty_favorites_desc');
  String get addToFavorites => translate('add_to_favorites');
  String get removeFromFavorites => translate('remove_from_favorites');
  String get removedFromFavorites => translate('removed_from_favorites');
  String get addFavoritesHint => translate('add_favorites_hint');
  String get clearFavorites => translate('clear_favorites');
  String get clearFavoritesConfirm => translate('clear_favorites_confirm');
  String get clear => translate('clear');
  String get shopNow => translate('shop_now');
  String get soldCount => translate('sold_count');

  // Profile
  String get myProfile => translate('my_profile');
  String get personalInfo => translate('personal_info');
  String get myOrders => translate('my_orders');
  String get myAddresses => translate('my_addresses');
  String get paymentMethods => translate('payment_methods');
  String get notifications => translate('notifications');
  String get settings => translate('settings');
  String get helpCenter => translate('help_center');
  String get aboutUs => translate('about_us');
  String get privacyPolicy => translate('privacy_policy');
  String get termsConditions => translate('terms_conditions');
  String get inviteFriends => translate('invite_friends');
  String get rateApp => translate('rate_app');
  String get language => translate('language');
  String get darkMode => translate('night_mode');
  String get logoutConfirm => translate('logout_confirm');

  // Orders
  String get orderHistory => translate('order_history');
  String get activeOrders => translate('active_orders');
  String get completedOrders => translate('completed_orders');
  String get cancelledOrders => translate('cancelled_orders');
  String get orderDetails => translate('order_details');
  String get orderNumber => translate('order_number');
  String get orderDate => translate('order_date');
  String get orderStatus => translate('order_status');
  String get trackOrder => translate('track_order');
  String get reorder => translate('reorder');

  // Address
  String get addAddress => translate('add_address');
  String get editAddress => translate('edit_address');
  String get address => translate('address');
  String get city => translate('city');
  String get region => translate('region');
  String get street => translate('street');
  String get house => translate('house');
  String get apartment => translate('apartment');
  String get entrance => translate('entrance');
  String get floor => translate('floor');
  String get landmark => translate('landmark');
  String get defaultAddress => translate('default_address');
  String get setAsDefault => translate('set_as_default');

  // Payment
  String get payment => translate('payment');
  String get paymentMethod => translate('payment_method');
  String get cash => translate('cash');
  String get card => translate('card');
  String get addCard => translate('add_card');
  String get cardNumber => translate('card_number');
  String get expiryDate => translate('expiry_date');
  String get cvv => translate('cvv');

  // Search
  String get search => translate('search');
  String get searchResults => translate('search_results');
  String get noResults => translate('no_results');
  String get searchHistory => translate('search_history');
  String get popularSearches => translate('popular_searches');
  String get clearHistory => translate('clear_history');
  String get sortBy => translate('sort_by');
  String get filter => translate('filter');
  String get priceLowHigh => translate('price_low_high');
  String get priceHighLow => translate('price_high_low');
  String get newest => translate('newest');
  String get mostPopular => translate('most_popular');

  // Checkout
  String get deliveryAddress => translate('delivery_address');
  String get deliveryTime => translate('delivery_time');
  String get orderSummary => translate('order_summary');
  String get placeOrder => translate('place_order');
  String get orderPlaced => translate('order_placed');
  String get orderPlacedDesc => translate('order_placed_desc');

  // Errors
  String get networkError => translate('network_error');
  String get serverError => translate('server_error');
  String get tryAgain => translate('try_again');
  String get somethingWrong => translate('something_wrong');
  String get fieldRequired => translate('field_required');
  String get invalidPhone => translate('invalid_phone');
  String get invalidCode => translate('invalid_code');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['uz', 'ru'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

// Extension for easy access
extension LocalizationExtension on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this)!;
}
