import { getSql } from '../_lib/db';
import { getAuthUser } from '../_lib/auth';
import { hasRole } from '../_lib/roles';
import { corsHeaders } from '../_lib/cors';

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM expenses ORDER BY date DESC`;
    return Response.json(rows, { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  if (!hasRole(user, ['Admin', 'Accountant'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  try {
    const { category, vendor = '', amount, currency = 'USD', date, description = '' } = await req.json();
    const sql = getSql();
    const rows = await sql`
      INSERT INTO expenses (category,vendor,amount,currency,date,description)
      VALUES (${category},${vendor},${amount},${currency},${date},${description})
      RETURNING *`;
    return Response.json(rows[0], { status: 201, headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
