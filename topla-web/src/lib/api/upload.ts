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
