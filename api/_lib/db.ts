import { neon } from '@neondatabase/serverless';

// Lazy init — top-level neon() throws at build time if DATABASE_URL is not yet set
let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}
