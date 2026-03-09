-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('active', 'completed', 'overdue', 'cancelled');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'installment';

-- AlterEnum (PaymentStatus: add held, reversed if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'held' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'held';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reversed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'reversed';
  END IF;
END $$;

-- CreateTable
CREATE TABLE "installment_plans" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "monthly_amount" DECIMAL(12,2) NOT NULL,
    "months" INTEGER NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "paid_months" INTEGER NOT NULL DEFAULT 0,
    "next_payment_date" TIMESTAMP(3),
    "status" "InstallmentStatus" NOT NULL DEFAULT 'active',
    "provider" "PaymentProvider" NOT NULL,
    "provider_plan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "installment_plans_order_id_idx" ON "installment_plans"("order_id");

-- CreateIndex
CREATE INDEX "installment_plans_card_id_idx" ON "installment_plans"("card_id");

-- CreateIndex
CREATE INDEX "installment_plans_status_idx" ON "installment_plans"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_settings_key_key" ON "payment_settings"("key");
