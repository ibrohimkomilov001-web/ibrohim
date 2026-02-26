-- =============================================
-- TOPLA Category Migration: 29 → 30 categories
-- Pro-level marketplace structure
-- =============================================

BEGIN;

-- Step 1: Delete all subcategories (cascading won't touch products)
DELETE FROM subcategories;

-- Step 2: Nullify product category references (demo data)
UPDATE products SET category_id = NULL, subcategory_id = NULL;

-- Step 3: Delete all old categories
DELETE FROM categories;

-- Step 4: Insert 30 new categories
-- 1. Elektronika
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Elektronika', 'Электроника', 'mobile', 1);
-- 2. Noutbuk va kompyuter
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Noutbuk va kompyuter', 'Ноутбуки и компьютеры', 'monitor', 2);
-- 3. Maishiy texnika
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Maishiy texnika', 'Бытовая техника', 'blend_2', 3);
-- 4. Televizor va video
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Televizor va video', 'ТВ и видео', 'screenmirroring', 4);
-- 5. Erkaklar kiyimi
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Erkaklar kiyimi', 'Мужская одежда', 'shirt', 5);
-- 6. Ayollar kiyimi
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Ayollar kiyimi', 'Женская одежда', 'woman', 6);
-- 7. Sumkalar va aksessuarlar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Sumkalar va aksessuarlar', 'Сумки и аксессуары', 'bag_2', 7);
-- 8. Zargarlik
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Zargarlik', 'Ювелирные изделия', 'diamonds', 8);
-- 9. Go'zallik
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Go''zallik', 'Красота', 'magic_star', 9);
-- 10. Parfyumeriya
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Parfyumeriya', 'Парфюмерия', 'drop', 10);
-- 11. Shaxsiy gigiena
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Shaxsiy gigiena', 'Личная гигиена', 'brush_1', 11);
-- 12. Dorixona
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Dorixona', 'Аптека', 'health', 12);
-- 13. Uy buyumlari
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Uy buyumlari', 'Товары для дома', 'home_2', 13);
-- 14. Mebel
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Mebel', 'Мебель', 'lamp_charge', 14);
-- 15. Qurilish va ta'mirlash
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Qurilish va ta''mirlash', 'Строительство и ремонт', 'ruler', 15);
-- 16. Maishiy kimyo
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Maishiy kimyo', 'Бытовая химия', 'box_1', 16);
-- 17. Bolalar uchun
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Bolalar uchun', 'Детские товары', 'happyemoji', 17);
-- 18. O'yinchoqlar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'O''yinchoqlar', 'Игрушки', 'game', 18);
-- 19. Kanselyariya
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Kanselyariya', 'Канцелярия', 'pen_tool', 19);
-- 20. Oziq-ovqat
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Oziq-ovqat', 'Продукты питания', 'milk', 20);
-- 21. Shirinliklar va gazaklar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Shirinliklar va gazaklar', 'Сладости и снеки', 'cake', 21);
-- 22. Ichimliklar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Ichimliklar', 'Напитки', 'cup', 22);
-- 23. Avtotovarlar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Avtotovarlar', 'Автотовары', 'car', 23);
-- 24. Sport va dam olish
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Sport va dam olish', 'Спорт и отдых', 'weight_1', 24);
-- 25. O'yin va konsol
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'O''yin va konsol', 'Игры и консоли', 'driver', 25);
-- 26. Kitoblar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Kitoblar', 'Книги', 'book', 26);
-- 27. Xobbi va ijodkorlik
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Xobbi va ijodkorlik', 'Хобби и творчество', 'colorfilter', 27);
-- 28. Uy hayvonlari
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Uy hayvonlari', 'Домашние животные', 'pet', 28);
-- 29. Bog' va tomorqa
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Bog'' va tomorqa', 'Сад и огород', 'tree', 29);
-- 30. Sovg'alar
INSERT INTO categories (id, name_uz, name_ru, icon, sort_order) VALUES
  (gen_random_uuid(), 'Sovg''alar', 'Подарки', 'gift', 30);

