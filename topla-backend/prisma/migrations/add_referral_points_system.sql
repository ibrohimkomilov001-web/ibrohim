-- =====================================================
-- Migration: Add Referral Points System
-- Date: 2026-03-06
-- =====================================================

-- 1. Add referralPoints to profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "referral_points" INTEGER NOT NULL DEFAULT 0;

-- 2. Add new tracking columns to referrals
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "registration_bonus_given" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "purchase_bonus_given" BOOLEAN NOT NULL DEFAULT false;

-- 3. Create PointLogType enum
DO $$ BEGIN
  CREATE TYPE "PointLogType" AS ENUM ('friend_registered', 'friend_purchased', 'reward_claimed', 'admin_adjustment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create referral_point_logs table
CREATE TABLE IF NOT EXISTS "referral_point_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profile_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" "PointLogType" NOT NULL,
  "description" TEXT,
  "referral_id" UUID,
  "claim_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referral_point_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_point_logs_profile_id_created_at_idx"
  ON "referral_point_logs"("profile_id", "created_at" DESC);

-- 5. Create RewardType enum
DO $$ BEGIN
  CREATE TYPE "RewardType" AS ENUM ('promo_fixed', 'promo_percent', 'free_delivery', 'physical_gift');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 6. Create RewardClaimStatus enum
DO $$ BEGIN
  CREATE TYPE "RewardClaimStatus" AS ENUM ('pending', 'fulfilled', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 7. Create referral_rewards table (catalog)
CREATE TABLE IF NOT EXISTS "referral_rewards" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name_uz" TEXT NOT NULL,
  "name_ru" TEXT NOT NULL,
  "description" TEXT,
  "points_cost" INTEGER NOT NULL,
  "type" "RewardType" NOT NULL,
  "value" DECIMAL(12,2),
  "image_url" TEXT,
  "stock" INTEGER,
  "total_claimed" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_rewards_is_active_sort_order_idx"
  ON "referral_rewards"("is_active", "sort_order");

-- 8. Create referral_reward_claims table
CREATE TABLE IF NOT EXISTS "referral_reward_claims" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "profile_id" UUID NOT NULL,
  "reward_id" UUID NOT NULL,
  "points_spent" INTEGER NOT NULL,
  "promo_code_id" UUID,
  "status" "RewardClaimStatus" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "referral_reward_claims_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_reward_claims_profile_id_created_at_idx"
  ON "referral_reward_claims"("profile_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "referral_reward_claims_reward_id_idx"
  ON "referral_reward_claims"("reward_id");

-- 9. Add referral_bonus to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'referral_bonus';

-- 10. Foreign keys
ALTER TABLE "referral_point_logs"
  ADD CONSTRAINT "referral_point_logs_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_point_logs"
  ADD CONSTRAINT "referral_point_logs_referral_id_fkey"
  FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_point_logs"
  ADD CONSTRAINT "referral_point_logs_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "referral_reward_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_reward_claims"
  ADD CONSTRAINT "referral_reward_claims_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_reward_claims"
  ADD CONSTRAINT "referral_reward_claims_reward_id_fkey"
  FOREIGN KEY ("reward_id") REFERENCES "referral_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. Insert starter rewards (admin can change later)
INSERT INTO "referral_rewards" ("name_uz", "name_ru", "description", "points_cost", "type", "value", "stock", "sort_order", "is_active")
VALUES
  ('10,000 so''m chegirma', '10 000 сум скидка', 'Keyingi xaridingizga 10,000 so''m chegirma', 10, 'promo_fixed', 10000, null, 1, true),
  ('25,000 so''m chegirma', '25 000 сум скидка', 'Keyingi xaridingizga 25,000 so''m chegirma', 25, 'promo_fixed', 25000, null, 2, true),
  ('50,000 so''m chegirma', '50 000 сум скидка', 'Keyingi xaridingizga 50,000 so''m chegirma', 50, 'promo_fixed', 50000, null, 3, true),
  ('Bepul yetkazib berish', 'Бесплатная доставка', 'Bitta buyurtmaga bepul yetkazib berish', 15, 'free_delivery', 0, null, 4, true),
  ('10% chegirma', '10% скидка', 'Keyingi xaridingizga 10% chegirma', 30, 'promo_percent', 10, null, 5, true)
ON CONFLICT DO NOTHING;
