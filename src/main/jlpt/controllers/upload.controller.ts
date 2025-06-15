import { Request, Response } from 'express';
import { DocumentService } from '../services/upload.service';
import { UploadDocumentResponse } from '../interfaces/upload.interface';

export class DocumentController {
  private documentService!: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  public uploadDocument = async (req: Request, res: Response) => {
    try {
      const { documentType, registrationId, userId } = req.body;
      const file = req.file;

      if (!file) {
         res.status(400).json({
          success: false,
          error: 'No file uploaded',
          code: 'NO_FILE'
        });
        return;
      }

      const result = await this.documentService.uploadDocument(
        userId,
        registrationId,
        documentType as 'photo' | 'signature' | 'id_proof',
        file
      );

      if (!result.success) {
         res.status(400).json(result);
         return
      }

      res.json(result);
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }; 
  
//   public uploadPresignedURL = async (req: Request, res: Response) => {
    
//   };


}

export const uploadPresignedURL = async (req: Request, res: Response): Promise<void> => {
const { userId, registrationId, documentType, fileName, mimeType } = req.body;

  try {
    const documentService = new DocumentService();
    const { uploadUrl, s3Key } = await documentService.generatePresignedUploadUrl(
      userId,
      registrationId,
      documentType,
      fileName,
      mimeType
    );

    res.json({
      success: true,
      uploadUrl,
      s3Key,
      publicUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate URL' });
  }

  
}

export const getPresignedURL = async (req: Request, res: Response): Promise<void> =>{
  try {
    console.log(req.params);
    
    const { s3Key } = req.params;
    

    // Proper null check with TypeScript narrowing
    if (!s3Key || typeof s3Key !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Valid s3Key parameter is required',
        code: 'INVALID_PARAM'
      });
      return;
    }

    const decodedKey = decodeURIComponent(s3Key);
    const documentService = new DocumentService()
    const presignedUrl = documentService.generatePresignedViewUrl(decodedKey);
    
    res.json({
      success: true,
      imageUrl: presignedUrl,
      expiresAt: new Date(Date.now() + 360000 * 1000).toISOString()
    });
    
  } catch (error) {
    console.error('Get secure URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate secure URL',
      code: 'URL_GENERATION_ERROR'
    });
  }
  };
