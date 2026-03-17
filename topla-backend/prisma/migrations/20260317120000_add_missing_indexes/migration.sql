-- Yo'q bo'lgan indekslar qo'shish (performance yaxshilash)
-- Banner, DeliveryZone, PickupPoint, PickupPointApplication,
-- LuckyWheelPrize, Webhook, FaqEntry, ABTest

-- Banner: isActive + sortOrder bo'yicha saralash
CREATE INDEX IF NOT EXISTS "banners_is_active_sort_order_idx" ON "banners"("is_active", "sort_order");

-- DeliveryZone: isActive bo'yicha filter
CREATE INDEX IF NOT EXISTS "delivery_zones_is_active_idx" ON "delivery_zones"("is_active");

-- PickupPoint: isActive bo'yicha filter
CREATE INDEX IF NOT EXISTS "pickup_points_is_active_idx" ON "pickup_points"("is_active");

-- PickupPointApplication: status va createdAt bo'yicha
CREATE INDEX IF NOT EXISTS "pickup_point_applications_status_idx" ON "pickup_point_applications"("status");
CREATE INDEX IF NOT EXISTS "pickup_point_applications_created_at_idx" ON "pickup_point_applications"("created_at" DESC);

-- LuckyWheelPrize: isActive + sortOrder
CREATE INDEX IF NOT EXISTS "lucky_wheel_prizes_is_active_sort_order_idx" ON "lucky_wheel_prizes"("is_active", "sort_order");

-- Webhook: apiKeyId va isActive
CREATE INDEX IF NOT EXISTS "webhooks_api_key_id_idx" ON "webhooks"("api_key_id");
CREATE INDEX IF NOT EXISTS "webhooks_is_active_idx" ON "webhooks"("is_active");

-- FaqEntry: isActive + sortOrder va category  
CREATE INDEX IF NOT EXISTS "faq_entries_is_active_sort_order_idx" ON "faq_entries"("is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "faq_entries_category_idx" ON "faq_entries"("category");

-- ABTest: status bo'yicha filter
CREATE INDEX IF NOT EXISTS "ab_tests_status_idx" ON "ab_tests"("status");
