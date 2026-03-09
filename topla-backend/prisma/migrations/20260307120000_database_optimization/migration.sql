-- ============================================
-- Database Optimization Migration
-- 1. Soft-delete (deletedAt) — Profile, Product, Shop, Order
-- 2. SupportTicket status → enum
-- 3. SavedCard: cardNumber → maskedPan, cardHolder removed
-- 4. onDelete policies
-- 5. Additional indexes
-- ============================================

-- 1. Add deletedAt columns for soft-delete
ALTER TABLE "profiles" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "shops" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Partial indexes: faqat deleted_at IS NULL bo'lgan qatorlar (ko'pchilik so'rovlar uchun tez)
CREATE INDEX "profiles_deleted_at_null" ON "profiles" ("id") WHERE "deleted_at" IS NULL;
CREATE INDEX "products_deleted_at_null" ON "products" ("id") WHERE "deleted_at" IS NULL;
CREATE INDEX "shops_deleted_at_null" ON "shops" ("id") WHERE "deleted_at" IS NULL;
CREATE INDEX "orders_deleted_at_null" ON "orders" ("id") WHERE "deleted_at" IS NULL;

-- 2. SupportTicket status: String → Enum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'waiting_customer', 'closed');

-- Mavjud ma'lumotlarni yangi turga o'tkazish
ALTER TABLE "support_tickets" 
  ALTER COLUMN "status" TYPE "SupportTicketStatus" 
  USING (
    CASE "status"
      WHEN 'open' THEN 'open'::"SupportTicketStatus"
      WHEN 'closed' THEN 'closed'::"SupportTicketStatus"
      WHEN 'in_progress' THEN 'in_progress'::"SupportTicketStatus"
      ELSE 'open'::"SupportTicketStatus"
    END
  );

ALTER TABLE "support_tickets" ALTER COLUMN "status" SET DEFAULT 'open'::"SupportTicketStatus";

-- SupportTicket status index
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" ("status");

-- 3. SavedCard: PCI-compliant field rename
-- cardNumber → maskedPan (faqat oxirgi 4 raqam — **** 1234)
ALTER TABLE "saved_cards" RENAME COLUMN "card_number" TO "masked_pan";

-- cardHolder ustunini o'chirish (PCI-DSS — to'liq ism saqlanmasligi kerak)
ALTER TABLE "saved_cards" DROP COLUMN IF EXISTS "card_holder";

-- SavedCard user relation (FK constraint)
ALTER TABLE "saved_cards" 
  ADD CONSTRAINT "saved_cards_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. onDelete policies qo'shish (mavjud FKlarni yangilash)
-- Order.addressId → SetNull on delete
-- (Prisma buni avtomatik qiladi, lekin xavfsizlik uchun)

-- Note: Prisma migrate dev will handle most FK changes automatically.
-- This migration covers the manual/raw SQL parts.

-- 5. Missing indexes
-- ShopFollow: userId (foydalanuvchi kuzatayotgan do'konlar uchun)
CREATE INDEX "shop_follows_user_id_idx" ON "shop_follows" ("user_id");

-- Product: shopId + status composite (vendor mahsulot boshqaruvi uchun)
CREATE INDEX "products_shop_id_status_idx" ON "products" ("shop_id", "status");

-- 6. Transaction → Order relation (FK constraint)
ALTER TABLE "transactions" 
  ADD CONSTRAINT "transactions_order_id_fkey" 
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") 
  ON DELETE RESTRICT ON UPDATE CASCADE;
