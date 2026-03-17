-- P-FIX-04 + P-06: Product schema extension
-- Add slug, barcode, videoUrl, dimensions, tags, SEO fields

-- SEO & URL fields
ALTER TABLE "products" ADD COLUMN "slug" TEXT;
ALTER TABLE "products" ADD COLUMN "meta_title" TEXT;
ALTER TABLE "products" ADD COLUMN "meta_description" TEXT;

-- Video
ALTER TABLE "products" ADD COLUMN "video_url" TEXT;

-- Barcode
ALTER TABLE "products" ADD COLUMN "barcode" TEXT;

-- Dimensions (cm)
ALTER TABLE "products" ADD COLUMN "width" DECIMAL(8,2);
ALTER TABLE "products" ADD COLUMN "height" DECIMAL(8,2);
ALTER TABLE "products" ADD COLUMN "length" DECIMAL(8,2);

-- Tags
ALTER TABLE "products" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Indexes
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_barcode_idx" ON "products"("barcode");
CREATE INDEX "products_slug_idx" ON "products"("slug");
