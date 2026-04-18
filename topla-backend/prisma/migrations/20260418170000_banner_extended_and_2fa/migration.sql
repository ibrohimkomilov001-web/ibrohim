-- Phase 3.1 + 5.4: Banner extended fields + Profile 2FA fields

-- Banner enum: add 'shop' value
ALTER TYPE "BannerActionType" ADD VALUE IF NOT EXISTS 'shop';

-- New enum for text position
DO $$ BEGIN
  CREATE TYPE "BannerTextPosition" AS ENUM ('left', 'center', 'right');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Banner table extensions
ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "cta_text" TEXT,
  ADD COLUMN IF NOT EXISTS "cta_text_ru" TEXT,
  ADD COLUMN IF NOT EXISTS "bg_color" TEXT,
  ADD COLUMN IF NOT EXISTS "text_color" TEXT,
  ADD COLUMN IF NOT EXISTS "text_position" "BannerTextPosition" DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS "starts_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "click_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "banners_starts_at_ends_at_idx" ON "banners"("starts_at", "ends_at");

-- Profile 2FA fields
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "totp_secret" TEXT,
  ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "totp_backup_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
