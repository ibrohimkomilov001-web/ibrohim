-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable: user_search_history
CREATE TABLE "user_search_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on user_id + query
CREATE UNIQUE INDEX "user_search_history_user_id_query_key" ON "user_search_history"("user_id", "query");

-- CreateIndex: for fast history lookups
CREATE INDEX "user_search_history_user_id_searched_at_idx" ON "user_search_history"("user_id", "searched_at" DESC);

-- AddForeignKey
ALTER TABLE "user_search_history" ADD CONSTRAINT "user_search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GIN trigram indexes for fast ILIKE text search on products
CREATE INDEX "products_name_uz_trgm_idx" ON "products" USING GIN ("name_uz" gin_trgm_ops);
CREATE INDEX "products_name_ru_trgm_idx" ON "products" USING GIN ("name_ru" gin_trgm_ops);
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- GIN trigram index on search_queries for fast autocomplete
CREATE INDEX "search_queries_query_trgm_idx" ON "search_queries" USING GIN ("query" gin_trgm_ops);
