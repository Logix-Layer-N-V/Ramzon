import axios from 'axios';

// On Vercel (non-localhost), always use same-origin /api — never localhost
const _envUrl = import.meta.env.VITE_API_URL as string | undefined;
const _baseURL =
  typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? '/api'
    : (_envUrl || 'http://localhost:4000/api');

export const api = axios.create({
  baseURL: _baseURL,
  withCredentials: true,
});

let _getToken: (() => string | null) | null = null;
let _setToken: ((t: string) => void) | null = null;

export const setTokenGetter = (fn: () => string | null): void => { _getToken = fn; };
export const setTokenSetter = (fn: (t: string) => void): void => { _setToken = fn; };

api.interceptors.request.use(cfg => {
  // Don't overwrite Authorization on retries — the response interceptor already set the fresh token
  if ((cfg as Record<string, unknown>)._retry) return cfg;
  const token = _getToken?.();
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async (err: unknown) => {
    const anyErr = err as { response?: { status: number }; config?: { _retry?: boolean; url?: string } };
    const url = (anyErr.config as Record<string, unknown> | undefined)?.url as string | undefined ?? '';
    // Never retry auth endpoints — login/refresh failures must propagate directly
    if (anyErr.response?.status === 401 && anyErr.config && !anyErr.config._retry && !url.includes('/auth/')) {
      anyErr.config._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        // Update stored token so subsequent requests use it immediately
        _setToken?.(data.accessToken);
        const cfg = anyErr.config as Record<string, unknown>;
        if (cfg.headers && typeof cfg.headers === 'object') {
          Object.assign(cfg.headers as Record<string, unknown>, {
            Authorization: `Bearer ${data.accessToken}`,
          });
        }
        return api(anyErr.config as Parameters<typeof api>[0]);
      } catch {
        window.location.href = '/#/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);
