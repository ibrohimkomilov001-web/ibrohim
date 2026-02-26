-- CreateEnum
CREATE TYPE "DeliveryAssignmentStatus" AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE "VendorTransactionType" AS ENUM ('sale', 'payout', 'adjustment');
CREATE TYPE "PaymentProvider" AS ENUM ('payme', 'click');
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');
CREATE TYPE "BannerActionType" AS ENUM ('none', 'link', 'product', 'category');
CREATE TYPE "SettingValueType" AS ENUM ('string', 'number', 'boolean', 'json');
CREATE TYPE "ChatSenderRole" AS ENUM ('user', 'vendor');
CREATE TYPE "DevicePlatform" AS ENUM ('android', 'ios', 'web');
CREATE TYPE "ModerationAction" AS ENUM ('auto_approved', 'auto_rejected', 'admin_blocked', 'admin_unblocked', 'revalidated');

-- AlterTable: delivery_assignments
ALTER TABLE "delivery_assignments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "delivery_assignments" ALTER COLUMN "status" TYPE "DeliveryAssignmentStatus" USING "status"::"DeliveryAssignmentStatus";
ALTER TABLE "delivery_assignments" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable: courier_payouts
ALTER TABLE "courier_payouts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "courier_payouts" ALTER COLUMN "status" TYPE "PayoutStatus" USING "status"::"PayoutStatus";
ALTER TABLE "courier_payouts" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable: transactions
ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "TransactionStatus" USING "status"::"TransactionStatus";
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending';
ALTER TABLE "transactions" ALTER COLUMN "payment_method" TYPE "PaymentMethod" USING "payment_method"::"PaymentMethod";

-- AlterTable: vendor_transactions
ALTER TABLE "vendor_transactions" ALTER COLUMN "type" TYPE "VendorTransactionType" USING "type"::"VendorTransactionType";

-- AlterTable: payouts
ALTER TABLE "payouts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payouts" ALTER COLUMN "status" TYPE "PayoutStatus" USING "status"::"PayoutStatus";
ALTER TABLE "payouts" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable: saved_cards
ALTER TABLE "saved_cards" ALTER COLUMN "provider" TYPE "PaymentProvider" USING "provider"::"PaymentProvider";

-- AlterTable: promo_codes
ALTER TABLE "promo_codes" ALTER COLUMN "discount_type" TYPE "DiscountType" USING "discount_type"::"DiscountType";

-- AlterTable: banners
ALTER TABLE "banners" ALTER COLUMN "action_type" DROP DEFAULT;
ALTER TABLE "banners" ALTER COLUMN "action_type" TYPE "BannerActionType" USING "action_type"::"BannerActionType";
ALTER TABLE "banners" ALTER COLUMN "action_type" SET DEFAULT 'none';

-- AlterTable: admin_settings
ALTER TABLE "admin_settings" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "admin_settings" ALTER COLUMN "type" TYPE "SettingValueType" USING "type"::"SettingValueType";
ALTER TABLE "admin_settings" ALTER COLUMN "type" SET DEFAULT 'string';

-- AlterTable: product_moderation_logs (skipped — table created in later migration)
-- ALTER TABLE "product_moderation_logs" ALTER COLUMN "action" TYPE "ModerationAction" USING "action"::"ModerationAction";

-- AlterTable: chat_messages (skipped — table created in later migration)
-- ALTER TABLE "chat_messages" ALTER COLUMN "sender_role" TYPE "ChatSenderRole" USING "sender_role"::"ChatSenderRole";

-- AlterTable: user_devices
ALTER TABLE "user_devices" ALTER COLUMN "platform" TYPE "DevicePlatform" USING "platform"::"DevicePlatform";
