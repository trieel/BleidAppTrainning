import { apiFetch } from "@/lib/api/client";
import type { WorkoutSession } from "@/types";

export function startSession(routineDayId: string) {
  return apiFetch<WorkoutSession>("/api/workout/session/start", {
    method: "POST",
    body: JSON.stringify({ routineDayId }),
  });
}

export function getActiveSession() {
  return apiFetch<WorkoutSession | null | undefined>("/api/workout/session/active");
}

export function getSession(sessionId: string) {
  return apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}`);
}

export function registerSet(sessionId: string, input: {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}) {
  return apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}/set`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteSet(sessionId: string, setId: string) {
  return apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}/set/${setId}`, {
    method: "DELETE",
  });
}

export function endSession(sessionId: string, notes?: string) {
  return apiFetch<WorkoutSession>(`/api/workout/session/${sessionId}/end`, {
    method: "PUT",
    body: JSON.stringify({ notes: notes || null }),
  });
}

export function getHistory(page = 1, pageSize = 20) {
  return apiFetch<WorkoutSession[]>(`/api/workout/history?page=${page}&pageSize=${pageSize}`);
}
