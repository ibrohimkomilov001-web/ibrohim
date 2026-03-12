-- ============================================
-- Migration: Convert 2-level categories + subcategories
-- to self-referencing 3-level Category tree
-- ============================================
-- Run this BEFORE prisma migrate dev
-- It preserves all existing data and product relationships

BEGIN;

-- Step 1: Add new columns to categories table
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" UUID;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Step 2: Set level=0 for all existing categories (they are L0 root categories)
UPDATE "categories" SET "level" = 0;

-- Step 3: Insert subcategories into categories table as level=1 children
-- We keep the subcategory's original UUID so product references stay valid
INSERT INTO "categories" ("id", "parent_id", "name_uz", "name_ru", "level", "sort_order", "is_active")
SELECT
  s."id",
  s."category_id" AS "parent_id",
  s."name_uz",
  s."name_ru",
  1 AS "level",
  s."sort_order",
  s."is_active"
FROM "subcategories" s
ON CONFLICT ("id") DO NOTHING;

-- Step 4: Update products — move subcategory_id to category_id
-- Products should now point to the leaf category (old subcategory, now in categories)
UPDATE "products"
SET "category_id" = "subcategory_id"
WHERE "subcategory_id" IS NOT NULL;

-- Step 5: Drop subcategory_id column from products
ALTER TABLE "products" DROP COLUMN IF EXISTS "subcategory_id";

-- Step 6: Add self-referencing foreign key
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
  ON DELETE CASCADE;

-- Step 7: Add indexes (slug unique index added AFTER slug generation)
CREATE INDEX IF NOT EXISTS "categories_parent_id_is_active_idx" ON "categories"("parent_id", "is_active");
CREATE INDEX IF NOT EXISTS "categories_level_is_active_sort_order_idx" ON "categories"("level", "is_active", "sort_order");

-- Step 8: Generate slugs — root categories get simple slug, children get parent-slug prefix
-- First: root categories (level=0)
UPDATE "categories" SET "slug" = LOWER(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    "name_uz",
    ' ', '-'),
    '''', ''),
    'ʼ', ''),
    'ʻ', ''),
    '''', ''),
    'va ', ''),
    ',', ''),
    '.', ''),
    '--', '-')
) WHERE "level" = 0;

-- Then: child categories (level=1) get parent-slug/child-slug format for uniqueness
UPDATE "categories" c SET "slug" = LOWER(
  (SELECT p."slug" FROM "categories" p WHERE p."id" = c."parent_id") || '-' ||
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    c."name_uz",
    ' ', '-'),
    '''', ''),
    'ʼ', ''),
    'ʻ', ''),
    '''', ''),
    'va ', ''),
    ',', ''),
    '.', ''),
    '--', '-')
) WHERE c."level" = 1;

-- Now create unique slug index
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");

-- Step 9: Drop subcategories table
DROP TABLE IF EXISTS "subcategories" CASCADE;

-- Step 10: Remove old indexes that reference subcategory_id
-- (Already handled by dropping the column)

COMMIT;
