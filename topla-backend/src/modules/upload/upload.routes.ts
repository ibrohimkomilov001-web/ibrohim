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
   * Upload single image
   * POST /upload/image
   * Body: multipart/form-data with field "file" and optional "folder" text field
   */
  app.post('/upload/image', {
    preHandler: [authMiddleware],
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

    const ext = data.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : data.mimetype.split('/')[1];
    const fileName = `${randomUUID()}.${ext}`;

    // Get folder from fields (if sent before file in multipart)
    const rawFolder = (data.fields as any)?.folder?.value as string || 'general';
    const folder = sanitizeFolder(rawFolder);
    const filePath = `${folder}/${fileName}`;

    try {
      let url: string;

      if (getStorageClient()) {
        // S3/MinIO upload
        const bucket = folder.startsWith('shop') ? env.S3_BUCKET_SHOPS
          : folder.startsWith('product') ? env.S3_BUCKET_PRODUCTS
          : folder.startsWith('avatar') ? env.S3_BUCKET_AVATARS
          : env.S3_BUCKET_PRODUCTS;

        try {
          url = await uploadFile(bucket, filePath, buffer, data.mimetype);
        } catch (s3Err: any) {
          // S3 xato bo'lsa — local fallback
          request.log.warn({ err: s3Err.message }, 'S3 upload failed, falling back to local storage');
          const dir = path.join(UPLOADS_DIR, folder);
          if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
          }
          await writeFile(path.join(dir, fileName), buffer);
          url = `/uploads/${folder}/${fileName}`;
        }
      } else {
        // Local file system (development)
        const dir = path.join(UPLOADS_DIR, folder);
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }
        await writeFile(path.join(dir, fileName), buffer);
        url = `/uploads/${folder}/${fileName}`;
      }

      return { url, fileName: filePath, size: buffer.length };
    } catch (error: any) {
      request.log.error(error, 'File upload failed');
      return reply.status(500).send({ error: 'File upload failed' });
    }
  });

  /**
   * Upload multiple images
   * POST /upload/images
   * Body: multipart/form-data with multiple "files" fields and optional "folder"
   */
  app.post('/upload/images', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply) => {
    const parts = request.parts();
    const results: Array<{ url: string; fileName: string; size: number }> = [];
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
      if (!allowedTypes.includes(part.mimetype)) {
        continue; // Skip invalid files
      }

      const buffer = await part.toBuffer();

      // Validate magic bytes
      if (!validateMagicBytes(buffer, part.mimetype)) {
        continue; // Skip files with spoofed MIME types
      }

      const ext = part.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : part.mimetype.split('/')[1];
      const fileName = `${randomUUID()}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      try {
        let url: string;

        if (getStorageClient()) {
          const bucket = folder.startsWith('shop') ? env.S3_BUCKET_SHOPS
            : folder.startsWith('product') ? env.S3_BUCKET_PRODUCTS
            : folder.startsWith('avatar') ? env.S3_BUCKET_AVATARS
            : env.S3_BUCKET_PRODUCTS;

          try {
            url = await uploadFile(bucket, filePath, buffer, part.mimetype);
          } catch (s3Err: any) {
            request.log.warn({ err: s3Err.message }, 'S3 upload failed, falling back to local storage');
            const dir = path.join(UPLOADS_DIR, folder);
            if (!existsSync(dir)) {
              await mkdir(dir, { recursive: true });
            }
            await writeFile(path.join(dir, fileName), buffer);
            url = `/uploads/${folder}/${fileName}`;
          }
        } else {
          const dir = path.join(UPLOADS_DIR, folder);
          if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
          }
          await writeFile(path.join(dir, fileName), buffer);
          url = `/uploads/${folder}/${fileName}`;
        }

        results.push({ url, fileName: filePath, size: buffer.length });
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
