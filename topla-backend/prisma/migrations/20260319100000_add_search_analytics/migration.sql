-- CreateTable: SearchAnalytics (Qidiruv analitikasi)
CREATE TABLE "search_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query" TEXT NOT NULL,
    "product_id" UUID,
    "action" TEXT NOT NULL,
    "position" INTEGER,
    "engine" TEXT,
    "user_id" UUID,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_analytics_query_action_idx" ON "search_analytics"("query", "action");
CREATE INDEX "search_analytics_product_id_idx" ON "search_analytics"("product_id");
CREATE INDEX "search_analytics_created_at_idx" ON "search_analytics"("created_at");
