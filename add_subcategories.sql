-- Subkategoriyalar qo'shish
-- Har bir asosiy kategoriya uchun tegishli subkategoriyalar

-- 1. Elektronika (d12f44f3-57c2-4125-b8cc-cb17fc0fe55c)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Smartfonlar', 'Смартфоны', 1, 'd12f44f3-57c2-4125-b8cc-cb17fc0fe55c', 'smartfonlar', 'mobile', 1, true),
(gen_random_uuid(), 'Planshetlar', 'Планшеты', 1, 'd12f44f3-57c2-4125-b8cc-cb17fc0fe55c', 'planshetlar', 'tablet', 2, true),
(gen_random_uuid(), 'Quloqchinlar', 'Наушники', 1, 'd12f44f3-57c2-4125-b8cc-cb17fc0fe55c', 'quloqchinlar', 'headphones', 3, true),
(gen_random_uuid(), 'Aksessuarlar', 'Аксессуары', 1, 'd12f44f3-57c2-4125-b8cc-cb17fc0fe55c', 'aksessuarlar-elektronika', 'accessories', 4, true),
(gen_random_uuid(), 'Smart soatlar', 'Умные часы', 1, 'd12f44f3-57c2-4125-b8cc-cb17fc0fe55c', 'smart-soatlar', 'watch', 5, true);

-- 2. Noutbuklar va kompyuterlar (7c8d716e-4057-4a16-87e2-c7394bdbc0b0)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Noutbuklar', 'Ноутбуки', 1, '7c8d716e-4057-4a16-87e2-c7394bdbc0b0', 'noutbuklar', 'laptop', 1, true),
(gen_random_uuid(), 'Kompyuterlar', 'Компьютеры', 1, '7c8d716e-4057-4a16-87e2-c7394bdbc0b0', 'kompyuterlar', 'monitor', 2, true),
(gen_random_uuid(), 'Monitorlar', 'Мониторы', 1, '7c8d716e-4057-4a16-87e2-c7394bdbc0b0', 'monitorlar', 'monitor', 3, true),
(gen_random_uuid(), 'Klaviatura va sichqoncha', 'Клавиатуры и мыши', 1, '7c8d716e-4057-4a16-87e2-c7394bdbc0b0', 'klaviatura-sichqoncha', 'keyboard', 4, true),
(gen_random_uuid(), 'Printerlar', 'Принтеры', 1, '7c8d716e-4057-4a16-87e2-c7394bdbc0b0', 'printerlar', 'printer', 5, true);

-- 3. Maishiy texnika (7448eaca-ebfe-427b-97a7-34ddf044e98b)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Kir yuvish mashinalari', 'Стиральные машины', 1, '7448eaca-ebfe-427b-97a7-34ddf044e98b', 'kir-yuvish', 'washing', 1, true),
(gen_random_uuid(), 'Muzlatgichlar', 'Холодильники', 1, '7448eaca-ebfe-427b-97a7-34ddf044e98b', 'muzlatgichlar', 'fridge', 2, true),
(gen_random_uuid(), 'Changyutgichlar', 'Пылесосы', 1, '7448eaca-ebfe-427b-97a7-34ddf044e98b', 'changyutgichlar', 'vacuum', 3, true),
(gen_random_uuid(), 'Konditsionerlar', 'Кондиционеры', 1, '7448eaca-ebfe-427b-97a7-34ddf044e98b', 'konditsionerlar', 'ac', 4, true),
(gen_random_uuid(), 'Oshxona texnikasi', 'Кухонная техника', 1, '7448eaca-ebfe-427b-97a7-34ddf044e98b', 'oshxona-texnikasi', 'kitchen', 5, true);

-- 4. Televizorlar (ba386732-85e1-4c88-b431-115d6961bfe4)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'LED televizorlar', 'LED телевизоры', 1, 'ba386732-85e1-4c88-b431-115d6961bfe4', 'led-televizorlar', 'tv', 1, true),
(gen_random_uuid(), 'Smart TV', 'Smart TV', 1, 'ba386732-85e1-4c88-b431-115d6961bfe4', 'smart-tv', 'tv', 2, true),
(gen_random_uuid(), 'TV aksessuarlari', 'TV аксессуары', 1, 'ba386732-85e1-4c88-b431-115d6961bfe4', 'tv-aksessuarlari', 'accessories', 3, true);

