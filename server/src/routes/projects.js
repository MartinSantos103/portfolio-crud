import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.status(501).json({ message: 'Pendiente de implementar' }));
export default router;