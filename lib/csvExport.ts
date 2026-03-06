/** Download an array of objects as a CSV file. */
export function exportCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(','),
    ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
