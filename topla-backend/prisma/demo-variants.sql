-- =============================================
-- iPhone 16 Pro Max VARIANTS (4 rang, o'lchamsiz)
-- =============================================
INSERT INTO product_variants (id, product_id, color_id, size_id, price, compare_at_price, stock, sku, images, is_active, sort_order, created_at, updated_at) VALUES
-- Titan tabiiy
(gen_random_uuid(), 'fa1f6de2-7ba1-45c7-b9a1-eb84f5f7afd7',
 '78406485-fc23-4510-9d6e-430e3b80bca8', NULL,
 18990000.00, 21490000.00, 30, 'IP16PM-256-NAT',
 ARRAY['https://store.storeimages.cdn-apple.com/iphone-16-pro-natural.jpg'],
 true, 0, NOW(), NOW()),

-- Titan cho'l (desert)
(gen_random_uuid(), 'fa1f6de2-7ba1-45c7-b9a1-eb84f5f7afd7',
 'a3a4c183-a3a9-48e0-86f1-5a31a04549d5', NULL,
 18990000.00, 21490000.00, 25, 'IP16PM-256-DST',
 ARRAY['https://store.storeimages.cdn-apple.com/iphone-16-pro-desert.jpg'],
 true, 1, NOW(), NOW()),

-- Titan oq (white)
(gen_random_uuid(), 'fa1f6de2-7ba1-45c7-b9a1-eb84f5f7afd7',
 '343a1154-59cb-404a-83ce-39df8f3c3ab7', NULL,
 18990000.00, 21490000.00, 20, 'IP16PM-256-WHT',
 ARRAY['https://store.storeimages.cdn-apple.com/iphone-16-pro-white.jpg'],
 true, 2, NOW(), NOW()),

-- Qora (black)
(gen_random_uuid(), 'fa1f6de2-7ba1-45c7-b9a1-eb84f5f7afd7',
 '4c051e0b-6602-473d-8ccc-248ff1fff4cf', NULL,
 19490000.00, 21490000.00, 15, 'IP16PM-256-BLK',
 ARRAY['https://store.storeimages.cdn-apple.com/iphone-16-pro-black.jpg'],
 true, 3, NOW(), NOW());

-- =============================================
-- Nike Futbolka VARIANTS (3 rang x 4 o'lcham = 12 variant)
-- Colors: Qora, Oq, Ko'k
-- Sizes: S, M, L, XL
-- =============================================

-- Qora + S
INSERT INTO product_variants (id, product_id, color_id, size_id, price, compare_at_price, stock, sku, images, is_active, sort_order, created_at, updated_at) VALUES
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '4c051e0b-6602-473d-8ccc-248ff1fff4cf', 'c16e22c7-d6a0-43e7-844b-36657e811b32',
 189000.00, 249000.00, 15, 'NIKE-BLK-S',
 ARRAY['https://static.nike.com/nike-drifit-black.jpg'],
 true, 0, NOW(), NOW()),

-- Qora + M
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '4c051e0b-6602-473d-8ccc-248ff1fff4cf', 'dc34f26b-1cd5-45ff-93b1-274a0a1417a6',
 189000.00, 249000.00, 20, 'NIKE-BLK-M',
 ARRAY['https://static.nike.com/nike-drifit-black.jpg'],
 true, 1, NOW(), NOW()),

-- Qora + L
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '4c051e0b-6602-473d-8ccc-248ff1fff4cf', 'de39d515-7244-4915-b7a0-083bef3bf717',
 189000.00, 249000.00, 18, 'NIKE-BLK-L',
 ARRAY['https://static.nike.com/nike-drifit-black.jpg'],
 true, 2, NOW(), NOW()),

-- Qora + XL
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '4c051e0b-6602-473d-8ccc-248ff1fff4cf', 'eb722854-3e33-4b40-ba42-db894316e4b8',
 199000.00, 249000.00, 10, 'NIKE-BLK-XL',
 ARRAY['https://static.nike.com/nike-drifit-black.jpg'],
 true, 3, NOW(), NOW()),