-- 5. Kiyim-kechak (7bc76df6-eec9-4690-953b-7e0594b7df28)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Erkaklar kiyimi', 'Мужская одежда', 1, '7bc76df6-eec9-4690-953b-7e0594b7df28', 'erkaklar-kiyimi', 'shirt', 1, true),
(gen_random_uuid(), 'Ayollar kiyimi', 'Женская одежда', 1, '7bc76df6-eec9-4690-953b-7e0594b7df28', 'ayollar-kiyimi', 'dress', 2, true),
(gen_random_uuid(), 'Bolalar kiyimi', 'Детская одежда', 1, '7bc76df6-eec9-4690-953b-7e0594b7df28', 'bolalar-kiyimi', 'baby', 3, true),
(gen_random_uuid(), 'Oyoq kiyimi', 'Обувь', 1, '7bc76df6-eec9-4690-953b-7e0594b7df28', 'oyoq-kiyimi', 'shoe', 4, true),
(gen_random_uuid(), 'Sport kiyimlari', 'Спортивная одежда', 1, '7bc76df6-eec9-4690-953b-7e0594b7df28', 'sport-kiyimlari', 'sport', 5, true);

-- 6. Sumkalar (92fa7ee6-99b2-46a4-9acc-e3b2501d2e39)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Ayollar sumkalari', 'Женские сумки', 1, '92fa7ee6-99b2-46a4-9acc-e3b2501d2e39', 'ayollar-sumkalari', 'bag', 1, true),
(gen_random_uuid(), 'Erkaklar sumkalari', 'Мужские сумки', 1, '92fa7ee6-99b2-46a4-9acc-e3b2501d2e39', 'erkaklar-sumkalari', 'bag', 2, true),
(gen_random_uuid(), 'Ryukzaklar', 'Рюкзаки', 1, '92fa7ee6-99b2-46a4-9acc-e3b2501d2e39', 'ryukzaklar', 'backpack', 3, true),
(gen_random_uuid(), 'Chamadonlar', 'Чемоданы', 1, '92fa7ee6-99b2-46a4-9acc-e3b2501d2e39', 'chamadonlar', 'luggage', 4, true);

-- 7. Zargarlik buyumlari (c15e3b3d-2837-47b0-8fe9-90d11378092e)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Uzuklar', 'Кольца', 1, 'c15e3b3d-2837-47b0-8fe9-90d11378092e', 'uzuklar', 'ring', 1, true),
(gen_random_uuid(), 'Marjonlar', 'Ожерелья', 1, 'c15e3b3d-2837-47b0-8fe9-90d11378092e', 'marjonlar', 'necklace', 2, true),
(gen_random_uuid(), 'Sirg''alar', 'Серьги', 1, 'c15e3b3d-2837-47b0-8fe9-90d11378092e', 'sirgalar', 'earring', 3, true),
(gen_random_uuid(), 'Bilaguzuklar', 'Браслеты', 1, 'c15e3b3d-2837-47b0-8fe9-90d11378092e', 'bilaguzuklar', 'bracelet', 4, true),
(gen_random_uuid(), 'Soatlar', 'Часы', 1, 'c15e3b3d-2837-47b0-8fe9-90d11378092e', 'soatlar', 'watch', 5, true);

-- 8. Go'zallik (1484851a-b236-44cc-929a-cd82c7ef20d5)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Yuz parvarishi', 'Уход за лицом', 1, '1484851a-b236-44cc-929a-cd82c7ef20d5', 'yuz-parvarishi', 'face', 1, true),
(gen_random_uuid(), 'Pardoz', 'Макияж', 1, '1484851a-b236-44cc-929a-cd82c7ef20d5', 'pardoz', 'makeup', 2, true),
(gen_random_uuid(), 'Tirnoq parvarishi', 'Уход за ногтями', 1, '1484851a-b236-44cc-929a-cd82c7ef20d5', 'tirnoq-parvarishi', 'nailpolish', 3, true),
(gen_random_uuid(), 'Soch parvarishi', 'Уход за волосами', 1, '1484851a-b236-44cc-929a-cd82c7ef20d5', 'soch-parvarishi', 'hair', 4, true);

-- 9. Parfyumeriya (ae88d374-29ca-4748-9886-f261dbac2db9)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Erkaklar atiri', 'Мужская парфюмерия', 1, 'ae88d374-29ca-4748-9886-f261dbac2db9', 'erkaklar-atiri', 'perfume', 1, true),
(gen_random_uuid(), 'Ayollar atiri', 'Женская парфюмерия', 1, 'ae88d374-29ca-4748-9886-f261dbac2db9', 'ayollar-atiri', 'perfume', 2, true),
(gen_random_uuid(), 'Unisex atirlar', 'Унисекс парфюмерия', 1, 'ae88d374-29ca-4748-9886-f261dbac2db9', 'unisex-atirlar', 'perfume', 3, true);

