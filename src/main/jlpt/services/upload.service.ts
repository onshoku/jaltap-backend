import AWS from 'aws-sdk';
import sizeOf from 'image-size';
import { v4 as uuidv4 } from 'uuid';
import { DocumentType, DocumentSpecs, S3UploadParams, UploadDocumentResponse } from '../interfaces/upload.interface';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class DocumentService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    this.bucketName = process.env.S3_BUCKET_NAME || '';
  }

  private readonly DOC_SPECS: Record<DocumentType, DocumentSpecs> = {
    photo: {
      allowedTypes: ['image/jpeg', 'image/jpg'],
      maxSize: 50 * 1024, // 50KB
      requiredDimensions: { width: 350, height: 450 }, // 3.5cm x 4.5cm at 100dpi
      metadata: { documentType: 'photo' }
    },
    signature: {
      allowedTypes: ['image/png', 'image/jpeg'],
      maxSize: 30 * 1024, // 30KB
      requiredDimensions: { width: 600, height: 300 }, // 6cm x 3cm at 100dpi
      metadata: { documentType: 'signature' }
    },
    id_proof: {
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize: 500 * 1024, // 500KB
      metadata: { documentType: 'id_proof' }
    }
  };

  private validateFile(documentType: DocumentType, file: Express.Multer.File): UploadDocumentResponse | null {
    const specs = this.DOC_SPECS[documentType];

    // Validate file type
    if (!specs.allowedTypes.includes(file.mimetype)) {
      return {
        success: false,
        error: `Invalid file type. Only ${specs.allowedTypes.join(', ')} allowed for ${documentType}.`,
        code: 'INVALID_FILE_TYPE'
      };
    }

    // Validate file size
    if (file.size > specs.maxSize) {
      return {
        success: false,
        error: `File too large. Max ${specs.maxSize / 1024}KB allowed for ${documentType}.`,
        code: 'FILE_TOO_LARGE'
      };
    }

    // Validate image dimensions (if applicable)
    if (specs.requiredDimensions && !file.mimetype.includes('pdf')) {
      try {
        const dimensions = sizeOf(file.buffer);
        
        if (dimensions.width !== specs.requiredDimensions.width || 
            dimensions.height !== specs.requiredDimensions.height) {
          return {
            success: false,
            error: `Invalid dimensions. Required: ${specs.requiredDimensions.width}x${specs.requiredDimensions.height} pixels.`,
            code: 'INVALID_DIMENSIONS'
          };
        }
      } catch (err) {
        return {
          success: false,
          error: 'Could not read image dimensions',
          code: 'DIMENSION_READ_ERROR'
        };
      }
    }

    return null;
  }

  private generateS3Key(userId: string, documentType: DocumentType, originalName: string): string {
    const fileExtension = originalName.split('.').pop();
    return `documents/${userId}/${documentType}/${uuidv4()}.${fileExtension}`;
  }

  public async uploadDocument(
    userId: string,
    registrationId: string,
    documentType: DocumentType,
    file: Express.Multer.File
  ): Promise<UploadDocumentResponse> {
    try {
      // Validate document type
      if (!(documentType in this.DOC_SPECS)) {
        return {
          success: false,
          error: 'Invalid document type',
          code: 'INVALID_DOCUMENT_TYPE'
        };
      }

      // Validate file against specs
      const validationError = this.validateFile(documentType, file);
      if (validationError) return validationError;

      const specs = this.DOC_SPECS[documentType];
      const s3Key = this.generateS3Key(userId, documentType, file.originalname);

      // Prepare S3 upload params
      const params: S3UploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          ...specs.metadata,
          userId,
          registrationId,
          originalName: file.originalname,
          uploadDate: new Date().toISOString()
        }
      };

      // Upload to S3
      const s3Response = await this.s3.upload(params).promise();

      // Return success response
      return {
        success: true,
        documentUrl: s3Response.Location,
        metadata: {
          fileSize: file.size,
          fileType: file.mimetype,
          ...(specs.requiredDimensions ? { dimensions: specs.requiredDimensions } : {}),
          uploadDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'Internal server error during upload',
        code: 'UPLOAD_ERROR'
      };
    }
  }

  public async generatePresignedUploadUrl(
  userId: string,
  registrationId: string,
  documentType: DocumentType,
  fileName: string,
  mimeType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  if (!(documentType in this.DOC_SPECS)) {
    throw new Error('Invalid document type');
  }

  const key = this.generateS3Key(userId, documentType, fileName);

//   const command = new PutObjectCommand({
//     Bucket: this.bucketName,
//     Key: key,
//     ContentType: mimeType,
//     Metadata: {
//       userId,
//       registrationId,
//       documentType,
//       originalName: fileName,
//       uploadDate: new Date().toISOString()
//     }
//   });

  const params = {
  Bucket: this.bucketName,
  Key: key,
  Expires: 60,
  ContentType: 'image/jpeg'
};

  const uploadUrl = this.s3.getSignedUrl('putObject', params); // ✅ this is for v2

  return { uploadUrl, s3Key: key };
}
}