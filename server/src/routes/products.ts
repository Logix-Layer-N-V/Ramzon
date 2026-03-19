import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const productsRouter = Router();
productsRouter.use(requireAuth);

productsRouter.get('/', async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

productsRouter.get('/:id', async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!rows[0]) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

productsRouter.post('/', requireRole('Admin'), async (req, res): Promise<void> => {
  try {
    const { name, wood_type = '', unit = 'pcs', price_per_unit, stock = 0, category = '', sku = '' } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO products (name,wood_type,unit,price_per_unit,stock,category,sku) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, wood_type, unit, price_per_unit, stock, category, sku]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

productsRouter.put('/:id', requireRole('Admin'), async (req, res): Promise<void> => {
  try {
    const { name, wood_type, unit, price_per_unit, stock, category, sku } = req.body;
    const { rows } = await pool.query(
      'UPDATE products SET name=$1,wood_type=$2,unit=$3,price_per_unit=$4,stock=$5,category=$6,sku=$7 WHERE id=$8 RETURNING *',
      [name, wood_type, unit, price_per_unit, stock, category, sku, req.params.id]
    );
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

productsRouter.delete('/:id', requireRole('Admin'), async (req, res): Promise<void> => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});
