import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // PRODUCTION DA SEED ISHLASHINI OLDINI OLISH
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ XATO: Seed production muhitda ishlatish mumkin emas!');
    console.error('   Agar haqiqatan kerak bo\'lsa, NODE_ENV=development qilib ishga tushiring.');
    process.exit(1);
  }

  console.log('🌱 Seeding database...');

  // Clear existing categories and subcategories
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();

  // ============================================
  // 30 Categories — Pro marketplace tuzilishi
  // O'zbek va Rus tillarida to'g'ri yozilishi tekshirilgan
  // ============================================
  const categories = await Promise.all([
    // 1. Elektronika
    prisma.category.create({
      data: {
        nameUz: 'Elektronika',
        nameRu: 'Электроника',
        icon: 'mobile',
        sortOrder: 1,
        subcategories: {
          create: [
            { nameUz: 'Smartfonlar', nameRu: 'Смартфоны', sortOrder: 1 },
            { nameUz: 'Planshetlar', nameRu: 'Планшеты', sortOrder: 2 },
            { nameUz: 'Quloqchinlar', nameRu: 'Наушники', sortOrder: 3 },
            { nameUz: 'Smart soatlar', nameRu: 'Умные часы', sortOrder: 4 },
            { nameUz: 'Portativ kolonkalar', nameRu: 'Портативные колонки', sortOrder: 5 },
            { nameUz: 'Zaryadlovchi qurilmalar', nameRu: 'Зарядные устройства', sortOrder: 6 },
            { nameUz: 'Telefon aksessuarlari', nameRu: 'Аксессуары для телефонов', sortOrder: 7 },
          ],
        },
      },
    }),
    // 2. Noutbuk va kompyuter
    prisma.category.create({
      data: {
        nameUz: 'Noutbuk va kompyuter',
        nameRu: 'Ноутбуки и компьютеры',
        icon: 'monitor',
        sortOrder: 2,
        subcategories: {
          create: [
            { nameUz: 'Noutbuklar', nameRu: 'Ноутбуки', sortOrder: 1 },
            { nameUz: 'Kompyuterlar', nameRu: 'Компьютеры', sortOrder: 2 },
            { nameUz: 'Monitorlar', nameRu: 'Мониторы', sortOrder: 3 },
            { nameUz: 'Komponentlar', nameRu: 'Комплектующие', sortOrder: 4 },
            { nameUz: 'Klaviatura va sichqoncha', nameRu: 'Клавиатуры и мыши', sortOrder: 5 },
            { nameUz: 'Printerlar', nameRu: 'Принтеры', sortOrder: 6 },
            { nameUz: 'Tarmoq jihozlari', nameRu: 'Сетевое оборудование', sortOrder: 7 },
          ],
        },
      },
    }),
    // 3. Maishiy texnika
    prisma.category.create({
      data: {
        nameUz: 'Maishiy texnika',
        nameRu: 'Бытовая техника',
        icon: 'blend_2',
        sortOrder: 3,
        subcategories: {
          create: [
            { nameUz: 'Kir yuvish mashinalari', nameRu: 'Стиральные машины', sortOrder: 1 },
            { nameUz: 'Muzlatgichlar', nameRu: 'Холодильники', sortOrder: 2 },
            { nameUz: 'Changyutgichlar', nameRu: 'Пылесосы', sortOrder: 3 },
            { nameUz: 'Konditsionerlar', nameRu: 'Кондиционеры', sortOrder: 4 },
            { nameUz: 'Oshxona texnikasi', nameRu: 'Кухонная техника', sortOrder: 5 },
            { nameUz: 'Dazmollar', nameRu: 'Утюги', sortOrder: 6 },
            { nameUz: 'Isitgichlar', nameRu: 'Обогреватели', sortOrder: 7 },
          ],
        },
      },
    }),
    // 4. Televizor va video
    prisma.category.create({
      data: {
        nameUz: 'Televizor va video',
        nameRu: 'ТВ и видео',
        icon: 'screenmirroring',
        sortOrder: 4,
        subcategories: {
          create: [
            { nameUz: 'Televizorlar', nameRu: 'Телевизоры', sortOrder: 1 },
            { nameUz: 'Projektorlar', nameRu: 'Проекторы', sortOrder: 2 },
            { nameUz: 'TV pristavkalar', nameRu: 'ТВ-приставки', sortOrder: 3 },
            { nameUz: 'Videokameralar', nameRu: 'Видеокамеры', sortOrder: 4 },
            { nameUz: 'TV aksessuarlar', nameRu: 'Аксессуары для ТВ', sortOrder: 5 },
          ],
        },
      },
    }),
    // 5. Erkaklar kiyimi
    prisma.category.create({
      data: {
        nameUz: 'Erkaklar kiyimi',
        nameRu: 'Мужская одежда',
        icon: 'shirt',
        sortOrder: 5,
        subcategories: {
          create: [
            { nameUz: 'Ko\'ylaklar', nameRu: 'Рубашки', sortOrder: 1 },
            { nameUz: 'Shimlar', nameRu: 'Брюки', sortOrder: 2 },
            { nameUz: 'Futbolkalar', nameRu: 'Футболки', sortOrder: 3 },
            { nameUz: 'Kurtkalar', nameRu: 'Куртки', sortOrder: 4 },
            { nameUz: 'Kostyumlar', nameRu: 'Костюмы', sortOrder: 5 },
            { nameUz: 'Ichki kiyimlar', nameRu: 'Нижнее бельё', sortOrder: 6 },
            { nameUz: 'Poyabzal', nameRu: 'Обувь', sortOrder: 7 },
          ],
        },
      },
    }),
    // 6. Ayollar kiyimi
    prisma.category.create({
      data: {
        nameUz: 'Ayollar kiyimi',
        nameRu: 'Женская одежда',
        icon: 'woman',
        sortOrder: 6,
        subcategories: {
          create: [
            { nameUz: 'Ko\'ylaklar', nameRu: 'Платья', sortOrder: 1 },
            { nameUz: 'Bluzka va ko\'ylaklar', nameRu: 'Блузки и рубашки', sortOrder: 2 },
            { nameUz: 'Shimlar va yubkalar', nameRu: 'Брюки и юбки', sortOrder: 3 },
            { nameUz: 'Ustki kiyim', nameRu: 'Верхняя одежда', sortOrder: 4 },
            { nameUz: 'Ichki kiyimlar', nameRu: 'Нижнее бельё', sortOrder: 5 },
            { nameUz: 'Ro\'mollar va sharf', nameRu: 'Платки и шарфы', sortOrder: 6 },
            { nameUz: 'Poyabzal', nameRu: 'Обувь', sortOrder: 7 },
          ],
        },
      },
    }),
    // 7. Sumkalar va aksessuarlar
    prisma.category.create({
      data: {
        nameUz: 'Sumkalar va aksessuarlar',
        nameRu: 'Сумки и аксессуары',
        icon: 'bag_2',
        sortOrder: 7,
        subcategories: {
          create: [
            { nameUz: 'Ayollar sumkalari', nameRu: 'Женские сумки', sortOrder: 1 },
            { nameUz: 'Erkaklar sumkalari', nameRu: 'Мужские сумки', sortOrder: 2 },
            { nameUz: 'Ryukzaklar', nameRu: 'Рюкзаки', sortOrder: 3 },
            { nameUz: 'Hamyonlar', nameRu: 'Кошельки', sortOrder: 4 },
            { nameUz: 'Kamarlar', nameRu: 'Ремни', sortOrder: 5 },
            { nameUz: 'Chamadonlar', nameRu: 'Чемоданы', sortOrder: 6 },
          ],
        },
      },
    }),
    // 8. Zargarlik
    prisma.category.create({
      data: {
        nameUz: 'Zargarlik',
        nameRu: 'Ювелирные изделия',
        icon: 'diamonds',
        sortOrder: 8,
        subcategories: {
          create: [
            { nameUz: 'Uzuklar', nameRu: 'Кольца', sortOrder: 1 },
            { nameUz: 'Bo\'yintuqlar', nameRu: 'Ожерелья', sortOrder: 2 },
            { nameUz: 'Isirg\'alar', nameRu: 'Серьги', sortOrder: 3 },
            { nameUz: 'Bilaguzuklar', nameRu: 'Браслеты', sortOrder: 4 },
            { nameUz: 'Soatlar', nameRu: 'Часы', sortOrder: 5 },
          ],
        },
      },
    }),
    // 9. Go'zallik
    prisma.category.create({
      data: {
        nameUz: "Go'zallik",
        nameRu: 'Красота',
        icon: 'magic_star',
        sortOrder: 9,
        subcategories: {
          create: [
            { nameUz: 'Pardoz vositalari', nameRu: 'Декоративная косметика', sortOrder: 1 },
            { nameUz: 'Teri parvarishi', nameRu: 'Уход за кожей', sortOrder: 2 },
            { nameUz: 'Soch parvarishi', nameRu: 'Уход за волосами', sortOrder: 3 },
            { nameUz: 'Tirnoq parvarishi', nameRu: 'Маникюр и педикюр', sortOrder: 4 },
            { nameUz: 'Soch quritgichlar', nameRu: 'Фены и стайлеры', sortOrder: 5 },
          ],
        },
      },
    }),
    // 10. Parfyumeriya
    prisma.category.create({
      data: {
        nameUz: 'Parfyumeriya',
        nameRu: 'Парфюмерия',
        icon: 'drop',
        sortOrder: 10,
        subcategories: {
          create: [
            { nameUz: 'Ayollar atiri', nameRu: 'Женская парфюмерия', sortOrder: 1 },
            { nameUz: 'Erkaklar atiri', nameRu: 'Мужская парфюмерия', sortOrder: 2 },
            { nameUz: 'Atir to\'plamlari', nameRu: 'Парфюмерные наборы', sortOrder: 3 },
          ],
        },
      },
    }),
    // 11. Shaxsiy gigiena
    prisma.category.create({
      data: {
        nameUz: 'Shaxsiy gigiena',
        nameRu: 'Личная гигиена',
        icon: 'brush_1',
        sortOrder: 11,
        subcategories: {
          create: [
            { nameUz: 'Og\'iz bo\'shlig\'i gigienasi', nameRu: 'Гигиена полости рта', sortOrder: 1 },
            { nameUz: 'Tana parvarishi', nameRu: 'Уход за телом', sortOrder: 2 },
            { nameUz: 'Soqol parvarishi', nameRu: 'Уход за бородой', sortOrder: 3 },
            { nameUz: 'Ustara va malhamlar', nameRu: 'Бритвы и средства для бритья', sortOrder: 4 },
          ],
        },
      },
    }),
    // 12. Dorixona
    prisma.category.create({
      data: {
        nameUz: 'Dorixona',
        nameRu: 'Аптека',
        icon: 'health',
        sortOrder: 12,
        subcategories: {
          create: [
            { nameUz: 'Vitaminlar', nameRu: 'Витамины', sortOrder: 1 },
            { nameUz: 'Tibbiy jihozlar', nameRu: 'Медицинские приборы', sortOrder: 2 },
            { nameUz: 'BADlar', nameRu: 'БАДы', sortOrder: 3 },
            { nameUz: 'Birinchi yordam', nameRu: 'Первая помощь', sortOrder: 4 },
          ],
        },
      },
    }),
    // 13. Uy buyumlari
    prisma.category.create({
      data: {
        nameUz: 'Uy buyumlari',
        nameRu: 'Товары для дома',
        icon: 'home_2',
        sortOrder: 13,
        subcategories: {
          create: [
            { nameUz: 'Uy tekstili', nameRu: 'Домашний текстиль', sortOrder: 1 },
            { nameUz: 'Oshxona buyumlari', nameRu: 'Посуда', sortOrder: 2 },
            { nameUz: 'Dekor', nameRu: 'Декор', sortOrder: 3 },
            { nameUz: 'Yoritish', nameRu: 'Освещение', sortOrder: 4 },
            { nameUz: 'Hammom buyumlari', nameRu: 'Товары для ванной', sortOrder: 5 },
            { nameUz: 'Saqlash va tartib', nameRu: 'Хранение и порядок', sortOrder: 6 },
          ],
        },
      },
    }),
    // 14. Mebel
    prisma.category.create({
      data: {
        nameUz: 'Mebel',
        nameRu: 'Мебель',
        icon: 'lamp_charge',
        sortOrder: 14,
        subcategories: {
          create: [
            { nameUz: 'Yotoqxona', nameRu: 'Спальня', sortOrder: 1 },
            { nameUz: 'Yashash xonasi', nameRu: 'Гостиная', sortOrder: 2 },
            { nameUz: 'Oshxona mebeli', nameRu: 'Кухонная мебель', sortOrder: 3 },
            { nameUz: 'Ofis mebeli', nameRu: 'Офисная мебель', sortOrder: 4 },
            { nameUz: 'Bolalar mebeli', nameRu: 'Детская мебель', sortOrder: 5 },
          ],
        },
      },
    }),
    // 15. Qurilish va ta'mirlash
    prisma.category.create({
      data: {
        nameUz: "Qurilish va ta'mirlash",
        nameRu: 'Строительство и ремонт',
        icon: 'ruler',
        sortOrder: 15,
        subcategories: {
          create: [
            { nameUz: 'Asboblar', nameRu: 'Инструменты', sortOrder: 1 },
            { nameUz: 'Bo\'yoqlar', nameRu: 'Краски', sortOrder: 2 },
            { nameUz: 'Santexnika', nameRu: 'Сантехника', sortOrder: 3 },
            { nameUz: 'Elektrika', nameRu: 'Электрика', sortOrder: 4 },
            { nameUz: 'Qulflar va dastaklar', nameRu: 'Замки и ручки', sortOrder: 5 },
          ],
        },
      },
    }),
    // 16. Maishiy kimyo
    prisma.category.create({
      data: {
        nameUz: 'Maishiy kimyo',
        nameRu: 'Бытовая химия',
        icon: 'box_1',
        sortOrder: 16,
        subcategories: {
          create: [
            { nameUz: 'Kir yuvish vositalari', nameRu: 'Средства для стирки', sortOrder: 1 },
            { nameUz: 'Tozalash vositalari', nameRu: 'Средства для уборки', sortOrder: 2 },
            { nameUz: 'Idish yuvish vositalari', nameRu: 'Средства для мытья посуды', sortOrder: 3 },
            { nameUz: 'Xushbo\'ylantirgichlar', nameRu: 'Освежители воздуха', sortOrder: 4 },
          ],
        },
      },
    }),
    // 17. Bolalar uchun
    prisma.category.create({
      data: {
        nameUz: 'Bolalar uchun',
        nameRu: 'Детские товары',
        icon: 'happyemoji',
        sortOrder: 17,
        subcategories: {
          create: [
            { nameUz: 'Bolalar kiyimi', nameRu: 'Детская одежда', sortOrder: 1 },
            { nameUz: 'Bolalar poyabzali', nameRu: 'Детская обувь', sortOrder: 2 },
            { nameUz: 'Bolalar oziq-ovqati', nameRu: 'Детское питание', sortOrder: 3 },
            { nameUz: 'Bolalar gigienasi', nameRu: 'Детская гигиена', sortOrder: 4 },
            { nameUz: 'Aravachalar', nameRu: 'Коляски', sortOrder: 5 },
            { nameUz: 'Bolalar xonasi', nameRu: 'Детская комната', sortOrder: 6 },
          ],
        },
      },
    }),
    // 18. O'yinchoqlar
    prisma.category.create({
      data: {
        nameUz: "O'yinchoqlar",
        nameRu: 'Игрушки',
        icon: 'game',
        sortOrder: 18,
        subcategories: {
          create: [
            { nameUz: 'Konstruktorlar', nameRu: 'Конструкторы', sortOrder: 1 },
            { nameUz: 'Qo\'g\'irchoqlar', nameRu: 'Куклы', sortOrder: 2 },
            { nameUz: 'Mashinalar', nameRu: 'Машинки', sortOrder: 3 },
            { nameUz: 'Stol o\'yinlari', nameRu: 'Настольные игры', sortOrder: 4 },
            { nameUz: 'Yumshoq o\'yinchoqlar', nameRu: 'Мягкие игрушки', sortOrder: 5 },
            { nameUz: 'Rivojlantiruvchi', nameRu: 'Развивающие', sortOrder: 6 },
          ],
        },
      },
    }),
    // 19. Kanselyariya
    prisma.category.create({
      data: {
        nameUz: 'Kanselyariya',
        nameRu: 'Канцелярия',
        icon: 'pen_tool',
        sortOrder: 19,
        subcategories: {
          create: [
            { nameUz: 'Yozuv buyumlari', nameRu: 'Письменные принадлежности', sortOrder: 1 },
            { nameUz: 'Daftarlar va bloknot', nameRu: 'Тетради и блокноты', sortOrder: 2 },
            { nameUz: 'Maktab buyumlari', nameRu: 'Школьные принадлежности', sortOrder: 3 },
            { nameUz: 'Ofis buyumlari', nameRu: 'Офисные принадлежности', sortOrder: 4 },
          ],
        },
      },
    }),
    // 20. Oziq-ovqat
    prisma.category.create({
      data: {
        nameUz: 'Oziq-ovqat',
        nameRu: 'Продукты питания',
        icon: 'milk',
        sortOrder: 20,
        subcategories: {
          create: [
            { nameUz: 'Sut mahsulotlari', nameRu: 'Молочные продукты', sortOrder: 1 },
            { nameUz: 'Non va un mahsulotlari', nameRu: 'Хлебобулочные и мука', sortOrder: 2 },
            { nameUz: 'Konservalar', nameRu: 'Консервы', sortOrder: 3 },
            { nameUz: 'Yog\' va soslar', nameRu: 'Масла и соусы', sortOrder: 4 },
            { nameUz: 'Guruch va yormalar', nameRu: 'Крупы и макароны', sortOrder: 5 },
            { nameUz: 'Ziravorlar', nameRu: 'Специи и приправы', sortOrder: 6 },
          ],
        },
      },
    }),
    // 21. Shirinliklar va gazaklar
    prisma.category.create({
      data: {
        nameUz: 'Shirinliklar va gazaklar',
        nameRu: 'Сладости и снеки',
        icon: 'cake',
        sortOrder: 21,
        subcategories: {
          create: [
            { nameUz: 'Shokoladlar', nameRu: 'Шоколад', sortOrder: 1 },
            { nameUz: 'Konfetlar', nameRu: 'Конфеты', sortOrder: 2 },
            { nameUz: 'Pechenye', nameRu: 'Печенье', sortOrder: 3 },
            { nameUz: 'Gazaklar', nameRu: 'Снеки', sortOrder: 4 },
            { nameUz: 'Quritilgan mevalar', nameRu: 'Сухофрукты и орехи', sortOrder: 5 },
          ],
        },
      },
    }),
    // 22. Ichimliklar
    prisma.category.create({
      data: {
        nameUz: 'Ichimliklar',
        nameRu: 'Напитки',
        icon: 'cup',
        sortOrder: 22,
        subcategories: {
          create: [
            { nameUz: 'Choy', nameRu: 'Чай', sortOrder: 1 },
            { nameUz: 'Qahva', nameRu: 'Кофе', sortOrder: 2 },
            { nameUz: 'Sharbat va kompotlar', nameRu: 'Соки и компоты', sortOrder: 3 },
            { nameUz: 'Suv', nameRu: 'Вода', sortOrder: 4 },
            { nameUz: 'Gazli ichimliklar', nameRu: 'Газированные напитки', sortOrder: 5 },
          ],
        },
      },
    }),
    // 23. Avtotovarlar
    prisma.category.create({
      data: {
        nameUz: 'Avtotovarlar',
        nameRu: 'Автотовары',
        icon: 'car',
        sortOrder: 23,
        subcategories: {
          create: [
            { nameUz: 'Ehtiyot qismlar', nameRu: 'Запчасти', sortOrder: 1 },
            { nameUz: 'Avto aksessuarlar', nameRu: 'Аксессуары', sortOrder: 2 },
            { nameUz: 'Moy va suyuqliklar', nameRu: 'Масла и жидкости', sortOrder: 3 },
            { nameUz: 'Shinalar va disklar', nameRu: 'Шины и диски', sortOrder: 4 },
            { nameUz: 'Avtoelektronika', nameRu: 'Автоэлектроника', sortOrder: 5 },
          ],
        },
      },
    }),
    // 24. Sport va dam olish
    prisma.category.create({
      data: {
        nameUz: 'Sport va dam olish',
        nameRu: 'Спорт и отдых',
        icon: 'weight_1',
        sortOrder: 24,
        subcategories: {
          create: [
            { nameUz: 'Sport kiyimlari', nameRu: 'Спортивная одежда', sortOrder: 1 },
            { nameUz: 'Sport jihozlari', nameRu: 'Спортивный инвентарь', sortOrder: 2 },
            { nameUz: 'Sport poyabzali', nameRu: 'Спортивная обувь', sortOrder: 3 },
            { nameUz: 'Velosipedlar', nameRu: 'Велосипеды', sortOrder: 4 },
            { nameUz: 'Turizm va yurish', nameRu: 'Туризм и походы', sortOrder: 5 },
            { nameUz: 'Baliq ovi', nameRu: 'Рыбалка', sortOrder: 6 },
          ],
        },
      },
    }),
    // 25. O'yin va konsol
    prisma.category.create({
      data: {
        nameUz: "O'yin va konsol",
        nameRu: 'Игры и консоли',
        icon: 'driver',
        sortOrder: 25,
        subcategories: {
          create: [
            { nameUz: 'Konsollar', nameRu: 'Консоли', sortOrder: 1 },
            { nameUz: 'O\'yinlar', nameRu: 'Игры', sortOrder: 2 },
            { nameUz: 'Geympad va aksessuarlar', nameRu: 'Геймпады и аксессуары', sortOrder: 3 },
            { nameUz: 'O\'yin stullari', nameRu: 'Игровые кресла', sortOrder: 4 },
          ],
        },
      },
    }),
    // 26. Kitoblar
    prisma.category.create({
      data: {
        nameUz: 'Kitoblar',
        nameRu: 'Книги',
        icon: 'book',
        sortOrder: 26,
        subcategories: {
          create: [
            { nameUz: 'Badiiy adabiyot', nameRu: 'Художественная литература', sortOrder: 1 },
            { nameUz: 'Darsliklar', nameRu: 'Учебники', sortOrder: 2 },
            { nameUz: 'Bolalar kitoblari', nameRu: 'Детские книги', sortOrder: 3 },
            { nameUz: 'Biznes va motivatsiya', nameRu: 'Бизнес и мотивация', sortOrder: 4 },
            { nameUz: 'Diniy kitoblar', nameRu: 'Религиозная литература', sortOrder: 5 },
          ],
        },
      },
    }),
    // 27. Xobbi va ijodkorlik
    prisma.category.create({
      data: {
        nameUz: 'Xobbi va ijodkorlik',
        nameRu: 'Хобби и творчество',
        icon: 'colorfilter',
        sortOrder: 27,
        subcategories: {
          create: [
            { nameUz: 'Rassomchilik', nameRu: 'Рисование', sortOrder: 1 },
            { nameUz: 'Tikuvchilik', nameRu: 'Шитьё', sortOrder: 2 },
            { nameUz: 'Musiqa asboblari', nameRu: 'Музыкальные инструменты', sortOrder: 3 },
            { nameUz: 'Qo\'lda ishlash', nameRu: 'Рукоделие', sortOrder: 4 },
          ],
        },
      },
    }),
    // 28. Uy hayvonlari
    prisma.category.create({
      data: {
        nameUz: 'Uy hayvonlari',
        nameRu: 'Домашние животные',
        icon: 'pet',
        sortOrder: 28,
        subcategories: {
          create: [
            { nameUz: 'Oziq-ovqat', nameRu: 'Корм', sortOrder: 1 },
            { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', sortOrder: 2 },
            { nameUz: 'Gigiena vositalari', nameRu: 'Средства гигиены', sortOrder: 3 },
            { nameUz: 'Vetapteka', nameRu: 'Ветаптека', sortOrder: 4 },
          ],
        },
      },
    }),
    // 29. Bog' va tomorqa
    prisma.category.create({
      data: {
        nameUz: "Bog' va tomorqa",
        nameRu: 'Сад и огород',
        icon: 'tree',
        sortOrder: 29,
        subcategories: {
          create: [
            { nameUz: 'Urug\'lar va ko\'chatlar', nameRu: 'Семена и рассада', sortOrder: 1 },
            { nameUz: 'Bog\' asboblari', nameRu: 'Садовый инвентарь', sortOrder: 2 },
            { nameUz: 'O\'g\'itlar', nameRu: 'Удобрения', sortOrder: 3 },
            { nameUz: 'Sug\'orish tizimlari', nameRu: 'Системы полива', sortOrder: 4 },
            { nameUz: 'Gullar va o\'simliklar', nameRu: 'Цветы и растения', sortOrder: 5 },
          ],
        },
      },
    }),
    // 30. Sovg'alar
    prisma.category.create({
      data: {
        nameUz: "Sovg'alar",
        nameRu: 'Подарки',
        icon: 'gift',
        sortOrder: 30,
        subcategories: {
          create: [
            { nameUz: 'Sovg\'a to\'plamlari', nameRu: 'Подарочные наборы', sortOrder: 1 },
            { nameUz: 'Sertifikatlar', nameRu: 'Сертификаты', sortOrder: 2 },
            { nameUz: 'Bayram bezaklari', nameRu: 'Праздничный декор', sortOrder: 3 },
            { nameUz: 'Esdalik buyumlar', nameRu: 'Сувениры', sortOrder: 4 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ ${categories.length} categories created`);

  // ============================================
  // Brands (upsert to avoid duplicates)
  // ============================================
  const brandNames = ['Apple', 'Samsung', 'Xiaomi', 'Nike', 'Adidas', 'Artel'];
  const brands = await Promise.all(
    brandNames.map(name =>
      prisma.brand.upsert({ where: { name }, create: { name }, update: {} })
    )
  );

  console.log(`✅ ${brands.length} brands created`);

  // ============================================
  // Colors
  // ============================================
  const colorData = [
    { nameUz: 'Qora', nameRu: 'Чёрный', hexCode: '#000000' },
    { nameUz: 'Oq', nameRu: 'Белый', hexCode: '#FFFFFF' },
    { nameUz: 'Qizil', nameRu: 'Красный', hexCode: '#FF0000' },
    { nameUz: 'Ko\'k', nameRu: 'Синий', hexCode: '#0000FF' },
    { nameUz: 'Yashil', nameRu: 'Зелёный', hexCode: '#00FF00' },
    { nameUz: 'Kulrang', nameRu: 'Серый', hexCode: '#808080' },
  ];
  // Delete and recreate colors
  await prisma.color.deleteMany();
  const colors = await Promise.all(
    colorData.map(c => prisma.color.create({ data: c }))
  );

  console.log(`✅ ${colors.length} colors created`);

  // ============================================
  // Promo Codes
  // ============================================
  await Promise.all([
    prisma.promoCode.upsert({
      where: { code: 'TOPLA10' },
      create: { code: 'TOPLA10', discountType: 'percentage', discountValue: 10, minOrderAmount: 50000, maxUses: 1000 },
      update: {},
    }),
    prisma.promoCode.upsert({
      where: { code: 'WELCOME' },
      create: { code: 'WELCOME', discountType: 'fixed', discountValue: 20000, minOrderAmount: 100000, maxUses: 500 },
      update: {},
    }),
    prisma.promoCode.upsert({
      where: { code: 'DELIVERY0' },
      create: { code: 'DELIVERY0', discountType: 'fixed', discountValue: 15000, maxUses: 200 },
      update: {},
    }),
  ]);

  console.log('✅ Promo codes created');

  // ============================================
  // Admin Settings
  // ============================================
  const settings = [
    { key: 'default_delivery_fee', value: '15000', type: 'number' },
    { key: 'commission_rate', value: '10', type: 'number' },
    { key: 'courier_delivery_share', value: '80', type: 'number' },
    { key: 'courier_assignment_timeout', value: '60', type: 'number' },
    { key: 'min_order_amount', value: '30000', type: 'number' },
    { key: 'app_version', value: '1.0.0', type: 'string' },
  ];
  await Promise.all(
    settings.map(s =>
      prisma.adminSetting.upsert({ where: { key: s.key }, create: s, update: {} })
    )
  );

  console.log('✅ Admin settings created');

  // ============================================
  // Admin User
  // ============================================
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  await prisma.profile.upsert({
    where: { phone: '+998900000000' },
    update: {
      email: 'admin@topla.uz',
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'TOPLA Admin',
    },
    create: {
      phone: '+998900000000',
      email: 'admin@topla.uz',
      passwordHash: adminPasswordHash,
      role: 'admin',
      fullName: 'TOPLA Admin',
      status: 'active',
    },
  });
  console.log('✅ Admin user created: admin@topla.uz / admin123');

  // ============================================
  // Vendor User + Shop
  // ============================================
  const vendorPasswordHash = await bcrypt.hash('vendor123', 12);
  const vendorProfile = await prisma.profile.upsert({
    where: { phone: '+998911112233' },
    update: {
      email: 'vendor@topla.uz',
      passwordHash: vendorPasswordHash,
      role: 'vendor',
      fullName: 'Demo Vendor',
    },
    create: {
      phone: '+998911112233',
      email: 'vendor@topla.uz',
      passwordHash: vendorPasswordHash,
      role: 'vendor',
      fullName: 'Demo Vendor',
      status: 'active',
    },
  });

  await prisma.shop.upsert({
    where: { ownerId: vendorProfile.id },
    update: {
      name: 'Demo Shop',
      description: 'Demo do\'kon',
      phone: '+998911112233',
      address: 'Toshkent, Chilonzor',
      status: 'active',
    },
    create: {
      ownerId: vendorProfile.id,
      name: 'Demo Shop',
      description: 'Demo do\'kon',
      phone: '+998911112233',
      address: 'Toshkent, Chilonzor',
      status: 'active',
    },
  });
  console.log('✅ Vendor user created: vendor@topla.uz / vendor123');

  // ============================================
  // Banners
  // ============================================
  await prisma.banner.deleteMany();
  await Promise.all([
    prisma.banner.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop',
        titleUz: 'Yangi kolleksiya',
        titleRu: 'Новая коллекция',
        subtitleUz: 'Eng so\'nggi mahsulotlar',
        subtitleRu: 'Самые новые товары',
        actionType: 'link',
        actionValue: 'https://t.me/topla_market',
        sortOrder: 1,
      },
    }),
    prisma.banner.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        titleUz: 'Chegirmalar haftaligi',
        titleRu: 'Неделя скидок',
        subtitleUz: '50% gacha chegirma',
        subtitleRu: 'Скидки до 50%',
        actionType: 'link',
        actionValue: 'https://t.me/topla_market',
        sortOrder: 2,
      },
    }),
    prisma.banner.create({
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
        titleUz: 'Bepul yetkazib berish',
        titleRu: 'Бесплатная доставка',
        subtitleUz: '100 000 so\'mdan yuqori buyurtmalar',
        subtitleRu: 'Заказы от 100 000 сум',
        actionType: 'none',
        sortOrder: 3,
      },
    }),
  ]);
  console.log('✅ Banners created');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
