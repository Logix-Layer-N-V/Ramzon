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
  if (!hasRole(user, ['Admin'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  try {
    const sql = getSql();
    const rows = await sql`SELECT id,name,email,role,status,avatar,joined_date FROM users ORDER BY name`;
    return Response.json(rows, { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
