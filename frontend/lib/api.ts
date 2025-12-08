// frontend/lib/api.ts
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api";
// ↑ change to your backend URL/port if different

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const text = await res.text();
      if (text) msg = text;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  if (res.status === 204) {
    // no body
    return undefined as T;
  }

  const data = (await res.json()) as T;
  return data;
}

export const api = {
  get:  <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put:  <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
