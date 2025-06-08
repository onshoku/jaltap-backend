import { Router } from "express";
import multer from 'multer';
import { exportMatchingRecords, getDocumentById, getDocumentsByUserAndTime, payment, saveForm, submitForm } from "../main/jlpt/controllers/submitForm";
import { DocumentController, getPresignedURL, uploadPresignedURL } from "../main/jlpt/controllers/upload.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 500 // 500KB max (for ID proof)
  }
});

// Example JLPT routes
router.post('/submit', submitForm);
router.post('/save', saveForm);
router.post('/export', exportMatchingRecords);

router.post('/payment', payment);

const documentController = new DocumentController();

router.get(
  '/:id',  getDocumentById
);
router.post('/',getDocumentsByUserAndTime)
router.post(
  '/upload',
  upload.single('file'),
  documentController.uploadDocument
);
router.post(
  '/upload/url',
  uploadPresignedURL
);
router.get(
  '/download/:s3Key',
  getPresignedURL
);
export default router;