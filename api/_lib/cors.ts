export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': process.env.CLIENT_URL || 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}
