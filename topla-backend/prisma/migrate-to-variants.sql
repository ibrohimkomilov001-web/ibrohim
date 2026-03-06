-- Backward compatibility migration: Convert existing products with colorId to ProductVariant records
-- Run this AFTER the main variant migration (20260304120000_add_product_variants_and_sizes)

-- Step 1: Create ProductVariant records for products that have a colorId
INSERT INTO "product_variants" (
  "id",
  "product_id",
  "color_id",
  "size_id",
  "price",
  "compare_at_price",
  "stock",
  "sku",
  "images",
  "is_active",
  "sort_order",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  p."id",
  p."color_id",
  NULL,
  p."price",
  p."original_price",
  p."stock",
  p."sku",
  p."images",
  p."is_active",
  0,
  NOW(),
  NOW()
FROM "products" p
WHERE p."color_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "product_variants" pv WHERE pv."product_id" = p."id"
  );

-- Step 2: Mark those products as having variants
UPDATE "products"
SET "has_variants" = true
WHERE "color_id" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "product_variants" pv WHERE pv."product_id" = "products"."id"
  );

-- Step 3: Seed common sizes (clothing + shoes)
INSERT INTO "sizes" ("id", "name_uz", "name_ru", "sort_order") VALUES
  (gen_random_uuid(), 'XS',  'XS',  1),
  (gen_random_uuid(), 'S',   'S',   2),
  (gen_random_uuid(), 'M',   'M',   3),
  (gen_random_uuid(), 'L',   'L',   4),
  (gen_random_uuid(), 'XL',  'XL',  5),
  (gen_random_uuid(), 'XXL', 'XXL', 6),
  (gen_random_uuid(), '36',  '36',  10),
  (gen_random_uuid(), '37',  '37',  11),
  (gen_random_uuid(), '38',  '38',  12),
  (gen_random_uuid(), '39',  '39',  13),
  (gen_random_uuid(), '40',  '40',  14),
  (gen_random_uuid(), '41',  '41',  15),
  (gen_random_uuid(), '42',  '42',  16),
  (gen_random_uuid(), '43',  '43',  17),
  (gen_random_uuid(), '44',  '44',  18),
  (gen_random_uuid(), '45',  '45',  19)
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'Products with variants:' AS info, COUNT(*) AS count FROM "products" WHERE "has_variants" = true;
SELECT 'Total product variants:' AS info, COUNT(*) AS count FROM "product_variants";
SELECT 'Total sizes:' AS info, COUNT(*) AS count FROM "sizes";
