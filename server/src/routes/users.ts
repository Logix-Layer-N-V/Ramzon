import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get('/', requireRole('Admin'), async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, status, avatar, joined_date FROM users ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});
