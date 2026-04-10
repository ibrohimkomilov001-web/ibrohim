'use client'

import { useLocaleStore } from '@/store/locale-store'
import { SupportPhoneLink, useTelegramLink, useTelegramHandle, useSupportEmail } from '@/hooks/useSettings'

export default function TermsContent() {
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
            {isRu ? 'Условия использования TOPLA' : 'TOPLA Foydalanish shartlari'}
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
                ? 'Настоящие Условия использования (далее — «Условия») регулируют отношения между ИП «TOPLA» (далее — «мы», «Платформа», «TOPLA») и пользователем (далее — «вы», «Покупатель»), возникающие при использовании мобильного приложения и веб-сайта TOPLA. Регистрируясь на Платформе или оформляя заказ, вы подтверждаете, что ознакомились с Условиями и принимаете их в полном объёме.'
                : 'Mazkur Foydalanish shartlari (bundan buyon — «Shartlar») YaTT «TOPLA» (bundan buyon — «biz», «Platforma», «TOPLA») va foydalanuvchi (bundan buyon — «siz», «Xaridor») o\'rtasidagi TOPLA mobil ilovasi va veb-saytidan foydalanish jarayonida yuzaga keladigan munosabatlarni tartibga soladi. Platformada ro\'yxatdan o\'tish yoki buyurtma berish orqali siz ushbu Shartlar bilan tanishganingizni va ularni to\'liq qabul qilganingizni tasdiqlaysiz.'}
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
                  ? '«Платформа» — мобильное приложение TOPLA (Android) и веб-сайт topla.uz, предоставляющие Покупателям возможность просматривать, выбирать и приобретать товары у Продавцов.'
                  : '«Platforma» — TOPLA mobil ilovasi (Android) va topla.uz veb-sayti bo\'lib, Xaridorlarga Sotuvchilarning tovarlarini ko\'rish, tanlash va sotib olish imkoniyatini beradi.'}
              </p>
              <p>
                {isRu
                  ? '«Продавец» — юридическое лицо или индивидуальный предприниматель, прошедший верификацию и заключивший договор через систему Didox, размещающий товары на Платформе.'
                  : '«Sotuvchi» — verifikatsiyadan o\'tgan va Didox tizimi orqali shartnoma tuzgan, Platformada tovarlarni joylashtiruvchi yuridik shaxs yoki yakka tartibdagi tadbirkor.'}
              </p>
              <p>
                {isRu
                  ? '«Товар» — продукция, размещённая Продавцом для продажи через Платформу.'
                  : '«Tovar» — Sotuvchi tomonidan Platforma orqali sotish uchun joylashtirilgan mahsulot.'}
              </p>
              <p>
                {isRu
                  ? '«Заказ» — оформленный Покупателем запрос на приобретение одного или нескольких Товаров.'
                  : '«Buyurtma» — Xaridor tomonidan bir yoki bir nechta Tovarni sotib olish uchun rasmiylashtirilgan so\'rov.'}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '2. Описание Платформы' : '2. Platforma tavsifi'}
            </h2>
            <p className="mb-3">
              {isRu
                ? '2.1. TOPLA является онлайн-маркетплейсом, выступающим посредником между Покупателями и Продавцами. TOPLA не является Продавцом товаров (за исключением случаев, когда это прямо указано).'
                : '2.1. TOPLA Xaridorlar va Sotuvchilar o\'rtasida vositachi sifatida faoliyat yurituvchi onlayn marketpleysdir. TOPLA tovarlarning Sotuvchisi hisoblanmaydi (bu to\'g\'ridan-to\'g\'ri ko\'rsatilgan holatlar bundan mustasno).'}
            </p>
            <p className="mb-3">
              {isRu ? '2.2. Платформа предоставляет следующие возможности:' : '2.2. Platforma quyidagi imkoniyatlarni taqdim etadi:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Поиск и просмотр каталога товаров' : 'Tovarlar katalogini qidirish va ko\'rish'}</li>
              <li>{isRu ? 'Оформление и отслеживание заказов' : 'Buyurtmalarni rasmiylashtirish va kuzatish'}</li>
              <li>{isRu ? 'Онлайн-оплата через Octobank и оплата наличными' : 'Octobank orqali onlayn to\'lov va naqd pul bilan to\'lash'}</li>
              <li>{isRu ? 'Доставка заказов по указанному адресу' : 'Buyurtmalarni ko\'rsatilgan manzilga yetkazib berish'}</li>
              <li>{isRu ? 'Участие в акциях, использование промокодов и кешбэка' : 'Aksiyalarda ishtirok etish, promokodlar va keshbekdan foydalanish'}</li>
              <li>{isRu ? 'Обмен сообщениями с Продавцами и поддержкой' : 'Sotuvchilar va qo\'llab-quvvatlash xizmati bilan xabar almashish'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '3. Регистрация и аккаунт' : '3. Ro\'yxatdan o\'tish va akkaunt'}
            </h2>
            <p>{isRu ? '3.1. Для использования Платформы необходима регистрация через номер телефона или аккаунт Google.' : '3.1. Platformadan foydalanish uchun telefon raqami yoki Google akkaunti orqali ro\'yxatdan o\'tish zarur.'}</p>
            <p>{isRu ? '3.2. Регистрация доступна лицам, достигшим 18-летнего возраста и обладающим полной дееспособностью.' : '3.2. Ro\'yxatdan o\'tish 18 yoshga to\'lgan va to\'liq muomala layoqatiga ega shaxslarga mumkin.'}</p>
            <p>{isRu ? '3.3. Один пользователь вправе создать только один аккаунт. Создание нескольких аккаунтов запрещено.' : '3.3. Bitta foydalanuvchi faqat bitta akkaunt ochishi mumkin. Bir nechta akkaunt yaratish taqiqlanadi.'}</p>
            <p>{isRu ? '3.4. Вы обязаны предоставить достоверные данные при регистрации и своевременно их обновлять.' : '3.4. Siz ro\'yxatdan o\'tishda to\'g\'ri ma\'lumotlarni taqdim etishga va ularni o\'z vaqtida yangilashga majbursiz.'}</p>
            <p>{isRu ? '3.5. Вы несёте полную ответственность за сохранность логина и пароля. Мы рекомендуем использовать сложный пароль и не передавать данные аккаунта третьим лицам.' : '3.5. Login va parolning xavfsizligi uchun to\'liq javobgarlik sizdadir. Biz murakkab parol ishlatishni va akkaunt ma\'lumotlarini uchinchi shaxslarga bermaslikni tavsiya qilamiz.'}</p>
            <p>{isRu ? '3.6. TOPLA вправе заблокировать или удалить аккаунт при нарушении настоящих Условий без предварительного уведомления.' : '3.6. TOPLA ushbu Shartlar buzilganda akkauntni oldindan ogohlantirmasdan bloklash yoki o\'chirish huquqiga ega.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '4. Оформление заказа' : '4. Buyurtma rasmiylashtirish'}
            </h2>
            <p>{isRu ? '4.1. Покупатель выбирает товары, добавляет их в корзину, указывает адрес доставки, выбирает способ оплаты и подтверждает заказ.' : '4.1. Xaridor tovarlarni tanlaydi, savatga qo\'shadi, yetkazib berish manzilini ko\'rsatadi, to\'lov usulini tanlaydi va buyurtmani tasdiqlaydi.'}</p>
            <p>{isRu ? '4.2. Заказ считается оформленным после подтверждения. Подтверждённый заказ является юридически обязывающим предложением на покупку.' : '4.2. Buyurtma tasdiqlangandan keyin rasmiylashtirilgan hisoblanadi. Tasdiqlangan buyurtma yuridik jihatdan majburiy sotib olish taklifi hisoblanadi.'}</p>
            <p>{isRu ? '4.3. Если товар из нескольких магазинов, система автоматически разделяет заказ по продавцам.' : '4.3. Agar tovar bir nechta do\'kondan bo\'lsa, tizim buyurtmani avtomatik ravishda sotuvchilar bo\'yicha ajratadi.'}</p>
            <p>{isRu ? '4.4. Мы оставляем за собой право отклонить заказ при подозрении на мошенничество, ошибку в цене или отсутствие товара на складе.' : '4.4. Biz firibgarlik gumonida, narxdagi xatolik yoki tovar omborda mavjud bo\'lmaganda buyurtmani rad etish huquqini saqlab qolamiz.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '5. Цены и оплата' : '5. Narxlar va to\'lov'}
            </h2>
            <p>{isRu ? '5.1. Все цены на Платформе указаны в узбекских сумах (UZS) и включают НДС.' : '5.1. Platformadagi barcha narxlar O\'zbekiston so\'mida (UZS) ko\'rsatilgan va QQSni o\'z ichiga oladi.'}</p>
            <p>{isRu ? '5.2. Цена фиксируется на момент оформления заказа. Последующие изменения цен не затрагивают уже оформленные заказы.' : '5.2. Narx buyurtma rasmiylashtirish vaqtida belgilanadi. Keyingi narx o\'zgarishlari allaqachon rasmiylashtirilgan buyurtmalarga ta\'sir qilmaydi.'}</p>
            <p className="mb-2">{isRu ? '5.3. Доступные способы оплаты:' : '5.3. Mavjud to\'lov usullari:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Банковская карта через Octobank (Visa, Mastercard, Humo, UzCard)' : 'Octobank orqali bank kartasi (Visa, Mastercard, Humo, UzCard)'}</li>
              <li>{isRu ? 'Наличными при получении' : 'Qabul qilishda naqd pul bilan'}</li>
            </ul>
            <p className="mt-2">{isRu ? '5.4. При оплате онлайн данные карты обрабатываются Octobank. TOPLA не хранит данные вашей банковской карты.' : '5.4. Onlayn to\'lovda karta ma\'lumotlari Octobank tomonidan qayta ishlanadi. TOPLA sizning bank karta ma\'lumotlaringizni saqlamaydi.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '6. Доставка' : '6. Yetkazib berish'}
            </h2>
            <p>{isRu ? '6.1. Доставка осуществляется по адресу, указанному Покупателем при оформлении заказа. Убедитесь в правильности адреса — мы не несём ответственности за доставку по неверному адресу.' : '6.1. Yetkazib berish buyurtma berishda Xaridor ko\'rsatgan manzilga amalga oshiriladi. Manzilning to\'g\'riligiga ishonch hosil qiling — biz noto\'g\'ri manzilga yetkazib berish uchun javobgar emasmiz.'}</p>
            <p>{isRu ? '6.2. Сроки доставки зависят от зоны и составляют от 1 до 7 рабочих дней. Точные сроки указываются при оформлении заказа.' : '6.2. Yetkazib berish muddati zonaga qarab 1 dan 7 ish kunigacha. Aniq muddatlar buyurtma berishda ko\'rsatiladi.'}</p>
            <p>{isRu ? '6.3. Стоимость доставки рассчитывается автоматически и зависит от зоны доставки и суммы заказа. Бесплатная доставка доступна при достижении минимальной суммы.' : '6.3. Yetkazib berish narxi avtomatik hisoblanadi va yetkazib berish zonasi hamda buyurtma summasiga bog\'liq. Minimal summaga yetganda bepul yetkazib berish mavjud.'}</p>
            <p>{isRu ? '6.4. Покупатель обязан принять заказ в согласованное время. При невозможности принять заказ необходимо связаться с поддержкой не менее чем за 2 часа.' : '6.4. Xaridor buyurtmani kelishilgan vaqtda qabul qilishi shart. Buyurtmani qabul qilish imkoni bo\'lmasa, kamida 2 soat oldin qo\'llab-quvvatlash xizmatiga murojaat qilish kerak.'}</p>
            <p>{isRu ? '6.5. При получении Покупатель обязан проверить целостность упаковки и соответствие товара заказу.' : '6.5. Qabul qilishda Xaridor qadoq butunligini va tovarning buyurtmaga mosligini tekshirishi shart.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '7. Возврат и обмен' : '7. Qaytarish va almashtirish'}
            </h2>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">
              {isRu ? '7.1. Возврат товара надлежащего качества' : '7.1. Sifatli tovarni qaytarish'}
            </h3>
            <p>{isRu ? 'Покупатель вправе отказаться от товара надлежащего качества в течение 14 дней с момента получения при условии сохранения товарного вида, потребительских свойств, пломб и фабричных ярлыков.' : 'Xaridor sifatli tovardan qabul qilgan kundan boshlab 14 kun ichida, tovarning tashqi ko\'rinishi, iste\'mol xossalari, plombalari va fabrika yorliqlari saqlanganda voz kechish huquqiga ega.'}</p>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '7.2. Возврат товара ненадлежащего качества' : '7.2. Sifatsiz tovarni qaytarish'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'При обнаружении производственного дефекта — в течение 14 дней' : 'Ishlab chiqarish nuqsoni aniqlanganda — 14 kun ichida'}</li>
              <li>{isRu ? 'При получении неправильного товара — немедленно' : 'Noto\'g\'ri tovar olinganda — darhol'}</li>
              <li>{isRu ? 'Если товар не соответствует описанию на Платформе — в течение 7 дней' : 'Tovar Platformadagi tavsifga mos kelmasa — 7 kun ichida'}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '7.3. Товары, не подлежащие возврату' : '7.3. Qaytarilmaydigan tovarlar'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Средства личной гигиены' : 'Shaxsiy gigiena vositalari'}</li>
              <li>{isRu ? 'Вскрытая косметика и парфюмерия' : 'Ochilgan kosmetika va parfyumeriya'}</li>
              <li>{isRu ? 'Нижнее бельё и чулочные изделия' : 'Ichki kiyim va paypoq mahsulotlari'}</li>
              <li>{isRu ? 'Товары, изготовленные по индивидуальному заказу' : 'Individual buyurtma bo\'yicha tayyorlangan tovarlar'}</li>
              <li>{isRu ? 'Электронные подарочные карты и промокоды' : 'Elektron sovg\'a kartalari va promokodlar'}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '7.4. Порядок возврата средств' : '7.4. Mablag\'larni qaytarish tartibi'}
            </h3>
            <p>{isRu ? 'Возврат денежных средств осуществляется тем же способом, которым была произведена оплата, в течение 3–10 рабочих дней после одобрения возврата.' : 'Pul mablag\'lari to\'lov amalga oshirilgan usulda, qaytarish ma\'qullangandan keyin 3-10 ish kuni ichida qaytariladi.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '8. Права и обязанности пользователя' : '8. Foydalanuvchining huquqlari va majburiyatlari'}
            </h2>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">
              {isRu ? '8.1. Вы имеете право:' : '8.1. Siz quyidagi huquqlarga egasiz:'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Пользоваться всеми функциями Платформы' : 'Platformaning barcha funksiyalaridan foydalanish'}</li>
              <li>{isRu ? 'Получать полную и достоверную информацию о товарах' : 'Tovarlar haqida to\'liq va ishonchli ma\'lumot olish'}</li>
              <li>{isRu ? 'Обращаться в службу поддержки' : 'Qo\'llab-quvvatlash xizmatiga murojaat qilish'}</li>
              <li>{isRu ? 'Возвращать товары в соответствии с разделом 7' : '7-bo\'limga muvofiq tovarlarni qaytarish'}</li>
              <li>{isRu ? 'Удалить аккаунт и потребовать удаления своих данных' : 'Akkauntni o\'chirish va ma\'lumotlaringiz o\'chirilishini talab qilish'}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '8.2. Вы обязаны:' : '8.2. Siz quyidagilarga majbursiz:'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Соблюдать законодательство Республики Узбекистан' : 'O\'zbekiston Respublikasi qonunchiligiga rioya qilish'}</li>
              <li>{isRu ? 'Предоставлять достоверную информацию' : 'Ishonchli ma\'lumotlar taqdim etish'}</li>
              <li>{isRu ? 'Обеспечивать безопасность своего аккаунта' : 'Akkauntingiz xavfsizligini ta\'minlash'}</li>
              <li>{isRu ? 'Своевременно принимать заказы' : 'Buyurtmalarni o\'z vaqtida qabul qilish'}</li>
              <li>{isRu ? 'Не нарушать права других пользователей и Продавцов' : 'Boshqa foydalanuvchilar va Sotuvchilarning huquqlarini buzmaslik'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '9. Запрещённые действия' : '9. Taqiqlangan harakatlar'}
            </h2>
            <p className="mb-3">{isRu ? 'При использовании Платформы запрещается:' : 'Platformadan foydalanishda quyidagilar taqiqlanadi:'}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Оформлять фиктивные заказы или систематически отменять заказы' : 'Soxta buyurtmalar berish yoki buyurtmalarni muntazam bekor qilish'}</li>
              <li>{isRu ? 'Использовать чужие аккаунты или передавать свой аккаунт третьим лицам' : 'Boshqalarning akkauntlaridan foydalanish yoki o\'z akkauntini uchinchi shaxslarga berish'}</li>
              <li>{isRu ? 'Предпринимать попытки взлома, DDoS-атаки или иного вмешательства в работу Платформы' : 'Platformani buzishga, DDoS-hujum yoki boshqacha tarzda ishiga aralashishga urinish'}</li>
              <li>{isRu ? 'Публиковать заведомо ложные отзывы' : 'Ataylab yolg\'on sharhlar joylashtirish'}</li>
              <li>{isRu ? 'Распространять спам, вирусы, вредоносное ПО' : 'Spam, viruslar, zararli dasturiy ta\'minot tarqatish'}</li>
              <li>{isRu ? 'Осуществлять обратную разработку (reverse engineering) приложения' : 'Ilovani teskari muhandislik (reverse engineering) qilish'}</li>
              <li>{isRu ? 'Использовать Платформу для размещения или приобретения незаконных товаров' : 'Platformadan noqonuniy tovarlarni joylashtirish yoki sotib olish uchun foydalanish'}</li>
            </ul>
            <p className="mt-3">
              {isRu
                ? 'Нарушение данных правил влечёт блокировку аккаунта и может стать основанием для привлечения к ответственности в соответствии с законодательством.'
                : 'Ushbu qoidalarni buzish akkauntni bloklashga olib keladi va qonunchilikka muvofiq javobgarlikka tortilish uchun asos bo\'lishi mumkin.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '10. Интеллектуальная собственность' : '10. Intellektual mulk'}
            </h2>
            <p>{isRu ? '10.1. Все элементы Платформы (дизайн, логотип, тексты, код, изображения) являются интеллектуальной собственностью TOPLA или лицензиаров и защищены законодательством об авторском праве.' : '10.1. Platformaning barcha elementlari (dizayn, logotip, matnlar, kod, rasmlar) TOPLA yoki litsenziarlarning intellektual mulki hisoblanadi va mualliflik huquqi to\'g\'risidagi qonunchilik bilan himoyalangan.'}</p>
            <p>{isRu ? '10.2. Изображения и описания товаров принадлежат соответствующим Продавцам.' : '10.2. Tovarlarning rasmlari va tavsiflari tegishli Sotuvchilarga tegishli.'}</p>
            <p>{isRu ? '10.3. Запрещено копировать, распространять или модифицировать контент Платформы без письменного разрешения.' : '10.3. Platforma kontentini yozma ruxsatsiz nusxalash, tarqatish yoki o\'zgartirish taqiqlanadi.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '11. Ответственность TOPLA' : '11. TOPLA javobgarligi'}
            </h2>
            <p>{isRu ? '11.1. TOPLA выступает посредником между Покупателем и Продавцом. Ответственность за качество, комплектность и соответствие товара описанию несёт Продавец.' : '11.1. TOPLA Xaridor va Sotuvchi o\'rtasida vositachi sifatida ish yuritadi. Tovar sifati, to\'liqligi va tavsifga mosligi uchun Sotuvchi javobgardir.'}</p>
            <p>{isRu ? '11.2. TOPLA не гарантирует бесперебойную работу Платформы. Возможны плановые технические работы и непредвиденные сбои.' : '11.2. TOPLA Platformaning uzluksiz ishlashiga kafolat bermaydi. Rejalashtirilgan texnik ishlar va kutilmagan nosozliklar bo\'lishi mumkin.'}</p>
            <p>{isRu ? '11.3. TOPLA не несёт ответственности за действия третьих лиц (платёжные провайдеры, службы доставки), за исключением случаев, когда это прямо предусмотрено законодательством.' : '11.3. TOPLA uchinchi shaxslarning (to\'lov provayderlari, yetkazib berish xizmatlari) harakatlari uchun javobgar emas, qonunchilikda bevosita ko\'zda tutilgan holatlar bundan mustasno.'}</p>
            <p>{isRu ? '11.4. Совокупная ответственность TOPLA по любому заказу не может превышать стоимость данного заказа.' : '11.4. TOPLAning har qanday buyurtma bo\'yicha umumiy javobgarligi ushbu buyurtma qiymatidan oshishi mumkin emas.'}</p>
            <p>{isRu ? '11.5. В случае форс-мажорных обстоятельств (стихийные бедствия, война, пандемия, решения государственных органов) исполнение обязательств может быть приостановлено.' : '11.5. Fors-major holatlarda (tabiiy ofatlar, urush, pandemiya, davlat organlarining qarorlari) majburiyatlarning bajarilishi to\'xtatilishi mumkin.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '12. Конфиденциальность' : '12. Maxfiylik'}
            </h2>
            <p>
              {isRu
                ? 'Обработка персональных данных регулируется нашей Политикой конфиденциальности, которая является неотъемлемой частью настоящих Условий. Ознакомиться с ней можно по адресу: '
                : 'Shaxsiy ma\'lumotlarni qayta ishlash bizning Maxfiylik siyosatimiz bilan tartibga solinadi, u ushbu Shartlarning ajralmas qismi hisoblanadi. U bilan quyidagi manzilda tanishish mumkin: '}
              <a href="/privacy" className="text-blue-600 hover:underline">topla.uz/privacy</a>
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '13. Разрешение споров' : '13. Nizolarni hal qilish'}
            </h2>
            <p>{isRu ? '13.1. Все споры и разногласия стороны стремятся разрешить путём переговоров. Вы можете обратиться в службу поддержки через приложение, электронную почту или Telegram.' : '13.1. Barcha nizolar va kelishmovchiliklarni tomonlar muzokaralar yo\'li bilan hal qilishga intiladi. Siz ilova, elektron pochta yoki Telegram orqali qo\'llab-quvvatlash xizmatiga murojaat qilishingiz mumkin.'}</p>
            <p>{isRu ? '13.2. Если спор не удаётся разрешить в досудебном порядке, он подлежит рассмотрению в суде по месту нахождения TOPLA в соответствии с законодательством Республики Узбекистан.' : '13.2. Agar nizoni sudgacha tartibda hal qilib bo\'lmasa, u TOPLA joylashgan joy bo\'yicha sudda O\'zbekiston Respublikasi qonunchiligiga muvofiq ko\'rib chiqiladi.'}</p>
            <p>{isRu ? '13.3. К настоящим Условиям применяется законодательство Республики Узбекистан.' : '13.3. Ushbu Shartlarga O\'zbekiston Respublikasi qonunchiligi qo\'llaniladi.'}</p>
          </section>

          <hr className="border-gray-200" />

          {/* 14 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '14. Изменения Условий' : '14. Shartlar o\'zgarishlari'}
            </h2>
            <p>
              {isRu
                ? '14.1. TOPLA вправе вносить изменения в настоящие Условия. О существенных изменениях мы уведомим вас через push-уведомление или уведомление в приложении не менее чем за 7 дней до вступления изменений в силу.'
                : '14.1. TOPLA ushbu Shartlarga o\'zgartirishlar kiritish huquqiga ega. Muhim o\'zgarishlar haqida sizni o\'zgarishlar kuchga kirishidan kamida 7 kun oldin push-bildirishnoma yoki ilovadagi xabar orqali ogohlantaramiz.'}
            </p>
            <p>
              {isRu
                ? '14.2. Продолжение использования Платформы после вступления изменений в силу означает ваше согласие с обновлёнными Условиями.'
                : '14.2. O\'zgarishlar kuchga kirganidan keyin Platformadan foydalanishni davom ettirishingiz yangilangan Shartlarga roziligingizni bildiradi.'}
            </p>
          </section>

          <hr className="border-gray-200" />

          {/* 15 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '15. Контактная информация' : '15. Aloqa ma\'lumotlari'}
            </h2>
            <div className="space-y-2 text-gray-800">
              <p><strong>{isRu ? 'Оператор:' : 'Operator:'}</strong> {isRu ? 'ИП «TOPLA»' : 'YaTT «TOPLA»'}</p>
              <p><strong>{isRu ? 'Адрес:' : 'Manzil:'}</strong> {isRu ? 'Республика Каракалпакстан, г. Нукус, Узбекистан' : 'Qoraqalpog\'iston Respublikasi, Nukus shahri, O\'zbekiston'}</p>
              <p><strong>{isRu ? 'Электронная почта:' : 'Elektron pochta:'}</strong>{' '}<a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a></p>
              <p><strong>{isRu ? 'Телефон:' : 'Telefon:'}</strong>{' '}<SupportPhoneLink className="text-blue-600 hover:underline" /></p>
              <p><strong>Telegram:</strong>{' '}<a href={telegramLink} className="text-blue-600 hover:underline">{telegramHandle}</a></p>
            </div>
            <p className="mt-4">
              {isRu ? 'Время работы поддержки: ежедневно с 09:00 до 21:00 (UTC+5).' : 'Qo\'llab-quvvatlash ish vaqti: har kuni 09:00 dan 21:00 gacha (UTC+5).'}
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
