-- ====================================================================
-- MERGE MIGRATION: Consolidate 30 L0 → 22 L0 categories
-- 5 merge groups, executed in a single transaction
-- Actual DB columns: id, name_uz, name_ru, icon, image_url,
--   sort_order, is_active, parent_id, level, slug
-- ====================================================================
BEGIN;

-- ====================================================================
-- 1. KIYIMLAR — New L0, merge Erkaklar kiyimi + Ayollar kiyimi
-- ====================================================================

INSERT INTO categories (id, name_uz, name_ru, icon, slug, level, sort_order)
VALUES (
  gen_random_uuid(),
  'Kiyimlar',
  'Одежда',
  'shirt',
  'kiyimlar',
  0, 5
);

-- Children of Erkaklar kiyimi: L1 → L2, prepend slug
UPDATE categories
SET level = 2,
    slug = 'kiyimlar-' || slug
WHERE parent_id = '785735bf-0b61-4eeb-aec7-28015f3881c9';

-- Children of Ayollar kiyimi: L1 → L2, prepend slug
UPDATE categories
SET level = 2,
    slug = 'kiyimlar-' || slug
WHERE parent_id = '26ba384b-e2e8-4d13-acd0-4e5728e971b0';

-- Erkaklar kiyimi: L0 → L1 under Kiyimlar
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'kiyimlar' AND level = 0),
    level = 1,
    slug = 'kiyimlar-erkaklar-kiyimi',
    sort_order = 1
WHERE id = '785735bf-0b61-4eeb-aec7-28015f3881c9';

-- Ayollar kiyimi: L0 → L1 under Kiyimlar
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'kiyimlar' AND level = 0),
    level = 1,
    slug = 'kiyimlar-ayollar-kiyimi',
    sort_order = 2
WHERE id = '26ba384b-e2e8-4d13-acd0-4e5728e971b0';


-- ====================================================================
-- 2. ELEKTRONIKA — Merge Noutbuk va kompyuter under Elektronika
-- ====================================================================

-- Children of Noutbuk va kompyuter: L1 → L2, prepend slug
UPDATE categories
SET level = 2,
    slug = 'elektronika-' || slug
WHERE parent_id = '00af698a-124b-4290-b34d-5cd8699dd057';

-- Noutbuk va kompyuter: L0 → L1 under Elektronika
UPDATE categories
SET parent_id = '783fa8f3-a256-404e-a62d-3a53821c85d6',
    level = 1,
    slug = 'elektronika-noutbuk-va-kompyuter',
    sort_order = 8
WHERE id = '00af698a-124b-4290-b34d-5cd8699dd057';


-- ====================================================================
-- 3. BOLALAR UCHUN — Merge O'yinchoqlar under Bolalar uchun
-- ====================================================================

-- Children of O'yinchoqlar: L1 → L2, prepend slug
UPDATE categories
SET level = 2,
    slug = 'bolalar-uchun-' || slug
WHERE parent_id = '30181895-2b81-46e9-8957-e9d2a1c30195';

-- O'yinchoqlar: L0 → L1 under Bolalar uchun
UPDATE categories
SET parent_id = '1886325c-be24-4623-a638-b09710ec3671',
    level = 1,
    slug = 'bolalar-uchun-oyinchoqlar',
    sort_order = 7
WHERE id = '30181895-2b81-46e9-8957-e9d2a1c30195';


-- ====================================================================
-- 4. OZIQ-OVQAT — Merge Shirinliklar va gazaklar + Ichimliklar
-- ====================================================================

-- Children of Shirinliklar va gazaklar: L1 → L2, prepend slug
UPDATE categories
SET level = 2,
    slug = 'oziq-ovqat-' || slug
WHERE parent_id = '5d7162f8-59bb-4a06-9ab7-03a55efe42a5';

-- Children of Ichimliklar: L1 → L2, prepend slug
UPDATE categories
SET level = 2,
    slug = 'oziq-ovqat-' || slug
WHERE parent_id = 'ef6c9f01-329e-4946-8e3f-b6e9fd56bdef';

-- Shirinliklar va gazaklar: L0 → L1 under Oziq-ovqat
UPDATE categories
SET parent_id = '2a7b17a9-07f1-4e5f-9af6-41b06f48173b',
    level = 1,
    slug = 'oziq-ovqat-shirinliklar-va-gazaklar',
    sort_order = 7
WHERE id = '5d7162f8-59bb-4a06-9ab7-03a55efe42a5';

-- Ichimliklar: L0 → L1 under Oziq-ovqat
UPDATE categories
SET parent_id = '2a7b17a9-07f1-4e5f-9af6-41b06f48173b',
    level = 1,
    slug = 'oziq-ovqat-ichimliklar',
    sort_order = 8
WHERE id = 'ef6c9f01-329e-4946-8e3f-b6e9fd56bdef';


-- ====================================================================
-- 5. GO'ZALLIK VA SALOMATLIK — New L0, merge 4 beauty/health cats
-- ====================================================================

INSERT INTO categories (id, name_uz, name_ru, icon, slug, level, sort_order)
VALUES (
  gen_random_uuid(),
  'Go''zallik va salomatlik',
  'Красота и здоровье',
  'magic_star',
  'gozallik-va-salomatlik',
  0, 9
);

-- Children of Go'zallik: L1 → L2
UPDATE categories
SET level = 2,
    slug = 'gozallik-va-salomatlik-' || slug
WHERE parent_id = '8a0b057b-22d6-46ff-8014-e064c2941cfb';

