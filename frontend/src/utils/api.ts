export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://riadh-voyages-api.onrender.com';
export const AUTH_CHANGED_EVENT = 'auth-changed';

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('auth_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto set content-type to application/json for body payloads if not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}
