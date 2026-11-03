import { apiFetch } from "@/lib/api/client";
import { cachedFetch, invalidateCache, setCachedData } from "@/lib/api/cache";
import type { WorkoutSession } from "@/types";

export async function startSession(routineDayId: string) {
  const session = await apiFetch<WorkoutSession>("/api/workout/session/start", {
    method: "POST",
    body: JSON.stringify({ routineDayId }),
  });
  setCachedData("active_session", session, 15_000);
  invalidateCache("history_");
  invalidateCache("progress_");
  return session;
}

export function getActiveSession(forceRefresh = false) {
  return cachedFetch<WorkoutSession | null | undefined>(
    "active_session",
    () => apiFetch<WorkoutSession | null | undefined>("/api/workout/session/active"),
    { ttlMs: 15_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export function getSession(sessionId: string) {
  return apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}`);
}

export async function registerSet(
  sessionId: string,
  input: {
    exerciseId: string;
    setNumber: number;
    reps: number;
    weightKg: number;
    completed: boolean;
  },
) {
  const session = await apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}/set`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  setCachedData("active_session", session, 15_000);
  return session;
}

export async function deleteSet(sessionId: string, setId: string) {
  const session = await apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}/set/${setId}`, {
    method: "DELETE",
  });
  setCachedData("active_session", session, 15_000);
  return session;
}

export async function endSession(sessionId: string, notes?: string) {
  const session = await apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}/end`, {
    method: "PUT",
    body: JSON.stringify({ notes: notes || null }),
  });
  invalidateCache("active_session");
  invalidateCache("history_");
  invalidateCache("progress_");
  return session;
}

export function getHistory(page = 1, pageSize = 20, forceRefresh = false) {
  return cachedFetch<WorkoutSession[]>(
    `history_${page}_${pageSize}`,
    () => apiFetch<WorkoutSession[]>(`/api/workout/history?page=${page}&pageSize=${pageSize}`),
    { ttlMs: 60_000, staleWhileRevalidate: true, forceRefresh },
  );
}
