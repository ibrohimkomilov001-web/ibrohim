-- Add shop_id to promo_codes for vendor-specific promo codes
ALTER TABLE "promo_codes" ADD COLUMN "shop_id" UUID;

-- Index for vendor promo code queries
CREATE INDEX IF NOT EXISTS "promo_codes_shop_id_idx" ON "promo_codes"("shop_id");
