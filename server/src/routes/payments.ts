import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

paymentsRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

paymentsRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

paymentsRouter.post('/', requireRole('Admin', 'Sales', 'Accountant'), async (req, res): Promise<void> => {
  try {
    const { client_id, invoice_id, amount, currency = 'USD', date, method = '', reference = '', notes = '' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO payments (client_id,invoice_id,amount,currency,date,method,reference,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [client_id, invoice_id, amount, currency, date, method, reference, notes]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});
