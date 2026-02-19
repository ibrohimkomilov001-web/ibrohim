-- Add missing database indexes for performance optimization

-- Address: userId (users frequently query their addresses)
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- Shop: status (admin frequently filters by status)
CREATE INDEX "shops_status_idx" ON "shops"("status");

-- Product: subcategoryId, brandId (frequently used in filters)
CREATE INDEX "products_subcategory_id_idx" ON "products"("subcategory_id");
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- OrderItem: orderId, shopId, productId (JOIN performance)
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_shop_id_idx" ON "order_items"("shop_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- OrderStatusHistory: orderId (frequently queried with order)
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- Transaction: status (admin filters by payment status)
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- Payout: shopId, status (vendor queries their payouts)
CREATE INDEX "payouts_shop_id_idx" ON "payouts"("shop_id");
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CourierPayout: courierId, status
CREATE INDEX "courier_payouts_courier_id_idx" ON "courier_payouts"("courier_id");
CREATE INDEX "courier_payouts_status_idx" ON "courier_payouts"("status");

-- DeliveryRating: courierId (courier rating aggregation)
CREATE INDEX "delivery_ratings_courier_id_idx" ON "delivery_ratings"("courier_id");

-- PromoCodeUsage: userId (user promo history lookup)
CREATE INDEX "promo_code_usage_user_id_idx" ON "promo_code_usage"("user_id");
