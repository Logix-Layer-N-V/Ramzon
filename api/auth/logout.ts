import { corsHeaders } from '../_lib/cors';

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(): Promise<Response> {
  const headers = new Headers(corsHeaders() as Record<string, string>);
  headers.set('Set-Cookie', 'refreshToken=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');
  return Response.json({ ok: true }, { headers });
}
