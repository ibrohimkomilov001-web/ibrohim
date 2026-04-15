'use client'

import { useLocaleStore } from '@/store/locale-store'
import { SupportPhoneLink, useTelegramLink, useTelegramHandle, useSupportEmail } from '@/hooks/useSettings'
import Link from 'next/link'

export default function RefundContent() {
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
            {isRu ? 'Политика возврата и обмена TOPLA' : 'TOPLA Qaytarish va almashtirish siyosati'}
          </h1>
          <p className="mt-3 text-[15px] text-gray-500">
            {isRu ? 'Последнее обновление: 15 апреля 2026 г.' : "So'nggi yangilanish: 2026-yil, 15-aprel"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <article className="space-y-10 text-[15px] leading-[1.75] text-gray-700">

          <div className="border-l-4 border-orange-400 pl-4 py-1 text-gray-600">
            <p>
              {isRu
                ? 'Настоящая Политика возврата и обмена описывает условия и порядок возврата товаров, приобретённых через маркетплейс TOPLA (далее — «Платформа»). Политика разработана в соответствии с законодательством Республики Узбекистан о защите прав потребителей.'
                : 'Mazkur Qaytarish va almashtirish siyosati TOPLA marketplace (bundan buyon — «Platforma») orqali sotib olingan tovarlarni qaytarish shartlari va tartibini tavsiflaydi. Siyosat O\'zbekiston Respublikasining iste\'molchilar huquqlarini himoya qilish to\'g\'risidagi qonunchiligiga muvofiq ishlab chiqilgan.'}
            </p>
          </div>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '1. Возврат товара надлежащего качества' : '1. Sifatli tovarni qaytarish'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'Покупатель вправе отказаться от товара надлежащего качества в течение 14 (четырнадцати) календарных дней с момента получения при соблюдении следующих условий:'
                : 'Xaridor sifatli tovardan qabul qilgan kundan boshlab 14 (o\'n to\'rt) kalendar kun ichida quyidagi shartlarga rioya qilgan holda voz kechish huquqiga ega:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Сохранён товарный вид и потребительские свойства товара' : 'Tovarning tashqi ko\'rinishi va iste\'mol xossalari saqlangan'}</li>
              <li>{isRu ? 'Сохранены фабричные ярлыки, пломбы и бирки' : 'Fabrika yorliqlari, plombalari va birkalari saqlangan'}</li>
              <li>{isRu ? 'Имеется товарный или кассовый чек (подтверждение заказа в системе TOPLA)' : 'Tovar yoki kassa cheki (TOPLA tizimidagi buyurtma tasdig\'i) mavjud'}</li>
              <li>{isRu ? 'Товар не был в употреблении' : 'Tovar ishlatilmagan'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '2. Возврат товара ненадлежащего качества' : '2. Sifatsiz tovarni qaytarish'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'Покупатель имеет право на возврат или обмен товара ненадлежащего качества в следующих случаях:'
                : 'Xaridor quyidagi hollarda sifatsiz tovarni qaytarish yoki almashtirish huquqiga ega:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Обнаружен производственный дефект — в течение 14 дней с момента получения' : 'Ishlab chiqarish nuqsoni aniqlangan — qabul qilgan kundan boshlab 14 kun ichida'}</li>
              <li>{isRu ? 'Получен неправильный товар (не соответствует заказу) — немедленно при получении' : 'Noto\'g\'ri tovar olingan (buyurtmaga mos kelmaydi) — qabul qilish vaqtida darhol'}</li>
              <li>{isRu ? 'Товар не соответствует описанию на Платформе — в течение 7 дней' : 'Tovar Platformadagi tavsifga mos kelmaydi — 7 kun ichida'}</li>
              <li>{isRu ? 'Товар повреждён при доставке — немедленно при получении' : 'Tovar yetkazib berish jarayonida shikastlangan — qabul qilish vaqtida darhol'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '3. Товары, не подлежащие возврату' : '3. Qaytarilmaydigan tovarlar'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'В соответствии с законодательством Республики Узбекистан, возврату и обмену не подлежат следующие товары надлежащего качества:'
                : 'O\'zbekiston Respublikasi qonunchiligiga muvofiq, quyidagi sifatli tovarlar qaytarilishi va almashtirilishi mumkin emas:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Средства личной гигиены (зубные щётки, расчёски и т.д.)' : 'Shaxsiy gigiena vositalari (tish cho\'tkalari, taroqlar va h.k.)'}</li>
              <li>{isRu ? 'Вскрытая косметика и парфюмерия' : 'Ochilgan kosmetika va parfyumeriya'}</li>
              <li>{isRu ? 'Нижнее бельё и чулочно-носочные изделия' : 'Ichki kiyim va paypoq-noskiy mahsulotlari'}</li>
              <li>{isRu ? 'Товары, изготовленные по индивидуальному заказу' : 'Individual buyurtma bo\'yicha tayyorlangan tovarlar'}</li>
              <li>{isRu ? 'Электронные подарочные карты и промокоды' : 'Elektron sovg\'a kartalari va promokodlar'}</li>
              <li>{isRu ? 'Лекарственные и медицинские средства' : 'Dori-darmon va tibbiy vositalar'}</li>
              <li>{isRu ? 'Продовольственные товары надлежащего качества' : 'Sifatli oziq-ovqat mahsulotlari'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '4. Порядок оформления возврата' : '4. Qaytarishni rasmiylashtirish tartibi'}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isRu ? 'Шаг 1. Подача заявки' : '1-qadam. Ariza berish'}
                </h3>
                <p>
                  {isRu
                    ? 'Откройте раздел «Мои заказы» → выберите товар → нажмите «Вернуть товар». Укажите причину возврата и приложите фотографии (при необходимости).'
                    : '«Buyurtmalarim» bo\'limini oching → tovarni tanlang → «Tovarni qaytarish» tugmasini bosing. Qaytarish sababini ko\'rsating va suratlarni biriktiring (zarur bo\'lsa).'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isRu ? 'Шаг 2. Рассмотрение заявки' : '2-qadam. Arizani ko\'rib chiqish'}
                </h3>
                <p>
                  {isRu
                    ? 'Продавец рассмотрит вашу заявку в течение 3 рабочих дней. Вы получите уведомление о решении.'
                    : 'Sotuvchi arizangizni 3 ish kuni ichida ko\'rib chiqadi. Qaror haqida bildirishnoma olasiz.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isRu ? 'Шаг 3. Отправка товара' : '3-qadam. Tovarni jo\'natish'}
                </h3>
                <p>
                  {isRu
                    ? 'После одобрения возврата отправьте товар Продавцу по указанному адресу. Сохраните квитанцию об отправке.'
                    : 'Qaytarish ma\'qullangandan keyin tovarni ko\'rsatilgan manzilga Sotuvchiga jo\'nating. Jo\'natish kvitansiyasini saqlang.'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {isRu ? 'Шаг 4. Возврат средств' : '4-qadam. Mablag\'larni qaytarish'}
                </h3>
                <p>
                  {isRu
                    ? 'После получения и проверки товара Продавцом денежные средства будут возвращены в течение 3–10 рабочих дней.'
                    : 'Sotuvchi tovarni qabul qilib tekshirgandan keyin pul mablag\'lari 3-10 ish kuni ichida qaytariladi.'}
                </p>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '5. Порядок возврата денежных средств' : '5. Pul mablag\'larini qaytarish tartibi'}
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Возврат осуществляется тем же способом, которым была произведена оплата' : 'Qaytarish to\'lov amalga oshirilgan usulda amalga oshiriladi'}</li>
              <li>{isRu ? 'Оплата банковской картой — возврат на карту в течение 3–10 рабочих дней' : 'Bank kartasi bilan to\'lov — kartaga 3-10 ish kuni ichida qaytariladi'}</li>
              <li>{isRu ? 'Оплата наличными при получении — возврат на банковский счёт (необходимо указать реквизиты)' : 'Qabul qilishda naqd to\'lov — bank hisobiga qaytariladi (rekvizitlarni ko\'rsatish kerak)'}</li>
              <li>{isRu ? 'Рассрочка — возврат на счёт банка-партнёра' : 'Bo\'lib to\'lash — hamkor bank hisobiga qaytariladi'}</li>
            </ul>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800">
                {isRu
                  ? '⏱ Сроки: после одобрения возврата Продавцом — от 3 до 10 рабочих дней в зависимости от банка.'
                  : '⏱ Muddatlar: Sotuvchi qaytarishni ma\'qullagandan keyin — bankka qarab 3 dan 10 ish kunigacha.'}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '6. Обмен товара' : '6. Tovarni almashtirish'}
            </h2>
            <p className="mb-3">
              {isRu
                ? 'Обмен товара на аналогичный (другой размер, цвет) возможен в течение 14 дней при соблюдении условий пункта 1. Для обмена:'
                : 'Tovarni shunga o\'xshash (boshqa o\'lcham, rang) bilan almashtirish 1-bandning shartlariga rioya qilgan holda 14 kun ichida mumkin. Almashtirish uchun:'}
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{isRu ? 'Свяжитесь с Продавцом через чат заказа' : 'Buyurtma chati orqali Sotuvchi bilan bog\'laning'}</li>
              <li>{isRu ? 'Согласуйте условия обмена' : 'Almashtirish shartlarini kelishib oling'}</li>
              <li>{isRu ? 'Отправьте товар и получите новый' : 'Tovarni jo\'nating va yangisini oling'}</li>
            </ul>
          </section>

          <hr className="border-gray-200" />

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '7. Ответственность сторон' : '7. Tomonlarning javobgarligi'}
            </h2>
            <div className="space-y-3">
              <p>
                {isRu
                  ? '7.1. TOPLA, выступая в роли посредника, обеспечивает контроль за соблюдением Продавцами настоящей Политики возврата.'
                  : '7.1. TOPLA vositachi sifatida Sotuvchilarning mazkur Qaytarish siyosatiga rioya qilishini nazorat qiladi.'}
              </p>
              <p>
                {isRu
                  ? '7.2. Продавец обязан рассмотреть заявку на возврат в установленные сроки и обеспечить возврат средств.'
                  : '7.2. Sotuvchi qaytarish arizasini belgilangan muddatlarda ko\'rib chiqishi va mablag\'larni qaytarishni ta\'minlashi shart.'}
              </p>
              <p>
                {isRu
                  ? '7.3. В случае спора между Покупателем и Продавцом TOPLA может выступить в роли арбитра для справедливого разрешения ситуации.'
                  : '7.3. Xaridor va Sotuvchi o\'rtasida nizo yuzaga kelgan taqdirda TOPLA vaziyatni adolatli hal qilish uchun hakam sifatida ish tutishi mumkin.'}
              </p>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isRu ? '8. Контактная информация' : '8. Aloqa ma\'lumotlari'}
            </h2>
            <p className="mb-4">
              {isRu
                ? 'По вопросам возврата и обмена вы можете связаться с нами:'
                : 'Qaytarish va almashtirish bo\'yicha savollar uchun biz bilan bog\'lanishingiz mumkin:'}
            </p>
            <div className="space-y-2 text-[15px]">
              <p>
                📧 {isRu ? 'Электронная почта' : 'Elektron pochta'}:{' '}
                <a href={`mailto:${email}`} className="text-orange-600 underline">{email}</a>
              </p>
              <p>
                💬 Telegram:{' '}
                <a href={telegramLink} target="_blank" rel="noopener" className="text-orange-600 underline">{telegramHandle}</a>
              </p>
              <p>
                📞 {isRu ? 'Телефон' : 'Telefon'}:{' '}
                <SupportPhoneLink className="text-orange-600 underline" />
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
              <p>
                {isRu
                  ? <>Полные условия использования платформы — <Link href="/terms" className="text-orange-600 underline">Условия использования</Link></>
                  : <>Platformadan foydalanishning to\'liq shartlari — <Link href="/terms" className="text-orange-600 underline">Foydalanish shartlari</Link></>}
              </p>
              <p className="mt-1">
                {isRu
                  ? <>Политика конфиденциальности — <Link href="/privacy" className="text-orange-600 underline">Политика конфиденциальности</Link></>
                  : <>Maxfiylik siyosati — <Link href="/privacy" className="text-orange-600 underline">Maxfiylik siyosati</Link></>}
              </p>
            </div>
          </section>

        </article>
      </div>
    </div>
  )
}
