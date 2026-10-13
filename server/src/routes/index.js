// server/src/routes/index.js
import { Router } from 'express';
import { query } from '../db/pool.js';
import auth from './auth.js';
import profile from './profile.js';
import services from './services.js';
import projects from './projects.js';
import demos from './demos.js';
import messages from './messages.js';
import users from './users.js';
import metrics from './metrics.js';
import uploads from './uploads.js';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'API funcionando', time: new Date().toISOString() });
});

router.get('/health', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT now() AS now');
    res.json({ ok: true, dbTime: rows[0].now });
  } catch (err) {
    next(err);
  }
});

router.use('/auth', auth);
router.use('/profile', profile);
router.use('/services', services);
router.use('/projects', projects);
router.use('/demos', demos);
router.use('/messages', messages);
router.use('/users', users);
router.use('/metrics', metrics);
router.use('/uploads', uploads);

export default router;