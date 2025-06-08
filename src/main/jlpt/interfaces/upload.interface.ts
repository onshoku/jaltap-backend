export type DocumentType = 'photo' | 'signature' | 'id_proof';

export interface DocumentSpecs {
  allowedTypes: string[];
  maxSize: number;
  requiredDimensions?: { width: number; height: number };
  metadata: {
    documentType: DocumentType;
    [key: string]: string;
  };
}

export interface UploadDocumentRequest {
  documentType: DocumentType;
  file: Express.Multer.File;
  registrationId: string;
  userId: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  documentUrl?: string;
  metadata?: {
    fileSize: number;
    fileType: string;
    dimensions?: { width: number; height: number };
    uploadDate: string;
  };
  error?: string;
  code?: string;
}

export interface S3UploadParams {
  Bucket: string;
  Key: string;
  Body: Buffer;
  ContentType: string;
  Metadata: {
    [key: string]: string;
  };
}