// Document auto-numbering — persisted in localStorage

export type DocType = 'inv' | 'est' | 'pay' | 'crd';

export type DateFormat = 'YYYYMMDD' | 'YYYYMM' | 'YYYY' | 'MMDD';

interface DocNumConfig {
  prefix: string;
  dateFormat: DateFormat;
  counter: number;
}

const DEFAULTS: Record<DocType, DocNumConfig> = {
  inv: { prefix: 'INV', dateFormat: 'YYYYMMDD', counter: 6 },
  est: { prefix: 'EST', dateFormat: 'YYYYMMDD', counter: 4 },
  pay: { prefix: 'PAY', dateFormat: 'YYYYMMDD', counter: 5 },
  crd: { prefix: 'CRD', dateFormat: 'YYYYMMDD', counter: 0 },
};

function storageKey(type: DocType) {
  return `docNum_${type}`;
}

export function getDocNumConfig(type: DocType): DocNumConfig {
  try {
    const raw = localStorage.getItem(storageKey(type));
    if (raw) return { ...DEFAULTS[type], ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS[type] };
}

export function saveDocNumConfig(type: DocType, config: Partial<DocNumConfig>): void {
  const current = getDocNumConfig(type);
  localStorage.setItem(storageKey(type), JSON.stringify({ ...current, ...config }));
}

function buildDatePart(fmt: DateFormat): string {
  const now = new Date();
  const y = now.getFullYear().toString();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  switch (fmt) {
    case 'YYYYMMDD': return `${y}${m}${d}`;
    case 'YYYYMM':   return `${y}${m}`;
    case 'YYYY':     return y;
    case 'MMDD':     return `${m}${d}`;
  }
}

/** Returns what the NEXT number will look like, without committing. */
export function previewDocNumber(type: DocType): string {
  const cfg = getDocNumConfig(type);
  const seq = (cfg.counter + 1).toString().padStart(3, '0');
  return `${cfg.prefix}-${buildDatePart(cfg.dateFormat)}-${seq}`;
}

/** Increments the counter and returns the committed number. Call on save. */
export function commitDocNumber(type: DocType): string {
  const cfg = getDocNumConfig(type);
  const next = cfg.counter + 1;
  saveDocNumConfig(type, { counter: next });
  const seq = next.toString().padStart(3, '0');
  return `${cfg.prefix}-${buildDatePart(cfg.dateFormat)}-${seq}`;
}