-- 10. Gigiena (68e56b35-e069-4fe2-99d6-ee3eef9afe92)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Tana parvarishi', 'Уход за телом', 1, '68e56b35-e069-4fe2-99d6-ee3eef9afe92', 'tana-parvarishi', 'body', 1, true),
(gen_random_uuid(), 'Og''iz bo''shlig''i', 'Гигиена полости рта', 1, '68e56b35-e069-4fe2-99d6-ee3eef9afe92', 'ogiz-boshligi', 'dental', 2, true),
(gen_random_uuid(), 'Soqol parvarishi', 'Уход за бородой', 1, '68e56b35-e069-4fe2-99d6-ee3eef9afe92', 'soqol-parvarishi', 'beard', 3, true);

-- 11. Dorixona (ae71dcb4-f40b-4f04-aa8b-f5eb6ebb922f)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Vitaminlar', 'Витамины', 1, 'ae71dcb4-f40b-4f04-aa8b-f5eb6ebb922f', 'vitaminlar', 'vitamin', 1, true),
(gen_random_uuid(), 'BADlar', 'БАДы', 1, 'ae71dcb4-f40b-4f04-aa8b-f5eb6ebb922f', 'badlar', 'supplement', 2, true),
(gen_random_uuid(), 'Tibbiy asboblar', 'Медицинские приборы', 1, 'ae71dcb4-f40b-4f04-aa8b-f5eb6ebb922f', 'tibbiy-asboblar', 'medical', 3, true);

-- 12. Uy va bog' (9be23480-ecfa-4831-9f1e-d7cceb073980)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Uy to''plamlari', 'Домашний текстиль', 1, '9be23480-ecfa-4831-9f1e-d7cceb073980', 'uy-toplamlari', 'textile', 1, true),
(gen_random_uuid(), 'Oshxona anjomlari', 'Посуда', 1, '9be23480-ecfa-4831-9f1e-d7cceb073980', 'oshxona-anjomlari', 'kitchen', 2, true),
(gen_random_uuid(), 'Yoritish', 'Освещение', 1, '9be23480-ecfa-4831-9f1e-d7cceb073980', 'yoritish', 'lamp', 3, true),
(gen_random_uuid(), 'Bog'' asboblari', 'Садовые инструменты', 1, '9be23480-ecfa-4831-9f1e-d7cceb073980', 'bog-asboblari', 'garden', 4, true);

-- 13. Mebel (06dbe23c-38ce-41dc-879e-4f742eaa34e8)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Divan va kreslolar', 'Диваны и кресла', 1, '06dbe23c-38ce-41dc-879e-4f742eaa34e8', 'divanlar', 'sofa', 1, true),
(gen_random_uuid(), 'Yotoq mebellari', 'Спальная мебель', 1, '06dbe23c-38ce-41dc-879e-4f742eaa34e8', 'yotoq-mebellari', 'bed', 2, true),
(gen_random_uuid(), 'Ish stollari', 'Рабочие столы', 1, '06dbe23c-38ce-41dc-879e-4f742eaa34e8', 'ish-stollari', 'desk', 3, true),
(gen_random_uuid(), 'Shkaflar', 'Шкафы', 1, '06dbe23c-38ce-41dc-879e-4f742eaa34e8', 'shkaflar', 'wardrobe', 4, true);

-- 14. Qurilish va tamirlash (ebbbae1f-5363-47aa-8aac-7f0ebb64fe55)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Asbob-uskunalar', 'Инструменты', 1, 'ebbbae1f-5363-47aa-8aac-7f0ebb64fe55', 'asbob-uskunalar', 'tools', 1, true),
(gen_random_uuid(), 'Elektr jihozlari', 'Электрооборудование', 1, 'ebbbae1f-5363-47aa-8aac-7f0ebb64fe55', 'elektr-jihozlari', 'electric', 2, true),
(gen_random_uuid(), 'Santexnika', 'Сантехника', 1, 'ebbbae1f-5363-47aa-8aac-7f0ebb64fe55', 'santexnika', 'plumbing', 3, true),
(gen_random_uuid(), 'Bo''yoq va qoplamalar', 'Краски и покрытия', 1, 'ebbbae1f-5363-47aa-8aac-7f0ebb64fe55', 'boyoq-qoplamalar', 'paint', 4, true);

