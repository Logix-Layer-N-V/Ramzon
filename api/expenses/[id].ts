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
    const id = new URL(req.url).searchParams.get('id') ?? '';
    const sql = getSql();
    const rows = await sql`SELECT * FROM expenses WHERE id=${id}`;
    if (!rows[0]) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    return Response.json(rows[0], { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  if (!hasRole(user, ['Admin', 'Accountant'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  try {
    const { status } = await req.json();
    const id = new URL(req.url).searchParams.get('id') ?? '';
    const sql = getSql();
    const rows = await sql`UPDATE expenses SET status=${status} WHERE id=${id} RETURNING *`;
    return Response.json(rows[0], { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
