"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Dumbbell, Flame, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getActiveRoutine, getExerciseProgress, getStreak, getVolumeProgress } from "@/lib/api";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BodyWeightTracker } from "@/components/features/body-weight-tracker";
import { OneRepMaxModal } from "@/components/features/one-rep-max-modal";
import type { ExerciseProgress, Routine, Streak, VolumeProgress } from "@/types";

export default function ProgressPage() {
  const router = useRouter();
  const [volume, setVolume] = useState<VolumeProgress[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [show1RMModal, setShow1RMModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getVolumeProgress(), getStreak(), getActiveRoutine()])
      .then(([volumeResult, streakResult, routineResult]) => {
        setVolume(volumeResult);
        setStreak(streakResult);
        setRoutine(routineResult);
        const first = routineResult.days[0]?.exercises[0]?.exerciseId;
        if (first) setSelectedExercise(first);
      })
      .catch((exception) => {
        if (exception instanceof ApiError && exception.status === 404) {
          router.replace("/onboarding");
        } else {
          setError(exception instanceof ApiError ? exception.message : "No pudimos cargar tus métricas.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (selectedExercise) {
      getExerciseProgress(selectedExercise).then(setExerciseProgress);
    }
  }, [selectedExercise]);

  if (loading) return <LoadingScreen />;

  const exerciseOptions =
    routine?.days
      .flatMap((day) => day.exercises)
      .filter((exercise, index, all) => all.findIndex((candidate) => candidate.exerciseId === exercise.exerciseId) === index) ?? [];

  const maxVolume = Math.max(...volume.map((item) => item.totalVolumeKg), 1);
  const maxWeight = Math.max(...exerciseProgress.map((item) => item.maxWeightKg), 1);

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-bold text-primary">
            <BarChart3 className="h-3.5 w-3.5" /> Métricas y Tendencias
          </div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl text-foreground tracking-tight mt-2">
            Progreso
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Evidencia objetiva de tu rendimiento a lo largo del tiempo.</p>
        </div>
        <Link
          href="/dashboard"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card-editorial rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Esta semana</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-foreground">
            {Math.round(volume.at(-1)?.totalVolumeKg ?? 0).toLocaleString("es-AR")}
            <span className="ml-1 text-sm font-semibold text-muted-foreground font-sans">kg</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Volumen de carga levantada</p>
        </div>

        <div className="card-editorial rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Racha Actual</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#BB6C32]/10 text-[#BB6C32]">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-foreground">
            {streak?.currentDays ?? 0}
            <span className="ml-1 text-sm font-semibold text-muted-foreground font-sans">días</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Consecutivos de disciplina</p>
        </div>

        <div className="card-editorial rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Mejor Racha</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#3E6B48]/10 text-[#3E6B48]">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-foreground">
            {streak?.longestDays ?? 0}
            <span className="ml-1 text-sm font-semibold text-muted-foreground font-sans">días</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tu récord histórico personal</p>
        </div>
      </div>

      {/* Weekly Volume Section */}
      <section className="mt-6 card-editorial rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Volumen semanal</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Carga Acumulada</h2>
          </div>
          <span className="rounded-full bg-secondary/80 border border-border/60 px-3 py-1 text-[11px] font-mono font-semibold text-primary">
            KG × REPS
          </span>
        </div>

        <div className="mt-8 flex h-52 items-end gap-2 sm:gap-4">
          {volume.length === 0 ? (
            <div className="grid h-full w-full place-items-center text-sm text-muted-foreground bg-muted/20 rounded-xl">
              Completá tu primera sesión para empezar a ver tu tendencia semanal.
            </div>
          ) : (
            volume.slice(-10).map((item) => {
              const heightPercent = Math.max((item.totalVolumeKg / maxVolume) * 85, 6);
              return (
                <div key={item.weekStart} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-mono font-bold text-primary opacity-0 transition group-hover:opacity-100">
                    {Math.round(item.totalVolumeKg)}
                  </span>
                  <div
                    className="w-full max-w-12 rounded-t-lg bg-primary/70 transition-all duration-300 group-hover:bg-primary shadow-soft"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-mono text-muted-foreground">{item.weekStart.slice(5)}</span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Exercise Progression Section */}
      <section className="mt-6 card-editorial rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-soft">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Sobrecarga progresiva</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Evolución por Ejercicio</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShow1RMModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98] transition shadow-soft"
            >
              <Trophy className="h-3.5 w-3.5" /> Calcular 1RM
            </button>
            {exerciseOptions.length > 0 && (
              <select
                value={selectedExercise}
                onChange={(event) => setSelectedExercise(event.target.value)}
                className="h-10 rounded-xl border border-border bg-muted/40 px-3 text-xs font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
              >
                {exerciseOptions.map((exercise) => (
                  <option key={exercise.exerciseId} value={exercise.exerciseId}>
                    {exercise.exerciseName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {exerciseProgress.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/60 p-5 text-sm text-muted-foreground">
              <Dumbbell className="h-5 w-5 text-primary" />
              <span>Registrá series de este ejercicio en tus entrenamientos para ver la evolución de tu carga máxima.</span>
            </div>
          ) : (
            exerciseProgress.slice(-8).map((point) => (
              <div key={point.date} className="flex items-center gap-3">
                <span className="w-16 text-[10px] font-mono text-muted-foreground font-medium">{point.date.slice(5)}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.max((point.maxWeightKg / maxWeight) * 100, 5)}%` }}
                  />
                </div>
                <span className="w-24 text-right font-mono text-xs font-bold text-foreground">
                  {point.maxWeightKg} kg <span className="text-[10px] text-muted-foreground font-normal">({point.totalReps}r)</span>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Body Weight Tracker Section */}
      <div className="mt-6">
        <BodyWeightTracker />
      </div>

      {/* 1RM Calculator Modal */}
      {show1RMModal && (
        <OneRepMaxModal
          initialWeightKg={exerciseProgress.length > 0 ? maxWeight : 80}
          initialReps={8}
          exerciseName={exerciseOptions.find((e) => e.exerciseId === selectedExercise)?.exerciseName}
          onClose={() => setShow1RMModal(false)}
        />
      )}
    </div>
  );
}
