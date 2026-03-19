import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

expensesRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

expensesRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM expenses WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

expensesRouter.post('/', requireRole('Admin', 'Accountant'), async (req, res): Promise<void> => {
  try {
    const { category, vendor = '', amount, currency = 'USD', date, description = '' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO expenses (category,vendor,amount,currency,date,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [category, vendor, amount, currency, date, description]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

expensesRouter.put('/:id', requireRole('Admin', 'Accountant'), async (req, res): Promise<void> => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query('UPDATE expenses SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});
