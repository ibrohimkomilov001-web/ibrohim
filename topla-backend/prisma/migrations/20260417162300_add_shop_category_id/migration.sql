-- AlterTable: Add category_id to shops (safe — skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE "shops" ADD COLUMN "category_id" UUID;
  END IF;
END $$;

-- CreateIndex (safe — skip if exists)
CREATE INDEX IF NOT EXISTS "shops_category_id_idx" ON "shops"("category_id");

-- AddForeignKey (safe — skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shops_category_id_fkey' AND table_name = 'shops'
  ) THEN
    ALTER TABLE "shops" ADD CONSTRAINT "shops_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Migrate existing category text to category_id
UPDATE "shops" s
SET "category_id" = c."id"
FROM "categories" c
WHERE c."level" = 0
  AND c."is_active" = true
  AND (lower(c."name_uz") = lower(s."category") OR lower(c."name_ru") = lower(s."category"))
  AND s."category" IS NOT NULL
  AND s."category_id" IS NULL;
