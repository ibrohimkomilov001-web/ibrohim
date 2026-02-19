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
  // Exact 29 Categories (Supabase original)
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
            { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', sortOrder: 5 },
          ],
        },
      },
    }),
    // 2. Noutbuklar va kompyuterlar
    prisma.category.create({
      data: {
        nameUz: 'Noutbuklar va kompyuterlar',
        nameRu: 'Ноутбуки и компьютеры',
        icon: 'monitor',
        sortOrder: 2,
        subcategories: {
          create: [
            { nameUz: 'Noutbuklar', nameRu: 'Ноутбуки', sortOrder: 1 },
            { nameUz: 'Kompyuterlar', nameRu: 'Компьютеры', sortOrder: 2 },
            { nameUz: 'Monitorlar', nameRu: 'Мониторы', sortOrder: 3 },
            { nameUz: 'Komponentlar', nameRu: 'Комплектующие', sortOrder: 4 },
            { nameUz: 'Periferiya', nameRu: 'Периферия', sortOrder: 5 },
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
            { nameUz: 'Oshxona texnikasi', nameRu: 'Кухонная техника', sortOrder: 4 },
            { nameUz: 'Iqlim texnikasi', nameRu: 'Климатическая техника', sortOrder: 5 },
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
            { nameUz: 'Proektor', nameRu: 'Проекторы', sortOrder: 2 },
            { nameUz: 'TV pristavkalar', nameRu: 'ТВ приставки', sortOrder: 3 },
            { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', sortOrder: 4 },
          ],
        },
      },
    }),
    // 5. Kiyim va poyabzal
    prisma.category.create({
      data: {
        nameUz: 'Kiyim va poyabzal',
        nameRu: 'Одежда и обувь',
        icon: 'shirt',
        sortOrder: 5,
        subcategories: {
          create: [
            { nameUz: 'Erkaklar kiyimi', nameRu: 'Мужская одежда', sortOrder: 1 },
            { nameUz: 'Ayollar kiyimi', nameRu: 'Женская одежда', sortOrder: 2 },
            { nameUz: 'Bolalar kiyimi', nameRu: 'Детская одежда', sortOrder: 3 },
            { nameUz: 'Erkaklar poyabzali', nameRu: 'Мужская обувь', sortOrder: 4 },
            { nameUz: 'Ayollar poyabzali', nameRu: 'Женская обувь', sortOrder: 5 },
          ],
        },
      },
    }),
    // 6. Sumkalar va aksessuarlar
    prisma.category.create({
      data: {
        nameUz: 'Sumkalar va aksessuarlar',
        nameRu: 'Сумки и аксессуары',
        icon: 'bag_2',
        sortOrder: 6,
        subcategories: {
          create: [
            { nameUz: 'Ayollar sumkalari', nameRu: 'Женские сумки', sortOrder: 1 },
            { nameUz: 'Erkaklar sumkalari', nameRu: 'Мужские сумки', sortOrder: 2 },
            { nameUz: 'Ryukzaklar', nameRu: 'Рюкзаки', sortOrder: 3 },
            { nameUz: 'Hamyonlar', nameRu: 'Кошельки', sortOrder: 4 },
          ],
        },
      },
    }),
    // 7. Zargarlik buyumlari
    prisma.category.create({
      data: {
        nameUz: 'Zargarlik buyumlari',
        nameRu: 'Ювелирные изделия',
        icon: 'diamonds',
        sortOrder: 7,
        subcategories: {
          create: [
            { nameUz: 'Uzuklar', nameRu: 'Кольца', sortOrder: 1 },
            { nameUz: 'Marjonlar', nameRu: 'Ожерелья', sortOrder: 2 },
            { nameUz: 'Isirg\'alar', nameRu: 'Серьги', sortOrder: 3 },
            { nameUz: 'Soatlar', nameRu: 'Часы', sortOrder: 4 },
          ],
        },
      },
    }),
    // 8. Go'zallik
    prisma.category.create({
      data: {
        nameUz: "Go'zallik",
        nameRu: 'Красота',
        icon: 'magic_star',
        sortOrder: 8,
        subcategories: {
          create: [
            { nameUz: 'Pardoz vositalari', nameRu: 'Косметика', sortOrder: 1 },
            { nameUz: 'Terini parvarish', nameRu: 'Уход за кожей', sortOrder: 2 },
            { nameUz: 'Soch parvarishi', nameRu: 'Уход за волосами', sortOrder: 3 },
          ],
        },
      },
    }),
    // 9. Parfyumeriya
    prisma.category.create({
      data: {
        nameUz: 'Parfyumeriya',
        nameRu: 'Парфюмерия',
        icon: 'drop',
        sortOrder: 9,
        subcategories: {
          create: [
            { nameUz: 'Ayollar atiri', nameRu: 'Женская парфюмерия', sortOrder: 1 },
            { nameUz: 'Erkaklar atiri', nameRu: 'Мужская парфюмерия', sortOrder: 2 },
          ],
        },
      },
    }),
    // 10. Gigiena
    prisma.category.create({
      data: {
        nameUz: 'Gigiena',
        nameRu: 'Гигиена',
        icon: 'brush_1',
        sortOrder: 10,
        subcategories: {
          create: [
            { nameUz: 'Og\'iz bo\'shlig\'i', nameRu: 'Полость рта', sortOrder: 1 },
            { nameUz: 'Tana gigienasi', nameRu: 'Гигиена тела', sortOrder: 2 },
          ],
        },
      },
    }),
    // 11. Dorixona
    prisma.category.create({
      data: {
        nameUz: 'Dorixona',
        nameRu: 'Аптека',
        icon: 'health',
        sortOrder: 11,
        subcategories: {
          create: [
            { nameUz: 'Vitaminlar', nameRu: 'Витамины', sortOrder: 1 },
            { nameUz: 'Tibbiy jihozlar', nameRu: 'Мед. оборудование', sortOrder: 2 },
            { nameUz: 'Shaxsiy gigiena', nameRu: 'Личная гигиена', sortOrder: 3 },
          ],
        },
      },
    }),
    // 12. Uy
    prisma.category.create({
      data: {
        nameUz: 'Uy',
        nameRu: 'Дом',
        icon: 'home_2',
        sortOrder: 12,
        subcategories: {
          create: [
            { nameUz: 'Uy tekstili', nameRu: 'Домашний текстиль', sortOrder: 1 },
            { nameUz: 'Oshxona buyumlari', nameRu: 'Посуда', sortOrder: 2 },
            { nameUz: 'Dekor', nameRu: 'Декор', sortOrder: 3 },
            { nameUz: 'Yoritish', nameRu: 'Освещение', sortOrder: 4 },
          ],
        },
      },
    }),
    // 13. Mebel
    prisma.category.create({
      data: {
        nameUz: 'Mebel',
        nameRu: 'Мебель',
        icon: 'lamp_charge',
        sortOrder: 13,
        subcategories: {
          create: [
            { nameUz: 'Yotoq xona', nameRu: 'Спальня', sortOrder: 1 },
            { nameUz: 'Mehmon xona', nameRu: 'Гостиная', sortOrder: 2 },
            { nameUz: 'Oshxona mebeli', nameRu: 'Кухонная мебель', sortOrder: 3 },
            { nameUz: 'Ofis mebeli', nameRu: 'Офисная мебель', sortOrder: 4 },
          ],
        },
      },
    }),
    // 14. Qurilish va ta'mirlash
    prisma.category.create({
      data: {
        nameUz: "Qurilish va ta'mirlash",
        nameRu: 'Строительство и ремонт',
        icon: 'ruler',
        sortOrder: 14,
        subcategories: {
          create: [
            { nameUz: 'Asboblar', nameRu: 'Инструменты', sortOrder: 1 },
            { nameUz: 'Bo\'yoqlar', nameRu: 'Краски', sortOrder: 2 },
            { nameUz: 'Santexnika', nameRu: 'Сантехника', sortOrder: 3 },
            { nameUz: 'Elektrika', nameRu: 'Электрика', sortOrder: 4 },
          ],
        },
      },
    }),
    // 15. Uy kimyoviy moddalari
    prisma.category.create({
      data: {
        nameUz: 'Uy kimyoviy moddalari',
        nameRu: 'Бытовая химия',
        icon: 'box_1',
        sortOrder: 15,
        subcategories: {
          create: [
            { nameUz: 'Kir yuvish', nameRu: 'Стирка', sortOrder: 1 },
            { nameUz: 'Tozalash', nameRu: 'Уборка', sortOrder: 2 },
            { nameUz: 'Idish yuvish', nameRu: 'Мытьё посуды', sortOrder: 3 },
          ],
        },
      },
    }),
    // 16. Bolalar mahsulotlari
    prisma.category.create({
      data: {
        nameUz: 'Bolalar mahsulotlari',
        nameRu: 'Детские товары',
        icon: 'happyemoji',
        sortOrder: 16,
        subcategories: {
          create: [
            { nameUz: 'Bolalar kiyimi', nameRu: 'Детская одежда', sortOrder: 1 },
            { nameUz: 'Bolalar oziq-ovqati', nameRu: 'Детское питание', sortOrder: 2 },
            { nameUz: 'Bolalar gigienasi', nameRu: 'Детская гигиена', sortOrder: 3 },
            { nameUz: 'Aravachalar', nameRu: 'Коляски', sortOrder: 4 },
          ],
        },
      },
    }),
    // 17. O'yinchoqlar
    prisma.category.create({
      data: {
        nameUz: "O'yinchoqlar",
        nameRu: 'Игрушки',
        icon: 'game',
        sortOrder: 17,
        subcategories: {
          create: [
            { nameUz: 'Konstruktorlar', nameRu: 'Конструкторы', sortOrder: 1 },
            { nameUz: 'Qo\'g\'irchoqlar', nameRu: 'Куклы', sortOrder: 2 },
            { nameUz: 'Mashinalar', nameRu: 'Машинки', sortOrder: 3 },
            { nameUz: 'Stol o\'yinlari', nameRu: 'Настольные игры', sortOrder: 4 },
          ],
        },
      },
    }),
    // 18. Maktab va ofis uchun
    prisma.category.create({
      data: {
        nameUz: 'Maktab va ofis uchun',
        nameRu: 'Школа и офис',
        icon: 'pen_tool',
        sortOrder: 18,
        subcategories: {
          create: [
            { nameUz: 'Yozuv buyumlari', nameRu: 'Письменные', sortOrder: 1 },
            { nameUz: 'Daftarlar', nameRu: 'Тетради', sortOrder: 2 },
            { nameUz: 'Ofis jihozlari', nameRu: 'Офисная техника', sortOrder: 3 },
          ],
        },
      },
    }),
    // 19. Oziq-ovqat mahsulotlari
    prisma.category.create({
      data: {
        nameUz: 'Oziq-ovqat mahsulotlari',
        nameRu: 'Продукты питания',
        icon: 'milk',
        sortOrder: 19,
        subcategories: {
          create: [
            { nameUz: 'Sut mahsulotlari', nameRu: 'Молочные продукты', sortOrder: 1 },
            { nameUz: 'Non mahsulotlari', nameRu: 'Хлебобулочные', sortOrder: 2 },
            { nameUz: 'Konservalar', nameRu: 'Консервы', sortOrder: 3 },
            { nameUz: 'Yog\' va soslar', nameRu: 'Масла и соусы', sortOrder: 4 },
          ],
        },
      },
    }),
    // 20. Shirinliklar va gazaklar
    prisma.category.create({
      data: {
        nameUz: 'Shirinliklar va gazaklar',
        nameRu: 'Сладости и снеки',
        icon: 'cake',
        sortOrder: 20,
        subcategories: {
          create: [
            { nameUz: 'Shokoladlar', nameRu: 'Шоколад', sortOrder: 1 },
            { nameUz: 'Konfetlar', nameRu: 'Конфеты', sortOrder: 2 },
            { nameUz: 'Gazaklar', nameRu: 'Снеки', sortOrder: 3 },
          ],
        },
      },
    }),
    // 21. Ichimliklar
    prisma.category.create({
      data: {
        nameUz: 'Ichimliklar',
        nameRu: 'Напитки',
        icon: 'cup',
        sortOrder: 21,
        subcategories: {
          create: [
            { nameUz: 'Choy va qahva', nameRu: 'Чай и кофе', sortOrder: 1 },
            { nameUz: 'Sharbatlar', nameRu: 'Соки', sortOrder: 2 },
            { nameUz: 'Suv', nameRu: 'Вода', sortOrder: 3 },
          ],
        },
      },
    }),
    // 22. Avtomobil mahsulotlari
    prisma.category.create({
      data: {
        nameUz: 'Avtomobil mahsulotlari',
        nameRu: 'Автотовары',
        icon: 'car',
        sortOrder: 22,
        subcategories: {
          create: [
            { nameUz: 'Ehtiyot qismlar', nameRu: 'Запчасти', sortOrder: 1 },
            { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', sortOrder: 2 },
            { nameUz: 'Yog\'lar', nameRu: 'Масла', sortOrder: 3 },
            { nameUz: 'Shinalar', nameRu: 'Шины', sortOrder: 4 },
          ],
        },
      },
    }),
    // 23. Sport va dam olish
    prisma.category.create({
      data: {
        nameUz: 'Sport va dam olish',
        nameRu: 'Спорт и отдых',
        icon: 'weight_1',
        sortOrder: 23,
        subcategories: {
          create: [
            { nameUz: 'Sport kiyimlari', nameRu: 'Спортивная одежда', sortOrder: 1 },
            { nameUz: 'Sport jihozlari', nameRu: 'Спортивный инвентарь', sortOrder: 2 },
            { nameUz: 'Turizm', nameRu: 'Туризм', sortOrder: 3 },
          ],
        },
      },
    }),
    // 24. O'yin va konsol
    prisma.category.create({
      data: {
        nameUz: "O'yin va konsol",
        nameRu: 'Игры и консоли',
        icon: 'driver',
        sortOrder: 24,
        subcategories: {
          create: [
            { nameUz: 'Konsollar', nameRu: 'Консоли', sortOrder: 1 },
            { nameUz: 'O\'yinlar', nameRu: 'Игры', sortOrder: 2 },
            { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', sortOrder: 3 },
          ],
        },
      },
    }),
    // 25. Kitoblar
    prisma.category.create({
      data: {
        nameUz: 'Kitoblar',
        nameRu: 'Книги',
        icon: 'book',
        sortOrder: 25,
        subcategories: {
          create: [
            { nameUz: 'Badiiy adabiyot', nameRu: 'Художественная', sortOrder: 1 },
            { nameUz: 'Darsliklar', nameRu: 'Учебники', sortOrder: 2 },
            { nameUz: 'Bolalar kitoblari', nameRu: 'Детские книги', sortOrder: 3 },
            { nameUz: 'Biznes kitoblar', nameRu: 'Бизнес книги', sortOrder: 4 },
          ],
        },
      },
    }),
    // 26. Xobbi va ijodkorlik
    prisma.category.create({
      data: {
        nameUz: 'Xobbi va ijodkorlik',
        nameRu: 'Хобби и творчество',
        icon: 'colorfilter',
        sortOrder: 26,
        subcategories: {
          create: [
            { nameUz: 'Rassomchilik', nameRu: 'Рисование', sortOrder: 1 },
            { nameUz: 'Tikuvchilik', nameRu: 'Шитьё', sortOrder: 2 },
          ],
        },
      },
    }),
    // 27. Uy hayvonlari
    prisma.category.create({
      data: {
        nameUz: 'Uy hayvonlari',
        nameRu: 'Домашние животные',
        icon: 'pet',
        sortOrder: 27,
        subcategories: {
          create: [
            { nameUz: 'Oziq-ovqat', nameRu: 'Корм', sortOrder: 1 },
            { nameUz: 'Aksessuarlar', nameRu: 'Аксессуары', sortOrder: 2 },
            { nameUz: 'Gigiyena', nameRu: 'Гигиена', sortOrder: 3 },
          ],
        },
      },
    }),
    // 28. Gullar va guldastalar
    prisma.category.create({
      data: {
        nameUz: 'Gullar va guldastalar',
        nameRu: 'Цветы и букеты',
        icon: 'lovely',
        sortOrder: 28,
        subcategories: {
          create: [
            { nameUz: 'Guldastalar', nameRu: 'Букеты', sortOrder: 1 },
            { nameUz: 'Uy o\'simliklari', nameRu: 'Комнатные растения', sortOrder: 2 },
          ],
        },
      },
    }),
    // 29. Sovg'alar
    prisma.category.create({
      data: {
        nameUz: "Sovg'alar",
        nameRu: 'Подарки',
        icon: 'gift',
        sortOrder: 29,
        subcategories: {
          create: [
            { nameUz: 'Sovg\'a to\'plamlari', nameRu: 'Подарочные наборы', sortOrder: 1 },
            { nameUz: 'Sertifikatlar', nameRu: 'Сертификаты', sortOrder: 2 },
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
