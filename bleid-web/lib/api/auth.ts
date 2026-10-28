import { apiFetch } from "@/lib/api/client";
import type { AuthResult, UserProfile } from "@/types";

export function register(input: { email: string; password: string; fullName: string }) {
  return apiFetch<AuthResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<AuthResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe() {
  return apiFetch<UserProfile>("/api/auth/me");
}

export function updateProfile(input: {
  fullName?: string;
  age?: number | null;
  sex?: string | null;
  goal?: string | null;
  level?: string | null;
  daysPerWeek?: number | null;
  sessionMin?: number | null;
  limitations?: { type: string; severity: string }[];
}) {
  return apiFetch<UserProfile>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
