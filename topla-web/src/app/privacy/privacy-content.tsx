'use client'

import { useLocaleStore } from '@/store/locale-store'
import { SupportPhoneLink, useTelegramLink, useTelegramHandle, useSupportEmail } from '@/hooks/useSettings'

export default function PrivacyContent() {
  const locale = useLocaleStore((s) => s.locale)
  const isRu = locale === 'ru'
  const telegramLink = useTelegramLink()
  const telegramHandle = useTelegramHandle()
  const email = useSupportEmail()

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 leading-tight">
            {isRu ? 'Политика конфиденциальности TOPLA' : 'TOPLA Maxfiylik siyosati'}
          </h1>
          <p className="mt-3 text-[15px] text-gray-500">
            {isRu ? 'Последнее обновление: 9 апреля 2026 г.' : "So'nggi yangilanish: 2026-yil, 9-aprel"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <article className="space-y-10 text-[15px] leading-[1.75] text-gray-700">

          <div className="border-l-4 border-orange-400 pl-4 py-1 text-gray-600">
            <p>
              {isRu
                ? 'Настоящая Политика конфиденциальности описывает, каким образом ИП «TOPLA» (далее — «мы», «нас», «TOPLA») собирает, использует, хранит и защищает персональные данные пользователей мобильного приложения и веб-сайта TOPLA (далее — «Платформа»). Используя Платформу, вы соглашаетесь с условиями настоящей Политики.'
                : 'Mazkur Maxfiylik siyosati YaTT «TOPLA» (bundan buyon — «biz», «bizning», «TOPLA») TOPLA mobil ilovasi va veb-sayti (bundan buyon — «Platforma») foydalanuvchilarining shaxsiy ma\'lumotlarini qanday to\'plashi, ishlatishi, saqlashi va himoya qilishini tavsiflaydi. Platformadan foydalanish orqali siz ushbu Siyosat shartlariga rozilik bildirasiz.'}
            </p>
          </div>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '1. Основные понятия' : '1. Asosiy tushunchalar'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '«Персональные данные» — любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).'
                  : '«Shaxsiy ma\'lumotlar» — bevosita yoki bilvosita aniqlangan yoki aniqlanishi mumkin bo\'lgan jismoniy shaxsga (shaxsiy ma\'lumotlar subyektiga) tegishli har qanday ma\'lumot.'}
              </p>
              <p>
                {isRu
                  ? '«Обработка персональных данных» — любое действие или совокупность действий, совершаемых с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение.'
                  : '«Shaxsiy ma\'lumotlarni qayta ishlash» — shaxsiy ma\'lumotlar bilan amalga oshiriladigan har qanday harakat yoki harakatlar majmui, jumladan to\'plash, yozish, tizimlash, saqlash, aniqlashtirish, olish, foydalanish, uzatish, anonimlashtirish, bloklash, o\'chirish, yo\'q qilish.'}
              </p>
              <p>
                {isRu
                  ? '«Продавец» — юридическое лицо или индивидуальный предприниматель, размещающий товары на Платформе для продажи.'
                  : '«Sotuvchi» — Platformada tovarlarni sotish uchun joylashtiruvchi yuridik shaxs yoki yakka tartibdagi tadbirkor.'}
              </p>
              <p>
                {isRu
                  ? '«Покупатель» (далее также «Пользователь», «вы») — физическое лицо, использующее Платформу для просмотра и приобретения товаров.'
                  : '«Xaridor» (bundan buyon «Foydalanuvchi», «siz» ham) — Platformadan tovarlarni ko\'rish va sotib olish uchun foydalanadigan jismoniy shaxs.'}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '2. Какие данные мы собираем' : '2. Qanday ma\'lumotlarni to\'playmiz'}
            </h2>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">
              {isRu ? '2.1. Данные, предоставляемые вами' : '2.1. Siz taqdim etadigan ma\'lumotlar'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Имя и фамилия' : 'Ism va familiya'}</li>
              <li>{isRu ? 'Номер мобильного телефона' : 'Mobil telefon raqami'}</li>
              <li>{isRu ? 'Адрес электронной почты (при наличии)' : 'Elektron pochta manzili (mavjud bo\'lsa)'}</li>
              <li>{isRu ? 'Адреса доставки' : 'Yetkazib berish manzillari'}</li>
              <li>{isRu ? 'Фотография профиля (по желанию)' : 'Profil rasmi (ixtiyoriy)'}</li>
              <li>{isRu ? 'Данные для входа через Google (идентификатор, электронная почта)' : 'Google orqali kirish ma\'lumotlari (identifikator, elektron pochta)'}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '2.2. Данные, собираемые автоматически' : '2.2. Avtomatik to\'planadigan ma\'lumotlar'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'IP-адрес и данные о местоположении (город — для определения зоны доставки)' : 'IP-manzil va joylashuv ma\'lumotlari (shahar — yetkazib berish zonasini aniqlash uchun)'}</li>
              <li>{isRu ? 'Тип и модель устройства, версия операционной системы' : 'Qurilma turi va modeli, operatsion tizim versiyasi'}</li>
              <li>{isRu ? 'Уникальный идентификатор устройства' : 'Qurilmaning yagona identifikatori'}</li>
              <li>{isRu ? 'Данные о действиях в приложении (просмотренные товары, поисковые запросы, заказы)' : 'Ilovadagi harakatlar haqida ma\'lumotlar (ko\'rilgan mahsulotlar, qidiruv so\'rovlari, buyurtmalar)'}</li>
              <li>{isRu ? 'Данные об ошибках и сбоях (Firebase Crashlytics)' : 'Xatolar va nosozliklar haqida ma\'lumotlar (Firebase Crashlytics)'}</li>
              <li>{isRu ? 'Токен push-уведомлений (Firebase Cloud Messaging)' : 'Push-bildirishnoma tokeni (Firebase Cloud Messaging)'}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '2.3. Платёжные данные' : '2.3. To\'lov ma\'lumotlari'}
            </h3>
            <p>
              {isRu
                ? 'Платежи обрабатываются через сертифицированного провайдера Octobank. Мы не храним и не имеем доступа к полным данным вашей банковской карты (номер, CVV, срок действия). На нашей стороне сохраняется только идентификатор транзакции и статус оплаты.'
                : 'To\'lovlar sertifikatlangan provayder Octobank orqali amalga oshiriladi. Biz sizning bank kartangizning to\'liq ma\'lumotlarini (raqam, CVV, amal qilish muddati) saqlamaymiz va ularga kirishimiz yo\'q. Bizning tomonda faqat tranzaksiya identifikatori va to\'lov holati saqlanadi.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '3. Цели обработки данных' : '3. Ma\'lumotlarni qayta ishlash maqsadlari'}
            </h2>
            <p className="mb-3">
              {isRu ? 'Мы обрабатываем ваши персональные данные для следующих целей:' : 'Biz sizning shaxsiy ma\'lumotlaringizni quyidagi maqsadlarda qayta ishlaymiz:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Регистрация и ведение учётной записи пользователя' : 'Foydalanuvchi hisobini ro\'yxatdan o\'tkazish va yuritish'}</li>
              <li>{isRu ? 'Оформление, обработка и доставка заказов' : 'Buyurtmalarni rasmiylashtirish, qayta ishlash va yetkazib berish'}</li>
              <li>{isRu ? 'Проведение платежей и возвратов' : 'To\'lovlarni amalga oshirish va qaytarishlar'}</li>
              <li>{isRu ? 'Связь с вами по вопросам заказов и обслуживания' : 'Buyurtmalar va xizmat ko\'rsatish masalalari bo\'yicha siz bilan bog\'lanish'}</li>
              <li>{isRu ? 'Персонализация контента и рекомендации товаров' : 'Kontentni shaxsiylashtirish va mahsulot tavsiyanomalar'}</li>
              <li>{isRu ? 'Улучшение качества Платформы и анализ пользовательского поведения' : 'Platforma sifatini oshirish va foydalanuvchi xatti-harakatlarini tahlil qilish'}</li>
              <li>{isRu ? 'Обеспечение безопасности и предотвращение мошенничества' : 'Xavfsizlikni ta\'minlash va firibgarlikning oldini olish'}</li>
              <li>{isRu ? 'Отправка уведомлений о статусе заказа, акциях и новостях (с вашего согласия)' : 'Buyurtma holati, aksiyalar va yangiliklar haqida bildirishnomalar yuborish (sizning roziligingiz bilan)'}</li>
              <li>{isRu ? 'Выполнение требований законодательства Республики Узбекистан' : 'O\'zbekiston Respublikasi qonunchiligining talablarini bajarish'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '4. Правовые основания обработки' : '4. Qayta ishlashning huquqiy asoslari'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'Обработка персональных данных осуществляется на основании:'
                : 'Shaxsiy ma\'lumotlarni qayta ishlash quyidagi asoslarda amalga oshiriladi:'}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>{isRu ? 'Вашего согласия' : 'Sizning roziligingiz'}</strong>{' — '}
                {isRu
                  ? 'при создании учётной записи вы даёте согласие на обработку данных'
                  : 'hisob qaydnomasini yaratishda siz ma\'lumotlarni qayta ishlashga rozilik berasiz'}
              </li>
              <li>
                <strong>{isRu ? 'Исполнения договора' : 'Shartnomani ijro etish'}</strong>{' — '}
                {isRu
                  ? 'обработка необходима для оформления и доставки заказов'
                  : 'buyurtmalarni rasmiylashtirish va yetkazib berish uchun qayta ishlash zarur'}
              </li>
              <li>
                <strong>{isRu ? 'Законных интересов' : 'Qonuniy manfaatlar'}</strong>{' — '}
                {isRu ? 'улучшение сервиса, обеспечение безопасности, аналитика' : 'xizmatni yaxshilash, xavfsizlikni ta\'minlash, tahlil'}
              </li>
              <li>
                <strong>{isRu ? 'Требований законодательства' : 'Qonunchilik talablari'}</strong>{' — '}
                {isRu
                  ? 'Закон Республики Узбекистан «О персональных данных» (от 02.07.2019 г. № ЗРУ-547)'
                  : 'O\'zbekiston Respublikasining «Shaxsiy ma\'lumotlar to\'g\'risida»gi Qonuni (02.07.2019 y. № O\'RQ-547)'}
              </li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '5. Передача данных третьим лицам' : '5. Ma\'lumotlarni uchinchi shaxslarga uzatish'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'Мы не продаём ваши персональные данные. Мы можем передать данные следующим категориям получателей исключительно в целях, описанных в настоящей Политике:'
                : 'Biz sizning shaxsiy ma\'lumotlaringizni sotmaymiz. Biz ma\'lumotlarni faqat ushbu Siyosatda tavsiflangan maqsadlarda quyidagi qabul qiluvchilarga uzatishimiz mumkin:'}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>{isRu ? 'Продавцы' : 'Sotuvchilar'}</strong>{' — '}
                {isRu
                  ? 'получают данные, необходимые для исполнения заказа (имя, адрес доставки, контактный телефон)'
                  : 'buyurtmani bajarish uchun zarur ma\'lumotlarni oladi (ism, yetkazib berish manzili, aloqa telefoni)'}
              </li>
              <li>
                <strong>{isRu ? 'Службы доставки' : 'Yetkazib berish xizmatlari'}</strong>{' — '}
                {isRu ? 'адрес и контактные данные для доставки заказа' : 'buyurtmani yetkazib berish uchun manzil va aloqa ma\'lumotlari'}
              </li>
              <li>
                <strong>{isRu ? 'Платёжный провайдер (Octobank)' : 'To\'lov provayderi (Octobank)'}</strong>{' — '}
                {isRu
                  ? 'для обработки платежей; данные карты вводятся напрямую на защищённой странице провайдера'
                  : 'to\'lovlarni qayta ishlash uchun; karta ma\'lumotlari bevosita provayderning himoyalangan sahifasida kiritiladi'}
              </li>
              <li>
                <strong>{isRu ? 'Аналитические сервисы' : 'Analitik xizmatlar'}</strong>{' — '}
                {isRu
                  ? 'Firebase Analytics и Crashlytics (Google) — обезличенные данные для анализа и устранения ошибок'
                  : 'Firebase Analytics va Crashlytics (Google) — tahlil va xatolarni bartaraf etish uchun anonimlashtarilgan ma\'lumotlar'}
              </li>
              <li>
                <strong>{isRu ? 'Государственные органы' : 'Davlat organlari'}</strong>{' — '}
                {isRu ? 'при наличии законного требования (судебное решение, запрос уполномоченного органа)' : 'qonuniy talab mavjud bo\'lganda (sud qarori, vakolatli organlar so\'rovi)'}
              </li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '6. Файлы cookie и технологии отслеживания' : '6. Cookie fayllari va kuzatuv texnologiyalari'}
            </h2>
            <p className="mb-3">
              {isRu ? 'Наш веб-сайт использует файлы cookie:' : 'Bizning veb-saytimiz cookie fayllaridan foydalanadi:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>{isRu ? 'Обязательные' : 'Majburiy'}</strong>{' — '}
                {isRu ? 'авторизация, сохранение выбора языка, работа корзины' : 'avtorizatsiya, til tanlashni saqlash, savat ishlashi'}
              </li>
              <li>
                <strong>{isRu ? 'Аналитические' : 'Analitik'}</strong>{' — '}
                {isRu ? 'обезличенная статистика посещений для улучшения работы Платформы' : 'Platforma ishini yaxshilash uchun anonimlashtarilgan tashrif statistikasi'}
              </li>
            </ul>
            <p className="mt-3">
              {isRu
                ? 'Вы можете управлять cookie через настройки вашего браузера. Отключение обязательных cookie может повлиять на функциональность сайта.'
                : 'Siz cookie fayllarini brauzeringiz sozlamalari orqali boshqarishingiz mumkin. Majburiy cookie-larni o\'chirish sayt funksionalligiga ta\'sir qilishi mumkin.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '7. Хранение и защита данных' : '7. Ma\'lumotlarni saqlash va himoya qilish'}
            </h2>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">
              {isRu ? '7.1. Сроки хранения' : '7.1. Saqlash muddatlari'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Данные учётной записи — в течение всего срока использования и 3 года после удаления аккаунта' : 'Hisob ma\'lumotlari — foydalanish davomida va akkaunt o\'chirilgandan keyin 3 yil'}</li>
              <li>{isRu ? 'Данные заказов — 5 лет (требования бухгалтерского и налогового учёта)' : 'Buyurtma ma\'lumotlari — 5 yil (buxgalteriya va soliq hisobi talablari)'}</li>
              <li>{isRu ? 'Аналитические данные — до 26 месяцев в обезличенной форме' : 'Analitik ma\'lumotlar — anonimlashtarilgan shaklda 26 oygacha'}</li>
              <li>{isRu ? 'Данные о сбоях (Crashlytics) — до 90 дней' : 'Nosozlik ma\'lumotlari (Crashlytics) — 90 kungacha'}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '7.2. Меры защиты' : '7.2. Himoya choralari'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Шифрование данных при передаче (TLS 1.2/1.3)' : 'Ma\'lumotlarni uzatishda shifrlash (TLS 1.2/1.3)'}</li>
              <li>{isRu ? 'Шифрование конфиденциальных данных при хранении (AES-256)' : 'Maxfiy ma\'lumotlarni saqlashda shifrlash (AES-256)'}</li>
              <li>{isRu ? 'Многофакторная аутентификация для административного доступа' : 'Ma\'muriy kirish uchun ko\'p faktorli autentifikatsiya'}</li>
              <li>{isRu ? 'Регулярное резервное копирование' : 'Muntazam zaxira nusxalash'}</li>
              <li>{isRu ? 'Защита от DDoS-атак и несанкционированного доступа' : 'DDoS-hujumlar va ruxsatsiz kirishdan himoya'}</li>
              <li>{isRu ? 'Хеширование паролей (bcrypt)' : 'Parollarni xeshlash (bcrypt)'}</li>
              <li>{isRu ? 'Регулярный аудит безопасности' : 'Muntazam xavfsizlik auditi'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '8. Ваши права' : '8. Sizning huquqlaringiz'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'В соответствии с законодательством Республики Узбекистан вы имеете право:'
                : 'O\'zbekiston Respublikasi qonunchiligiga muvofiq siz quyidagi huquqlarga egasiz:'}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{isRu ? 'Право на доступ' : 'Kirish huquqi'}</strong>{' — '}{isRu ? 'получить информацию о том, какие ваши данные мы обрабатываем' : 'qaysi ma\'lumotlaringiz qayta ishlanayotgani haqida ma\'lumot olish'}</li>
              <li><strong>{isRu ? 'Право на исправление' : 'Tuzatish huquqi'}</strong>{' — '}{isRu ? 'потребовать исправления неточных данных' : 'noto\'g\'ri ma\'lumotlarni tuzatishni talab qilish'}</li>
              <li><strong>{isRu ? 'Право на удаление' : 'O\'chirish huquqi'}</strong>{' — '}{isRu ? 'потребовать удаления данных и аккаунта' : 'ma\'lumotlaringiz va akkauntingizni o\'chirishni talab qilish'}</li>
              <li><strong>{isRu ? 'Право на ограничение обработки' : 'Qayta ishlashni cheklash huquqi'}</strong>{' — '}{isRu ? 'потребовать ограничения в определённых ситуациях' : 'ma\'lum vaziyatlarda cheklashni talab qilish'}</li>
              <li><strong>{isRu ? 'Право на отзыв согласия' : 'Rozilikni qaytarib olish huquqi'}</strong>{' — '}{isRu ? 'отозвать ранее данное согласие' : 'avval berilgan rozilikni qaytarib olish'}</li>
              <li><strong>{isRu ? 'Право на перенос данных' : 'Ma\'lumotlarni ko\'chirish huquqi'}</strong>{' — '}{isRu ? 'получить свои данные в структурированном формате' : 'o\'z ma\'lumotlaringizni tuzilmali formatda olish'}</li>
              <li><strong>{isRu ? 'Право на обжалование' : 'Shikoyat qilish huquqi'}</strong>{' — '}{isRu ? 'обратиться в уполномоченный орган по защите персональных данных' : 'shaxsiy ma\'lumotlarni himoya qilish bo\'yicha vakolatli organga murojaat qilish'}</li>
            </ul>
            <p className="mt-3">
              {isRu
                ? 'Для реализации ваших прав обратитесь к нам по контактам, указанным в разделе 12.'
                : 'Huquqlaringizni amalga oshirish uchun 12-bo\'limda ko\'rsatilgan kontaktlar orqali biz bilan bog\'laning.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '9. Защита данных детей' : '9. Bolalar ma\'lumotlarini himoya qilish'}
            </h2>
            <p>
              {isRu
                ? 'Платформа не предназначена для лиц младше 18 лет. Мы сознательно не собираем данные несовершеннолетних. Если нам станет известно, что собраны данные лица младше 18 лет, мы примем меры по их незамедлительному удалению. Если вы являетесь родителем или опекуном и считаете, что ваш ребёнок предоставил нам свои данные, свяжитесь с нами.'
                : 'Platforma 18 yoshga to\'lmagan shaxslar uchun mo\'ljallanmagan. Biz voyaga yetmaganlarning shaxsiy ma\'lumotlarini ataylab to\'plamaymiz. Agar bizga 18 yoshga to\'lmagan shaxsning ma\'lumotlari to\'planganligi ma\'lum bo\'lsa, biz ularni zudlik bilan o\'chirish choralarini ko\'ramiz. Agar siz ota-ona yoki vasiy bo\'lsangiz va farzandingiz bizga o\'z ma\'lumotlarini taqdim etgan deb hisoblasangiz, biz bilan bog\'laning.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '10. Трансграничная передача данных' : '10. Transchegaraviy ma\'lumot uzatish'}
            </h2>
            <p>
              {isRu
                ? 'Ваши данные хранятся на серверах на территории Республики Узбекистан. В отдельных случаях данные могут передаваться в другие страны (например, аналитические данные в Google LLC, США) в соответствии с применимым законодательством и при условии обеспечения надлежащего уровня защиты.'
                : 'Sizning ma\'lumotlaringiz O\'zbekiston Respublikasi hududidagi serverlarda saqlanadi. Alohida hollarda ma\'lumotlar boshqa mamlakatlarga uzatilishi mumkin (masalan, analitik ma\'lumotlar Google LLC, AQSh) amaldagi qonunchilikka muvofiq va tegishli himoya darajasi ta\'minlanganda.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '11. Изменения Политики' : '11. Siyosat o\'zgarishlari'}
            </h2>
            <p>
              {isRu
                ? 'Мы вправе вносить изменения в настоящую Политику. При существенных изменениях мы уведомим вас через push-уведомление или электронную почту. Дата последнего обновления указана в начале документа. Продолжение использования Платформы после публикации изменений означает ваше согласие с обновлённой Политикой.'
                : 'Biz ushbu Siyosatga o\'zgartirishlar kiritish huquqiga egamiz. Muhim o\'zgarishlar kiritilganda sizni push-bildirishnoma yoki elektron pochta orqali xabardor qilamiz. Oxirgi yangilanish sanasi hujjat boshida ko\'rsatilgan. O\'zgarishlar e\'lon qilinganidan keyin Platformadan foydalanishni davom ettirishingiz yangilangan Siyosatga roziligingizni bildiradi.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '12. Контактная информация' : '12. Aloqa ma\'lumotlari'}
            </h2>
            <p className="mb-4">
              {isRu
                ? 'По вопросам, связанным с обработкой персональных данных:'
                : 'Shaxsiy ma\'lumotlarni qayta ishlash bilan bog\'liq savollar bo\'yicha:'}
            </p>
            <div className="space-y-2 text-gray-800">
              <p><strong>{isRu ? 'Оператор:' : 'Operator:'}</strong> {isRu ? 'ИП «TOPLA»' : 'YaTT «TOPLA»'}</p>
              <p><strong>{isRu ? 'Адрес:' : 'Manzil:'}</strong> {isRu ? 'Республика Каракалпакстан, г. Нукус, Узбекистан' : 'Qoraqalpog\'iston Respublikasi, Nukus shahri, O\'zbekiston'}</p>
              <p><strong>{isRu ? 'Электронная почта:' : 'Elektron pochta:'}</strong>{' '}<a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a></p>
              <p><strong>{isRu ? 'Телефон:' : 'Telefon:'}</strong>{' '}<SupportPhoneLink className="text-blue-600 hover:underline" /></p>
              <p><strong>Telegram:</strong>{' '}<a href={telegramLink} className="text-blue-600 hover:underline">{telegramHandle}</a></p>
            </div>
            <p className="mt-4">
              {isRu
                ? 'Мы обязуемся рассмотреть ваше обращение в течение 10 рабочих дней.'
                : 'Biz sizning murojaatingizni 10 ish kuni ichida ko\'rib chiqishga majburmiz.'}
            </p>
          </section>

          <div className="pt-6 mt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              {isRu
                ? '© 2026 TOPLA. Все права защищены.'
                : '© 2026 TOPLA. Barcha huquqlar himoyalangan.'}
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
