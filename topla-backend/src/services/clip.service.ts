// ============================================
// CLIP Image Search Service
// Integrates with CLIP microservice for image embeddings
// and pgvector for vector similarity search
// ============================================

import { env } from '../config/env.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

const CLIP_URL = env.CLIP_SERVICE_URL;

interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
}

/**
 * Get CLIP embedding from an image buffer
 */
export async function getImageEmbedding(imageBuffer: Buffer, filename = 'image.jpg'): Promise<number[]> {
  if (!CLIP_URL) throw new Error('CLIP_SERVICE_URL not configured');

  // Determine MIME type from filename extension
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  const formData = new FormData();
  formData.append('file', new Blob([imageBuffer], { type: mimeType }), filename);

  const res = await fetch(`${CLIP_URL}/embed/image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CLIP embed/image failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as EmbeddingResponse;
  return data.embedding;
}

/**
 * Get CLIP embedding from an image URL
 */
export async function getImageEmbeddingFromUrl(imageUrl: string): Promise<number[]> {
  if (!CLIP_URL) throw new Error('CLIP_SERVICE_URL not configured');

  const formData = new FormData();
  formData.append('url', imageUrl);

  const res = await fetch(`${CLIP_URL}/embed/url`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CLIP embed/url failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as EmbeddingResponse;
  return data.embedding;
}

/**
 * Get CLIP embedding from text
 */
export async function getTextEmbedding(text: string): Promise<number[]> {
  if (!CLIP_URL) throw new Error('CLIP_SERVICE_URL not configured');

  const formData = new FormData();
  formData.append('text', text);

  const res = await fetch(`${CLIP_URL}/embed/text`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`CLIP embed/text failed (${res.status}): ${txt}`);
  }

  const data = (await res.json()) as EmbeddingResponse;
  return data.embedding;
}

/**
 * Search products by image embedding using pgvector cosine similarity.
 * Returns products sorted by visual similarity.
 */
export async function searchProductsByEmbedding(
  embedding: number[],
  limit = 20,
  offset = 0,
): Promise<{ id: string; similarity: number }[]> {
  const vectorStr = `[${embedding.join(',')}]`;

  const results = await prisma.$queryRaw<{ id: string; similarity: number }[]>(Prisma.sql`
    SELECT id, 1 - (embedding <=> ${vectorStr}::vector) as similarity
     FROM products
     WHERE embedding IS NOT NULL
       AND is_active = true
       AND status = 'active'
       AND deleted_at IS NULL
     ORDER BY embedding <=> ${vectorStr}::vector
     LIMIT ${limit} OFFSET ${offset}
  `);

  return results;
}

/**
 * Generate and store embedding for a product from its first image
 */
export async function generateProductEmbedding(productId: string): Promise<void> {
  if (!CLIP_URL) return; // silently skip if CLIP not configured

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, images: true, thumbnailUrl: true },
  });

  if (!product) return;

  const imagePath = product.thumbnailUrl || product.images?.[0];
  if (!imagePath) return;

  // Build a full URL reachable from the CLIP container
  const baseUrl = process.env.BASE_URL || 'https://topla.uz';
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;

  try {
    const embedding = await getImageEmbeddingFromUrl(imageUrl);
    const vectorStr = `[${embedding.join(',')}]`;

    await prisma.$executeRawUnsafe(
      `UPDATE products SET embedding = $1::vector WHERE id = $2::uuid`,
      vectorStr,
      productId,
    );
  } catch (err) {
    console.error(`Failed to generate embedding for product ${productId}:`, err);
  }
}

/**
 * Check if CLIP service is available
 */
export async function isClipAvailable(): Promise<boolean> {
  if (!CLIP_URL) return false;
  try {
    const res = await fetch(`${CLIP_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { model_loaded: boolean };
    return data.model_loaded === true;
  } catch {
    return false;
  }
}
