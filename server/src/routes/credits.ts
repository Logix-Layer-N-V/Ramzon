import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const creditsRouter = Router();
creditsRouter.use(requireAuth);

creditsRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM credits ORDER BY date DESC');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

creditsRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM credits WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

creditsRouter.post('/', requireRole('Admin', 'Accountant'), async (req, res): Promise<void> => {
  try {
    const { client_id, amount, currency = 'USD', date, reason = '' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO credits (client_id,amount,currency,date,reason) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [client_id, amount, currency, date, reason]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});
