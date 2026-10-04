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
