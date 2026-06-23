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
  try { return jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as AuthUser; }
  catch { return null; }
}

function signAccess(p: AuthUser): string {
  return jwt.sign(p, process.env.JWT_SECRET!, { expiresIn: '15m', algorithm: 'HS256' });
}
function signRefresh(p: AuthUser): string {
  return jwt.sign(p, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d', algorithm: 'HS256' });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['Admin', 'Sales', 'Accountant'] as const;
const MAX_PDF_BYTES = 4 * 1024 * 1024;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]?.trim()) ?? 'unknown';
}

async function checkRateLimit(
  sql: ReturnType<typeof getSql>,
  key: string,
  maxAttempts: number,
  windowMinutes: number,
  lockMinutes: number
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = new Date();
  await sql`DELETE FROM rate_limits WHERE key = ${key} AND window_start < NOW() - INTERVAL '2 hours'`;
  const rows = await sql`SELECT attempts, window_start, locked_until FROM rate_limits WHERE key = ${key}`;
  const row = rows[0] as any;

  if (row?.locked_until && new Date(row.locked_until) > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((new Date(row.locked_until).getTime() - now.getTime()) / 1000) };
  }

  if (row && new Date(row.window_start) < new Date(now.getTime() - windowMinutes * 60_000)) {
    await sql`DELETE FROM rate_limits WHERE key = ${key}`;
    await sql`INSERT INTO rate_limits (key, attempts, window_start) VALUES (${key}, 1, NOW())`;
    return { allowed: true };
  }

  if (!row) {
    await sql`INSERT INTO rate_limits (key, attempts, window_start) VALUES (${key}, 1, NOW())`;
    return { allowed: true };
  }

  if (row.attempts >= maxAttempts) {
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60_000).toISOString();
    await sql`UPDATE rate_limits SET locked_until = ${lockedUntil} WHERE key = ${key}`;
    return { allowed: false, retryAfterSeconds: lockMinutes * 60 };
  }

  await sql`UPDATE rate_limits SET attempts = attempts + 1 WHERE key = ${key}`;
  return { allowed: true };
}

function hasRole(u: AuthUser, roles: string[]): boolean {
  return roles.includes(u.role);
}

function logAudit(
  user: AuthUser,
  action: string,
  resource: string,
  resourceId: string = '',
  ip: string = '',
  meta: Record<string, unknown> = {}
): void {
  const sql = getSql();
  sql`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, ip, meta)
      VALUES (${user.id}, ${user.name}, ${action}, ${resource}, ${resourceId}, ${ip}, ${JSON.stringify(meta)})`
    .catch(() => {/* fire-and-forget */});
}

const isVercel = !!process.env.VERCEL;

