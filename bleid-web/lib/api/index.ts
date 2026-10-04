import { apiFetch } from "@/lib/api/client";
import type {
  Exercise,
  ExerciseProgress,
  Routine,
  Streak,
  VolumeProgress,
} from "@/types";

export function getActiveRoutine() {
  return apiFetch<Routine>("/api/routines/my");
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

export function getVolumeProgress() {
  return apiFetch<VolumeProgress[]>("/api/progress/volume");
}

export function getStreak() {
  return apiFetch<Streak>("/api/progress/streak");
}

export function getExerciseProgress(exerciseId: string) {
  return apiFetch<ExerciseProgress[]>(`/api/progress/exercise/${exerciseId}`);
}