-- 15. Uy kimyoviy moddalar (076fd357-bdd1-4d3a-8ac1-14fda8b8ae50)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Kir yuvish vositalari', 'Средства для стирки', 1, '076fd357-bdd1-4d3a-8ac1-14fda8b8ae50', 'kir-yuvish-vositalari', 'laundry', 1, true),
(gen_random_uuid(), 'Tozalash vositalari', 'Чистящие средства', 1, '076fd357-bdd1-4d3a-8ac1-14fda8b8ae50', 'tozalash-vositalari', 'cleaning', 2, true),
(gen_random_uuid(), 'Idish yuvish vositalari', 'Средства для мытья посуды', 1, '076fd357-bdd1-4d3a-8ac1-14fda8b8ae50', 'idish-yuvish', 'dishwash', 3, true);

-- 16. Bolalar uchun (7d24469a-709f-46ef-8ac4-ece591336d2d)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Bolalar oziq-ovqat', 'Детское питание', 1, '7d24469a-709f-46ef-8ac4-ece591336d2d', 'bolalar-oziq-ovqat', 'babyfood', 1, true),
(gen_random_uuid(), 'Tagliklar', 'Подгузники', 1, '7d24469a-709f-46ef-8ac4-ece591336d2d', 'tagliklar', 'diaper', 2, true),
(gen_random_uuid(), 'Bolalar gigienasi', 'Детская гигиена', 1, '7d24469a-709f-46ef-8ac4-ece591336d2d', 'bolalar-gigienasi', 'babyhygiene', 3, true),
(gen_random_uuid(), 'Bolalar mebeli', 'Детская мебель', 1, '7d24469a-709f-46ef-8ac4-ece591336d2d', 'bolalar-mebeli', 'babyfurniture', 4, true);

-- 17. O'yinchoqlar (e97fca6d-e354-4345-82f7-c54dad4c3dd3)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Qo''g''irchoqlar', 'Куклы', 1, 'e97fca6d-e354-4345-82f7-c54dad4c3dd3', 'qogirchoqlar', 'doll', 1, true),
(gen_random_uuid(), 'Konstruktorlar', 'Конструкторы', 1, 'e97fca6d-e354-4345-82f7-c54dad4c3dd3', 'konstruktorlar', 'constructor', 2, true),
(gen_random_uuid(), 'Mashinalar', 'Машинки', 1, 'e97fca6d-e354-4345-82f7-c54dad4c3dd3', 'mashinalar', 'car', 3, true),
(gen_random_uuid(), 'Rivojlantiruvchi o''yinlar', 'Развивающие игры', 1, 'e97fca6d-e354-4345-82f7-c54dad4c3dd3', 'rivojlantiruvchi-oyinlar', 'puzzle', 4, true);

-- 18. Maktab va ofis (32e34988-7af1-480c-b99b-32113e2e0181)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Yozuv-chizuv', 'Канцелярия', 1, '32e34988-7af1-480c-b99b-32113e2e0181', 'yozuv-chizuv', 'pen', 1, true),
(gen_random_uuid(), 'Ofis texnikasi', 'Оргтехника', 1, '32e34988-7af1-480c-b99b-32113e2e0181', 'ofis-texnikasi', 'office', 2, true),
(gen_random_uuid(), 'Daftarlar va kitoblar', 'Тетради и книги', 1, '32e34988-7af1-480c-b99b-32113e2e0181', 'daftarlar-kitoblar', 'book', 3, true);

-- 19. Oziq-ovqat (c1612e63-842a-4990-b62d-92ddba607169)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Non va un mahsulotlari', 'Хлеб и мучные', 1, 'c1612e63-842a-4990-b62d-92ddba607169', 'non-un-mahsulotlari', 'bread', 1, true),
(gen_random_uuid(), 'Sut mahsulotlari', 'Молочные продукты', 1, 'c1612e63-842a-4990-b62d-92ddba607169', 'sut-mahsulotlari', 'dairy', 2, true),
(gen_random_uuid(), 'Go''sht va kolbasa', 'Мясо и колбаса', 1, 'c1612e63-842a-4990-b62d-92ddba607169', 'gosht-kolbasa', 'meat', 3, true),
(gen_random_uuid(), 'Konservalar', 'Консервы', 1, 'c1612e63-842a-4990-b62d-92ddba607169', 'konservalar', 'canned', 4, true),
(gen_random_uuid(), 'Yog'' va soslar', 'Масла и соусы', 1, 'c1612e63-842a-4990-b62d-92ddba607169', 'yog-soslar', 'oil', 5, true);

