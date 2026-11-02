import { clearToken, getToken, isTokenExpiringSoon, setToken } from "@/lib/auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const currentToken = getToken();
    if (!currentToken) return null;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { token: string };
        if (data?.token) {
          setToken(data.token);
          return data.token;
        }
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = getToken();

  // Si el token está próximo a expirar y no estamos en auth, renovar silenciosamente
  if (
    token &&
    !path.startsWith("/api/auth/login") &&
    !path.startsWith("/api/auth/register") &&
    !path.startsWith("/api/auth/refresh") &&
    isTokenExpiringSoon(7)
  ) {
    refreshAccessToken().then((newToken) => {
      if (newToken) token = newToken;
    });
  }

  const buildHeaders = (authToken: string | null) => {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
    if (typeof window !== "undefined") {
      headers.set("X-Timezone-Offset", String(-new Date().getTimezoneOffset()));
    }
    return headers;
  };

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(token),
  });

  // Si da 401 e teníamos token, intentar refrescar y reintentar una vez
  if (response.status === 401 && token && !path.startsWith("/api/auth/refresh")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: buildHeaders(newToken),
      });
    }
  }

  if (response.status === 401) {
    clearToken();
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/register")
    ) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    let errorMessage = body?.detail;
    if (!errorMessage && body?.errors && typeof body.errors === "object") {
      errorMessage = Object.values(body.errors).flat().join(" ").trim();
    }
    if (!errorMessage && body?.title) {
      errorMessage = body.title;
    }
    throw new ApiError(errorMessage || "No pudimos completar la solicitud.", response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