-- Step 5: Insert subcategories for each category
-- 1. Elektronika
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Smartfonlar', 'Смартфоны', 1),
  ('Planshetlar', 'Планшеты', 2),
  ('Quloqchinlar', 'Наушники', 3),
  ('Smart soatlar', 'Умные часы', 4),
  ('Portativ kolonkalar', 'Портативные колонки', 5),
  ('Zaryadlovchi qurilmalar', 'Зарядные устройства', 6),
  ('Telefon aksessuarlari', 'Аксессуары для телефонов', 7)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Elektronika';

-- 2. Noutbuk va kompyuter
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Noutbuklar', 'Ноутбуки', 1),
  ('Kompyuterlar', 'Компьютеры', 2),
  ('Monitorlar', 'Мониторы', 3),
  ('Komponentlar', 'Комплектующие', 4),
  ('Klaviatura va sichqoncha', 'Клавиатуры и мыши', 5),
  ('Printerlar', 'Принтеры', 6),
  ('Tarmoq jihozlari', 'Сетевое оборудование', 7)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Noutbuk va kompyuter';

-- 3. Maishiy texnika
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Kir yuvish mashinalari', 'Стиральные машины', 1),
  ('Muzlatgichlar', 'Холодильники', 2),
  ('Changyutgichlar', 'Пылесосы', 3),
  ('Konditsionerlar', 'Кондиционеры', 4),
  ('Oshxona texnikasi', 'Кухонная техника', 5),
  ('Dazmollar', 'Утюги', 6),
  ('Isitgichlar', 'Обогреватели', 7)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Maishiy texnika';

