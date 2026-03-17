-- ============================================
-- String ustunlarni Enum turiga almashtirish
-- 4 ta maydon: CategoryAttribute.type, Product.unit, ABTest.testType, FaqEntry.category
-- ============================================

-- 1. AttributeInputType enum yaratish
CREATE TYPE "AttributeInputType" AS ENUM ('chips', 'range', 'toggle', 'color', 'radio');

-- CategoryAttribute.type: String -> AttributeInputType
ALTER TABLE "category_attributes"
  ALTER COLUMN "type" SET DEFAULT 'chips',
  ALTER COLUMN "type" TYPE "AttributeInputType" USING "type"::"AttributeInputType";

-- 2. ProductUnit enum yaratish
CREATE TYPE "ProductUnit" AS ENUM ('dona', 'kg', 'litr', 'metr', 'paket', 'quti');

-- Product.unit: String -> ProductUnit
ALTER TABLE "products"
  ALTER COLUMN "unit" SET DEFAULT 'dona',
  ALTER COLUMN "unit" TYPE "ProductUnit" USING "unit"::"ProductUnit";

-- 3. ABTestType enum yaratish
CREATE TYPE "ABTestType" AS ENUM ('price', 'image', 'title', 'layout');

-- ABTest.testType: String -> ABTestType
ALTER TABLE "ab_tests"
  ALTER COLUMN "test_type" TYPE "ABTestType" USING "test_type"::"ABTestType";

-- 4. FaqCategory enum yaratish
CREATE TYPE "FaqCategory" AS ENUM ('shipping', 'payment', 'returns', 'general');

-- FaqEntry.category: String? -> FaqCategory?
ALTER TABLE "faq_entries"
  ALTER COLUMN "category" TYPE "FaqCategory" USING "category"::"FaqCategory";
