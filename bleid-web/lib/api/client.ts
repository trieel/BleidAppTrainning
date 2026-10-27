import { clearToken, getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

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
