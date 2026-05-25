import { Router } from 'express';
import { UploadController } from './upload.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { upload } from '../../shared/utils/upload';

const router = Router();

router.post('/image', authenticate, upload.single('image'), UploadController.uploadImage);
router.post('/multiple', authenticate, upload.array('images', 10), UploadController.uploadMultiple);

export default router;