-- AlterTable: Add missing Profile columns
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "google_id" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "terms_accepted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_google_id_key" ON "profiles"("google_id");
CREATE INDEX IF NOT EXISTS "profiles_email_idx" ON "profiles"("email");
