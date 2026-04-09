-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('not_sent', 'sent', 'pending_signature', 'signed', 'rejected');

-- AlterTable: Add contract fields to shops
ALTER TABLE "shops" ADD COLUMN "contract_status" "ContractStatus" NOT NULL DEFAULT 'not_sent';
ALTER TABLE "shops" ADD COLUMN "contract_id" TEXT;
ALTER TABLE "shops" ADD COLUMN "contract_url" TEXT;
ALTER TABLE "shops" ADD COLUMN "contract_sent_at" TIMESTAMP(3);
ALTER TABLE "shops" ADD COLUMN "contract_sent_by" UUID;
ALTER TABLE "shops" ADD COLUMN "contract_signed_at" TIMESTAMP(3);

-- CreateIndex: Address(userId, isDefault)
CREATE INDEX "addresses_user_id_is_default_idx" ON "addresses"("user_id", "is_default");

-- CreateIndex: PromoCode(isActive, expiresAt)
CREATE INDEX "promo_codes_is_active_expires_at_idx" ON "promo_codes"("is_active", "expires_at");

-- CreateIndex: Referral(purchaseBonusGiven, referredId)
CREATE INDEX "referrals_purchase_bonus_given_referred_id_idx" ON "referrals"("purchase_bonus_given", "referred_id");
