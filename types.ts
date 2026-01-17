
export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultName?: string;
}

export interface ConversionConfig {
  quality: number;
}
