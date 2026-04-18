-- AlterTable
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "shop_type" TEXT DEFAULT 'Magazin';
