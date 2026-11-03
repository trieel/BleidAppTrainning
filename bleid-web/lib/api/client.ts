import { clearToken, getToken, isTokenExpiringSoon, parseJwtPayload, setToken } from "@/lib/auth";

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

  // Si tenemos token y no es ruta de autenticación básica
  const isAuthRoute =
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/register") ||
    path.startsWith("/api/auth/refresh");

  if (token && !isAuthRoute) {
    const payload = parseJwtPayload(token);
    const isExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : false;

    // Si ya expiró (en periodo de gracia), renovarlo antes de hacer la petición
    if (isExpired) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = refreshed;
      }
    } else if (isTokenExpiringSoon(7)) {
      // Si está próximo a vencer en 7 días, renovar en segundo plano sin bloquear
      refreshAccessToken().catch(() => null);
    }
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

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutMs = options.signal ? 60000 : 45000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: buildHeaders(token),
    });

    clearTimeout(timeoutId);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "El servidor está tardando en responder. Si el servicio estaba en reposo, puede demorar unos segundos.",
        504,
      );
    }
    throw new ApiError(
      "Error de conexión con el servidor. Verifica tu conexión a internet.",
      0,
    );
  }

  // Si da 401 y teníamos token, intentar refrescar una vez y reintentar
  if (response.status === 401 && token && !isAuthRoute) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      try {
        response = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: buildHeaders(newToken),
        });
      } catch {
        // En caso de corte en el reintento, mantener la respuesta original 401
      }
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
