import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

clientsRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

clientsRouter.post('/', requireRole('Admin', 'Sales'), async (req, res): Promise<void> => {
  try {
    const { name, company = '', email = '', vat_number = '', address = '', phone = '', preferred_currency = 'USD' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO clients (name,company,email,vat_number,address,phone,preferred_currency) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, company, email, vat_number, address, phone, preferred_currency]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

clientsRouter.put('/:id', requireRole('Admin', 'Sales'), async (req, res): Promise<void> => {
  try {
    const { name, company, email, vat_number, address, phone, status } = req.body;
    const { rows } = await pool.query(
      'UPDATE clients SET name=$1,company=$2,email=$3,vat_number=$4,address=$5,phone=$6,status=$7 WHERE id=$8 RETURNING *',
      [name, company, email, vat_number, address, phone, status, req.params.id]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

clientsRouter.delete('/:id', requireRole('Admin'), async (req, res): Promise<void> => {
  try {
    await pool.query('DELETE FROM clients WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});