-- Children of Parfyumeriya: L1 → L2
UPDATE categories
SET level = 2,
    slug = 'gozallik-va-salomatlik-' || slug
WHERE parent_id = 'e9e7ddc4-bab8-4d9d-aae2-464bd2ca95ab';

-- Children of Shaxsiy gigiena: L1 → L2
UPDATE categories
SET level = 2,
    slug = 'gozallik-va-salomatlik-' || slug
WHERE parent_id = '55b84906-ad55-4514-ac56-6a71a21036fe';

-- Children of Dorixona: L1 → L2
UPDATE categories
SET level = 2,
    slug = 'gozallik-va-salomatlik-' || slug
WHERE parent_id = '76974de0-0950-4f79-bdf6-c8bf4c7eb35f';

-- Go'zallik → L1
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'gozallik-va-salomatlik' AND level = 0),
    level = 1,
    slug = 'gozallik-va-salomatlik-gozallik',
    sort_order = 1
WHERE id = '8a0b057b-22d6-46ff-8014-e064c2941cfb';

-- Parfyumeriya → L1
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'gozallik-va-salomatlik' AND level = 0),
    level = 1,
    slug = 'gozallik-va-salomatlik-parfyumeriya',
    sort_order = 2
WHERE id = 'e9e7ddc4-bab8-4d9d-aae2-464bd2ca95ab';

-- Shaxsiy gigiena → L1
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'gozallik-va-salomatlik' AND level = 0),
    level = 1,
    slug = 'gozallik-va-salomatlik-shaxsiy-gigiena',
    sort_order = 3
WHERE id = '55b84906-ad55-4514-ac56-6a71a21036fe';

-- Dorixona → L1
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'gozallik-va-salomatlik' AND level = 0),
    level = 1,
    slug = 'gozallik-va-salomatlik-dorixona',
    sort_order = 4
WHERE id = '76974de0-0950-4f79-bdf6-c8bf4c7eb35f';


-- ====================================================================
-- 6. REASSIGN L0 SORT ORDERS (1–22)
-- ====================================================================

UPDATE categories SET sort_order = 1  WHERE slug = 'elektronika' AND level = 0;
UPDATE categories SET sort_order = 2  WHERE slug = 'maishiy-texnika' AND level = 0;
UPDATE categories SET sort_order = 3  WHERE slug = 'televizor-va-video' AND level = 0;
UPDATE categories SET sort_order = 4  WHERE slug = 'kiyimlar' AND level = 0;
UPDATE categories SET sort_order = 5  WHERE slug = 'sumkalar-va-aksessuarlar' AND level = 0;
UPDATE categories SET sort_order = 6  WHERE slug = 'zargarlik' AND level = 0;
UPDATE categories SET sort_order = 7  WHERE slug = 'gozallik-va-salomatlik' AND level = 0;
UPDATE categories SET sort_order = 8  WHERE slug = 'uy-buyumlari' AND level = 0;
UPDATE categories SET sort_order = 9  WHERE slug = 'mebel' AND level = 0;
UPDATE categories SET sort_order = 10 WHERE slug = 'qurilish-va-tamirlash' AND level = 0;
UPDATE categories SET sort_order = 11 WHERE slug = 'maishiy-kimyo' AND level = 0;
UPDATE categories SET sort_order = 12 WHERE slug = 'bolalar-uchun' AND level = 0;
UPDATE categories SET sort_order = 13 WHERE slug = 'kanselyariya' AND level = 0;
UPDATE categories SET sort_order = 14 WHERE slug = 'oziq-ovqat' AND level = 0;
UPDATE categories SET sort_order = 15 WHERE slug = 'avtotovarlar' AND level = 0;
UPDATE categories SET sort_order = 16 WHERE slug = 'sport-va-dam-olish' AND level = 0;
UPDATE categories SET sort_order = 17 WHERE slug = 'oyin-va-konsol' AND level = 0;
UPDATE categories SET sort_order = 18 WHERE slug = 'kitoblar' AND level = 0;
UPDATE categories SET sort_order = 19 WHERE slug = 'xobbi-va-ijodkorlik' AND level = 0;
UPDATE categories SET sort_order = 20 WHERE slug = 'uy-hayvonlari' AND level = 0;
UPDATE categories SET sort_order = 21 WHERE slug = 'bog-va-tomorqa' AND level = 0;
UPDATE categories SET sort_order = 22 WHERE slug = 'sovgalar' AND level = 0;


-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

SELECT '--- L0 Categories (should be 22) ---' AS info;
SELECT id, name_uz, slug, level, sort_order
FROM categories WHERE level = 0 ORDER BY sort_order;

SELECT '--- Counts by level ---' AS info;
SELECT level, COUNT(*) AS count FROM categories GROUP BY level ORDER BY level;

SELECT '--- Merged trees ---' AS info;
SELECT p.name_uz AS parent, c.name_uz AS child, c.level, c.slug
FROM categories c
JOIN categories p ON c.parent_id = p.id
WHERE p.slug IN ('kiyimlar', 'gozallik-va-salomatlik')
   OR (p.slug = 'elektronika' AND c.slug LIKE 'elektronika-noutbuk%')
   OR (p.slug = 'bolalar-uchun' AND c.slug LIKE 'bolalar-uchun-oyinchoqlar%')
   OR (p.slug IN ('oziq-ovqat-shirinliklar-va-gazaklar', 'oziq-ovqat-ichimliklar'))
ORDER BY p.name_uz, c.sort_order;

COMMIT;
