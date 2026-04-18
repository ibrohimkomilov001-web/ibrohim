-- Multi-Attribute Variant System (Yandex-style)
-- Yangi atributlar: Rang × Xotira × RAM × Material × ...

-- ============================================
-- 1. Enum: OptionDisplayType
-- ============================================
CREATE TYPE "OptionDisplayType" AS ENUM ('color', 'text', 'image');

-- ============================================
-- 2. product_option_types
-- ============================================
CREATE TABLE "product_option_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "name_uz" TEXT NOT NULL,
  "name_ru" TEXT NOT NULL,
  "display_type" "OptionDisplayType" NOT NULL DEFAULT 'text',
  "unit" TEXT,
  "is_global" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_option_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_option_types_slug_key" ON "product_option_types"("slug");
CREATE INDEX "product_option_types_is_active_sort_order_idx" ON "product_option_types"("is_active", "sort_order");

-- ============================================
-- 3. product_option_values
-- ============================================
CREATE TABLE "product_option_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "option_type_id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "value_uz" TEXT NOT NULL,
  "value_ru" TEXT NOT NULL,
  "hex_code" TEXT,
  "image_url" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_option_values_option_type_id_slug_key" ON "product_option_values"("option_type_id", "slug");
CREATE INDEX "product_option_values_option_type_id_is_active_sort_order_idx" ON "product_option_values"("option_type_id", "is_active", "sort_order");

ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_type_id_fkey"
  FOREIGN KEY ("option_type_id") REFERENCES "product_option_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 4. product_option_links (product ↔ option_type)
-- ============================================
CREATE TABLE "product_option_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "option_type_id" UUID NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_option_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_option_links_product_id_option_type_id_key" ON "product_option_links"("product_id", "option_type_id");
CREATE INDEX "product_option_links_product_id_sort_order_idx" ON "product_option_links"("product_id", "sort_order");

ALTER TABLE "product_option_links" ADD CONSTRAINT "product_option_links_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_option_links" ADD CONSTRAINT "product_option_links_option_type_id_fkey"
  FOREIGN KEY ("option_type_id") REFERENCES "product_option_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 5. product_variant_values (variant ↔ option_value junction)
-- ============================================
CREATE TABLE "product_variant_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "variant_id" UUID NOT NULL,
  "option_type_id" UUID NOT NULL,
  "option_value_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_variant_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_variant_values_variant_id_option_type_id_key" ON "product_variant_values"("variant_id", "option_type_id");
CREATE INDEX "product_variant_values_option_value_id_idx" ON "product_variant_values"("option_value_id");

ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_option_type_id_fkey"
  FOREIGN KEY ("option_type_id") REFERENCES "product_option_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_option_value_id_fkey"
  FOREIGN KEY ("option_value_id") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 6. products: default_variant_id
-- ============================================
ALTER TABLE "products" ADD COLUMN "default_variant_id" UUID;

ALTER TABLE "products" ADD CONSTRAINT "products_default_variant_id_fkey"
  FOREIGN KEY ("default_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- 7. DATA MIGRATION: seed global option types from existing Color & Size
-- ============================================

-- 7a. Create global option types: Rang va O'lcham
INSERT INTO "product_option_types" ("id", "slug", "name_uz", "name_ru", "display_type", "is_global", "sort_order", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'color',   'Rang',     'Цвет',          'color', true, 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'size',    'O''lcham', 'Размер',        'text',  true, 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'storage', 'Xotira',   'Память',        'text',  true, 3, true, NOW(), NOW()),
  (gen_random_uuid(), 'ram',     'RAM',      'Оперативная память', 'text', true, 4, true, NOW(), NOW()),
  (gen_random_uuid(), 'material', 'Material', 'Материал',     'text',  true, 5, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 7b. Seed option values from existing Color table
INSERT INTO "product_option_values" ("id", "option_type_id", "slug", "value_uz", "value_ru", "hex_code", "sort_order", "is_active", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "product_option_types" WHERE slug = 'color'),
  -- slug = lowercased name_uz, spaces -> dashes
  LOWER(REGEXP_REPLACE(c."name_uz", '\s+', '-', 'g')),
  c."name_uz",
  c."name_ru",
  c."hex_code",
  c."sort_order",
  true,
  NOW(),
  NOW()
FROM "colors" c
ON CONFLICT ("option_type_id", "slug") DO NOTHING;

-- 7c. Seed option values from existing Size table
INSERT INTO "product_option_values" ("id", "option_type_id", "slug", "value_uz", "value_ru", "sort_order", "is_active", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  (SELECT id FROM "product_option_types" WHERE slug = 'size'),
  LOWER(REGEXP_REPLACE(s."name_uz", '\s+', '-', 'g')),
  s."name_uz",
  s."name_ru",
  s."sort_order",
  true,
  NOW(),
  NOW()
FROM "sizes" s
ON CONFLICT ("option_type_id", "slug") DO NOTHING;

-- 7d. For existing ProductVariants with colorId: create ProductVariantValue rows
INSERT INTO "product_variant_values" ("id", "variant_id", "option_type_id", "option_value_id", "created_at")
SELECT
  gen_random_uuid(),
  pv.id,
  (SELECT id FROM "product_option_types" WHERE slug = 'color'),
  ov.id,
  NOW()
FROM "product_variants" pv
JOIN "colors" c ON c.id = pv.color_id
JOIN "product_option_values" ov
  ON ov.option_type_id = (SELECT id FROM "product_option_types" WHERE slug = 'color')
  AND ov.value_uz = c.name_uz
WHERE pv.color_id IS NOT NULL
ON CONFLICT ("variant_id", "option_type_id") DO NOTHING;

-- 7e. For existing ProductVariants with sizeId: create ProductVariantValue rows
INSERT INTO "product_variant_values" ("id", "variant_id", "option_type_id", "option_value_id", "created_at")
SELECT
  gen_random_uuid(),
  pv.id,
  (SELECT id FROM "product_option_types" WHERE slug = 'size'),
  ov.id,
  NOW()
FROM "product_variants" pv
JOIN "sizes" s ON s.id = pv.size_id
JOIN "product_option_values" ov
  ON ov.option_type_id = (SELECT id FROM "product_option_types" WHERE slug = 'size')
  AND ov.value_uz = s.name_uz
WHERE pv.size_id IS NOT NULL
ON CONFLICT ("variant_id", "option_type_id") DO NOTHING;

-- 7f. For each product with variants, create ProductOptionLink rows
-- Color link
INSERT INTO "product_option_links" ("id", "product_id", "option_type_id", "sort_order", "created_at")
SELECT DISTINCT
  gen_random_uuid(),
  pv.product_id,
  (SELECT id FROM "product_option_types" WHERE slug = 'color'),
  1,
  NOW()
FROM "product_variants" pv
WHERE pv.color_id IS NOT NULL
ON CONFLICT ("product_id", "option_type_id") DO NOTHING;

-- Size link
INSERT INTO "product_option_links" ("id", "product_id", "option_type_id", "sort_order", "created_at")
SELECT DISTINCT
  gen_random_uuid(),
  pv.product_id,
  (SELECT id FROM "product_option_types" WHERE slug = 'size'),
  2,
  NOW()
FROM "product_variants" pv
WHERE pv.size_id IS NOT NULL
ON CONFLICT ("product_id", "option_type_id") DO NOTHING;
