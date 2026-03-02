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
      'empty_cart': 'Savat bo\'sh',
      'empty_cart_desc': 'Hali hech narsa qo\'shilmagan',
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
      'empty_favorites': 'Sevimlilar bo\'sh',
      'empty_favorites_desc': 'Sevimli mahsulotlar yo\'q',
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
      'orders_empty_desc': 'Birinchi xaridingizni qiling',
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
      'purchased_empty_desc': 'Siz hali hech narsa sotib olmadingiz',

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
      'empty_cart_desc': 'Вы еще ничего не добавили',
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
      'empty_favorites': 'Нет избранных',
      'empty_favorites_desc': 'У вас нет избранных товаров',
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
      'orders_empty_desc': 'Сделайте свой первый заказ',
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
      'purchased_empty_desc': 'Вы ещё ничего не купили',

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
