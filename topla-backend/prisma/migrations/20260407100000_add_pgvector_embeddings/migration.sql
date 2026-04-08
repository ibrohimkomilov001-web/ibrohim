-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add CLIP embedding column (512 dimensions) to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(512);

-- Create HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS products_embedding_idx ON products USING hnsw (embedding vector_cosine_ops);
