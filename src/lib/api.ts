import { auth } from '../firebase';

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Debes iniciar sesión para continuar.');
  }
  return user.getIdToken();
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = await getIdToken();
  const { body, headers, ...rest } = options;

  const response = await fetch(path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error || `Error del servidor (${response.status})`
    );
  }
  return data as T;
}
