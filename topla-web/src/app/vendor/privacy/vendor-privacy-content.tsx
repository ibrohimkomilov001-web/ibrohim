'use client'

import { useLocaleStore } from '@/store/locale-store'
import { useTelegramLink, useTelegramHandle, useSupportEmail } from '@/hooks/useSettings'
import Link from 'next/link'

export default function VendorPrivacyContent() {
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
            {isRu ? 'Политика конфиденциальности для продавцов' : 'Sotuvchilar uchun maxfiylik siyosati'}
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
                ? 'Настоящая Политика конфиденциальности описывает, какие персональные данные Продавцов собирает, обрабатывает и хранит оператор маркетплейса Topla.uz. Регистрируясь на Платформе, вы соглашаетесь с условиями обработки ваших данных, изложенными в данном документе.'
                : "Ushbu Maxfiylik siyosati Topla.uz marketpleysi operatori Sotuvchilarning qanday shaxsiy ma'lumotlarini to'plashi, qayta ishlashi va saqlashini tavsiflaydi. Platformada ro'yxatdan o'tish orqali siz ushbu hujjatda bayon etilgan ma'lumotlaringizni qayta ishlash shartlariga rozilik bildirasiz."}
            </p>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '1. Введение' : '1. Kirish'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '1.1. Оператор маркетплейса Topla.uz (далее — «Оператор», «мы») уважает конфиденциальность Продавцов и стремится обеспечить надёжную защиту их персональных данных.'
                  : "1.1. Topla.uz marketpleysi operatori (keyingi o'rinlarda — «Operator», «biz») Sotuvchilarning maxfiyligini hurmat qiladi va ularning shaxsiy ma'lumotlarini ishonchli himoya qilishga intiladi."}
              </p>
              <p>
                {isRu
                  ? '1.2. Настоящая Политика распространяется на все данные, предоставленные Продавцом при регистрации и в ходе использования Платформы.'
                  : "1.2. Ushbu Siyosat Sotuvchi tomonidan ro'yxatdan o'tishda va Platformadan foydalanish davomida taqdim etilgan barcha ma'lumotlarga taalluqlidir."}
              </p>
              <p>
                {isRu
                  ? '1.3. Обработка данных осуществляется в соответствии с Законом Республики Узбекистан «О персональных данных» и иными применимыми нормативными актами.'
                  : "1.3. Ma'lumotlarni qayta ishlash O'zbekiston Respublikasining «Shaxsiy ma'lumotlar to'g'risida» gi Qonuni va boshqa tegishli me'yoriy hujjatlarga muvofiq amalga oshiriladi."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '2. Термины и определения' : "2. Atama va ta'riflar"}
            </h2>
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>{isRu ? 'Персональные данные' : "Shaxsiy ma'lumotlar"}</strong> — {isRu ? 'любая информация, относящаяся к прямо или косвенно определённому или определяемому физическому лицу (субъекту персональных данных).' : "bevosita yoki bilvosita aniqlangan yoki aniqlanishi mumkin bo'lgan jismoniy shaxsga (shaxsiy ma'lumotlar subyektiga) tegishli har qanday axborot."}
                </li>
                <li>
                  <strong>{isRu ? 'Обработка данных' : "Ma'lumotlarni qayta ishlash"}</strong> — {isRu ? 'любое действие с персональными данными, включая сбор, запись, систематизацию, накопление, хранение, уточнение, использование, передачу, обезличивание, блокировку, удаление и уничтожение.' : "shaxsiy ma'lumotlar bilan bajariladigan har qanday harakat, jumladan to'plash, yozib olish, tizimlashtirish, to'plash, saqlash, aniqlashtirish, foydalanish, uzatish, shaxssizlantirish, bloklash, o'chirish va yo'q qilish."}
                </li>
                <li>
                  <strong>{isRu ? 'Продавец' : 'Sotuvchi'}</strong> — {isRu ? 'физическое лицо-предприниматель, самозанятое лицо или юридическое лицо, зарегистрированное на Платформе для реализации товаров.' : "Platformada tovarlarni sotish uchun ro'yxatdan o'tgan yakka tartibdagi tadbirkor, o'z-o'zini band qilgan shaxs yoki yuridik shaxs."}
                </li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '3. Какие данные мы собираем' : "3. Qanday ma'lumotlar to'playmiz"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '3.1. При регистрации и использовании Платформы мы получаем и обрабатываем следующие категории данных Продавца:'
                  : "3.1. Ro'yxatdan o'tish va Platformadan foydalanish jarayonida biz Sotuvchining quyidagi ma'lumotlar toifalarini olamiz va qayta ishlaymiz:"}
              </p>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">
                {isRu ? 'Идентификационные данные:' : "Identifikatsiya ma'lumotlari:"}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'ФИО или наименование организации;' : 'FIO yoki tashkilot nomi;'}</li>
                <li>{isRu ? 'ИНН (СТИР);' : 'INN (STIR);'}</li>
                <li>{isRu ? 'контактный номер телефона;' : 'aloqa telefon raqami;'}</li>
                <li>{isRu ? 'наименование магазина.' : "do'kon nomi."}</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">
                {isRu ? 'Финансовые данные:' : "Moliyaviy ma'lumotlar:"}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'банковские реквизиты (расчётный счёт, МФО);' : 'bank rekvizitlari (hisob raqami, MFO);'}</li>
                <li>{isRu ? 'история транзакций и выплат.' : "tranzaksiyalar va to'lovlar tarixi."}</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">
                {isRu ? 'Данные о деятельности:' : "Faoliyat ma'lumotlari:"}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'информация о размещённых товарах;' : "joylashtirilgan tovarlar haqidagi ma'lumotlar;"}</li>
                <li>{isRu ? 'история заказов и их статусы;' : "buyurtmalar tarixi va ularning holatlari;"}</li>
                <li>{isRu ? 'аналитические данные о продажах;' : "sotuvlar haqidagi analitik ma'lumotlar;"}</li>
                <li>{isRu ? 'переписка со службой поддержки и Покупателями.' : "qo'llab-quvvatlash xizmati va Xaridorlar bilan yozishmalar."}</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4 mb-2">
                {isRu ? 'Технические данные:' : "Texnik ma'lumotlar:"}
              </h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'IP-адрес и данные устройства;' : 'IP-manzil va qurilma haqidagi ma\'lumotlar;'}</li>
                <li>{isRu ? 'тип и версия браузера;' : "brauzer turi va versiyasi;"}</li>
                <li>{isRu ? 'дата и время посещений;' : "tashriflar sanasi va vaqti;"}</li>
                <li>{isRu ? 'журнал действий в Личном кабинете.' : "Shaxsiy kabinetdagi harakatlar jurnali."}</li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '4. Цели обработки данных' : "4. Ma'lumotlarni qayta ishlash maqsadlari"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '4.1. Мы обрабатываем персональные данные Продавца исключительно в следующих целях:'
                  : "4.1. Biz Sotuvchining shaxsiy ma'lumotlarini faqat quyidagi maqsadlarda qayta ishlaymiz:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'регистрация и идентификация Продавца на Платформе;' : "Sotuvchini Platformada ro'yxatdan o'tkazish va identifikatsiya qilish;"}</li>
                <li>{isRu ? 'обеспечение работы Личного кабинета и управления товарами;' : "Shaxsiy kabinet ishlashi va tovarlarni boshqarishni ta'minlash;"}</li>
                <li>{isRu ? 'обработка заказов и расчёт выплат;' : "buyurtmalarni qayta ishlash va to'lovlarni hisoblash;"}</li>
                <li>{isRu ? 'предоставление аналитики и статистики продаж;' : "sotuvlar tahlili va statistikasini taqdim etish;"}</li>
                <li>{isRu ? 'связь с Продавцом по вопросам работы на Платформе;' : "Platformadagi ish masalalari bo'yicha Sotuvchi bilan bog'lanish;"}</li>
                <li>{isRu ? 'предотвращение мошенничества и обеспечение безопасности Платформы;' : "firibgarlikning oldini olish va Platforma xavfsizligini ta'minlash;"}</li>
                <li>{isRu ? 'исполнение требований законодательства Республики Узбекистан;' : "O'zbekiston Respublikasi qonunchiligi talablarini bajarish;"}</li>
                <li>{isRu ? 'улучшение качества услуг и пользовательского опыта.' : "xizmatlar sifati va foydalanuvchi tajribasini yaxshilash."}</li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '5. Правовые основания обработки' : "5. Qayta ishlashning huquqiy asoslari"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '5.1. Обработка персональных данных осуществляется на следующих правовых основаниях:'
                  : "5.1. Shaxsiy ma'lumotlarni qayta ishlash quyidagi huquqiy asoslarda amalga oshiriladi:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'согласие Продавца, выраженное при регистрации на Платформе;' : "Platformada ro'yxatdan o'tishda ifodalangan Sotuvchining roziligi;"}</li>
                <li>{isRu ? 'исполнение условий договора оферты между Оператором и Продавцом;' : "Operator va Sotuvchi o'rtasidagi oferta shartnomasi shartlarini bajarish;"}</li>
                <li>{isRu ? 'исполнение обязательств, предусмотренных законодательством;' : "qonunchilikda nazarda tutilgan majburiyatlarni bajarish;"}</li>
                <li>{isRu ? 'защита законных интересов Оператора.' : "Operatorning qonuniy manfaatlarini himoya qilish."}</li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '6. Передача данных третьим лицам' : "6. Ma'lumotlarni uchinchi shaxslarga uzatish"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '6.1. Мы не продаём и не передаём персональные данные Продавцов третьим лицам, за исключением случаев, описанных ниже:'
                  : "6.1. Biz Sotuvchilarning shaxsiy ma'lumotlarini uchinchi shaxslarga sotmaymiz va bermaymiz, quyida tavsiflangan holatlardan tashqari:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>{isRu ? 'Платёжные провайдеры' : "To'lov provayderlari"}</strong> — {isRu ? 'для проведения финансовых расчётов (передаются только данные, необходимые для обработки выплат);' : "moliyaviy hisob-kitoblarni amalga oshirish uchun (faqat to'lovlarni qayta ishlash uchun zarur ma'lumotlar uzatiladi);"}
                </li>
                <li>
                  <strong>{isRu ? 'Государственные органы' : 'Davlat organlari'}</strong> — {isRu ? 'по законному запросу правоохранительных, налоговых или контролирующих органов;' : "huquqni muhofaza qilish, soliq yoki nazorat organlarining qonuniy so'rovi bo'yicha;"}
                </li>
                <li>
                  <strong>{isRu ? 'Техническое обеспечение' : "Texnik ta'minot"}</strong> — {isRu ? 'хостинг-провайдеры, сервисы аналитики и службы уведомлений, обрабатывающие данные от имени Оператора по поручению и в рамках соглашений о конфиденциальности.' : "Operator nomidan va maxfiylik shartnomasi doirasida ma'lumotlarni qayta ishlovchi xosting provayderlari, tahlil xizmatlari va bildirishnoma xizmatlari."}
                </li>
              </ul>
              <p>
                {isRu
                  ? '6.2. При передаче данных третьим лицам Оператор обеспечивает соблюдение требований законодательства и принимает меры для защиты данных.'
                  : "6.2. Ma'lumotlarni uchinchi shaxslarga uzatishda Operator qonunchilik talablariga rioya etilishini ta'minlaydi va ma'lumotlarni himoya qilish choralarini ko'radi."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '7. Защита данных' : "7. Ma'lumotlarni himoya qilish"}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '7.1. Оператор принимает необходимые организационные и технические меры для защиты персональных данных Продавцов от несанкционированного доступа, утраты, изменения или уничтожения:'
                  : "7.1. Operator Sotuvchilarning shaxsiy ma'lumotlarini ruxsatsiz kirish, yo'qotish, o'zgartirish yoki yo'q qilishdan himoya qilish uchun zarur tashkiliy va texnik choralarni ko'radi:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'шифрование данных при передаче (SSL/TLS);' : "ma'lumotlarni uzatishda shifrlash (SSL/TLS);"}</li>
                <li>{isRu ? 'контроль доступа к системам обработки данных;' : "ma'lumotlarni qayta ishlash tizimlariga kirishni nazorat qilish;"}</li>
                <li>{isRu ? 'регулярное резервное копирование;' : "muntazam zaxira nusxa ko'chirish;"}</li>
                <li>{isRu ? 'мониторинг безопасности и обнаружение инцидентов;' : "xavfsizlik monitoringi va hodisalarni aniqlash;"}</li>
                <li>{isRu ? 'разграничение прав доступа среди сотрудников.' : "xodimlar orasida kirish huquqlarini cheklash."}</li>
              </ul>
              <p>
                {isRu
                  ? '7.2. Несмотря на предпринимаемые меры, Оператор не может гарантировать абсолютную безопасность данных при передаче через интернет. Продавец использует Платформу на свой риск.'
                  : "7.2. Ko'rilayotgan choralarga qaramay, Operator internet orqali ma'lumotlar uzatishda mutlaq xavfsizlikni kafolatlay olmaydi. Sotuvchi Platformadan o'z xavfi ostida foydalanadi."}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '8. Файлы cookie и аналитика' : '8. Cookie fayllari va tahlil'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '8.1. Платформа использует файлы cookie и аналогичные технологии для обеспечения работы Личного кабинета, аналитики и улучшения пользовательского опыта.'
                  : "8.1. Platforma Shaxsiy kabinet ishlashi, tahlil va foydalanuvchi tajribasini yaxshilash uchun cookie fayllari va shunga o'xshash texnologiyalardan foydalanadi."}
              </p>
              <p>
                {isRu
                  ? '8.2. Типы используемых cookie:'
                  : "8.2. Foydalaniladigan cookie turlari:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>{isRu ? 'Необходимые' : 'Zaruriy'}</strong> — {isRu ? 'обеспечивают работу авторизации и базовых функций Платформы;' : 'avtorizatsiya va Platformaning asosiy funksiyalari ishlashini ta\'minlaydi;'}</li>
                <li><strong>{isRu ? 'Аналитические' : 'Analitik'}</strong> — {isRu ? 'помогают нам понять, как Продавцы используют Платформу, для её улучшения;' : "Sotuvchilar Platformadan qanday foydalanishini tushunishga va uni yaxshilashga yordam beradi;"}</li>
                <li><strong>{isRu ? 'Функциональные' : 'Funksional'}</strong> — {isRu ? 'сохраняют пользовательские настройки (язык, тема оформления).' : "foydalanuvchi sozlamalarini saqlaydi (til, dizayn mavzusi)."}</li>
              </ul>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '9. Права Продавца' : '9. Sotuvchining huquqlari'}
            </h2>
            <div className="space-y-2">
              <p>
                {isRu
                  ? '9.1. В отношении своих персональных данных Продавец имеет следующие права:'
                  : "9.1. O'z shaxsiy ma'lumotlari bo'yicha Sotuvchi quyidagi huquqlarga ega:"}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{isRu ? 'право на доступ — получить информацию о том, какие данные обрабатываются;' : "kirish huquqi — qanday ma'lumotlar qayta ishlanayotgani haqida ma'lumot olish;"}</li>
                <li>{isRu ? 'право на исправление — потребовать коррекции неточных или неполных данных;' : "tuzatish huquqi — noto'g'ri yoki to'liq bo'lmagan ma'lumotlarni tuzatishni talab qilish;"}</li>
                <li>{isRu ? 'право на удаление — запросить удаление данных, если они больше не необходимы для целей обработки;' : "o'chirish huquqi — agar ma'lumotlar qayta ishlash maqsadlari uchun endi kerak bo'lmasa, ularni o'chirishni so'rash;"}</li>
                <li>{isRu ? 'право на ограничение обработки — в определённых случаях ограничить обработку данных;' : "qayta ishlashni cheklash huquqi — ma'lum hollarda ma'lumotlarni qayta ishlashni cheklash;"}</li>
                <li>{isRu ? 'право на отзыв согласия — отозвать ранее данное согласие на обработку.' : "rozilikni qaytarib olish huquqi — avval berilgan qayta ishlash roziligini qaytarib olish."}</li>
              </ul>
              <p>
                {isRu
                  ? '9.2. Для реализации указанных прав Продавец может обратиться в службу поддержки по каналам связи, указанным в разделе 10.'
                  : "9.2. Ko'rsatilgan huquqlarni amalga oshirish uchun Sotuvchi 10-bo'limda ko'rsatilgan aloqa kanallari orqali qo'llab-quvvatlash xizmatiga murojaat qilishi mumkin."}
              </p>
              <p>
                {isRu
                  ? '9.3. Оператор обязуется рассмотреть обращение в течение 10 (десяти) рабочих дней.'
                  : "9.3. Operator murojaatni 10 (o'n) ish kuni ichida ko'rib chiqishga majburdir."}
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
                  ? '10.1. Оператор хранит персональные данные Продавца в течение всего срока действия учётной записи и не менее 3 (трёх) лет после её удаления для исполнения требований законодательства.'
                  : "10.1. Operator Sotuvchining shaxsiy ma'lumotlarini hisob amal qilgan davr mobaynida va qonunchilik talablarini bajarish uchun hisob o'chirilganidan keyin kamida 3 (uch) yil davomida saqlaydi."}
              </p>
              <p>
                {isRu
                  ? '10.2. Оператор вправе вносить изменения в настоящую Политику, уведомив Продавца через Личный кабинет или электронную почту не менее чем за 10 (десять) календарных дней.'
                  : "10.2. Operator kamida 10 (o'n) kalendar kun oldin Shaxsiy kabinet yoki elektron pochta orqali Sotuvchini xabardor qilib, ushbu Siyosatga o'zgartirishlar kiritish huquqiga ega."}
              </p>
              <p>
                {isRu
                  ? '10.3. Продолжение использования Платформы после изменения Политики означает согласие с её обновлённой версией.'
                  : "10.3. Siyosat o'zgartirilganidan keyin Platformadan foydalanishni davom ettirish uning yangilangan versiyasi bilan rozilikni bildiradi."}
              </p>
              <p>
                {isRu
                  ? '10.4. По всем вопросам, касающимся обработки персональных данных, вы можете обратиться к нам:'
                  : "10.4. Shaxsiy ma'lumotlarni qayta ishlashga oid barcha savollar bo'yicha biz bilan bog'lanishingiz mumkin:"}
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
