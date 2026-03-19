import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const estimatesRouter = Router();
estimatesRouter.use(requireAuth);

estimatesRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM estimates ORDER BY created_at DESC');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

estimatesRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM estimates WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    const { rows: items } = await pool.query('SELECT * FROM estimate_items WHERE estimate_id=$1', [req.params.id]);
    res.json({ ...rows[0], items });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

estimatesRouter.post('/', requireRole('Admin', 'Sales'), async (req, res): Promise<void> => {
  try {
    const {
      estimate_number, client_id, client_name, date, valid_until,
      currency = 'USD', subtotal = 0, tax_amount = 0, total = 0,
      status = 'Draft', notes = '', rep = '', items = []
    } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO estimates (estimate_number,client_id,client_name,date,valid_until,currency,subtotal,tax_amount,total,status,notes,rep) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [estimate_number, client_id, client_name, date, valid_until, currency, subtotal, tax_amount, total, status, notes, rep]
    );
    const estimate = rows[0];
    for (const item of items as Array<{ description: string; quantity: number; unit_price: number; total: number }>) {
      await pool.query(
        'INSERT INTO estimate_items (estimate_id,description,quantity,unit_price,total) VALUES ($1,$2,$3,$4,$5)',
        [estimate.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }
    res.status(201).json(estimate);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

estimatesRouter.put('/:id', requireRole('Admin', 'Sales'), async (req, res): Promise<void> => {
  try {
    const { status, notes } = req.body;
    const { rows } = await pool.query(
      'UPDATE estimates SET status=$1,notes=$2 WHERE id=$3 RETURNING *',
      [status, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

estimatesRouter.delete('/:id', requireRole('Admin'), async (req, res): Promise<void> => {
  try {
    await pool.query('DELETE FROM estimates WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});
