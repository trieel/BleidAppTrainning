import { apiFetch } from "@/lib/api/client";
import { cachedFetch, invalidateCache, setCachedData } from "@/lib/api/cache";
import type {
  BodyWeightEntry,
  Exercise,
  ExerciseLatestPerformance,
  ExerciseProgress,
  Routine,
  Streak,
  VolumeProgress,
} from "@/types";

export function getActiveRoutine(forceRefresh = false) {
  return cachedFetch<Routine>(
    "active_routine",
    () => apiFetch<Routine>("/api/routines/my"),
    { ttlMs: 120_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export async function addRoutineDay(routineId: string, name?: string) {
  const updated = await apiFetch<Routine>(`/api/routines/${routineId}/days`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  setCachedData("active_routine", updated, 120_000);
  return updated;
}

export async function deleteRoutineDay(routineId: string, dayId: string) {
  const updated = await apiFetch<Routine>(`/api/routines/${routineId}/days/${dayId}`, {
    method: "DELETE",
  });
  setCachedData("active_routine", updated, 120_000);
  return updated;
}

export async function addRoutineExercise(
  routineId: string,
  dayId: string,
  input: {
    exerciseId: string;
    sets: number;
    repsMin: number;
    repsMax: number;
    restSeconds: number;
  },
) {
  const updated = await apiFetch<Routine>(`/api/routines/${routineId}/day/${dayId}/exercises`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  setCachedData("active_routine", updated, 120_000);
  return updated;
}

export async function removeRoutineExercise(routineId: string, dayId: string, exerciseId: string) {
  const updated = await apiFetch<Routine>(`/api/routines/${routineId}/day/${dayId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
  setCachedData("active_routine", updated, 120_000);
  return updated;
}

export async function completeOnboarding(input: {
  goal: string;
  level: string;
  daysPerWeek: number;
  sessionMin: number;
  age: number;
  sex: string;
  limitations: { type: string; severity: string }[];
}) {
  invalidateCache();
  return apiFetch<{ user: unknown; routine: Routine }>("/api/onboarding", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getExercises(muscleGroupId?: string, forceRefresh = false) {
  const query = muscleGroupId ? `?muscleGroupId=${muscleGroupId}` : "";
  return cachedFetch<Exercise[]>(
    `exercises_${muscleGroupId ?? "all"}`,
    () => apiFetch<Exercise[]>(`/api/exercises${query}`),
    { ttlMs: 600_000, staleWhileRevalidate: true, forceRefresh }, // 10 min
  );
}

export function getExerciseById(exerciseId: string) {
  return cachedFetch<Exercise>(
    `exercise_${exerciseId}`,
    () => apiFetch<Exercise>(`/api/exercises/${exerciseId}`),
    { ttlMs: 600_000, staleWhileRevalidate: true },
  );
}

export function getVolumeProgress(forceRefresh = false) {
  return cachedFetch<VolumeProgress[]>(
    "progress_volume",
    () => apiFetch<VolumeProgress[]>("/api/progress/volume"),
    { ttlMs: 60_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export function getStreak(forceRefresh = false) {
  return cachedFetch<Streak>(
    "progress_streak",
    () => apiFetch<Streak>("/api/progress/streak"),
    { ttlMs: 60_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export function getExerciseProgress(exerciseId: string, forceRefresh = false) {
  return cachedFetch<ExerciseProgress[]>(
    `progress_exercise_${exerciseId}`,
    () => apiFetch<ExerciseProgress[]>(`/api/progress/exercise/${exerciseId}`),
    { ttlMs: 60_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export function getLatestExercisePerformance(exerciseId: string, excludeSessionId?: string) {
  const query = excludeSessionId ? `?excludeSessionId=${excludeSessionId}` : "";
  return apiFetch<ExerciseLatestPerformance | null>(`/api/progress/exercise/${exerciseId}/latest${query}`);
}

export function getBodyWeightHistory(days = 90, forceRefresh = false) {
  return cachedFetch<BodyWeightEntry[]>(
    `bodyweight_history_${days}`,
    () => apiFetch<BodyWeightEntry[]>(`/api/progress/bodyweight?days=${days}`),
    { ttlMs: 60_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export function getLatestBodyWeight(forceRefresh = false) {
  return cachedFetch<BodyWeightEntry | null>(
    "bodyweight_latest",
    () => apiFetch<BodyWeightEntry | null>("/api/progress/bodyweight/latest"),
    { ttlMs: 60_000, staleWhileRevalidate: true, forceRefresh },
  );
}

export async function logBodyWeight(input: { weightKg: number; date?: string; notes?: string }) {
  const entry = await apiFetch<BodyWeightEntry>("/api/progress/bodyweight", {
    method: "POST",
    body: JSON.stringify(input),
  });
  invalidateCache("bodyweight_");
  setCachedData("bodyweight_latest", entry, 60_000);
  return entry;
}

export async function deleteBodyWeight(id: string) {
  await apiFetch<void>(`/api/progress/bodyweight/${id}`, {
    method: "DELETE",
  });
  invalidateCache("bodyweight_");
}
