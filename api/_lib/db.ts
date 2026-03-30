import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.STORAGE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('No database URL found — set DATABASE_URL env var');
    _sql = neon(url);
  }
  return _sql;
}
