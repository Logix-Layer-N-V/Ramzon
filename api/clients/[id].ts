import { getSql } from '../_lib/db';
import { getAuthUser } from '../_lib/auth';
import { hasRole } from '../_lib/roles';
import { corsHeaders } from '../_lib/cors';

function getId(req: Request): string {
  return new URL(req.url).searchParams.get('id') ?? '';
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM clients WHERE id=${getId(req)}`;
    if (!rows[0]) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    return Response.json(rows[0], { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  try {
    const { name, company, email, vat_number, address, phone, status } = await req.json();
    const sql = getSql();
    const rows = await sql`
      UPDATE clients SET name=${name},company=${company},email=${email},
      vat_number=${vat_number},address=${address},phone=${phone},status=${status}
      WHERE id=${getId(req)} RETURNING *`;
    return Response.json(rows[0], { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  try {
    const sql = getSql();
    await sql`DELETE FROM clients WHERE id=${getId(req)}`;
    return Response.json({ ok: true }, { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
