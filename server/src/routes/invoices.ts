import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

invoicesRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

invoicesRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    const { rows: items } = await pool.query('SELECT * FROM invoice_items WHERE invoice_id=$1', [req.params.id]);
    res.json({ ...rows[0], items });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

invoicesRouter.post('/', requireRole('Admin', 'Sales'), async (req, res): Promise<void> => {
  try {
    const {
      invoice_number, client_id, client_name, date, due_date,
      currency = 'USD', subtotal = 0, tax_amount = 0, total_amount = 0,
      status = 'Draft', notes = '', rep = '', paid_amount = 0, items = []
    } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO invoices (invoice_number,client_id,client_name,date,due_date,currency,subtotal,tax_amount,total_amount,status,notes,rep,paid_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [invoice_number, client_id, client_name, date, due_date, currency, subtotal, tax_amount, total_amount, status, notes, rep, paid_amount]
    );
    const invoice = rows[0];
    for (const item of items as Array<{ description: string; quantity: number; unit_price: number; total: number }>) {
      await pool.query(
        'INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,total) VALUES ($1,$2,$3,$4,$5)',
        [invoice.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }
    res.status(201).json(invoice);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

invoicesRouter.put('/:id', requireRole('Admin', 'Sales'), async (req, res): Promise<void> => {
  try {
    const { status, paid_amount, notes } = req.body;
    const { rows } = await pool.query(
      'UPDATE invoices SET status=$1,paid_amount=$2,notes=$3 WHERE id=$4 RETURNING *',
      [status, paid_amount, notes, req.params.id]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

invoicesRouter.delete('/:id', requireRole('Admin'), async (req, res): Promise<void> => {
  try {
    await pool.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});
