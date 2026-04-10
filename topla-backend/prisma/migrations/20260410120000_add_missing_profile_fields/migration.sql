-- AddMissingProfileFields
-- Adds columns that exist in schema.prisma but were never properly migrated

-- 1. Create Gender enum
DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unspecified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add missing profile columns
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "gender" "Gender" NOT NULL DEFAULT 'unspecified';
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "birth_date" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "referral_points" INTEGER NOT NULL DEFAULT 0;

-- 3. Add unique constraint on referral_code (matching schema)
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_referral_code_key" ON "profiles"("referral_code");

-- 4. Add missing shop column
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "contract_note" TEXT;
