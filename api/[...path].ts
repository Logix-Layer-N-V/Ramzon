import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/* ── Inline helpers (no external _lib imports) ──────────────────────────── */

let _sql: ReturnType<typeof neon> | null = null;
function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.STORAGE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('No database URL found');
    _sql = neon(url);
  }
  return _sql;
}

interface AuthUser { id: string; role: string; name: string }

function getAuthUser(req: VercelRequest): AuthUser | null {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser; }
  catch { return null; }
}

function signAccess(p: AuthUser): string {
  return jwt.sign(p, process.env.JWT_SECRET!, { expiresIn: '15m' });
}
function signRefresh(p: AuthUser): string {
  return jwt.sign(p, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}
function hasRole(u: AuthUser, roles: string[]): boolean {
  return roles.includes(u.role);
}

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

/* ── Main handler ───────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Vercel catch-all [...]path]: key in req.query is '...path'
  const pathParam = req.query['...path'] || req.query.path;
  const segments = Array.isArray(pathParam) ? pathParam
    : typeof pathParam === 'string' ? pathParam.split('/')
    : (req.url || '').replace(/^\/api\/?/, '').split('?')[0].split('/').filter(Boolean);
  const [resource, id] = segments;
  const m = req.method || 'GET';

  try {
    switch (resource) {
      case 'auth':      return handleAuth(req, res, id, m);
      case 'clients':   return handleClients(req, res, id, m);
      case 'invoices':  return handleInvoices(req, res, id, m);
      case 'estimates': return handleEstimates(req, res, id, m);
      case 'payments':  return handlePayments(req, res, id, m);
      case 'credits':   return handleCredits(req, res, id, m);
      case 'expenses':  return handleExpenses(req, res, id, m);
      case 'products':  return handleProducts(req, res, id, m);
      case 'users':     return handleUsers(req, res, id, m);
      case 'health':    return res.json({ status: 'ok' });
      default:          return res.status(404).json({ error: 'Not found' });
    }
  } catch (e: any) {
    console.error('API Error:', e);
    return res.status(500).json({ error: 'Server error', message: e.message });
  }
}

/* ── AUTH ────────────────────────────────────────────────────────────────── */

async function handleAuth(req: VercelRequest, res: VercelResponse, sub: string, m: string) {
  if (sub === 'login' && m === 'POST') {
    const { email, password } = req.body ?? {};
    const sql = getSql();
    const rows = await sql`SELECT id, email, role, name, status, password FROM users WHERE email=${email}`;
    const user = rows[0] as any;
    if (!user || user.status !== 'Active')
      return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' });
    const payload: AuthUser = { id: user.id, role: user.role, name: user.name };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Max-Age=${7 * 86400}; Path=/${secure}`);
    return res.json({ accessToken, user: payload });
  }
  if (sub === 'refresh' && m === 'POST') {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    try {
      const p = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthUser;
      return res.json({ accessToken: signAccess({ id: p.id, role: p.role, name: p.name }) });
    } catch { return res.status(401).json({ error: 'Invalid refresh token' }); }
  }
  if (sub === 'logout' && m === 'POST') {
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');
    return res.json({ ok: true });
  }
  if (sub === 'me' && m === 'GET') {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json({ user });
  }
  return res.status(404).json({ error: 'Not found' });
}

/* ── CLIENTS ────────────────────────────────────────────────────────────── */

async function handleClients(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM clients ORDER BY name`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const { name, company = '', email = '', vat_number = '', address = '', phone = '', preferred_currency = 'USD' } = req.body;
      const rows = await sql`INSERT INTO clients (name,company,email,vat_number,address,phone,preferred_currency) VALUES (${name},${company},${email},${vat_number},${address},${phone},${preferred_currency}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM clients WHERE id=${id}`;
      return rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const { name, company, email, vat_number, address, phone, status } = req.body;
      const rows = await sql`UPDATE clients SET name=${name},company=${company},email=${email},vat_number=${vat_number},address=${address},phone=${phone},status=${status} WHERE id=${id} RETURNING *`;
      return res.json(rows[0]);
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM clients WHERE id=${id}`;
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── INVOICES ───────────────────────────────────────────────────────────── */

async function handleInvoices(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM invoices ORDER BY created_at DESC`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const { invoice_number, client_id, client_name, date, due_date, currency = 'USD', subtotal = 0, tax_amount = 0, total_amount = 0, status = 'Draft', notes = '', rep = '', paid_amount = 0, items = [] } = req.body;
      const rows = await sql`INSERT INTO invoices (invoice_number,client_id,client_name,date,due_date,currency,subtotal,tax_amount,total_amount,status,notes,rep,paid_amount) VALUES (${invoice_number},${client_id},${client_name},${date},${due_date},${currency},${subtotal},${tax_amount},${total_amount},${status},${notes},${rep},${paid_amount}) RETURNING *`;
      const inv = rows[0] as any;
      for (const item of items)
        await sql`INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,total) VALUES (${inv.id},${item.description},${item.quantity},${item.unit_price},${item.total})`;
      return res.status(201).json(inv);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM invoices WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      const items = await sql`SELECT * FROM invoice_items WHERE invoice_id=${id}`;
      return res.json({ ...rows[0], items });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const { status, paid_amount, notes } = req.body;
      const rows = await sql`UPDATE invoices SET status=${status},paid_amount=${paid_amount},notes=${notes} WHERE id=${id} RETURNING *`;
      return res.json(rows[0]);
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM invoices WHERE id=${id}`;
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── ESTIMATES ──────────────────────────────────────────────────────────── */

async function handleEstimates(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM estimates ORDER BY created_at DESC`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const { estimate_number, client_id, client_name, date, valid_until, currency = 'USD', subtotal = 0, tax_amount = 0, total = 0, status = 'Draft', notes = '', rep = '', items = [] } = req.body;
      const rows = await sql`INSERT INTO estimates (estimate_number,client_id,client_name,date,valid_until,currency,subtotal,tax_amount,total,status,notes,rep) VALUES (${estimate_number},${client_id},${client_name},${date},${valid_until},${currency},${subtotal},${tax_amount},${total},${status},${notes},${rep}) RETURNING *`;
      const est = rows[0] as any;
      for (const item of items)
        await sql`INSERT INTO estimate_items (estimate_id,description,quantity,unit_price,total) VALUES (${est.id},${item.description},${item.quantity},${item.unit_price},${item.total})`;
      return res.status(201).json(est);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM estimates WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      const items = await sql`SELECT * FROM estimate_items WHERE estimate_id=${id}`;
      return res.json({ ...rows[0], items });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const { status, notes } = req.body;
      const rows = await sql`UPDATE estimates SET status=${status},notes=${notes} WHERE id=${id} RETURNING *`;
      return res.json(rows[0]);
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM estimates WHERE id=${id}`;
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── PAYMENTS ───────────────────────────────────────────────────────────── */

async function handlePayments(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM payments ORDER BY date DESC`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const { client_id, invoice_id, amount, currency = 'USD', date, method = '', reference = '', notes = '' } = req.body;
      const rows = await sql`INSERT INTO payments (client_id,invoice_id,amount,currency,date,method,reference,notes) VALUES (${client_id},${invoice_id},${amount},${currency},${date},${method},${reference},${notes}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM payments WHERE id=${id}`;
      return rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── CREDITS ────────────────────────────────────────────────────────────── */

async function handleCredits(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM credits ORDER BY date DESC`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const { client_id, amount, currency = 'USD', date, reason = '' } = req.body;
      const rows = await sql`INSERT INTO credits (client_id,amount,currency,date,reason) VALUES (${client_id},${amount},${currency},${date},${reason}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM credits WHERE id=${id}`;
      return rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── EXPENSES ───────────────────────────────────────────────────────────── */

async function handleExpenses(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM expenses ORDER BY date DESC`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const { category, vendor = '', amount, currency = 'USD', date, description = '' } = req.body;
      const rows = await sql`INSERT INTO expenses (category,vendor,amount,currency,date,description) VALUES (${category},${vendor},${amount},${currency},${date},${description}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM expenses WHERE id=${id}`;
      return rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const { status } = req.body;
      const rows = await sql`UPDATE expenses SET status=${status} WHERE id=${id} RETURNING *`;
      return res.json(rows[0]);
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── PRODUCTS ───────────────────────────────────────────────────────────── */

async function handleProducts(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(await sql`SELECT * FROM products ORDER BY name`);
    if (m === 'POST') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const { name, wood_type = '', unit = 'pcs', price_per_unit, stock = 0, category = '', sku = '' } = req.body;
      const rows = await sql`INSERT INTO products (name,wood_type,unit,price_per_unit,stock,category,sku) VALUES (${name},${wood_type},${unit},${price_per_unit},${stock},${category},${sku}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM products WHERE id=${id}`;
      return rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const { name, wood_type, unit, price_per_unit, stock, category, sku } = req.body;
      const rows = await sql`UPDATE products SET name=${name},wood_type=${wood_type},unit=${unit},price_per_unit=${price_per_unit},stock=${stock},category=${category},sku=${sku} WHERE id=${id} RETURNING *`;
      return res.json(rows[0]);
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM products WHERE id=${id}`;
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── USERS ──────────────────────────────────────────────────────────────── */

async function handleUsers(req: VercelRequest, res: VercelResponse, _id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  if (m === 'GET') {
    const sql = getSql();
    const rows = await sql`SELECT id,name,email,role,status,avatar,joined_date FROM users ORDER BY name`;
    return res.json(rows);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
