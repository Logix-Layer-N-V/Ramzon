import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db';
import { signAccess, signRefresh } from '../_lib/auth';
import { corsHeaders } from '../_lib/cors';

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { email, password } = await req.json() as { email: string; password: string };
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE email=${email} AND status='Active'`;
    const user = rows[0] as { id: string; role: string; name: string; password: string } | undefined;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders() });
    }
    const payload = { id: user.id, role: user.role, name: user.name };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const headers = new Headers(corsHeaders() as Record<string, string>);
    headers.set('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Max-Age=${7 * 86400}; Path=/${secure}`);
    return Response.json({ accessToken, user: payload }, { headers });
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders() });
  }
}