-- 20. Shirinliklar (011e57b4-5193-4749-9ea9-183c8f1393fd)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Shokolad', 'Шоколад', 1, '011e57b4-5193-4749-9ea9-183c8f1393fd', 'shokolad', 'chocolate', 1, true),
(gen_random_uuid(), 'Pechene va tort', 'Печенье и торты', 1, '011e57b4-5193-4749-9ea9-183c8f1393fd', 'pechene-tort', 'cake', 2, true),
(gen_random_uuid(), 'Konfetlar', 'Конфеты', 1, '011e57b4-5193-4749-9ea9-183c8f1393fd', 'konfetlar', 'candy', 3, true);

-- 21. Ichimliklar (b8c8d4e5-3f57-488c-8153-e462ca463873)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Suv', 'Вода', 1, 'b8c8d4e5-3f57-488c-8153-e462ca463873', 'suv', 'water', 1, true),
(gen_random_uuid(), 'Sharbatlar', 'Соки', 1, 'b8c8d4e5-3f57-488c-8153-e462ca463873', 'sharbatlar', 'juice', 2, true),
(gen_random_uuid(), 'Choy va qahva', 'Чай и кофе', 1, 'b8c8d4e5-3f57-488c-8153-e462ca463873', 'choy-qahva', 'coffee', 3, true);

-- 22. Avtomobil uchun (49027125-a579-4e1d-8557-a942dd1a25aa)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Avtomobil aksessuarlari', 'Автоаксессуары', 1, '49027125-a579-4e1d-8557-a942dd1a25aa', 'avto-aksessuarlar', 'caraccessory', 1, true),
(gen_random_uuid(), 'Ehtiyot qismlar', 'Запчасти', 1, '49027125-a579-4e1d-8557-a942dd1a25aa', 'ehtiyot-qismlar', 'carparts', 2, true),
(gen_random_uuid(), 'Avto kimyo', 'Автохимия', 1, '49027125-a579-4e1d-8557-a942dd1a25aa', 'avto-kimyo', 'carchemical', 3, true),
(gen_random_uuid(), 'Shinalar', 'Шины', 1, '49027125-a579-4e1d-8557-a942dd1a25aa', 'shinalar', 'tire', 4, true);

-- 23. Sport va dam olish (4868ceda-861e-4d1c-b088-378d1701841f)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Sport anjomlari', 'Спортивный инвентарь', 1, '4868ceda-861e-4d1c-b088-378d1701841f', 'sport-anjomlari', 'dumbbell', 1, true),
(gen_random_uuid(), 'Velosipedlar', 'Велосипеды', 1, '4868ceda-861e-4d1c-b088-378d1701841f', 'velosipedlar', 'bicycle', 2, true),
(gen_random_uuid(), 'Turizm', 'Туризм', 1, '4868ceda-861e-4d1c-b088-378d1701841f', 'turizm', 'tent', 3, true),
(gen_random_uuid(), 'Baliq ovi', 'Рыбалка', 1, '4868ceda-861e-4d1c-b088-378d1701841f', 'baliq-ovi', 'fishing', 4, true);

-- 24. Hayvonlar uchun (23637383-30cf-4d3a-b770-cc4749d97099)
INSERT INTO categories (id, name_uz, name_ru, level, parent_id, slug, icon, sort_order, is_active) VALUES
(gen_random_uuid(), 'Yem-xashak', 'Корма', 1, '23637383-30cf-4d3a-b770-cc4749d97099', 'yem-xashak', 'petfood', 1, true),
(gen_random_uuid(), 'Aksessuarlar', 'Аксессуары', 1, '23637383-30cf-4d3a-b770-cc4749d97099', 'hayvon-aksessuarlari', 'petaccessory', 2, true),
(gen_random_uuid(), 'Gigiena va parvarish', 'Гигиена и уход', 1, '23637383-30cf-4d3a-b770-cc4749d97099', 'hayvon-gigienasi', 'pethygiene', 3, true);

-- Redis cache tozalash haqida eslatma:
-- Bu INSERT lardan keyin redis cache ni tozalash kerak: docker exec topla-redis redis-cli FLUSHDB
