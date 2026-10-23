import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, active, created_at FROM users ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
