import { Request, Response, NextFunction } from 'express';

export class UploadController {
  /**
   * POST /api/upload/image
   * Subir una imagen
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No se subió ninguna imagen' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.status(201).json({
        status: 'success',
        data: {
          url: imageUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/upload/multiple
   * Subir múltiples imágenes (para fotos antes/después)
   */
  static async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No se subieron imágenes' });
      }

      const images = files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
      }));

      res.status(201).json({ status: 'success', data: images });
    } catch (error) {
      next(error);
    }
  }
}