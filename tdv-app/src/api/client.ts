import { API_URL } from '../config';

// Cliente único para hablar con el backend. Añade la cabecera X-Client: mobile (el servidor
// responde con el token en el JSON en vez de cookie) y el token Bearer cuando hay sesión.

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (t: string | null) => { authToken = t; };
// El AuthProvider se registra aquí para cerrar la sesión si el servidor responde 401 (token vencido).
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

type Options = { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number };

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = false, timeoutMs = 12000 } = opts;
  const headers: Record<string, string> = { 'X-Client': 'mobile', Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu Wi-Fi y que el backend esté encendido.');
  } finally { clearTimeout(timer); }

  let data: any = {};
  try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }

  if (!res.ok) {
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, data?.error || `Error ${res.status}`, data);
  }
  return data as T;
}
