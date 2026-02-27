-- Add composite indexes for common query patterns

-- Profile indexes
CREATE INDEX IF NOT EXISTS "profiles_role_status_idx" ON "profiles"("role", "status");
CREATE INDEX IF NOT EXISTS "profiles_phone_idx" ON "profiles"("phone");
CREATE INDEX IF NOT EXISTS "profiles_created_at_idx" ON "profiles"("created_at" DESC);

-- Product composite indexes
CREATE INDEX IF NOT EXISTS "products_shop_id_is_active_status_idx" ON "products"("shop_id", "is_active", "status");
CREATE INDEX IF NOT EXISTS "products_category_id_is_active_status_idx" ON "products"("category_id", "is_active", "status");
CREATE INDEX IF NOT EXISTS "products_subcategory_id_is_active_status_idx" ON "products"("subcategory_id", "is_active", "status");
CREATE INDEX IF NOT EXISTS "products_is_active_status_created_at_idx" ON "products"("is_active", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "products_is_flash_sale_flash_sale_end_idx" ON "products"("is_flash_sale", "flash_sale_end");

-- Order indexes
CREATE INDEX IF NOT EXISTS "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "orders_payment_status_idx" ON "orders"("payment_status");

-- OrderItem composite index
CREATE INDEX IF NOT EXISTS "order_items_shop_id_order_id_idx" ON "order_items"("shop_id", "order_id");

-- Return indexes
CREATE INDEX IF NOT EXISTS "returns_status_idx" ON "returns"("status");
CREATE INDEX IF NOT EXISTS "returns_created_at_idx" ON "returns"("created_at" DESC);

-- ChatRoom customer index
CREATE INDEX IF NOT EXISTS "chat_rooms_customer_id_last_message_at_idx" ON "chat_rooms"("customer_id", "last_message_at" DESC);

-- VendorDocument composite index
CREATE INDEX IF NOT EXISTS "vendor_documents_shop_id_status_idx" ON "vendor_documents"("shop_id", "status");

-- Subcategory composite index
CREATE INDEX IF NOT EXISTS "subcategories_category_id_is_active_idx" ON "subcategories"("category_id", "is_active");
