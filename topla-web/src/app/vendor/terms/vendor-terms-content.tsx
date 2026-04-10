'use client'

import { useLocaleStore } from '@/store/locale-store'
import { useTelegramLink, useTelegramHandle, useSupportEmail } from '@/hooks/useSettings'
import Link from 'next/link'

export default function VendorTermsContent() {
  const locale = useLocaleStore((s) => s.locale)
  const isRu = locale === 'ru'
  const telegramLink = useTelegramLink()
  const telegramHandle = useTelegramHandle()
  const email = useSupportEmail()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight md:text-[28px]">
            {isRu ? 'Договор оферты для продавцов' : 'Sotuvchilar uchun oferta shartnomasi'}
          </h1>
          <p className="mt-3 text-[15px] text-gray-500">
            {isRu ? 'Последнее обновление: 9 апреля 2026 г.' : 'Oxirgi yangilanish: 2026-yil 9-aprel'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <article className="space-y-10 text-[15px] leading-[1.75] text-gray-700">
          {/* Intro callout */}
          <div className="border-l-4 border-orange-400 pl-4 py-1 text-gray-600">
            <p>
              {isRu
                ? 'Настоящий договор оферты (далее — «Оферта») регулирует условия работы продавцов на маркетплейсе Topla.uz. Регистрируясь в качестве продавца на платформе, вы подтверждаете, что ознакомились с условиями настоящей Оферты и принимаете их в полном объёме.'
                : "Ushbu oferta shartnomasi (keyingi o'rinlarda — «Oferta») Topla.uz marketpleysida sotuvchilarning ishlash shartlarini tartibga soladi. Platformada sotuvchi sifatida ro'yxatdan o'tish orqali siz ushbu Oferta shartlari bilan tanishganingizni va ularni to'liq qabul qilganingizni tasdiqlaysiz."}
            </p>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '1. Основные понятия' : '1. Asosiy tushunchalar'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? 'В настоящей Оферте используются следующие термины и определения:'
                  : "Ushbu Ofertada quyidagi atama va ta'riflar qo'llaniladi:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>{isRu ? 'Платформа' : 'Platforma'}</strong> — {isRu ? 'онлайн-маркетплейс Topla.uz (веб-сайт topla.uz и мобильное приложение Topla), предоставляющий технологическую инфраструктуру для совершения сделок купли-продажи товаров между Продавцами и Покупателями.' : "Topla.uz onlayn marketpleysi (topla.uz veb-sayti va Topla mobil ilovasi) — Sotuvchilar va Xaridorlar o'rtasida tovarlar oldi-sotdi bitimlarini amalga oshirish uchun texnologik infratuzilmani taqdim etuvchi platforma."}
                </li>
                <li>
                  <strong>{isRu ? 'Оператор' : 'Operator'}</strong> — {isRu ? 'юридическое лицо, управляющее Платформой Topla.uz и оказывающее посреднические услуги Продавцам и Покупателям.' : "Topla.uz Platformasini boshqaradigan va Sotuvchilar hamda Xaridorlarga vositachilik xizmatlarini ko'rsatadigan yuridik shaxs."}
                </li>
                <li>
                  <strong>{isRu ? 'Продавец' : 'Sotuvchi'}</strong> — {isRu ? 'физическое лицо-предприниматель, самозанятое лицо или юридическое лицо, зарегистрированное на Платформе для реализации товаров.' : "Platformada tovarlarni sotish uchun ro'yxatdan o'tgan yakka tartibdagi tadbirkor, o'z-o'zini band qilgan shaxs yoki yuridik shaxs."}
                </li>
                <li>
                  <strong>{isRu ? 'Покупатель' : 'Xaridor'}</strong> — {isRu ? 'пользователь Платформы, приобретающий товары у Продавцов.' : "Sotuvchilardan tovar sotib oluvchi Platforma foydalanuvchisi."}
                </li>
                <li>
                  <strong>{isRu ? 'Товар' : 'Tovar'}</strong> — {isRu ? 'продукция, размещённая Продавцом на Платформе для реализации Покупателям.' : "Sotuvchi tomonidan Xaridorlarga sotish uchun Platformada joylashtirilgan mahsulot."}
                </li>
                <li>
                  <strong>{isRu ? 'Комиссия' : 'Komissiya'}</strong> — {isRu ? 'вознаграждение Оператора за предоставление посреднических услуг, рассчитываемое в процентах от стоимости реализованного Товара.' : "Operatorning vositachilik xizmatlari uchun mukofoti bo'lib, sotilgan Tovar narxidan foizda hisoblanadi."}
                </li>
                <li>
                  <strong>{isRu ? 'Личный кабинет' : 'Shaxsiy kabinet'}</strong> — {isRu ? 'защищённый раздел Платформы, доступный Продавцу после авторизации, обеспечивающий управление товарами, заказами и финансами.' : "avtorizatsiyadan keyin Sotuvchiga ochiq bo'lgan Platformaning himoyalangan bo'limi bo'lib, tovarlar, buyurtmalar va moliyani boshqarish imkoniyatini beradi."}
                </li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '2. Предмет договора' : '2. Shartnoma predmeti'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '2.1. Оператор предоставляет Продавцу доступ к Платформе для размещения и реализации Товаров Покупателям на условиях, определённых настоящей Офертой.'
                  : "2.1. Operator Sotuvchiga ushbu Ofertada belgilangan shartlarda Xaridorlarga Tovarlarni joylashtirish va sotish uchun Platformadan foydalanish huquqini beradi."}
              </p>
              <p>
                {isRu
                  ? '2.2. Оператор оказывает Продавцу посреднические услуги, включая обеспечение технологической инфраструктуры, обработку платежей, предоставление аналитических инструментов и поддержку.'
                  : "2.2. Operator Sotuvchiga vositachilik xizmatlarini ko'rsatadi, jumladan, texnologik infratuzilmani ta'minlash, to'lovlarni qayta ishlash, analitik vositalarni taqdim etish va qo'llab-quvvatlash."}
              </p>
              <p>
                {isRu
                  ? '2.3. Продавец самостоятельно определяет ассортимент, описание и цену Товаров, размещаемых на Платформе, с учётом ограничений, установленных настоящей Офертой.'
                  : "2.3. Sotuvchi Platformada joylashtiriladigan Tovarlarning assortimenti, tavsifi va narxini ushbu Ofertada belgilangan cheklovlarni hisobga olgan holda mustaqil belgilaydi."}
              </p>
              <p>
                {isRu
                  ? '2.4. Оператор не является собственником Товаров и не несёт ответственности за их качество, безопасность или соответствие описанию.'
                  : "2.4. Operator Tovarlar egasi hisoblanmaydi va ularning sifati, xavfsizligi yoki tavsifga muvofiqligi uchun javobgar emas."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '3. Регистрация и авторизация' : "3. Ro'yxatdan o'tish va avtorizatsiya"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '3.1. Для начала работы на Платформе Продавец обязан пройти процедуру регистрации, предоставив достоверные сведения о себе и своей предпринимательской деятельности.'
                  : "3.1. Platformada ishlashni boshlash uchun Sotuvchi ro'yxatdan o'tish tartibini bajarishi va o'zi hamda tadbirkorlik faoliyati haqida ishonchli ma'lumotlarni taqdim etishi shart."}
              </p>
              <p>
                {isRu
                  ? '3.2. При регистрации Продавец указывает: ФИО или наименование организации, контактный телефон, ИНН (СТИР), наименование магазина, банковские реквизиты (расчётный счёт и МФО).'
                  : "3.2. Ro'yxatdan o'tishda Sotuvchi quyidagilarni ko'rsatadi: FIO yoki tashkilot nomi, aloqa telefoni, INN (STIR), do'kon nomi, bank rekvizitlari (hisob raqami va MFO)."}
              </p>
              <p>
                {isRu
                  ? '3.3. Продавец несёт полную ответственность за достоверность предоставленных данных. Оператор вправе запросить дополнительные документы для верификации.'
                  : "3.3. Sotuvchi taqdim etilgan ma'lumotlarning to'g'riligi uchun to'liq javobgardir. Operator tekshirish uchun qo'shimcha hujjatlarni so'rash huquqiga ega."}
              </p>
              <p>
                {isRu
                  ? '3.4. Учётная запись Продавца является персональной. Передача доступа третьим лицам без согласия Оператора запрещена.'
                  : "3.4. Sotuvchining hisobi shaxsiy hisoblanadi. Operatorning roziligisiz uchinchi shaxslarga kirishni berish taqiqlanadi."}
              </p>
              <p>
                {isRu
                  ? '3.5. Оператор оставляет за собой право отказать в регистрации или приостановить аккаунт Продавца при наличии оснований, в том числе при предоставлении ложных сведений.'
                  : "3.5. Operator, shu jumladan yolg'on ma'lumotlar taqdim etilganda, asoslar mavjud bo'lganda ro'yxatdan o'tishni rad etish yoki Sotuvchining akkauntini to'xtatib turish huquqini o'zida saqlab qoladi."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '4. Права и обязанности Платформы' : '4. Platformaning huquq va majburiyatlari'}
            </h2>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">
              {isRu ? '4.1. Оператор обязуется:' : '4.1. Operator quyidagilarga majbur:'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'обеспечивать бесперебойную работу Платформы (за исключением плановых технических работ);' : "Platformaning uzluksiz ishlashini ta'minlash (rejalashtirilgan texnik ishlardan tashqari);"}</li>
              <li>{isRu ? 'предоставлять Продавцу инструменты для управления товарами, заказами и аналитикой;' : "Sotuvchiga tovarlar, buyurtmalar va tahlillarni boshqarish vositalarini taqdim etish;"}</li>
              <li>{isRu ? 'обеспечивать корректный расчёт и своевременную выплату причитающихся Продавцу средств;' : "Sotuvchiga tegishli mablag'larni to'g'ri hisoblash va o'z vaqtida to'lashni ta'minlash;"}</li>
              <li>{isRu ? 'уведомлять Продавца об изменениях условий Оферты не менее чем за 10 (десять) календарных дней;' : "Oferta shartlaridagi o'zgarishlar haqida Sotuvchini kamida 10 (o'n) kalendar kun oldin xabardor qilish;"}</li>
              <li>{isRu ? 'предоставлять техническую поддержку через доступные каналы связи.' : "mavjud aloqa kanallari orqali texnik yordam ko'rsatish."}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '4.2. Оператор вправе:' : '4.2. Operator quyidagi huquqlarga ega:'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'модерировать и отклонять товарные карточки, не соответствующие правилам Платформы;' : "Platforma qoidalariga mos kelmaydigan tovar kartalarini moderatsiya qilish va rad etish;"}</li>
              <li>{isRu ? 'удерживать комиссию из средств, причитающихся Продавцу;' : "Sotuvchiga tegishli mablag'lardan komissiyani ushlab qolish;"}</li>
              <li>{isRu ? 'приостанавливать или прекращать доступ Продавца к Платформе при нарушении условий Оферты;' : "Oferta shartlari buzilganda Sotuvchining Platformadan foydalanishini to'xtatib turish yoki tugatish;"}</li>
              <li>{isRu ? 'вносить изменения в функциональность Платформы, тарифы и условия работы;' : "Platformaning funksionalligi, tariflari va ishlash shartlariga o'zgartirish kiritish;"}</li>
              <li>{isRu ? 'проводить проверки деятельности Продавца на предмет соответствия требованиям Оферты.' : "Sotuvchining faoliyatini Oferta talablariga muvofiqligini tekshirish."}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '5. Права и обязанности Продавца' : '5. Sotuvchining huquq va majburiyatlari'}
            </h2>

            <h3 className="font-semibold text-gray-900 mt-4 mb-2">
              {isRu ? '5.1. Продавец обязуется:' : '5.1. Sotuvchi quyidagilarga majbur:'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'предоставлять достоверные описания, фотографии и характеристики Товаров;' : "Tovarlarning ishonchli tavsiflari, fotosuratlari va xususiyatlarini taqdim etish;"}</li>
              <li>{isRu ? 'обеспечивать наличие Товаров, указанных как доступные на Платформе;' : "Platformada mavjud deb ko'rsatilgan Tovarlarning borlgini ta'minlash;"}</li>
              <li>{isRu ? 'своевременно обрабатывать и исполнять заказы Покупателей;' : "Xaridorlarning buyurtmalarini o'z vaqtida qayta ishlash va bajarish;"}</li>
              <li>{isRu ? 'обеспечивать надлежащее качество и безопасность Товаров в соответствии с законодательством Республики Узбекистан;' : "O'zbekiston Respublikasi qonunchiligiga muvofiq Tovarlarning tegishli sifati va xavfsizligini ta'minlash;"}</li>
              <li>{isRu ? 'иметь все необходимые лицензии, сертификаты и разрешения для реализации Товаров;' : "Tovarlarni sotish uchun barcha zaruriy litsenziyalar, sertifikatlar va ruxsatnomalariga ega bo'lish;"}</li>
              <li>{isRu ? 'оперативно отвечать на обращения Покупателей и решать спорные ситуации;' : "Xaridorlarning murojaatlariga tezkor javob berish va nizoli vaziyatlarni hal qilish;"}</li>
              <li>{isRu ? 'соблюдать налоговое законодательство и самостоятельно уплачивать все применимые налоги;' : "soliq qonunchiligiga rioya qilish va barcha tegishli soliqlarni mustaqil to'lash;"}</li>
              <li>{isRu ? 'не размещать на Платформе контрафактные, запрещённые или ограниченные в обороте товары.' : "Platformada soxta, taqiqlangan yoki muomalasi cheklangan tovarlarni joylashtirmaslik."}</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-6 mb-2">
              {isRu ? '5.2. Продавец вправе:' : '5.2. Sotuvchi quyidagi huquqlarga ega:'}
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'самостоятельно определять ассортимент, описание и цены на свои Товары;' : "o'z Tovarlarining assortimenti, tavsifi va narxlarini mustaqil belgilash;"}</li>
              <li>{isRu ? 'использовать аналитические инструменты Платформы для отслеживания продаж;' : "sotuvlarni kuzatish uchun Platformaning analitik vositalaridan foydalanish;"}</li>
              <li>{isRu ? 'обращаться в службу поддержки Платформы по вопросам работы;' : "ish masalalari bo'yicha Platformaning qo'llab-quvvatlash xizmatiga murojaat qilish;"}</li>
              <li>{isRu ? 'получать выплаты за реализованные Товары в соответствии с условиями Оферты;' : "Oferta shartlariga muvofiq sotilgan Tovarlar uchun to'lovlarni olish;"}</li>
              <li>{isRu ? 'в любое время прекратить использование Платформы, уведомив Оператора.' : "istalgan vaqtda Operatorni xabardor qilib Platformadan foydalanishni to'xtatish."}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '6. Комиссия и платежи' : "6. Komissiya va to'lovlar"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '6.1. За оказание посреднических услуг Оператор удерживает комиссию из суммы, уплаченной Покупателем за Товар. Размер комиссии определяется в зависимости от категории Товара и публикуется в Личном кабинете Продавца.'
                  : "6.1. Vositachilik xizmatlari uchun Operator Xaridor tomonidan Tovar uchun to'langan summadan komissiyani ushlab qoladi. Komissiya miqdori Tovar kategoriyasiga qarab belgilanadi va Sotuvchining Shaxsiy kabinetida e'lon qilinadi."}
              </p>
              <p>
                {isRu
                  ? '6.2. Выплата средств Продавцу осуществляется на банковский счёт, указанный при регистрации, за вычетом комиссии Оператора и применимых налогов.'
                  : "6.2. Sotuvchiga mablag'lar Operator komissiyasi va tegishli soliqlarni hisobga olgan holda ro'yxatdan o'tishda ko'rsatilgan bank hisobiga o'tkaziladi."}
              </p>
              <p>
                {isRu
                  ? '6.3. Периодичность и сроки выплат определяются Оператором и публикуются в Личном кабинете. Стандартный срок выплат — в течение 10 (десяти) рабочих дней после подтверждения получения Товара Покупателем.'
                  : "6.3. To'lovlarning davriyligi va muddatlari Operator tomonidan belgilanadi va Shaxsiy kabinetda e'lon qilinadi. Standart to'lov muddati — Xaridor Tovarni qabul qilganligini tasdiqlaganidan keyin 10 (o'n) ish kunida."}
              </p>
              <p>
                {isRu
                  ? '6.4. Продавец самостоятельно несёт ответственность за уплату всех применимых налогов и сборов, связанных с реализацией Товаров на Платформе.'
                  : "6.4. Sotuvchi Platformada Tovarlarni sotish bilan bog'liq barcha tegishli soliqlar va yig'imlarni to'lash uchun mustaqil javobgardir."}
              </p>
              <p>
                {isRu
                  ? '6.5. Оператор вправе изменять размер комиссии, уведомив Продавца не менее чем за 10 (десять) календарных дней до вступления изменений в силу.'
                  : "6.5. Operator o'zgarishlar kuchga kirishidan kamida 10 (o'n) kalendar kun oldin Sotuvchini xabardor qilib, komissiya miqdorini o'zgartirish huquqiga ega."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '7. Правила размещения товаров' : '7. Mahsulot joylash qoidalari'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '7.1. При размещении Товаров на Платформе Продавец обязан соблюдать следующие правила:'
                  : "7.1. Tovarlarni Platformada joylashtirishda Sotuvchi quyidagi qoidalarga rioya qilishi shart:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'указывать полное и достоверное описание Товара, включая характеристики, состав, размеры и страну происхождения;' : "Tovarning to'liq va ishonchli tavsifini, jumladan xarakteristikalar, tarkib, o'lchamlar va ishlab chiqaruvchi mamlakatni ko'rsatish;"}</li>
                <li>{isRu ? 'размещать качественные фотографии, соответствующие реальному виду Товара;' : "Tovarning haqiqiy ko'rinishiga mos sifatli fotosuratlarni joylashtirish;"}</li>
                <li>{isRu ? 'указывать актуальную цену и наличие Товара;' : "Tovarning dolzarb narxi va mavjudligini ko'rsatish;"}</li>
                <li>{isRu ? 'не использовать вводящие в заблуждение названия, описания или ключевые слова;' : "chalg'ituvchi nomlar, tavsiflar yoki kalit so'zlarni ishlatmaslik;"}</li>
                <li>{isRu ? 'не копировать контент (фото, описания) других Продавцов без их разрешения.' : "boshqa Sotuvchilarning kontentini (foto, tavsif) ularning ruxsatisiz nusxa ko'chirmaslik."}</li>
              </ul>
              <p>
                {isRu
                  ? '7.2. Запрещается размещение на Платформе следующих категорий товаров:'
                  : "7.2. Platformada quyidagi tovar kategoriyalarini joylashtirish taqiqlanadi:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'товары, запрещённые законодательством Республики Узбекистан;' : "O'zbekiston Respublikasi qonunchiligi bilan taqiqlangan tovarlar;"}</li>
                <li>{isRu ? 'контрафактная продукция и товары, нарушающие права интеллектуальной собственности;' : "kontrafakt mahsulotlar va intellektual mulk huquqlarini buzuvchi tovarlar;"}</li>
                <li>{isRu ? 'оружие, боеприпасы и взрывчатые вещества;' : "qurol, o'q-dorilar va portlovchi moddalar;"}</li>
                <li>{isRu ? 'наркотические средства и психотропные вещества;' : "giyohvand moddalar va psixotrop moddalar;"}</li>
                <li>{isRu ? 'алкогольная и табачная продукция;' : "spirtli ichimliklar va tamaki mahsulotlari;"}</li>
                <li>{isRu ? 'лекарственные средства (за исключением продукции, разрешённой к свободной реализации);' : "dori vositalari (erkin sotishga ruxsat etilgan mahsulotlardan tashqari);"}</li>
                <li>{isRu ? 'товары порнографического или экстремистского характера.' : "pornografik yoki ekstremistik xarakterdagi tovarlar."}</li>
              </ul>
              <p>
                {isRu
                  ? '7.3. Оператор вправе без предварительного уведомления удалить товарные карточки, нарушающие правила размещения.'
                  : "7.3. Operator oldindan xabardor qilmasdan joylash qoidalarini buzgan tovar kartalarini o'chirish huquqiga ega."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '8. Ответственность' : '8. Javobgarlik'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '8.1. Продавец несёт полную ответственность за качество, безопасность и соответствие Товаров описанию, а также за соблюдение действующего законодательства при их реализации.'
                  : "8.1. Sotuvchi Tovarlarning sifati, xavfsizligi va tavsifga muvofiqligi, shuningdek ularni sotishda amaldagi qonunchilikka rioya qilish uchun to'liq javobgardir."}
              </p>
              <p>
                {isRu
                  ? '8.2. Оператор не несёт ответственности за убытки, понесённые Продавцом вследствие нарушения Продавцом условий настоящей Оферты или действующего законодательства.'
                  : "8.2. Operator, Sotuvchining ushbu Oferta shartlari yoki amaldagi qonunchilikni buzishi natijasida Sotuvchi ko'rgan zarar uchun javobgar emas."}
              </p>
              <p>
                {isRu
                  ? '8.3. Оператор не несёт ответственности за сбои в работе Платформы, вызванные обстоятельствами непреодолимой силы (форс-мажор), включая стихийные бедствия, военные действия, решения государственных органов, сбои в работе телекоммуникационных сетей.'
                  : "8.3. Operator fors-major holatlari, jumladan tabiiy ofatlar, harbiy harakatlar, davlat organlarining qarorlari, telekommunikatsiya tarmoqlarining ishdan chiqishi natijasida Platformaning ishlashidagi uzilishlar uchun javobgar emas."}
              </p>
              <p>
                {isRu
                  ? '8.4. В случае предъявления претензий третьими лицами в связи с Товарами, размещёнными Продавцом, Продавец обязуется урегулировать такие претензии самостоятельно и за свой счёт.'
                  : "8.4. Uchinchi shaxslar tomonidan Sotuvchi joylashtirilgan Tovarlar bilan bog'liq da'volar qo'yilgan taqdirda, Sotuvchi bunday da'volarni mustaqil ravishda va o'z hisobidan hal qilishga majburdir."}
              </p>
              <p>
                {isRu
                  ? '8.5. Совокупная ответственность Оператора перед Продавцом по настоящей Оферте ограничивается суммой комиссий, уплаченных Продавцом за последние 3 (три) месяца.'
                  : "8.5. Operatorning ushbu Oferta bo'yicha Sotuvchi oldidagi umumiy javobgarligi Sotuvchi tomonidan oxirgi 3 (uch) oy ichida to'langan komissiyalar summasi bilan cheklanadi."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '9. Разрешение споров' : '9. Nizolarni hal qilish'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '9.1. Все споры и разногласия, возникающие в связи с настоящей Офертой, стороны обязуются разрешать путём переговоров.'
                  : "9.1. Tomonlar ushbu Oferta bilan bog'liq barcha nizo va kelishmovchiliklarni muzokaralar yo'li bilan hal qilishga majburdirlar."}
              </p>
              <p>
                {isRu
                  ? '9.2. В случае невозможности разрешения спора путём переговоров, спор передаётся на рассмотрение в суд по месту нахождения Оператора в соответствии с законодательством Республики Узбекистан.'
                  : "9.2. Nizoni muzokaralar yo'li bilan hal qilish imkonsiz bo'lganda, nizo O'zbekiston Respublikasi qonunchiligiga muvofiq Operator joylashgan joyidagi sudga ko'rib chiqish uchun topshiriladi."}
              </p>
              <p>
                {isRu
                  ? '9.3. Настоящая Оферта регулируется и толкуется в соответствии с законодательством Республики Узбекистан.'
                  : "9.3. Ushbu Oferta O'zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi va talqin qilinadi."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '10. Заключительные положения' : '10. Yakuniy qoidalar'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '10.1. Настоящая Оферта вступает в силу с момента принятия её Продавцом (регистрация на Платформе) и действует бессрочно до прекращения использования Платформы.'
                  : "10.1. Ushbu Oferta Sotuvchi tomonidan qabul qilingan paytdan (Platformada ro'yxatdan o'tish) kuchga kiradi va Platformadan foydalanish tugatilgunga qadar muddatsiz amal qiladi."}
              </p>
              <p>
                {isRu
                  ? '10.2. Оператор вправе вносить изменения в настоящую Оферту, уведомив Продавца не менее чем за 10 (десять) календарных дней до вступления изменений в силу через Личный кабинет или электронную почту.'
                  : "10.2. Operator Shaxsiy kabinet yoki elektron pochta orqali o'zgarishlar kuchga kirishidan kamida 10 (o'n) kalendar kun oldin Sotuvchini xabardor qilib, ushbu Ofertaga o'zgartirishlar kiritish huquqiga ega."}
              </p>
              <p>
                {isRu
                  ? '10.3. Продолжение использования Платформы после вступления изменений в силу означает согласие Продавца с новой редакцией Оферты.'
                  : "10.3. O'zgarishlar kuchga kirganidan keyin Platformadan foydalanishni davom ettirish Sotuvchining Ofertaning yangi tahriri bilan roziligini bildiradi."}
              </p>
              <p>
                {isRu
                  ? '10.4. Продавец вправе в любое время отказаться от Оферты, прекратив использование Платформы. При этом все обязательства по незавершённым заказам сохраняются.'
                  : "10.4. Sotuvchi istalgan vaqtda Platformadan foydalanishni to'xtatib, Ofertadan voz kechish huquqiga ega. Bunda bajarilmagan buyurtmalar bo'yicha barcha majburiyatlar saqlanib qoladi."}
              </p>
              <p>
                {isRu
                  ? '10.5. По всем вопросам, связанным с настоящей Офертой, Продавец может обратиться в службу поддержки:'
                  : "10.5. Ushbu Ofertaga oid barcha savollar bo'yicha Sotuvchi qo'llab-quvvatlash xizmatiga murojaat qilishi mumkin:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'Telegram' : 'Telegram'}: <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{telegramHandle}</a></li>
                <li>{isRu ? 'Электронная почта' : 'Elektron pochta'}: <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a></li>
              </ul>
            </div>
          </section>

          {/* Back link */}
          <div className="pt-4">
            <Link href="/vendor/register" className="text-blue-600 hover:underline text-sm">
              {isRu ? '← Вернуться к регистрации' : "← Ro'yxatdan o'tishga qaytish"}
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
