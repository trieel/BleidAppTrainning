import { apiFetch } from "@/lib/api/client";
import type {
  BodyWeightEntry,
  Exercise,
  ExerciseLatestPerformance,
  ExerciseProgress,
  Routine,
  Streak,
  VolumeProgress,
} from "@/types";

export function getActiveRoutine() {
  return apiFetch<Routine>("/api/routines/my");
}

export function addRoutineDay(routineId: string, name?: string) {
  return apiFetch<Routine>(`/api/routines/${routineId}/days`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteRoutineDay(routineId: string, dayId: string) {
  return apiFetch<Routine>(`/api/routines/${routineId}/days/${dayId}`, {
    method: "DELETE",
  });
}

export function addRoutineExercise(routineId: string, dayId: string, input: {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}) {
  return apiFetch<Routine>(`/api/routines/${routineId}/day/${dayId}/exercises`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function removeRoutineExercise(routineId: string, dayId: string, exerciseId: string) {
  return apiFetch<Routine>(`/api/routines/${routineId}/day/${dayId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
}

export function completeOnboarding(input: {
  goal: string;
  level: string;
  daysPerWeek: number;
  sessionMin: number;
  age: number;
  sex: string;
  limitations: { type: string; severity: string }[];
}) {
  return apiFetch<{ user: unknown; routine: Routine }>("/api/onboarding", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getExercises(muscleGroupId?: string) {
  const query = muscleGroupId ? `?muscleGroupId=${muscleGroupId}` : "";
  return apiFetch<Exercise[]>(`/api/exercises${query}`);
}

export function getExerciseById(exerciseId: string) {
  return apiFetch<Exercise>(`/api/exercises/${exerciseId}`);
}

export function getVolumeProgress() {
  return apiFetch<VolumeProgress[]>("/api/progress/volume");
}

export function getStreak() {
  return apiFetch<Streak>("/api/progress/streak");
}

export function getExerciseProgress(exerciseId: string) {
  return apiFetch<ExerciseProgress[]>(`/api/progress/exercise/${exerciseId}`);
}

export function getLatestExercisePerformance(exerciseId: string, excludeSessionId?: string) {
  const query = excludeSessionId ? `?excludeSessionId=${excludeSessionId}` : "";
  return apiFetch<ExerciseLatestPerformance | null>(`/api/progress/exercise/${exerciseId}/latest${query}`);
}

export function getBodyWeightHistory(days = 90) {
  return apiFetch<BodyWeightEntry[]>(`/api/progress/bodyweight?days=${days}`);
}

export function getLatestBodyWeight() {
  return apiFetch<BodyWeightEntry | null>("/api/progress/bodyweight/latest");
}

export function logBodyWeight(input: { weightKg: number; date?: string; notes?: string }) {
  return apiFetch<BodyWeightEntry>("/api/progress/bodyweight", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteBodyWeight(id: string) {
  return apiFetch<void>(`/api/progress/bodyweight/${id}`, {
    method: "DELETE",
  });
}
