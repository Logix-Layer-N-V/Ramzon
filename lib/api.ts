import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000/api',
  withCredentials: true,
});

let _getToken: (() => string | null) | null = null;
export const setTokenGetter = (fn: () => string | null): void => {
  _getToken = fn;
};

api.interceptors.request.use(cfg => {
  const token = _getToken?.();
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async (err: unknown) => {
    const anyErr = err as { response?: { status: number }; config?: { _retry?: boolean } };
    if (anyErr.response?.status === 401 && anyErr.config && !anyErr.config._retry) {
      anyErr.config._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const cfg = anyErr.config as Record<string, unknown>;
        if (cfg.headers && typeof cfg.headers === 'object') {
          Object.assign(cfg.headers as Record<string, unknown>, {
            Authorization: `Bearer ${data.accessToken}`,
          });
        }
        return api(anyErr.config as Parameters<typeof api>[0]);
      } catch {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(err);
  }
);
