import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

/* ── Inline helpers ─────────────────────────────────────────────────────── */

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

function toCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    if (Array.isArray(v)) {
      out[key] = v.map(i =>
        i instanceof Date ? i.toISOString().slice(0, 10)
        : (typeof i === 'object' && i !== null ? toCamel(i as Record<string, unknown>) : i)
      );
    } else if (v instanceof Date) {
      out[key] = v.toISOString().slice(0, 10);
    } else if (typeof v === 'object' && v !== null) {
      out[key] = toCamel(v as Record<string, unknown>);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function fromBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    out[k.replace(/([A-Z])/g, c => '_' + c.toLowerCase())] = v;
  }
  return out;
}

const NUMERIC_KEYS = /^(total|subtotal|quantity|qty|price|stock|amount|tax|paid|spent|rate|balance|cost|pricePerUnit)$|(Amount|Total|Price|Stock|Qty|Tax|Paid|Spent|Rate|Balance|Cost|Quantity)$/;

function sanitizeNulls(obj: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(obj)) {
    if (obj[k] === null) {
      obj[k] = NUMERIC_KEYS.test(k) ? 0 : '';
    } else if (NUMERIC_KEYS.test(k) && typeof obj[k] === 'string' && (obj[k] as string) !== '') {
      const n = parseFloat(obj[k] as string);
      if (!isNaN(n)) obj[k] = n;
    }
  }
  return obj;
}

function row2camel(r: unknown): Record<string, unknown> {
  return sanitizeNulls(toCamel(r as Record<string, unknown>));
}

function rows2camel(rows: unknown[]): Record<string, unknown>[] {
  return rows.map(row2camel);
}

/* ── Main handler ───────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const pathParam = req.query['...path'] || req.query.path;
  const segments = Array.isArray(pathParam) ? pathParam
    : typeof pathParam === 'string' ? pathParam.split('/')
    : (req.url || '').replace(/^\/api\/?/, '').split('?')[0].split('/').filter(Boolean);
  const [resource, id] = segments;
  const m = req.method || 'GET';

  try {
    switch (resource) {
      case 'auth':          return handleAuth(req, res, id, m);
      case 'clients':       return handleClients(req, res, id, m);
      case 'invoices':      return handleInvoices(req, res, id, m);
      case 'estimates':     return handleEstimates(req, res, id, m);
      case 'payments':      return handlePayments(req, res, id, m);
      case 'credits':       return handleCredits(req, res, id, m);
      case 'expenses':      return handleExpenses(req, res, id, m);
      case 'products':      return handleProducts(req, res, id, m);
      case 'users':         return handleUsers(req, res, id, m);
      case 'send-document': return handleSendDocument(req, res, m);
      case 'error-logs':    return handleErrorLog(req, res, m);
      case 'health':        return res.json({ status: 'ok' });
      default:              return res.status(404).json({ error: 'Not found' });
    }
  } catch (e: any) {
    const errPayload = {
      ts: new Date().toISOString(),
      method: m,
      path: req.url ?? '',
      message: e?.message ?? String(e),
      stack: e?.stack?.split('\n').slice(0, 5).join(' | '),
    };
    console.error('[API_ERROR]', JSON.stringify(errPayload));
    return res.status(500).json({ error: 'Server error', message: e.message });
  }
}

/* ── Error log endpoint ─────────────────────────────────────────────────── */

