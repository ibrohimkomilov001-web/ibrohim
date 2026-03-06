-- Add iPhone-specific colors
INSERT INTO colors (id, name_uz, name_ru, hex_code, sort_order) VALUES
  (gen_random_uuid(), 'Titan tabiiy',  'Натуральный титан', '#8B8178', 10),
  (gen_random_uuid(), 'Titan cho''l',  'Титан пустыня',     '#C4A882', 11),
  (gen_random_uuid(), 'Titan oq',      'Белый титан',       '#F2F1EB', 12),
  (gen_random_uuid(), 'Pushti',        'Розовый',           '#FFC0CB', 13)
ON CONFLICT DO NOTHING;

-- Show all colors
SELECT id, name_uz, hex_code, sort_order FROM colors ORDER BY sort_order ASC, name_uz ASC;

-- =============================================
-- PRODUCT 1: iPhone 16 Pro Max (faqat rang variantlari)
-- =============================================
INSERT INTO products (
  id, shop_id, category_id, subcategory_id, brand_id,
  name_uz, name_ru, name,
  description_uz, description_ru, description,
  price, original_price, discount_percent,
  images, stock, unit, sku, status, is_active, has_variants, quality_score,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'c287d0de-3882-4233-9130-36a8806feea0',
  '783fa8f3-a256-404e-a62d-3a53821c85d6',
  'e2ea4fa3-540e-4be6-b31d-54bf70bb3818',
  '71ae5f4f-053e-4a3b-a65b-85c0a24f3c84',
  'iPhone 16 Pro Max 256GB',
  'iPhone 16 Pro Max 256GB',
  'iPhone 16 Pro Max 256GB',
  'Apple iPhone 16 Pro Max 256GB. A18 Pro chip, 48MP kamera tizimi, titan korpus, USB-C, Dynamic Island.',
  'Apple iPhone 16 Pro Max 256GB. Чип A18 Pro, 48МП камера, титановый корпус, USB-C, Dynamic Island.',
  'iPhone 16 Pro Max 256GB',
  18990000.00, 21490000.00, 12,
  ARRAY['https://store.storeimages.cdn-apple.com/iphone-16-pro-hero.jpg'],
  100, 'dona', 'IPHONE16PM-256', 'active', true, true, 85,
  NOW(), NOW()
)
RETURNING id;

-- =============================================
-- PRODUCT 2: Nike Erkaklar Futbolkasi (rang + o'lcham)
-- =============================================
INSERT INTO products (
  id, shop_id, category_id, subcategory_id, brand_id,
  name_uz, name_ru, name,
  description_uz, description_ru, description,
  price, original_price, discount_percent,
  images, stock, unit, sku, status, is_active, has_variants, quality_score,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'c287d0de-3882-4233-9130-36a8806feea0',
  '785735bf-0b61-4eeb-aec7-28015f3881c9',
  '76d4b7a1-9691-4489-8151-0fa23112d789',
  '1415de6f-c909-46fb-9de6-c7fd8136b970',
  'Nike Dri-FIT Erkaklar Futbolkasi',
  'Nike Dri-FIT Мужская футболка',
  'Nike Dri-FIT Erkaklar Futbolkasi',
  'Nike Dri-FIT texnologiyasi bilan sport futbolka. Namlikni so''ruvchi material, yengil va qulay.',
  'Спортивная футболка Nike с технологией Dri-FIT. Влагоотводящий материал, легкая и удобная.',
  'Nike Dri-FIT Erkaklar Futbolkasi',
  189000.00, 249000.00, 24,
  ARRAY['https://static.nike.com/a/images/nikefutbolka.jpg'],
  200, 'dona', 'NIKE-DRIFIT-001', 'active', true, true, 80,
  NOW(), NOW()
)
RETURNING id;
