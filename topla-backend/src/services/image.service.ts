import sharp from 'sharp';

export interface ProcessedImage {
  /** Optimized original (max 1200px) */
  original: Buffer;
  /** Medium size (600px) for listings */
  medium: Buffer;
  /** Thumbnail (200px) for grids */
  thumbnail: Buffer;
  /** All in WebP format */
  contentType: 'image/webp';
  /** File extension */
  ext: 'webp';
}

export interface ImageVariant {
  suffix: string;
  buffer: Buffer;
  width: number;
}

/**
 * Process uploaded image into 3 optimized WebP variants:
 * - original: max 1200px wide, quality 80
 * - medium: max 600px wide, quality 75
 * - thumbnail: max 200px wide, quality 70
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  // Get metadata to avoid upscaling
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 1200;

  // Original — max 1200px, WebP quality 80
  const original = await sharp(buffer)
    .resize({
      width: Math.min(width, 1200),
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  // Medium — max 600px, WebP quality 75
  const medium = await sharp(buffer)
    .resize({
      width: Math.min(width, 600),
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toBuffer();

  // Thumbnail — max 200px, WebP quality 70
  const thumbnail = await sharp(buffer)
    .resize({
      width: Math.min(width, 200),
      withoutEnlargement: true,
    })
    .webp({ quality: 70 })
    .toBuffer();

  return {
    original,
    medium,
    thumbnail,
    contentType: 'image/webp',
    ext: 'webp',
  };
}

/**
 * Process image into all 3 variants with named suffixes
 */
export async function processImageVariants(buffer: Buffer): Promise<ImageVariant[]> {
  const processed = await processImage(buffer);

  return [
    { suffix: '', buffer: processed.original, width: 1200 },
    { suffix: '_md', buffer: processed.medium, width: 600 },
    { suffix: '_thumb', buffer: processed.thumbnail, width: 200 },
  ];
}

/**
 * Quick single-variant optimization (for avatars, logos)
 */
export async function optimizeSingleImage(
  buffer: Buffer,
  maxWidth: number = 800,
  quality: number = 80,
): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || maxWidth;

  return sharp(buffer)
    .resize({
      width: Math.min(width, maxWidth),
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}
