-- CreateTable: sizes
CREATE TABLE "sizes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_uz" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- AlterTable: colors - add sort_order
ALTER TABLE "colors" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: products - add has_variants flag
ALTER TABLE "products" ADD COLUMN "has_variants" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: product_variants
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "color_id" UUID,
    "size_id" UUID,
    "price" DECIMAL(12,2) NOT NULL,
    "compare_at_price" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "images" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_color_id_size_id_key" ON "product_variants"("product_id", "color_id", "size_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_is_active_idx" ON "product_variants"("product_id", "is_active");

-- CreateIndex
CREATE INDEX "product_variants_color_id_idx" ON "product_variants"("color_id");

-- CreateIndex
CREATE INDEX "product_variants_size_id_idx" ON "product_variants"("size_id");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: cart_items - add variant_id
ALTER TABLE "cart_items" ADD COLUMN "variant_id" UUID;

-- DropIndex: old unique constraint on cart_items
DROP INDEX IF EXISTS "cart_items_user_id_product_id_key";

-- CreateIndex: new unique constraint on cart_items (with variant)
CREATE UNIQUE INDEX "cart_items_user_id_product_id_variant_id_key" ON "cart_items"("user_id", "product_id", "variant_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: order_items - add variant fields
ALTER TABLE "order_items" ADD COLUMN "variant_id" UUID;
ALTER TABLE "order_items" ADD COLUMN "variant_label" TEXT;

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
