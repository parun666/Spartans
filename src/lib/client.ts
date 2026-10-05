export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}
