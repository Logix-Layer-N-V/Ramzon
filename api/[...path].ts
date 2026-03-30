import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSql } from './_lib/db';
import { getAuthUser, signAccess, signRefresh } from './_lib/auth';
import type { AuthUser } from './_lib/auth';
import { hasRole } from './_lib/roles';
import { corsHeaders } from './_lib/cors';
import { parseCookies } from './_lib/cookies';

function segs(req: Request): string[] {
  return new URL(req.url).pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
export async function GET(req: Request): Promise<Response> { return route(req); }
export async function POST(req: Request): Promise<Response> { return route(req); }
export async function PUT(req: Request): Promise<Response> { return route(req); }
export async function DELETE(req: Request): Promise<Response> { return route(req); }

async function route(req: Request): Promise<Response> {
  const [resource, id] = segs(req);
  const m = req.method.toUpperCase();
  try {
    switch (resource) {
      case 'auth':      return handleAuth(req, id, m);
      case 'clients':   return handleClients(req, id, m);
      case 'invoices':  return handleInvoices(req, id, m);
      case 'estimates': return handleEstimates(req, id, m);
      case 'payments':  return handlePayments(req, id, m);
      case 'credits':   return handleCredits(req, id, m);
      case 'expenses':  return handleExpenses(req, id, m);
      case 'products':  return handleProducts(req, id, m);
      case 'users':     return handleUsers(req, id, m);
      default: return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function handleAuth(req: Request, sub: string, m: string): Promise<Response> {
  if (sub === 'login' && m === 'POST') {
    const { email, password } = await req.json() as { email: string; password: string };
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE email=${email} AND status='Active'`;
    const user = rows[0] as { id: string; role: string; name: string; password: string } | undefined;
    if (!user || !(await bcrypt.compare(password, user.password)))
      return Response.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders() });
    const payload = { id: user.id, role: user.role, name: user.name };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const h = new Headers(corsHeaders() as Record<string, string>);
    h.set('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Max-Age=${7 * 86400}; Path=/${secure}`);
    return Response.json({ accessToken, user: payload }, { headers: h });
  }
  if (sub === 'refresh' && m === 'POST') {
    const token = parseCookies(req).refreshToken;
    if (!token) return Response.json({ error: 'No refresh token' }, { status: 401, headers: corsHeaders() });
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthUser;
    return Response.json({ accessToken: signAccess({ id: payload.id, role: payload.role, name: payload.name }) }, { headers: corsHeaders() });
  }
  if (sub === 'logout' && m === 'POST') {
    const h = new Headers(corsHeaders() as Record<string, string>);
    h.set('Set-Cookie', 'refreshToken=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');
    return Response.json({ ok: true }, { headers: h });
  }
  if (sub === 'me' && m === 'GET') {
    const user = getAuthUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
    return Response.json({ user }, { headers: corsHeaders() });
  }
  return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

async function handleClients(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM clients ORDER BY name`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { name, company = '', email = '', vat_number = '', address = '', phone = '', preferred_currency = 'USD' } = await req.json();
      const rows = await sql`INSERT INTO clients (name,company,email,vat_number,address,phone,preferred_currency) VALUES (${name},${company},${email},${vat_number},${address},${phone},${preferred_currency}) RETURNING *`;
      return Response.json(rows[0], { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM clients WHERE id=${id}`;
      return rows[0] ? Response.json(rows[0], { headers: corsHeaders() }) : Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { name, company, email, vat_number, address, phone, status } = await req.json();
      const rows = await sql`UPDATE clients SET name=${name},company=${company},email=${email},vat_number=${vat_number},address=${address},phone=${phone},status=${status} WHERE id=${id} RETURNING *`;
      return Response.json(rows[0], { headers: corsHeaders() });
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      await sql`DELETE FROM clients WHERE id=${id}`;
      return Response.json({ ok: true }, { headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── INVOICES ────────────────────────────────────────────────────────────────

async function handleInvoices(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM invoices ORDER BY created_at DESC`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { invoice_number, client_id, client_name, date, due_date, currency = 'USD', subtotal = 0, tax_amount = 0, total_amount = 0, status = 'Draft', notes = '', rep = '', paid_amount = 0, items = [] } = await req.json();
      const rows = await sql`INSERT INTO invoices (invoice_number,client_id,client_name,date,due_date,currency,subtotal,tax_amount,total_amount,status,notes,rep,paid_amount) VALUES (${invoice_number},${client_id},${client_name},${date},${due_date},${currency},${subtotal},${tax_amount},${total_amount},${status},${notes},${rep},${paid_amount}) RETURNING *`;
      const inv = rows[0] as { id: string };
      for (const item of items as Array<{ description: string; quantity: number; unit_price: number; total: number }>)
        await sql`INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,total) VALUES (${inv.id},${item.description},${item.quantity},${item.unit_price},${item.total})`;
      return Response.json(inv, { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM invoices WHERE id=${id}`;
      if (!rows[0]) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
      const items = await sql`SELECT * FROM invoice_items WHERE invoice_id=${id}`;
      return Response.json({ ...rows[0], items }, { headers: corsHeaders() });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { status, paid_amount, notes } = await req.json();
      const rows = await sql`UPDATE invoices SET status=${status},paid_amount=${paid_amount},notes=${notes} WHERE id=${id} RETURNING *`;
      return Response.json(rows[0], { headers: corsHeaders() });
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      await sql`DELETE FROM invoices WHERE id=${id}`;
      return Response.json({ ok: true }, { headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── ESTIMATES ───────────────────────────────────────────────────────────────

async function handleEstimates(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM estimates ORDER BY created_at DESC`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { estimate_number, client_id, client_name, date, valid_until, currency = 'USD', subtotal = 0, tax_amount = 0, total = 0, status = 'Draft', notes = '', rep = '', items = [] } = await req.json();
      const rows = await sql`INSERT INTO estimates (estimate_number,client_id,client_name,date,valid_until,currency,subtotal,tax_amount,total,status,notes,rep) VALUES (${estimate_number},${client_id},${client_name},${date},${valid_until},${currency},${subtotal},${tax_amount},${total},${status},${notes},${rep}) RETURNING *`;
      const est = rows[0] as { id: string };
      for (const item of items as Array<{ description: string; quantity: number; unit_price: number; total: number }>)
        await sql`INSERT INTO estimate_items (estimate_id,description,quantity,unit_price,total) VALUES (${est.id},${item.description},${item.quantity},${item.unit_price},${item.total})`;
      return Response.json(est, { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM estimates WHERE id=${id}`;
      if (!rows[0]) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
      const items = await sql`SELECT * FROM estimate_items WHERE estimate_id=${id}`;
      return Response.json({ ...rows[0], items }, { headers: corsHeaders() });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { status, notes } = await req.json();
      const rows = await sql`UPDATE estimates SET status=${status},notes=${notes} WHERE id=${id} RETURNING *`;
      return Response.json(rows[0], { headers: corsHeaders() });
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      await sql`DELETE FROM estimates WHERE id=${id}`;
      return Response.json({ ok: true }, { headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

async function handlePayments(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM payments ORDER BY date DESC`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Sales', 'Accountant'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { client_id, invoice_id, amount, currency = 'USD', date, method = '', reference = '', notes = '' } = await req.json();
      const rows = await sql`INSERT INTO payments (client_id,invoice_id,amount,currency,date,method,reference,notes) VALUES (${client_id},${invoice_id},${amount},${currency},${date},${method},${reference},${notes}) RETURNING *`;
      return Response.json(rows[0], { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM payments WHERE id=${id}`;
      return rows[0] ? Response.json(rows[0], { headers: corsHeaders() }) : Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── CREDITS ─────────────────────────────────────────────────────────────────

async function handleCredits(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM credits ORDER BY date DESC`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { client_id, amount, currency = 'USD', date, reason = '' } = await req.json();
      const rows = await sql`INSERT INTO credits (client_id,amount,currency,date,reason) VALUES (${client_id},${amount},${currency},${date},${reason}) RETURNING *`;
      return Response.json(rows[0], { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM credits WHERE id=${id}`;
      return rows[0] ? Response.json(rows[0], { headers: corsHeaders() }) : Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

async function handleExpenses(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM expenses ORDER BY date DESC`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { category, vendor = '', amount, currency = 'USD', date, description = '' } = await req.json();
      const rows = await sql`INSERT INTO expenses (category,vendor,amount,currency,date,description) VALUES (${category},${vendor},${amount},${currency},${date},${description}) RETURNING *`;
      return Response.json(rows[0], { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM expenses WHERE id=${id}`;
      return rows[0] ? Response.json(rows[0], { headers: corsHeaders() }) : Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin', 'Accountant'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { status } = await req.json();
      const rows = await sql`UPDATE expenses SET status=${status} WHERE id=${id} RETURNING *`;
      return Response.json(rows[0], { headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

async function handleProducts(req: Request, id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  const sql = getSql();
  if (!id) {
    if (m === 'GET') return Response.json(await sql`SELECT * FROM products ORDER BY name`, { headers: corsHeaders() });
    if (m === 'POST') {
      if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { name, wood_type = '', unit = 'pcs', price_per_unit, stock = 0, category = '', sku = '' } = await req.json();
      const rows = await sql`INSERT INTO products (name,wood_type,unit,price_per_unit,stock,category,sku) VALUES (${name},${wood_type},${unit},${price_per_unit},${stock},${category},${sku}) RETURNING *`;
      return Response.json(rows[0], { status: 201, headers: corsHeaders() });
    }
  } else {
    if (m === 'GET') {
      const rows = await sql`SELECT * FROM products WHERE id=${id}`;
      return rows[0] ? Response.json(rows[0], { headers: corsHeaders() }) : Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }
    if (m === 'PUT') {
      if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      const { name, wood_type, unit, price_per_unit, stock, category, sku } = await req.json();
      const rows = await sql`UPDATE products SET name=${name},wood_type=${wood_type},unit=${unit},price_per_unit=${price_per_unit},stock=${stock},category=${category},sku=${sku} WHERE id=${id} RETURNING *`;
      return Response.json(rows[0], { headers: corsHeaders() });
    }
    if (m === 'DELETE') {
      if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
      await sql`DELETE FROM products WHERE id=${id}`;
      return Response.json({ ok: true }, { headers: corsHeaders() });
    }
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}

// ─── USERS ───────────────────────────────────────────────────────────────────

async function handleUsers(req: Request, _id: string | undefined, m: string): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  if (m === 'GET') {
    const sql = getSql();
    const rows = await sql`SELECT id,name,email,role,status,avatar,joined_date FROM users ORDER BY name`;
    return Response.json(rows, { headers: corsHeaders() });
  }
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders() });
}