-- Oq + S
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '3d1c71d8-300b-4ad2-bdae-43add0ba057c', 'c16e22c7-d6a0-43e7-844b-36657e811b32',
 189000.00, 249000.00, 12, 'NIKE-WHT-S',
 ARRAY['https://static.nike.com/nike-drifit-white.jpg'],
 true, 4, NOW(), NOW()),

-- Oq + M
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '3d1c71d8-300b-4ad2-bdae-43add0ba057c', 'dc34f26b-1cd5-45ff-93b1-274a0a1417a6',
 189000.00, 249000.00, 22, 'NIKE-WHT-M',
 ARRAY['https://static.nike.com/nike-drifit-white.jpg'],
 true, 5, NOW(), NOW()),

-- Oq + L
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '3d1c71d8-300b-4ad2-bdae-43add0ba057c', 'de39d515-7244-4915-b7a0-083bef3bf717',
 189000.00, 249000.00, 25, 'NIKE-WHT-L',
 ARRAY['https://static.nike.com/nike-drifit-white.jpg'],
 true, 6, NOW(), NOW()),

-- Oq + XL
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '3d1c71d8-300b-4ad2-bdae-43add0ba057c', 'eb722854-3e33-4b40-ba42-db894316e4b8',
 199000.00, 249000.00, 8, 'NIKE-WHT-XL',
 ARRAY['https://static.nike.com/nike-drifit-white.jpg'],
 true, 7, NOW(), NOW()),

-- Ko'k + S
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '8709ea72-8e23-4341-a972-c74d047b5537', 'c16e22c7-d6a0-43e7-844b-36657e811b32',
 189000.00, 249000.00, 10, 'NIKE-BLU-S',
 ARRAY['https://static.nike.com/nike-drifit-blue.jpg'],
 true, 8, NOW(), NOW()),

-- Ko'k + M
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '8709ea72-8e23-4341-a972-c74d047b5537', 'dc34f26b-1cd5-45ff-93b1-274a0a1417a6',
 189000.00, 249000.00, 18, 'NIKE-BLU-M',
 ARRAY['https://static.nike.com/nike-drifit-blue.jpg'],
 true, 9, NOW(), NOW()),

-- Ko'k + L
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '8709ea72-8e23-4341-a972-c74d047b5537', 'de39d515-7244-4915-b7a0-083bef3bf717',
 189000.00, 249000.00, 15, 'NIKE-BLU-L',
 ARRAY['https://static.nike.com/nike-drifit-blue.jpg'],
 true, 10, NOW(), NOW()),

-- Ko'k + XL
(gen_random_uuid(), '376c3d34-09c8-4ace-98d4-ba6e4217fe68',
 '8709ea72-8e23-4341-a972-c74d047b5537', 'eb722854-3e33-4b40-ba42-db894316e4b8',
 199000.00, 249000.00, 6, 'NIKE-BLU-XL',
 ARRAY['https://static.nike.com/nike-drifit-blue.jpg'],
 true, 11, NOW(), NOW());

-- Verify
SELECT 'iPhone variants:' AS info, COUNT(*) FROM product_variants WHERE product_id = 'fa1f6de2-7ba1-45c7-b9a1-eb84f5f7afd7';
SELECT 'Nike variants:' AS info, COUNT(*) FROM product_variants WHERE product_id = '376c3d34-09c8-4ace-98d4-ba6e4217fe68';

SELECT pv.sku, c.name_uz AS rang, s.name_uz AS olcham, pv.price, pv.stock
FROM product_variants pv
LEFT JOIN colors c ON c.id = pv.color_id
LEFT JOIN sizes s ON s.id = pv.size_id
WHERE pv.product_id IN ('fa1f6de2-7ba1-45c7-b9a1-eb84f5f7afd7', '376c3d34-09c8-4ace-98d4-ba6e4217fe68')
ORDER BY pv.product_id, pv.sort_order;
