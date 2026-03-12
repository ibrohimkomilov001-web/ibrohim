-- Add CategoryAttribute and ProductAttributeValue tables for filter system
-- Run on production DB: topla_db

-- Category filter attributes (e.g. "RAM", "Material", etc.)
CREATE TABLE IF NOT EXISTS category_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_uz TEXT NOT NULL,
    name_ru TEXT,
    key TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'chips',
    unit TEXT,
    options JSONB DEFAULT '[]',
    range_min DOUBLE PRECISION,
    range_max DOUBLE PRECISION,
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, key)
);

-- Product attribute values (e.g. product X has RAM = "8GB")
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES category_attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, attribute_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_attributes_category_id ON category_attributes(category_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product_id ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);

SELECT 'Tables created successfully' AS result;
