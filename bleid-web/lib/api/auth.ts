import { apiFetch } from "@/lib/api/client";
import { cachedFetch, invalidateCache } from "@/lib/api/cache";
import type { AuthResult, UserProfile } from "@/types";

export function register(input: { email: string; password: string; fullName: string }) {
  invalidateCache();
  return apiFetch<AuthResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  invalidateCache();
  return apiFetch<AuthResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refreshSession() {
  return apiFetch<AuthResult>("/api/auth/refresh", {
    method: "POST",
  });
}

export function getMe() {
  return cachedFetch<UserProfile>("auth_me", () => apiFetch<UserProfile>("/api/auth/me"), {
    ttlMs: 300_000, // 5 min
    staleWhileRevalidate: true,
  });
}

export async function updateProfile(input: {
  fullName?: string;
  age?: number | null;
  sex?: string | null;
  goal?: string | null;
  level?: string | null;
  daysPerWeek?: number | null;
  sessionMin?: number | null;
  limitations?: { type: string; severity: string }[];
}) {
  const updated = await apiFetch<UserProfile>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  invalidateCache("auth_me");
  return updated;
}
