-- Lucky Wheel (Omad Barabani) - migration
-- CreateEnum SpinPrizeType
CREATE TYPE "SpinPrizeType" AS ENUM ('discount_percent', 'discount_fixed', 'free_delivery', 'physical_gift', 'nothing');

-- CreateTable: lucky_wheel_prizes
CREATE TABLE "lucky_wheel_prizes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_uz" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "type" "SpinPrizeType" NOT NULL,
    "value" DECIMAL(12,2),
    "probability" DECIMAL(5,4) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF6B35',
    "image_url" TEXT,
    "promo_code_prefix" TEXT,
    "stock" INTEGER,
    "total_won" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lucky_wheel_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: lucky_wheel_spins
CREATE TABLE "lucky_wheel_spins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "prize_id" UUID,
    "promo_code" TEXT,
    "prize_type" "SpinPrizeType" NOT NULL,
    "prize_name" TEXT,
    "spin_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lucky_wheel_spins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lucky_wheel_spins_user_id_spin_date_key" ON "lucky_wheel_spins"("user_id", "spin_date");
CREATE INDEX "lucky_wheel_spins_user_id_idx" ON "lucky_wheel_spins"("user_id");
CREATE INDEX "lucky_wheel_spins_spin_date_idx" ON "lucky_wheel_spins"("spin_date");

-- AddForeignKey
ALTER TABLE "lucky_wheel_spins" ADD CONSTRAINT "lucky_wheel_spins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lucky_wheel_spins" ADD CONSTRAINT "lucky_wheel_spins_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "lucky_wheel_prizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: Boshlang'ich sovg'alar
INSERT INTO "lucky_wheel_prizes" ("id", "name_uz", "name_ru", "type", "value", "probability", "color", "promo_code_prefix", "stock", "sort_order", "is_active", "updated_at") VALUES
  (gen_random_uuid(), '5% chegirma', 'Скидка 5%', 'discount_percent', 5, 0.2500, '#4CAF50', 'D5', NULL, 1, true, NOW()),
  (gen_random_uuid(), '10% chegirma', 'Скидка 10%', 'discount_percent', 10, 0.1500, '#2196F3', 'D10', NULL, 2, true, NOW()),
  (gen_random_uuid(), '15% chegirma', 'Скидка 15%', 'discount_percent', 15, 0.0500, '#9C27B0', 'D15', NULL, 3, true, NOW()),
  (gen_random_uuid(), 'Bepul yetkazish', 'Бесплатная доставка', 'free_delivery', NULL, 0.1000, '#FF9800', 'FD', NULL, 4, true, NOW()),
  (gen_random_uuid(), 'AirPods Pro', 'AirPods Pro', 'physical_gift', NULL, 0.0050, '#E91E63', NULL, 2, 5, true, NOW()),
  (gen_random_uuid(), 'Quloqchin', 'Наушники', 'physical_gift', NULL, 0.0200, '#00BCD4', NULL, 5, 6, true, NOW()),
  (gen_random_uuid(), 'Keyingi safar', 'В следующий раз', 'nothing', NULL, 0.3250, '#9E9E9E', NULL, NULL, 7, true, NOW()),
  (gen_random_uuid(), 'Omad kulib boqadi', 'Удача улыбнётся', 'nothing', NULL, 0.2000, '#607D8B', NULL, NULL, 8, true, NOW());
