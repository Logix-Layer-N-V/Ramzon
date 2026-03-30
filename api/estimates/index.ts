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
    const rows = await sql`SELECT * FROM estimates ORDER BY created_at DESC`;
    return Response.json(rows, { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(req: Request): Promise<Response> {
  const user = getAuthUser(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  if (!hasRole(user, ['Admin', 'Sales'])) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
  try {
    const {
      estimate_number, client_id, client_name, date, valid_until,
      currency = 'USD', subtotal = 0, tax_amount = 0, total = 0,
      status = 'Draft', notes = '', rep = '', items = []
    } = await req.json();
    const sql = getSql();
    const rows = await sql`
      INSERT INTO estimates (estimate_number,client_id,client_name,date,valid_until,currency,subtotal,tax_amount,total,status,notes,rep)
      VALUES (${estimate_number},${client_id},${client_name},${date},${valid_until},${currency},${subtotal},${tax_amount},${total},${status},${notes},${rep})
      RETURNING *`;
    const estimate = rows[0] as { id: string };
    for (const item of items as Array<{ description: string; quantity: number; unit_price: number; total: number }>) {
      await sql`INSERT INTO estimate_items (estimate_id,description,quantity,unit_price,total) VALUES (${estimate.id},${item.description},${item.quantity},${item.unit_price},${item.total})`;
    }
    return Response.json(estimate, { status: 201, headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
