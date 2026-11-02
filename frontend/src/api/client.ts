export const API_BASE = '/knowledgehub';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener());
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipUnauthorizedRedirect?: boolean } = {}
): Promise<T> {
  const { skipUnauthorizedRedirect = false, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      ...headers,
    },
    ...rest,
  });

  if (response.status === 401 && !skipUnauthorizedRedirect) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (data && typeof data.message === 'string') {
        errorMessage = data.message;
      }
    } catch {
      // Fallback to status text
      if (response.statusText) {
        errorMessage = response.statusText;
      }
    }
    throw new ApiError(errorMessage, response.status);
  }

  // Handle 204 No Content or empty body
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
