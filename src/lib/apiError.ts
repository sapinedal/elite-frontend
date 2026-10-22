import { isAxiosError } from 'axios';

/**
 * Traducción central de errores a mensajes que el usuario final entiende.
 *
 * Flujo:
 * 1. El interceptor de Axios reemplaza `error.message` por el mensaje amigable y programa
 *    un toast global (ver `scheduleGlobalErrorToast`).
 * 2. Si el componente atrapa el error y llama a `getErrorMessage(err)`, el error queda marcado
 *    como manejado y el toast global se omite (el componente muestra el suyo).
 * 3. Los errores que nadie maneja igual le llegan al usuario por el toast global.
 */

const HANDLED = Symbol('errorHandled');
// Mensaje amigable que el interceptor ya calculó para el error
const TRANSLATED = Symbol('translatedMessage');

const MESSAGES = {
  network: 'No se pudo conectar con el servidor. Revisa tu conexión a internet e intenta de nuevo.',
  timeout: 'El servidor tardó demasiado en responder. Intenta de nuevo en unos segundos.',
  unauthorized: 'Tu sesión expiró. Inicia sesión nuevamente.',
  forbidden: 'No tienes permisos para realizar esta acción.',
  notFound: 'El registro que buscas no existe o fue eliminado.',
  tooLarge: 'El archivo es demasiado grande para subirlo. Reduce su tamaño o súbelo en partes.',
  sessionExpired: 'La página estuvo inactiva mucho tiempo. Recárgala e intenta de nuevo.',
  tooManyRequests: 'Hiciste demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.',
  validation: 'Revisa los datos ingresados.',
  server: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo; si el problema continúa, contacta a soporte.',
  unknown: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

type ApiErrorBody = { message?: unknown; error?: unknown; errors?: Record<string, unknown> };

// El backend puede responder HTML (ej. warnings de PHP); solo se usan cuerpos JSON
const bodyOf = (data: unknown): ApiErrorBody | null =>
  data && typeof data === 'object' && !Array.isArray(data) ? (data as ApiErrorBody) : null;

const backendMessage = (body: ApiErrorBody | null): string | null => {
  const message = body?.message ?? body?.error;
  return typeof message === 'string' && message.trim() !== '' ? message : null;
};

const validationMessages = (body: ApiErrorBody | null): string | null => {
  if (!body?.errors || typeof body.errors !== 'object') return null;
  const messages = Object.values(body.errors)
    .flat()
    .filter((m): m is string => typeof m === 'string');
  return messages.length ? messages.slice(0, 3).join('\n') : null;
};

/**
 * Mensaje amigable para cualquier error (Axios o de JavaScript).
 * `fallback` reemplaza el mensaje genérico de errores del servidor (5xx) o desconocidos.
 */
export function getErrorMessage(err: unknown, fallback?: string): string {
  markErrorHandled(err);

  if (isAxiosError(err)) {
    const translated = (err as unknown as Record<symbol, string>)[TRANSLATED];
    if (!err.response) {
      return translated ?? (err.code === 'ECONNABORTED' ? MESSAGES.timeout : MESSAGES.network);
    }
    const status = err.response.status;
    if (status >= 500) return fallback ?? MESSAGES.server;
    return translated ?? translateResponse(status, err.response.data);
  }

  if (err instanceof Error && err.message) return err.message;
  return fallback ?? MESSAGES.unknown;
}

function translateResponse(status: number, data: unknown): string {
  const body = bodyOf(data);
  const fromBackend = backendMessage(body);

  switch (status) {
    case 401: return MESSAGES.unauthorized;
    case 403: return fromBackend ?? MESSAGES.forbidden;
    case 404: return fromBackend ?? MESSAGES.notFound;
    case 413: return fromBackend ?? MESSAGES.tooLarge;
    case 419: return MESSAGES.sessionExpired;
    case 422: return validationMessages(body) ?? fromBackend ?? MESSAGES.validation;
    case 429: return MESSAGES.tooManyRequests;
    default:
      if (status >= 500) return MESSAGES.server;
      return fromBackend ?? MESSAGES.unknown;
  }
}

/**
 * Lo usa el interceptor: calcula el mensaje sin marcar el error como manejado.
 */
export function translateAxiosError(err: unknown): string {
  if (!isAxiosError(err)) return MESSAGES.unknown;
  const message = err.response
    ? translateResponse(err.response.status, err.response.data)
    : err.code === 'ECONNABORTED' ? MESSAGES.timeout : MESSAGES.network;
  (err as unknown as Record<symbol, string>)[TRANSLATED] = message;
  return message;
}

export function markErrorHandled(err: unknown): void {
  if (err && typeof err === 'object') {
    (err as Record<symbol, boolean>)[HANDLED] = true;
  }
}

const isHandled = (err: unknown): boolean =>
  Boolean(err && typeof err === 'object' && (err as Record<symbol, boolean>)[HANDLED]);

// ---- Toast global de errores (NotificationProvider se suscribe) ----

type ErrorListener = (message: string) => void;
const listeners = new Set<ErrorListener>();

export function onGlobalError(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Muestra el error en un toast si ningún componente lo manejó. Se difiere con setTimeout para que
 * los `catch` (que corren como microtareas) alcancen a marcarlo como manejado antes.
 */
export function scheduleGlobalErrorToast(err: unknown, message: string): void {
  setTimeout(() => {
    if (!isHandled(err)) {
      listeners.forEach((listener) => listener(message));
    }
  }, 0);
}
