-- AlterTable
ALTER TABLE "shops" ADD COLUMN "category_id" UUID;

-- CreateIndex
CREATE INDEX "shops_category_id_idx" ON "shops"("category_id");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing category text to category_id
UPDATE "shops" s
SET "category_id" = c."id"
FROM "categories" c
WHERE c."level" = 0
  AND c."is_active" = true
  AND (lower(c."name_uz") = lower(s."category") OR lower(c."name_ru") = lower(s."category"))
  AND s."category" IS NOT NULL
  AND s."category_id" IS NULL;
