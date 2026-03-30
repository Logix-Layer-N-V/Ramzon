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
    const rows = await sql`SELECT * FROM invoices ORDER BY created_at DESC`;
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
      invoice_number, client_id, client_name, date, due_date,
      currency = 'USD', subtotal = 0, tax_amount = 0, total_amount = 0,
      status = 'Draft', notes = '', rep = '', paid_amount = 0, items = []
    } = await req.json();
    const sql = getSql();
    const rows = await sql`
      INSERT INTO invoices (invoice_number,client_id,client_name,date,due_date,currency,subtotal,tax_amount,total_amount,status,notes,rep,paid_amount)
      VALUES (${invoice_number},${client_id},${client_name},${date},${due_date},${currency},${subtotal},${tax_amount},${total_amount},${status},${notes},${rep},${paid_amount})
      RETURNING *`;
    const invoice = rows[0] as { id: string };
    for (const item of items as Array<{ description: string; quantity: number; unit_price: number; total: number }>) {
      await sql`INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,total) VALUES (${invoice.id},${item.description},${item.quantity},${item.unit_price},${item.total})`;
    }
    return Response.json(invoice, { status: 201, headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