async function handleErrorLog(req: VercelRequest, res: VercelResponse, m: string) {
  if (m !== 'GET') return res.status(405).end();
  const user = getAuthUser(req);
  if (!user || !hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  const sql = getSql();
  const rows = await sql`SELECT id, ts, level, source, message, meta, created_at FROM error_logs ORDER BY created_at DESC LIMIT 200`;
  return res.json(rows2camel(rows as unknown[]));
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM clients ORDER BY name`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, company = '', email = '', vat_number = '', address = '', phone = '', preferred_currency = 'USD' } = b;
      const rows = await sql`INSERT INTO clients (name,company,email,vat_number,address,phone,preferred_currency) VALUES (${name},${company},${email},${vat_number},${address},${phone},${preferred_currency}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM clients WHERE id=${id}`;
      return rows[0] ? res.json(row2camel(rows[0] as Record<string, unknown>)) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, company, email, vat_number, address, phone, preferred_currency, status } = b;
      const rows = await sql`UPDATE clients SET name=${name},company=${company},email=${email},vat_number=${vat_number},address=${address},phone=${phone},preferred_currency=${preferred_currency ?? 'USD'},status=${status ?? 'Active'} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM invoices ORDER BY created_at DESC`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const {
        invoice_number, client_id, client_name, date, due_date,
        currency = 'USD', subtotal = 0, tax_amount = 0, total_amount = 0,
        status = 'Draft', notes = '', rep = '', paid_amount = 0,
      } = b;
      const items = (req.body as any)?.items ?? [];
      const rows = await sql`INSERT INTO invoices (invoice_number,client_id,client_name,date,due_date,currency,subtotal,tax_amount,total_amount,status,notes,rep,paid_amount) VALUES (${invoice_number},${client_id},${client_name},${date},${due_date},${currency},${subtotal},${tax_amount},${total_amount},${status},${notes},${rep},${paid_amount}) RETURNING *`;
      const inv = rows[0] as any;
      for (const item of items) {
        const desc = item.description ?? '';
        const houtsoort = item.houtsoort ?? '';
        const spec = item.spec ?? '';
        const qty = item.quantity ?? 0;
        const unit = item.unit ?? 'PCS';
        const price = item.unitPrice ?? item.unit_price ?? 0;
        const tot = item.total ?? 0;
        const taxRate = item.taxRate ?? item.tax_rate ?? 10;
        const priceByArea = item.priceByArea ?? item.price_by_area ?? false;
        await sql`INSERT INTO invoice_items (invoice_id,description,houtsoort,spec,quantity,unit,unit_price,tax_rate,total,price_by_area) VALUES (${inv.id},${desc},${houtsoort},${spec},${qty},${unit},${price},${taxRate},${tot},${priceByArea})`;
      }
      return res.status(201).json(row2camel(inv as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM invoices WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      const items = await sql`SELECT * FROM invoice_items WHERE invoice_id=${id}`;
      return res.json(row2camel({ ...(rows[0] as Record<string, unknown>), items: rows2camel(items as unknown[]) }));
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { status, paid_amount, notes } = b;
      const rows = await sql`UPDATE invoices SET status=${status},paid_amount=${paid_amount},notes=${notes} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM estimates ORDER BY created_at DESC`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const {
        estimate_number, client_id, client_name, date, valid_until,
        currency = 'USD', subtotal = 0, tax_amount = 0, total = 0,
        status = 'Draft', notes = '', rep = '',
      } = b;
      const items = (req.body as any)?.items ?? [];
      const rows = await sql`INSERT INTO estimates (estimate_number,client_id,client_name,date,valid_until,currency,subtotal,tax_amount,total,status,notes,rep) VALUES (${estimate_number},${client_id},${client_name},${date},${valid_until},${currency},${subtotal},${tax_amount},${total},${status},${notes},${rep}) RETURNING *`;
      const est = rows[0] as any;
      for (const item of items) {
        const desc = item.description ?? '';
        const houtsoort = item.houtsoort ?? '';
        const spec = item.spec ?? '';
        const qty = item.quantity ?? 0;
        const unit = item.unit ?? 'PCS';
        const price = item.unitPrice ?? item.unit_price ?? 0;
        const tot = item.total ?? 0;
        const taxRate = item.taxRate ?? item.tax_rate ?? 10;
        const priceByArea = item.priceByArea ?? item.price_by_area ?? false;
        await sql`INSERT INTO estimate_items (estimate_id,description,houtsoort,spec,quantity,unit,unit_price,tax_rate,total,price_by_area) VALUES (${est.id},${desc},${houtsoort},${spec},${qty},${unit},${price},${taxRate},${tot},${priceByArea})`;
      }
      return res.status(201).json(row2camel(est as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM estimates WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      const items = await sql`SELECT * FROM estimate_items WHERE estimate_id=${id}`;
      return res.json(row2camel({ ...(rows[0] as Record<string, unknown>), items: rows2camel(items as unknown[]) }));
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { status, notes } = b;
      const rows = await sql`UPDATE estimates SET status=${status},notes=${notes} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM payments ORDER BY date DESC`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { client_id, invoice_id, amount, currency = 'USD', date, method = '', reference = '', notes = '' } = b;
      const rows = await sql`INSERT INTO payments (client_id,invoice_id,amount,currency,date,method,reference,notes) VALUES (${client_id},${invoice_id},${amount},${currency},${date},${method},${reference},${notes}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM payments WHERE id=${id}`;
      return rows[0] ? res.json(row2camel(rows[0] as Record<string, unknown>)) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { method, reference, notes } = b;
      const rows = await sql`UPDATE payments SET method=${method},reference=${reference},notes=${notes} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM payments WHERE id=${id}`;
      return res.json({ ok: true });
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM credits ORDER BY date DESC`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { client_id, amount, currency = 'USD', date, reason = '' } = b;
      const rows = await sql`INSERT INTO credits (client_id,amount,currency,date,reason) VALUES (${client_id},${amount},${currency},${date},${reason}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM credits WHERE id=${id}`;
      return rows[0] ? res.json(row2camel(rows[0] as Record<string, unknown>)) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { amount, reason, status } = b;
      const rows = await sql`UPDATE credits SET amount=${amount},reason=${reason},status=${status} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM credits WHERE id=${id}`;
      return res.json({ ok: true });
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM expenses ORDER BY date DESC`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { category, vendor = '', amount, currency = 'USD', date, description = '' } = b;
      const rows = await sql`INSERT INTO expenses (category,vendor,amount,currency,date,description) VALUES (${category},${vendor},${amount},${currency},${date},${description}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM expenses WHERE id=${id}`;
      return rows[0] ? res.json(row2camel(rows[0] as Record<string, unknown>)) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { status } = b;
      const rows = await sql`UPDATE expenses SET status=${status} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
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
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM products ORDER BY name`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, wood_type = '', unit = 'pcs', price_per_unit, stock = 0, category = '', sku = '' } = b;
      const rows = await sql`INSERT INTO products (name,wood_type,unit,price_per_unit,stock,category,sku) VALUES (${name},${wood_type},${unit},${price_per_unit},${stock},${category},${sku}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM products WHERE id=${id}`;
      return rows[0] ? res.json(row2camel(rows[0] as Record<string, unknown>)) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, wood_type, unit, price_per_unit, stock, category, sku } = b;
      const rows = await sql`UPDATE products SET name=${name},wood_type=${wood_type},unit=${unit},price_per_unit=${price_per_unit},stock=${stock},category=${category},sku=${sku} WHERE id=${id} RETURNING *`;
      return res.json(row2camel(rows[0] as Record<string, unknown>));
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

async function handleUsers(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  const sql = getSql();
  if (m === 'GET' && !id) {
    const rows = await sql`SELECT id,name,email,role,status,avatar,joined_date FROM users ORDER BY name`;
    return res.json(rows2camel(rows as unknown[]));
  }
  if (m === 'POST' && !id) {
    const { name, email, role = 'Sales', status = 'Active', password = 'ramzon123' } = req.body ?? {};
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const hashed = await bcrypt.hash(password, 10);
    const rows = await sql`INSERT INTO users (name,email,password,role,status) VALUES (${name},${email},${hashed},${role},${status}) RETURNING id,name,email,role,status,avatar,joined_date`;
    return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
  }
  if (m === 'PUT' && id) {
    const { name, email, role, status } = req.body ?? {};
    const rows = await sql`UPDATE users SET name=COALESCE(${name},name), email=COALESCE(${email},email), role=COALESCE(${role},role), status=COALESCE(${status},status) WHERE id=${id} RETURNING id,name,email,role,status,avatar,joined_date`;
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    return res.json(row2camel(rows[0] as Record<string, unknown>));
  }
  if (m === 'DELETE' && id) {
    if (id === user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await sql`DELETE FROM users WHERE id=${id}`;
    return res.status(204).end();
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── SEND DOCUMENT (Email via Resend) ──────────────────────────────────── */

async function handleSendDocument(req: VercelRequest, res: VercelResponse, m: string) {
  if (m !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Email service not configured — set RESEND_API_KEY' });

  const {
    to, clientName, docType, docNumber, total, currency, pdfBase64, companyName,
  } = req.body ?? {};

  if (!to || !docNumber || !pdfBase64)
    return res.status(400).json({ error: 'Missing required fields: to, docNumber, pdfBase64' });

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const typeLabel = docType === 'invoice' ? 'Invoice' : 'Estimate';
  const filename = `${docNumber.replace(/\s+/g, '_')}.pdf`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${companyName || 'Ramzon N.V.'} <${fromEmail}>`,
      to: [to],
      subject: `${typeLabel} ${docNumber} — ${companyName || 'Ramzon N.V.'}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">${typeLabel} ${docNumber}</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">Dear ${clientName || 'Client'},</p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
            Please find attached your ${typeLabel.toLowerCase()} <strong>${docNumber}</strong>
            for a total of <strong>${currency} ${total}</strong>.
          </p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">If you have any questions, please don't hesitate to contact us.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            ${companyName || 'Ramzon N.V.'}<br/>Sent by ${user.name || 'Admin'}
          </p>
        </div>
      `,
      attachments: [{ filename, content: pdfBase64 }],
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email', details: (error as any).message });
    }

    return res.json({ success: true, messageId: data?.id });
  } catch (e: any) {
    console.error('Email send error:', e);
    return res.status(500).json({ error: 'Failed to send email', message: e.message });
  }
}
