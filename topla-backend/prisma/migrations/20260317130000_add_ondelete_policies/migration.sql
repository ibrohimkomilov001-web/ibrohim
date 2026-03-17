-- ============================================
-- onDelete siyosatlari qo'shish
-- Moliyaviy yozuvlar: RESTRICT (o'chirish taqiqlangan)
-- Bog'liq yozuvlar: CASCADE yoki SET NULL
-- ============================================

-- Shop.owner -> Profile: RESTRICT (do'kon egasini o'chirish taqiqlangan)
ALTER TABLE "shops" DROP CONSTRAINT IF EXISTS "shops_owner_id_fkey";
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Order.user -> Profile: RESTRICT (buyurtma egasini o'chirish taqiqlangan)
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_user_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Courier.profile -> Profile: RESTRICT (kuryer profilini o'chirish taqiqlangan)
ALTER TABLE "couriers" DROP CONSTRAINT IF EXISTS "couriers_profile_id_fkey";
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DeliveryAssignment.courier -> Courier: CASCADE
ALTER TABLE "delivery_assignments" DROP CONSTRAINT IF EXISTS "delivery_assignments_courier_id_fkey";
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_courier_id_fkey"
  FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DeliveryRating.order -> Order: CASCADE
ALTER TABLE "delivery_ratings" DROP CONSTRAINT IF EXISTS "delivery_ratings_order_id_fkey";
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "delivery_ratings_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DeliveryRating.courier -> Courier: RESTRICT (kuryer reytingini saqlash)
ALTER TABLE "delivery_ratings" DROP CONSTRAINT IF EXISTS "delivery_ratings_courier_id_fkey";
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "delivery_ratings_courier_id_fkey"
  FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DeliveryRating.user -> Profile: RESTRICT
ALTER TABLE "delivery_ratings" DROP CONSTRAINT IF EXISTS "delivery_ratings_user_id_fkey";
ALTER TABLE "delivery_ratings" ADD CONSTRAINT "delivery_ratings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CourierPayout.courier -> Courier: RESTRICT (moliyaviy yozuv)
ALTER TABLE "courier_payouts" DROP CONSTRAINT IF EXISTS "courier_payouts_courier_id_fkey";
ALTER TABLE "courier_payouts" ADD CONSTRAINT "courier_payouts_courier_id_fkey"
  FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Transaction.order -> Order: RESTRICT (moliyaviy yozuv)
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_order_id_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- VendorTransaction.shop -> Shop: RESTRICT (moliyaviy yozuv)
ALTER TABLE "vendor_transactions" DROP CONSTRAINT IF EXISTS "vendor_transactions_shop_id_fkey";
ALTER TABLE "vendor_transactions" ADD CONSTRAINT "vendor_transactions_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payout.shop -> Shop: RESTRICT (moliyaviy yozuv)
ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_shop_id_fkey";
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProductModerationLog.admin -> Profile: SET NULL (admin o'chirilsa log saqlanadi)
ALTER TABLE "product_moderation_logs" DROP CONSTRAINT IF EXISTS "product_moderation_logs_admin_id_fkey";
ALTER TABLE "product_moderation_logs" ADD CONSTRAINT "product_moderation_logs_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Referral.referrer -> Profile: RESTRICT
ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referrer_id_fkey";
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey"
  FOREIGN KEY ("referrer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Referral.referred -> Profile: RESTRICT
ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referred_id_fkey";
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_fkey"
  FOREIGN KEY ("referred_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ReferralRewardClaim.reward -> ReferralReward: RESTRICT
ALTER TABLE "referral_reward_claims" DROP CONSTRAINT IF EXISTS "referral_reward_claims_reward_id_fkey";
ALTER TABLE "referral_reward_claims" ADD CONSTRAINT "referral_reward_claims_reward_id_fkey"
  FOREIGN KEY ("reward_id") REFERENCES "referral_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PromoCodeUsage.promo -> PromoCode: CASCADE
ALTER TABLE "promo_code_usage" DROP CONSTRAINT IF EXISTS "promo_code_usage_promo_id_fkey";
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_promo_id_fkey"
  FOREIGN KEY ("promo_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PromoCodeUsage.user -> Profile: CASCADE
ALTER TABLE "promo_code_usage" DROP CONSTRAINT IF EXISTS "promo_code_usage_user_id_fkey";
ALTER TABLE "promo_code_usage" ADD CONSTRAINT "promo_code_usage_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