function cors(res: VercelResponse) {
  const origin = process.env.CLIENT_URL || (isVercel ? null : 'http://localhost:3000');
  if (!origin) throw new Error('CLIENT_URL env var is required in production');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const secureCookie = isVercel ? '; Secure' : '';

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

const NUMERIC_KEYS = /^(total|subtotal|quantity|qty|price|stock|amount|tax|paid|spent|rate|balance|cost|pricePerUnit|thickness|width|length|defaultTaxRate)$|(Amount|Total|Price|Stock|Qty|Tax|Paid|Spent|Rate|Balance|Cost|Quantity)$/;

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

function rows2camel(rows: unknown): Record<string, unknown>[] {
  return (rows as unknown[]).map(row2camel);
}

/* ── Main handler ───────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const pathParam = req.query['...path'] || req.query.path;
  const segments = Array.isArray(pathParam) ? pathParam
    : typeof pathParam === 'string' ? pathParam.split('/')
    : (req.url || '').replace(/^\/api\/?/, '').split('?')[0].split('/').filter(Boolean);
  const [resource, id, subAction] = segments;
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
      case 'products':           return handleProducts(req, res, id, m);
      case 'product-categories': return handleProductCategories(req, res, id, m);
      case 'users':          return handleUsers(req, res, id, m, subAction);
      case 'bank-accounts':      return handleBankAccounts(req, res, id, m);
      case 'bank-transactions':  return handleBankTransactions(req, res, id, m);
      case 'exchange-rates':     return handleExchangeRates(req, res, id, m);
      case 'send-document':  return handleSendDocument(req, res, m);
      case 'error-logs':    return handleErrorLog(req, res, m);
      case 'system-stats':  return handleSystemStats(req, res, m);
      case 'audit-logs':    return handleAuditLogs(req, res, m);
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
    return res.status(500).json({ error: 'Server error' });
  }
}

/* ── Error log endpoint ─────────────────────────────────────────────────── */

async function handleErrorLog(req: VercelRequest, res: VercelResponse, m: string) {
  if (m !== 'GET') return res.status(405).end();
  const user = getAuthUser(req);
  if (!user || !hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  const sql = getSql();
  const rl = await checkRateLimit(sql, `errorlogs:${user.id}`, 60, 1, 5);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
  const rows = await sql`SELECT id, ts, level, source, message, meta, created_at FROM error_logs ORDER BY created_at DESC LIMIT 200`;
  return res.json(rows2camel(rows as unknown[]));
}

/* ── System stats endpoint ──────────────────────────────────────────────── */

async function handleSystemStats(req: VercelRequest, res: VercelResponse, m: string) {
  if (m !== 'GET') return res.status(405).end();
  const user = getAuthUser(req);
  if (!user || !hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  const sql = getSql();
  const rl = await checkRateLimit(sql, `sysstats:${user.id}`, 30, 1, 5);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests.' });

  // Measure DB latency
  const t0 = Date.now();
  await sql`SELECT 1`;
  const dbLatencyMs = Date.now() - t0;

  // Parallel metric queries
  const [sizeRows, connRows, err24Rows, warnRows, blockRows, loginRows] = await Promise.all([
    sql`SELECT pg_database_size(current_database()) AS size_bytes`,
    sql`SELECT count(*) AS cnt FROM pg_stat_activity WHERE state = 'active'`,
    sql`SELECT count(*) AS cnt FROM error_logs WHERE ts > NOW() - INTERVAL '24 hours' AND level = 'error'`,
    sql`SELECT count(*) AS cnt FROM error_logs WHERE ts > NOW() - INTERVAL '24 hours' AND level = 'warn'`,
    sql`SELECT count(*) AS cnt FROM rate_limits WHERE locked_until > NOW()`,
    sql`SELECT count(*) AS cnt FROM rate_limits WHERE key LIKE 'login:%' AND window_start > NOW() - INTERVAL '24 hours'`,
  ]);

  return res.json({
    dbLatencyMs,
    dbSizeMb: Math.round(Number((sizeRows[0] as any).size_bytes) / 1024 / 1024),
    activeConnections: Number((connRows[0] as any).cnt),
    errors24h:         Number((err24Rows[0] as any).cnt),
    warns24h:          Number((warnRows[0] as any).cnt),
    rateLimitBlocks:   Number((blockRows[0] as any).cnt),
    loginAttempts24h:  Number((loginRows[0] as any).cnt),
  });
}

/* ── Audit logs endpoint ────────────────────────────────────────────────── */

async function handleAuditLogs(req: VercelRequest, res: VercelResponse, m: string) {
  if (m !== 'GET') return res.status(405).end();
  const user = getAuthUser(req);
  if (!user || !hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  const sql = getSql();
  const rl = await checkRateLimit(sql, `auditlogs:${user.id}`, 60, 1, 5);
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
  const rows = await sql`SELECT id, ts, user_id, user_name, action, resource, resource_id, ip, meta FROM audit_logs ORDER BY ts DESC LIMIT 500`;
  return res.json(rows2camel(rows as unknown[]));
}

/* ── AUTH ────────────────────────────────────────────────────────────────── */

async function handleAuth(req: VercelRequest, res: VercelResponse, sub: string, m: string) {
  if (sub === 'login' && m === 'POST') {
    const email = ((req.body?.email ?? '') as string).toLowerCase().trim();
    const { password } = req.body ?? {};
    const sql = getSql();
    const ip = getClientIp(req);
    const rl = await checkRateLimit(sql, `login:${ip}`, 5, 15, 15);
    if (!rl.allowed) {
      return res.status(429).json({ error: `Too many login attempts. Try again in ${Math.ceil((rl.retryAfterSeconds ?? 900) / 60)} minutes.` });
    }
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
    logAudit(payload, 'login', 'auth', '', ip);
    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Max-Age=${7 * 86400}; Path=/${secureCookie}`);
    return res.json({ accessToken, user: payload });
  }
  if (sub === 'refresh' && m === 'POST') {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    try {
      const p = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, { algorithms: ['HS256'] }) as AuthUser;
      return res.json({ accessToken: signAccess({ id: p.id, role: p.role, name: p.name }) });
    } catch { return res.status(401).json({ error: 'Invalid refresh token' }); }
  }
  if (sub === 'logout' && m === 'POST') {
    res.setHeader('Set-Cookie', `refreshToken=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/${secureCookie}`);
    return res.json({ ok: true });
  }
  if (sub === 'me' && m === 'GET') {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json({ user });
  }
  if (sub === 'change-password' && m === 'POST') {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const sql = getSql();
    const rl = await checkRateLimit(sql, `changepwd:${user.id}`, 5, 15, 15);
    if (!rl.allowed) {
      return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterSeconds ?? 900) / 60)} minutes.` });
    }
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    if (newPassword.length > 72) return res.status(400).json({ error: 'Password too long (max 72 characters)' });
    const rows = await sql`SELECT password FROM users WHERE id=${user.id}`;
    const row = rows[0] as any;
    if (!row) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(currentPassword, row.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(trimmedNew, 10);
    await sql`UPDATE users SET password=${hashed} WHERE id=${user.id}`;
    return res.json({ ok: true });
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
      const created = row2camel(rows[0] as Record<string, unknown>);
      logAudit(user, 'create', 'clients', String(created.id ?? ''), getClientIp(req), { name });
      return res.status(201).json(created);
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
      logAudit(user, 'update', 'clients', id, getClientIp(req));
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM clients WHERE id=${id}`;
      logAudit(user, 'delete', 'clients', id, getClientIp(req));
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
        const itemType = item.itemType ?? item.item_type ?? 'item';
        await sql`INSERT INTO invoice_items (invoice_id,description,houtsoort,spec,quantity,unit,unit_price,tax_rate,total,price_by_area,item_type) VALUES (${inv.id},${desc},${houtsoort},${spec},${qty},${unit},${price},${taxRate},${tot},${priceByArea},${itemType})`;
      }
      logAudit(user, 'create', 'invoices', inv.id, getClientIp(req), { invoice_number: b.invoice_number });
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
      const {
        invoice_number, client_id, client_name, date, due_date,
        currency = 'USD', exchange_rate = 1, subtotal = 0, tax_amount = 0, total_amount = 0,
        status = 'Pending', notes = '', rep = '', paid_amount = 0,
      } = b;
      const items = (req.body as any)?.items ?? [];
      const rows = await sql`UPDATE invoices SET invoice_number=${invoice_number},client_id=${client_id},client_name=${client_name},date=${date},due_date=${due_date},currency=${currency},exchange_rate=${exchange_rate},subtotal=${subtotal},tax_amount=${tax_amount},total_amount=${total_amount},status=${status},notes=${notes},rep=${rep},paid_amount=${paid_amount} WHERE id=${id} RETURNING *`;
      await sql`DELETE FROM invoice_items WHERE invoice_id=${id}`;
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
        const itemType = item.itemType ?? item.item_type ?? 'item';
        await sql`INSERT INTO invoice_items (invoice_id,description,houtsoort,spec,quantity,unit,unit_price,tax_rate,total,price_by_area,item_type) VALUES (${id},${desc},${houtsoort},${spec},${qty},${unit},${price},${taxRate},${tot},${priceByArea},${itemType})`;
      }
      logAudit(user, 'update', 'invoices', id, getClientIp(req));
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM invoices WHERE id=${id}`;
      logAudit(user, 'delete', 'invoices', id, getClientIp(req));
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
        const itemType = item.itemType ?? item.item_type ?? 'item';
        await sql`INSERT INTO estimate_items (estimate_id,description,houtsoort,spec,quantity,unit,unit_price,tax_rate,total,price_by_area,item_type) VALUES (${est.id},${desc},${houtsoort},${spec},${qty},${unit},${price},${taxRate},${tot},${priceByArea},${itemType})`;
      }
      logAudit(user, 'create', 'estimates', est.id, getClientIp(req), { estimate_number: b.estimate_number });
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
      const {
        estimate_number, client_id, client_name, date, valid_until,
        currency = 'USD', exchange_rate = 1, subtotal = 0, tax_amount = 0, total = 0,
        status = 'Draft', notes = '', rep = '',
      } = b;
      const items = (req.body as any)?.items ?? [];
      const rows = await sql`UPDATE estimates SET estimate_number=${estimate_number},client_id=${client_id},client_name=${client_name},date=${date},valid_until=${valid_until},currency=${currency},exchange_rate=${exchange_rate},subtotal=${subtotal},tax_amount=${tax_amount},total=${total},status=${status},notes=${notes},rep=${rep} WHERE id=${id} RETURNING *`;
      await sql`DELETE FROM estimate_items WHERE estimate_id=${id}`;
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
        const itemType = item.itemType ?? item.item_type ?? 'item';
        await sql`INSERT INTO estimate_items (estimate_id,description,houtsoort,spec,quantity,unit,unit_price,tax_rate,total,price_by_area,item_type) VALUES (${id},${desc},${houtsoort},${spec},${qty},${unit},${price},${taxRate},${tot},${priceByArea},${itemType})`;
      }
      logAudit(user, 'update', 'estimates', id, getClientIp(req));
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM estimates WHERE id=${id}`;
      logAudit(user, 'delete', 'estimates', id, getClientIp(req));
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
      const created = row2camel(rows[0] as Record<string, unknown>);
      logAudit(user, 'create', 'payments', String(created.id ?? ''), getClientIp(req), { amount, currency });
      return res.status(201).json(created);
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
      const created = row2camel(rows[0] as Record<string, unknown>);
      logAudit(user, 'create', 'credits', String(created.id ?? ''), getClientIp(req), { amount, currency });
      return res.status(201).json(created);
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
      const created = row2camel(rows[0] as Record<string, unknown>);
      logAudit(user, 'create', 'expenses', String(created.id ?? ''), getClientIp(req), { category, amount });
      return res.status(201).json(created);
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

/* ── PRODUCT CATEGORIES ─────────────────────────────────────────────────── */

async function handleProductCategories(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();

  if (!id) {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM product_categories ORDER BY sort_order, name`;
      return res.json(rows2camel(rows));
    }
    if (m === 'POST') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, description = '', pricing_type = 'pcs', sort_order = 0 } = b;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const rows = await sql`INSERT INTO product_categories (name, description, pricing_type, sort_order) VALUES (${name}, ${description}, ${pricing_type}, ${sort_order}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, description = '', pricing_type = 'pcs', sort_order = 0 } = b;
      const rows = await sql`UPDATE product_categories SET name=${name}, description=${description}, pricing_type=${pricing_type}, sort_order=${sort_order} WHERE id=${id} RETURNING *`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      // Get category name so we can clear it from products
      const catRows = await sql`SELECT name FROM product_categories WHERE id=${id}`;
      if (!catRows[0]) return res.status(404).json({ error: 'Not found' });
      const catName = (catRows[0] as any).name as string;
      // Clear category on products that referenced this category
      await sql`UPDATE products SET category='' WHERE category=${catName}`;
      await sql`DELETE FROM product_categories WHERE id=${id}`;
      return res.json({ ok: true });
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
      const { name, wood_type = '', thickness = 0, width = 0, length = 0, unit = 'pcs', price_per_unit, stock = 0, category = '', sku = '', calculation_type = 'pcs', description = '', default_tax_rate = 10 } = b;
      const rows = await sql`INSERT INTO products (name,wood_type,thickness,width,length,unit,price_per_unit,stock,category,sku,calculation_type,description,default_tax_rate) VALUES (${name},${wood_type},${thickness},${width},${length},${unit},${price_per_unit},${stock},${category},${sku},${calculation_type},${description},${default_tax_rate}) RETURNING *`;
      const created = row2camel(rows[0] as Record<string, unknown>);
      logAudit(user, 'create', 'products', String(created.id ?? ''), getClientIp(req), { name });
      return res.status(201).json(created);
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM products WHERE id=${id}`;
      return rows[0] ? res.json(row2camel(rows[0] as Record<string, unknown>)) : res.status(404).json({ error: 'Not found' });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { name, wood_type, thickness = 0, width = 0, length = 0, unit, price_per_unit, stock, category, sku, calculation_type = 'pcs', description = '', default_tax_rate = 10 } = b;
      const rows = await sql`UPDATE products SET name=${name},wood_type=${wood_type},thickness=${thickness},width=${width},length=${length},unit=${unit},price_per_unit=${price_per_unit},stock=${stock},category=${category},sku=${sku},calculation_type=${calculation_type},description=${description},default_tax_rate=${default_tax_rate} WHERE id=${id} RETURNING *`;
      logAudit(user, 'update', 'products', id, getClientIp(req));
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM products WHERE id=${id}`;
      logAudit(user, 'delete', 'products', id, getClientIp(req));
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── USERS ──────────────────────────────────────────────────────────────── */

async function handleUsers(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string, subAction?: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
  const sql = getSql();
  if (m === 'POST' && id && subAction === 'reset-password') {
    const { newPassword } = req.body ?? {};
    if (!newPassword || String(newPassword).trim().length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    if (String(newPassword).length > 72)
      return res.status(400).json({ error: 'Password too long (max 72 characters)' });
    const rl = await checkRateLimit(sql, `resetpwd:${user.id}`, 10, 15, 15);
    if (!rl.allowed)
      return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterSeconds ?? 900) / 60)} minutes.` });
    const hashed = await bcrypt.hash(String(newPassword).trim(), 10);
    const rows = await sql`UPDATE users SET password=${hashed} WHERE id=${id} RETURNING id`;
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    logAudit(user, 'reset-password', 'users', id, getClientIp(req));
    return res.json({ ok: true });
  }
  if (m === 'GET' && !id) {
    const rows = await sql`SELECT id,name,email,role,status,avatar,joined_date FROM users ORDER BY name`;
    return res.json(rows2camel(rows as unknown[]));
  }
  if (m === 'POST' && !id) {
    const { name, role = 'Sales', status = 'Active', password } = req.body ?? {};
    const email = ((req.body?.email ?? '') as string).toLowerCase().trim();
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    if (!password || password.trim().length < 8) return res.status(400).json({ error: 'Password required (min 8 characters)' });
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const hashed = await bcrypt.hash(password.trim(), 10);
    const rows = await sql`INSERT INTO users (name,email,password,role,status) VALUES (${name},${email},${hashed},${role},${status}) RETURNING id,name,email,role,status,avatar,joined_date`;
    const created = row2camel(rows[0] as Record<string, unknown>);
    logAudit(user, 'create', 'users', String(created.id ?? ''), getClientIp(req), { name, role });
    return res.status(201).json(created);
  }
  if (m === 'PUT' && id) {
    const { name, email, role, status } = req.body ?? {};
    if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const rows = await sql`UPDATE users SET name=COALESCE(${name},name), email=COALESCE(${email},email), role=COALESCE(${role},role), status=COALESCE(${status},status) WHERE id=${id} RETURNING id,name,email,role,status,avatar,joined_date`;
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    logAudit(user, 'update', 'users', id, getClientIp(req));
    return res.json(row2camel(rows[0] as Record<string, unknown>));
  }
  if (m === 'DELETE' && id) {
    if (id === user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await sql`DELETE FROM users WHERE id=${id}`;
    logAudit(user, 'delete', 'users', id, getClientIp(req));
    return res.status(204).end();
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── BANK ACCOUNTS ──────────────────────────────────────────────────────── */

async function handleBankAccounts(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM bank_accounts ORDER BY bank, currency`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { bank, currency = 'SRD', iban = '', balance = 0 } = b;
      const rows = await sql`INSERT INTO bank_accounts (bank, currency, iban, balance) VALUES (${bank}, ${currency}, ${iban}, ${balance}) RETURNING *`;
      logAudit(user, 'create', 'bank-accounts', String((rows[0] as any).id ?? ''), getClientIp(req), { bank, currency });
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { bank, iban, balance } = b;
      const rows = await sql`UPDATE bank_accounts SET bank=${bank}, iban=${iban}, balance=${balance} WHERE id=${id} RETURNING *`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      logAudit(user, 'update', 'bank-accounts', id, getClientIp(req));
      return res.json(row2camel(rows[0] as Record<string, unknown>));
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM bank_accounts WHERE id=${id}`;
      logAudit(user, 'delete', 'bank-accounts', id, getClientIp(req));
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── BANK TRANSACTIONS ──────────────────────────────────────────────────── */

async function handleBankTransactions(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();

  if (!id) {
    if (m === 'GET') {
      const accountId = req.query.accountId as string | undefined;
      if (accountId) {
        const rows = await sql`SELECT * FROM bank_transactions WHERE account_id = ${accountId} ORDER BY date DESC, created_at DESC`;
        return res.json(rows2camel(rows as unknown[]));
      }
      const rows = await sql`SELECT * FROM bank_transactions ORDER BY date DESC, created_at DESC LIMIT 200`;
      return res.json(rows2camel(rows as unknown[]));
    }
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { account_id, type, amount, date, description = '', reference = '', to_account_id = '' } = b;
      if (!account_id || !type || !amount || !date) return res.status(400).json({ error: 'account_id, type, amount and date required' });
      const validTypes = ['deposit', 'withdrawal', 'transfer', 'fee'];
      if (!validTypes.includes(String(type))) return res.status(400).json({ error: 'Invalid transaction type' });
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

      const rows = await sql`
        INSERT INTO bank_transactions (account_id, type, amount, date, description, reference, to_account_id)
        VALUES (${account_id}, ${type}, ${numAmount}, ${date}, ${description}, ${reference}, ${to_account_id})
        RETURNING *
      `;

      if (type === 'deposit') {
        await sql`UPDATE bank_accounts SET balance = balance + ${numAmount} WHERE id = ${account_id}`;
      } else if (type === 'withdrawal' || type === 'fee') {
        await sql`UPDATE bank_accounts SET balance = balance - ${numAmount} WHERE id = ${account_id}`;
      } else if (type === 'transfer' && to_account_id) {
        await sql`UPDATE bank_accounts SET balance = balance - ${numAmount} WHERE id = ${account_id}`;
        await sql`UPDATE bank_accounts SET balance = balance + ${numAmount} WHERE id = ${to_account_id}`;
      }

      logAudit(user, 'create', 'bank-transactions', String((rows[0] as any).id ?? ''), getClientIp(req), { account_id, type, amount: numAmount });
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      const txRows = await sql`SELECT * FROM bank_transactions WHERE id = ${id}`;
      const tx = txRows[0] as any;
      if (!tx) return res.status(404).json({ error: 'Not found' });
      const amount = Number(tx.amount);

      if (tx.type === 'deposit') {
        await sql`UPDATE bank_accounts SET balance = balance - ${amount} WHERE id = ${tx.account_id}`;
      } else if (tx.type === 'withdrawal' || tx.type === 'fee') {
        await sql`UPDATE bank_accounts SET balance = balance + ${amount} WHERE id = ${tx.account_id}`;
      } else if (tx.type === 'transfer' && tx.to_account_id) {
        await sql`UPDATE bank_accounts SET balance = balance + ${amount} WHERE id = ${tx.account_id}`;
        await sql`UPDATE bank_accounts SET balance = balance - ${amount} WHERE id = ${tx.to_account_id}`;
      }

      await sql`DELETE FROM bank_transactions WHERE id = ${id}`;
      logAudit(user, 'delete', 'bank-transactions', id, getClientIp(req));
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── EXCHANGE RATES ─────────────────────────────────────────────────────── */

async function handleExchangeRates(req: VercelRequest, res: VercelResponse, id: string | undefined, m: string) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return res.json(rows2camel(await sql`SELECT * FROM exchange_rates ORDER BY date DESC`));
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return res.status(403).json({ error: 'Forbidden' });
      const b = fromBody(req.body);
      const { date, usd_srd, eur_srd = 0, eur_usd = 0 } = b;
      const rows = await sql`INSERT INTO exchange_rates (date, usd_srd, eur_srd, eur_usd) VALUES (${date}, ${usd_srd}, ${eur_srd}, ${eur_usd}) RETURNING *`;
      return res.status(201).json(row2camel(rows[0] as Record<string, unknown>));
    }
  } else {
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return res.status(403).json({ error: 'Forbidden' });
      await sql`DELETE FROM exchange_rates WHERE id=${id}`;
      return res.json({ ok: true });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/* ── SEND DOCUMENT (Email via Resend) ──────────────────────────────────── */

async function handleSendDocument(req: VercelRequest, res: VercelResponse, m: string) {
  if (m !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const emailRl = await checkRateLimit(getSql(), `email:${user.id}`, 20, 60, 60);
  if (!emailRl.allowed) {
    return res.status(429).json({ error: 'Email rate limit reached. Try again later.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Email service not configured — set RESEND_API_KEY' });

  const {
    to, clientName, docType, docNumber, total, currency, pdfBase64, companyName,
  } = req.body ?? {};

  if (!to || !docNumber || !pdfBase64)
    return res.status(400).json({ error: 'Missing required fields: to, docNumber, pdfBase64' });
  if (!EMAIL_RE.test(to))
    return res.status(400).json({ error: 'Invalid recipient email address' });
  if (Buffer.byteLength(pdfBase64, 'base64') > MAX_PDF_BYTES)
    return res.status(413).json({ error: 'PDF attachment too large (max 4 MB)' });

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const typeLabel = docType === 'invoice' ? 'Invoice' : 'Estimate';
  const filename = `${docNumber.replace(/\s+/g, '_')}.pdf`;
  const safeCompany  = escapeHtml(companyName  || 'Ramzon N.V.');
  const safeClient   = escapeHtml(clientName   || 'Client');
  const safeDocNum   = escapeHtml(docNumber);
  const safeTotal    = escapeHtml(String(total ?? ''));
  const safeCurrency = escapeHtml(String(currency ?? ''));
  const safeSender   = escapeHtml(user.name || 'Admin');

  try {
    const { data, error } = await resend.emails.send({
      from: `${safeCompany} <${fromEmail}>`,
      to: [to],
      subject: `${typeLabel} ${safeDocNum} — ${safeCompany}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1e293b; margin-bottom: 8px;">${typeLabel} ${safeDocNum}</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">Dear ${safeClient},</p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
            Please find attached your ${typeLabel.toLowerCase()} <strong>${safeDocNum}</strong>
            for a total of <strong>${safeCurrency} ${safeTotal}</strong>.
          </p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">If you have any questions, please don't hesitate to contact us.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            ${safeCompany}<br/>Sent by ${safeSender}
          </p>
        </div>
      `,
      attachments: [{ filename, content: pdfBase64 }],
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.json({ success: true, messageId: data?.id });
  } catch (e: any) {
    console.error('Email send error:', e);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
