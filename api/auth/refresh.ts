import jwt from 'jsonwebtoken';
import { signAccess } from '../_lib/auth';
import type { AuthUser } from '../_lib/auth';
import { corsHeaders } from '../_lib/cors';
import { parseCookies } from '../_lib/cookies';

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request): Promise<Response> {
  const token = parseCookies(req).refreshToken;
  if (!token) {
    return Response.json({ error: 'No refresh token' }, { status: 401, headers: corsHeaders() });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthUser;
    const accessToken = signAccess({ id: payload.id, role: payload.role, name: payload.name });
    return Response.json({ accessToken }, { headers: corsHeaders() });
  } catch {
    return Response.json({ error: 'Invalid refresh token' }, { status: 401, headers: corsHeaders() });
  }
}
