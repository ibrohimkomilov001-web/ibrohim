import { FastifyInstance, FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { env } from '../../config/env.js';
import { uploadFile, getStorageClient, deleteFile } from '../../config/storage.js';
import { processImageVariants, optimizeSingleImage } from '../../services/image.service.js';

// Magic byte signatures for allowed image types
const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png':  [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif':  [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [Buffer.from('RIFF')], // full check: RIFF....WEBP
};

function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  for (const sig of signatures) {
    if (buffer.length >= sig.length && buffer.subarray(0, sig.length).equals(sig)) {
      // Additional WebP check: bytes 8-12 must be 'WEBP'
      if (mimetype === 'image/webp') {
        return buffer.length >= 12 && buffer.subarray(8, 12).toString() === 'WEBP';
      }
      return true;
    }
  }
  return false;
}

function sanitizeFolder(raw: string): string {
  return raw.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/^\/+/, '') || 'general';
}

/**
 * File Upload routes
 * POST /upload/image - Upload a single image
 * POST /upload/images - Upload multiple images (max 10)
 */
export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart support
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10,
    },
  });

  // Local uploads directory (development fallback)
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

  /**
   * Upload single image — auto-optimized to WebP with 3 variants
   * POST /upload/image
   * Returns: { url, mediumUrl, thumbnailUrl, fileName, originalSize, optimizedSize }
   */
  app.post('/upload/image', {
    preHandler: [authMiddleware, requireRole('vendor', 'admin', 'super_admin')],
  }, async (request: FastifyRequest, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: jpeg, png, webp, gif',
      });
    }

    const buffer = await data.toBuffer();

    // Validate magic bytes — prevent MIME type spoofing
    if (!validateMagicBytes(buffer, data.mimetype)) {
      return reply.status(400).send({
        error: 'File content does not match declared type',
      });
    }

    const originalSize = buffer.length;
    const baseName = randomUUID();

    // Get folder from fields
    const rawFolder = (data.fields as any)?.folder?.value as string || 'general';
    const folder = sanitizeFolder(rawFolder);

    // Determine if this is an avatar/logo (single variant) or product image (3 variants)
    const isAvatar = folder.startsWith('avatar') || folder.startsWith('shop');

    try {
      let url: string;
      let mediumUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let optimizedSize = 0;

      if (isAvatar) {
        // Single optimized variant for avatars/logos (max 800px)
        const optimized = await optimizeSingleImage(buffer, 800, 80);
        const fileName = `${baseName}.webp`;
        const filePath = `${folder}/${fileName}`;
        optimizedSize = optimized.length;

        url = await _uploadBuffer(request, filePath, optimized, 'image/webp', folder);
      } else {
        // Product images: 3 variants (original 1200px, medium 600px, thumb 200px)
        const variants = await processImageVariants(buffer);

        const urls: string[] = [];
        for (const variant of variants) {
          const fileName = `${baseName}${variant.suffix}.webp`;
          const filePath = `${folder}/${fileName}`;
          const variantUrl = await _uploadBuffer(request, filePath, variant.buffer, 'image/webp', folder);
          urls.push(variantUrl);
          optimizedSize += variant.buffer.length;
        }

        url = urls[0]!;          // original (1200px)
        mediumUrl = urls[1]!;    // medium (600px)
        thumbnailUrl = urls[2]!; // thumbnail (200px)
      }

      const savings = Math.round((1 - optimizedSize / originalSize) * 100);

      return {
        url,
        mediumUrl,
        thumbnailUrl,
        fileName: `${folder}/${baseName}.webp`,
        originalSize,
        optimizedSize,
        savings: `${savings}%`,
      };
    } catch (error: any) {
      request.log.error(error, 'File upload failed');
      return reply.status(500).send({ error: 'File upload failed' });
    }
  });

  /**
   * Helper: upload buffer to S3 or local filesystem
   */
  async function _uploadBuffer(
    request: FastifyRequest,
    filePath: string,
    buffer: Buffer,
    contentType: string,
    folder: string,
  ): Promise<string> {
    if (getStorageClient()) {
      const bucket = folder.startsWith('shop') ? env.S3_BUCKET_SHOPS
        : folder.startsWith('product') ? env.S3_BUCKET_PRODUCTS
        : folder.startsWith('avatar') ? env.S3_BUCKET_AVATARS
        : env.S3_BUCKET_PRODUCTS;

      try {
        return await uploadFile(bucket, filePath, buffer, contentType);
      } catch (s3Err: any) {
        request.log.warn({ err: s3Err.message }, 'S3 upload failed, falling back to local storage');
      }
    }

    // Local filesystem fallback
    const dir = path.join(UPLOADS_DIR, path.dirname(filePath));
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(path.join(UPLOADS_DIR, filePath), buffer);
    return `/uploads/${filePath}`;
  }

  /**
   * Upload multiple images — auto-optimized to WebP
   * POST /upload/images
   * Returns: { files: [{ url, mediumUrl, thumbnailUrl, originalSize, optimizedSize }], count }
   */
  app.post('/upload/images', {
    preHandler: [authMiddleware, requireRole('vendor', 'admin', 'super_admin')],
  }, async (request: FastifyRequest, reply) => {
    const parts = request.parts();
    const results: Array<{
      url: string;
      mediumUrl?: string;
      thumbnailUrl?: string;
      fileName: string;
      originalSize: number;
      optimizedSize: number;
    }> = [];
    let folder = 'general';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'folder') {
          folder = sanitizeFolder((part as any).value as string || 'general');
        }
        continue;
      }

      // File part
      if (!allowedTypes.includes(part.mimetype)) continue;

      const buffer = await part.toBuffer();
      if (!validateMagicBytes(buffer, part.mimetype)) continue;

      const baseName = randomUUID();
      const originalSize = buffer.length;
      const isAvatar = folder.startsWith('avatar') || folder.startsWith('shop');

      try {
        let url: string;
        let mediumUrl: string | undefined;
        let thumbnailUrl: string | undefined;
        let optimizedSize = 0;

        if (isAvatar) {
          const optimized = await optimizeSingleImage(buffer, 800, 80);
          const filePath = `${folder}/${baseName}.webp`;
          optimizedSize = optimized.length;
          url = await _uploadBuffer(request, filePath, optimized, 'image/webp', folder);
        } else {
          const variants = await processImageVariants(buffer);
          const urls: string[] = [];

          for (const variant of variants) {
            const filePath = `${folder}/${baseName}${variant.suffix}.webp`;
            const variantUrl = await _uploadBuffer(request, filePath, variant.buffer, 'image/webp', folder);
            urls.push(variantUrl);
            optimizedSize += variant.buffer.length;
          }

          url = urls[0]!;
          mediumUrl = urls[1]!;
          thumbnailUrl = urls[2]!;
        }

        results.push({
          url,
          mediumUrl,
          thumbnailUrl,
          fileName: `${folder}/${baseName}.webp`,
          originalSize,
          optimizedSize,
        });
      } catch (error: any) {
        request.log.error(error, `Failed to upload ${part.filename}`);
      }
    }

    if (results.length === 0) {
      return reply.status(400).send({ error: 'No valid files uploaded' });
    }

    return { files: results, count: results.length };
  });

  /**
   * DELETE /upload/file
   * Faylni o'chirish (S3 yoki lokal)
   */
  app.delete('/upload/file', { preHandler: [authMiddleware, requireRole('vendor', 'admin')] }, async (request, reply) => {
    const { url } = request.body as { url?: string };

    if (!url || typeof url !== 'string') {
      throw new AppError('File URL kerak', 400);
    }

    // Xavfsizlik: path traversal oldini olish
    if (url.includes('..') || url.includes('\0')) {
      throw new AppError('Noto\'g\'ri URL', 400);
    }

    try {
      if (getStorageClient()) {
        // S3 dan o'chirish — URL dan bucket va key ajratish
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) {
          throw new AppError('Noto\'g\'ri S3 URL', 400);
        }
        const bucket = pathParts[0]!;
        const key = pathParts.slice(1).join('/');

        // Xavfsizlik: faqat bizning bucket'lardan o'chirish
        const allowedBuckets = [env.S3_BUCKET_PRODUCTS, env.S3_BUCKET_SHOPS, env.S3_BUCKET_AVATARS];
        if (!allowedBuckets.includes(bucket)) {
          throw new AppError('Noto\'g\'ri bucket', 400);
        }

        await deleteFile(bucket, key);
      } else {
        // Lokal faylni o'chirish
        const { unlink } = await import('fs/promises');
        const localPath = url.replace(`http://localhost:${env.PORT}/uploads/`, '');
        const fullPath = path.join(process.cwd(), 'uploads', localPath);

        // Xavfsizlik: uploads papkasidan tashqarida emas
        if (!fullPath.startsWith(path.join(process.cwd(), 'uploads'))) {
          throw new AppError('Noto\'g\'ri fayl yo\'li', 400);
        }

        const { existsSync: fileExists } = await import('fs');
        if (!fileExists(fullPath)) {
          throw new AppError('Fayl topilmadi', 404);
        }
        await unlink(fullPath);
      }

      return reply.send({ success: true, message: 'Fayl o\'chirildi' });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      request.log.error(error, 'File delete error');
      throw new AppError('Faylni o\'chirishda xatolik', 500);
    }
  });
}