-- 4. Televizor va video
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Televizorlar', 'Телевизоры', 1),
  ('Projektorlar', 'Проекторы', 2),
  ('TV pristavkalar', 'ТВ-приставки', 3),
  ('Videokameralar', 'Видеокамеры', 4),
  ('TV aksessuarlar', 'Аксессуары для ТВ', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Televizor va video';

-- 5. Erkaklar kiyimi
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Ko''ylaklar', 'Рубашки', 1),
  ('Shimlar', 'Брюки', 2),
  ('Futbolkalar', 'Футболки', 3),
  ('Kurtkalar', 'Куртки', 4),
  ('Kostyumlar', 'Костюмы', 5),
  ('Ichki kiyimlar', 'Нижнее бельё', 6),
  ('Poyabzal', 'Обувь', 7)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Erkaklar kiyimi';

-- 6. Ayollar kiyimi
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Ko''ylaklar', 'Платья', 1),
  ('Bluzka va ko''ylaklar', 'Блузки и рубашки', 2),
  ('Shimlar va yubkalar', 'Брюки и юбки', 3),
  ('Ustki kiyim', 'Верхняя одежда', 4),
  ('Ichki kiyimlar', 'Нижнее бельё', 5),
  ('Ro''mollar va sharf', 'Платки и шарфы', 6),
  ('Poyabzal', 'Обувь', 7)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Ayollar kiyimi';

-- 7. Sumkalar va aksessuarlar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Ayollar sumkalari', 'Женские сумки', 1),
  ('Erkaklar sumkalari', 'Мужские сумки', 2),
  ('Ryukzaklar', 'Рюкзаки', 3),
  ('Hamyonlar', 'Кошельки', 4),
  ('Kamarlar', 'Ремни', 5),
  ('Chamadonlar', 'Чемоданы', 6)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Sumkalar va aksessuarlar';

-- 8. Zargarlik
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Uzuklar', 'Кольца', 1),
  ('Bo''yintuqlar', 'Ожерелья', 2),
  ('Isirg''alar', 'Серьги', 3),
  ('Bilaguzuklar', 'Браслеты', 4),
  ('Soatlar', 'Часы', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Zargarlik';

-- 9. Go'zallik
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Pardoz vositalari', 'Декоративная косметика', 1),
  ('Teri parvarishi', 'Уход за кожей', 2),
  ('Soch parvarishi', 'Уход за волосами', 3),
  ('Tirnoq parvarishi', 'Маникюр и педикюр', 4),
  ('Soch quritgichlar', 'Фены и стайлеры', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Go''zallik';

-- 10. Parfyumeriya
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Ayollar atiri', 'Женская парфюмерия', 1),
  ('Erkaklar atiri', 'Мужская парфюмерия', 2),
  ('Atir to''plamlari', 'Парфюмерные наборы', 3)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Parfyumeriya';

-- 11. Shaxsiy gigiena
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Og''iz bo''shlig''i gigienasi', 'Гигиена полости рта', 1),
  ('Tana parvarishi', 'Уход за телом', 2),
  ('Soqol parvarishi', 'Уход за бородой', 3),
  ('Ustara va malhamlar', 'Бритвы и средства для бритья', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Shaxsiy gigiena';

-- 12. Dorixona
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Vitaminlar', 'Витамины', 1),
  ('Tibbiy jihozlar', 'Медицинские приборы', 2),
  ('BADlar', 'БАДы', 3),
  ('Birinchi yordam', 'Первая помощь', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Dorixona';

-- 13. Uy buyumlari
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Uy tekstili', 'Домашний текстиль', 1),
  ('Oshxona buyumlari', 'Посуда', 2),
  ('Dekor', 'Декор', 3),
  ('Yoritish', 'Освещение', 4),
  ('Hammom buyumlari', 'Товары для ванной', 5),
  ('Saqlash va tartib', 'Хранение и порядок', 6)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Uy buyumlari';

-- 14. Mebel
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Yotoqxona', 'Спальня', 1),
  ('Yashash xonasi', 'Гостиная', 2),
  ('Oshxona mebeli', 'Кухонная мебель', 3),
  ('Ofis mebeli', 'Офисная мебель', 4),
  ('Bolalar mebeli', 'Детская мебель', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Mebel';

-- 15. Qurilish va ta'mirlash
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Asboblar', 'Инструменты', 1),
  ('Bo''yoqlar', 'Краски', 2),
  ('Santexnika', 'Сантехника', 3),
  ('Elektrika', 'Электрика', 4),
  ('Qulflar va dastaklar', 'Замки и ручки', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Qurilish va ta''mirlash';

-- 16. Maishiy kimyo
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Kir yuvish vositalari', 'Средства для стирки', 1),
  ('Tozalash vositalari', 'Средства для уборки', 2),
  ('Idish yuvish vositalari', 'Средства для мытья посуды', 3),
  ('Xushbo''ylantirgichlar', 'Освежители воздуха', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Maishiy kimyo';

-- 17. Bolalar uchun
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Bolalar kiyimi', 'Детская одежда', 1),
  ('Bolalar poyabzali', 'Детская обувь', 2),
  ('Bolalar oziq-ovqati', 'Детское питание', 3),
  ('Bolalar gigienasi', 'Детская гигиена', 4),
  ('Aravachalar', 'Коляски', 5),
  ('Bolalar xonasi', 'Детская комната', 6)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Bolalar uchun';

-- 18. O'yinchoqlar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Konstruktorlar', 'Конструкторы', 1),
  ('Qo''g''irchoqlar', 'Куклы', 2),
  ('Mashinalar', 'Машинки', 3),
  ('Stol o''yinlari', 'Настольные игры', 4),
  ('Yumshoq o''yinchoqlar', 'Мягкие игрушки', 5),
  ('Rivojlantiruvchi', 'Развивающие', 6)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'O''yinchoqlar';

-- 19. Kanselyariya
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Yozuv buyumlari', 'Письменные принадлежности', 1),
  ('Daftarlar va bloknot', 'Тетради и блокноты', 2),
  ('Maktab buyumlari', 'Школьные принадлежности', 3),
  ('Ofis buyumlari', 'Офисные принадлежности', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Kanselyariya';

-- 20. Oziq-ovqat
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Sut mahsulotlari', 'Молочные продукты', 1),
  ('Non va un mahsulotlari', 'Хлебобулочные и мука', 2),
  ('Konservalar', 'Консервы', 3),
  ('Yog'' va soslar', 'Масла и соусы', 4),
  ('Guruch va yormalar', 'Крупы и макароны', 5),
  ('Ziravorlar', 'Специи и приправы', 6)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Oziq-ovqat';

-- 21. Shirinliklar va gazaklar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Shokoladlar', 'Шоколад', 1),
  ('Konfetlar', 'Конфеты', 2),
  ('Pechenye', 'Печенье', 3),
  ('Gazaklar', 'Снеки', 4),
  ('Quritilgan mevalar', 'Сухофрукты и орехи', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Shirinliklar va gazaklar';

-- 22. Ichimliklar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Choy', 'Чай', 1),
  ('Qahva', 'Кофе', 2),
  ('Sharbat va kompotlar', 'Соки и компоты', 3),
  ('Suv', 'Вода', 4),
  ('Gazli ichimliklar', 'Газированные напитки', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Ichimliklar';

-- 23. Avtotovarlar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Ehtiyot qismlar', 'Запчасти', 1),
  ('Avto aksessuarlar', 'Аксессуары', 2),
  ('Moy va suyuqliklar', 'Масла и жидкости', 3),
  ('Shinalar va disklar', 'Шины и диски', 4),
  ('Avtoelektronika', 'Автоэлектроника', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Avtotovarlar';

-- 24. Sport va dam olish
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Sport kiyimlari', 'Спортивная одежда', 1),
  ('Sport jihozlari', 'Спортивный инвентарь', 2),
  ('Sport poyabzali', 'Спортивная обувь', 3),
  ('Velosipedlar', 'Велосипеды', 4),
  ('Turizm va yurish', 'Туризм и походы', 5),
  ('Baliq ovi', 'Рыбалка', 6)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Sport va dam olish';

-- 25. O'yin va konsol
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Konsollar', 'Консоли', 1),
  ('O''yinlar', 'Игры', 2),
  ('Geympad va aksessuarlar', 'Геймпады и аксессуары', 3),
  ('O''yin stullari', 'Игровые кресла', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'O''yin va konsol';

-- 26. Kitoblar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Badiiy adabiyot', 'Художественная литература', 1),
  ('Darsliklar', 'Учебники', 2),
  ('Bolalar kitoblari', 'Детские книги', 3),
  ('Biznes va motivatsiya', 'Бизнес и мотивация', 4),
  ('Diniy kitoblar', 'Религиозная литература', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Kitoblar';

-- 27. Xobbi va ijodkorlik
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Rassomchilik', 'Рисование', 1),
  ('Tikuvchilik', 'Шитьё', 2),
  ('Musiqa asboblari', 'Музыкальные инструменты', 3),
  ('Qo''lda ishlash', 'Рукоделие', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Xobbi va ijodkorlik';

-- 28. Uy hayvonlari
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Oziq-ovqat', 'Корм', 1),
  ('Aksessuarlar', 'Аксессуары', 2),
  ('Gigiena vositalari', 'Средства гигиены', 3),
  ('Vetapteka', 'Ветаптека', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Uy hayvonlari';

-- 29. Bog' va tomorqa
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Urug''lar va ko''chatlar', 'Семена и рассада', 1),
  ('Bog'' asboblari', 'Садовый инвентарь', 2),
  ('O''g''itlar', 'Удобрения', 3),
  ('Sug''orish tizimlari', 'Системы полива', 4),
  ('Gullar va o''simliklar', 'Цветы и растения', 5)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Bog'' va tomorqa';

-- 30. Sovg'alar
INSERT INTO subcategories (id, category_id, name_uz, name_ru, sort_order)
SELECT gen_random_uuid(), c.id, s.name_uz, s.name_ru, s.sort_order
FROM categories c, (VALUES
  ('Sovg''a to''plamlari', 'Подарочные наборы', 1),
  ('Sertifikatlar', 'Сертификаты', 2),
  ('Bayram bezaklari', 'Праздничный декор', 3),
  ('Esdalik buyumlar', 'Сувениры', 4)
) AS s(name_uz, name_ru, sort_order)
WHERE c.name_uz = 'Sovg''alar';

-- Verify
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Subcategories: ' || COUNT(*) FROM subcategories;

COMMIT;
