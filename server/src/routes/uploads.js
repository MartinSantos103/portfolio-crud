import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadImageToCloudinary } from '../services/cloudinary.js';

const router = Router();

/**
 * POST /api/uploads
 * Sube una imagen a Cloudinary (o la valida en modo desarrollo) y devuelve su URL.
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { image, file, url, folder = 'portfolio' } = req.body ?? {};
    const payload = image || file || url;

    const result = await uploadImageToCloudinary(payload, folder);
    return res.status(201).json({
      ok: true,
      url: result.url,
      provider: result.provider,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        ok: false,
        error: {
          code: err.code || 'UPLOAD_ERROR',
          message: err.message,
        },
      });
    }
    next(err);
  }
});

export default router;
