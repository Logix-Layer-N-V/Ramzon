import { getSql } from '../_lib/db';
import { getAuthUser } from '../_lib/auth';
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
    const rows = await sql`SELECT * FROM credits WHERE id=${id}`;
    if (!rows[0]) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    return Response.json(rows[0], { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
