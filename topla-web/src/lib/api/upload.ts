import api from './client';

export interface UploadResponse {
  url: string;
  path: string;
  filename: string;
}

export interface MultiUploadResponse {
  urls?: string[];
  paths?: string[];
  files?: Array<{ url: string; fileName: string; size: number }>;
  count?: number;
}

/**
 * Resolve relative image URLs (e.g. /uploads/...) to full absolute URLs
 * using the API server origin. S3 URLs (https://...) are returned as-is.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  // Next.js Image needs absolute URLs to match remotePatterns
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_API_URL || '').origin;
    return `${origin}${url}`;
  } catch {
    return url;
  }
}

export const uploadApi = {
  uploadImage: async (file: File, folder: string = 'product'): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return api.upload<UploadResponse>('/upload/image', formData);
  },

  uploadImages: async (files: File[], folder: string = 'product'): Promise<MultiUploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('folder', folder);
    return api.upload<MultiUploadResponse>('/upload/images', formData);
  },
};

export default uploadApi;
