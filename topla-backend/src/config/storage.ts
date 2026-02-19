import { Client as MinioClient } from 'minio';
import { env } from './env.js';

let storageClient: MinioClient | null = null;

export function initStorage(): MinioClient | null {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
    console.warn('⚠️ S3 storage not configured');
    return null;
  }

  storageClient = new MinioClient({
    endPoint: env.S3_ENDPOINT.replace('https://', '').replace('http://', ''),
    useSSL: env.S3_ENDPOINT.startsWith('https'),
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    region: env.S3_REGION,
  });

  console.log('✅ S3 Storage initialized');
  return storageClient;
}

export function getStorageClient(): MinioClient | null {
  return storageClient;
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  bucket: string,
  fileName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!storageClient) throw new Error('Storage not initialized');

  await storageClient.putObject(bucket, fileName, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  return `${env.S3_ENDPOINT}/${bucket}/${fileName}`;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(
  bucket: string,
  fileName: string,
): Promise<void> {
  if (!storageClient) throw new Error('Storage not initialized');
  await storageClient.removeObject(bucket, fileName);
}

