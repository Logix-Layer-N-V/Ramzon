export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get('cookie') || '';
  return Object.fromEntries(
    header.split(';')
      .map(c => c.trim().split('='))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k.trim(), decodeURIComponent(v.join('='))])
  );
}
