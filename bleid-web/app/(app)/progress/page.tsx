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
import { formatExerciseName } from "@/lib/labels";
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

  const maxVolume = volume.length > 0 ? Math.max(...volume.map((item) => item.totalVolumeKg), 1) : 0;
  const maxWeight = exerciseProgress.length > 0 ? Math.max(...exerciseProgress.map((item) => item.maxWeightKg), 1) : 0;

  return (
    <div className="px-3.5 py-2 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Encabezado compacto */}
      <header className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary">
            <BarChart3 className="h-3 w-3" /> Métricas y Tendencias
          </div>
          <h1 className="font-serif text-2xl font-bold sm:text-4xl text-foreground tracking-tight mt-1">
            Progreso
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Evidencia objetiva de tu rendimiento a lo largo del tiempo.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shadow-soft"
          aria-label="Volver al panel"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {/* Franja de 3 Métricas en fila horizontal: Ultra compacta en mobile (iPhone 13) */}
      <div className="mt-3.5 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
        {/* Métrica 1: Volumen Semanal */}
        <div className="card-editorial rounded-xl sm:rounded-2xl border border-border bg-card p-2.5 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Esta sem.
            </p>
            <div className="grid h-5 w-5 sm:h-8 sm:w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <p className="mt-1 sm:mt-3 font-mono text-base sm:text-3xl font-bold tracking-tight text-foreground">
            {Math.round(volume.at(-1)?.totalVolumeKg ?? 0).toLocaleString("es-AR")}
            <span className="ml-0.5 text-[10px] sm:text-sm font-semibold text-muted-foreground font-sans">kg</span>
          </p>
          <p className="hidden sm:block mt-1 text-xs text-muted-foreground">Volumen de carga levantada</p>
        </div>

        {/* Métrica 2: Racha Actual */}
        <div className="card-editorial rounded-xl sm:rounded-2xl border border-border bg-card p-2.5 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Racha act.
            </p>
            <div className="grid h-5 w-5 sm:h-8 sm:w-8 place-items-center rounded-lg bg-[#BB6C32]/10 text-[#BB6C32]">
              <Flame className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <p className="mt-1 sm:mt-3 font-mono text-base sm:text-3xl font-bold tracking-tight text-foreground">
            {streak?.currentDays ?? 0}
            <span className="ml-0.5 text-[10px] sm:text-sm font-semibold text-muted-foreground font-sans">d</span>
          </p>
          <p className="hidden sm:block mt-1 text-xs text-muted-foreground">Consecutivos de disciplina</p>
        </div>

        {/* Métrica 3: Mejor Racha */}
        <div className="card-editorial rounded-xl sm:rounded-2xl border border-border bg-card p-2.5 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Récord
            </p>
            <div className="grid h-5 w-5 sm:h-8 sm:w-8 place-items-center rounded-lg bg-[#3E6B48]/10 text-[#3E6B48]">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          </div>
          <p className="mt-1 sm:mt-3 font-mono text-base sm:text-3xl font-bold tracking-tight text-foreground">
            {streak?.longestDays ?? 0}
            <span className="ml-0.5 text-[10px] sm:text-sm font-semibold text-muted-foreground font-sans">d</span>
          </p>
          <p className="hidden sm:block mt-1 text-xs text-muted-foreground">Tu récord histórico</p>
        </div>
      </div>

      {/* Gráfico de Volumen Semanal (Adaptable en altura para mobile) */}
      <section className="mt-4 sm:mt-6 card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-7 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Volumen semanal</p>
            <h2 className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold tracking-tight text-foreground">Carga Acumulada</h2>
          </div>
          <span className="rounded-full bg-secondary/80 border border-border/60 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono font-semibold text-primary">
            KG × REPS
          </span>
        </div>

        <div className="mt-4 sm:mt-8 flex h-36 sm:h-52 items-end gap-1.5 sm:gap-4">
          {volume.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-secondary/20 p-4 text-center">
              <BarChart3 className="h-5 w-5 text-primary/70 mb-1.5" />
              <p className="text-xs font-mono font-bold text-foreground">Sin series registradas</p>
              <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
                Completá tu primera sesión para empezar a registrar y comparar tu sobrecarga semanal.
              </p>
            </div>
          ) : (
            volume.slice(-10).map((item) => {
              const heightPercent = maxVolume > 0 ? Math.max((item.totalVolumeKg / maxVolume) * 85, 6) : 6;
              return (
                <div key={item.weekStart} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-primary opacity-0 transition group-hover:opacity-100">
                    {Math.round(item.totalVolumeKg)}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/70 transition-all duration-300 group-hover:bg-primary shadow-soft"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">{item.weekStart.slice(5)}</span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Evolución por Ejercicio (Sobrecarga progresiva) */}
      <section className="mt-4 sm:mt-6 card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-7 shadow-soft">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Sobrecarga progresiva</p>
            <h2 className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold tracking-tight text-foreground">Evolución por Ejercicio</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShow1RMModal(true)}
              className="flex items-center gap-1 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98] transition shadow-soft shrink-0"
            >
              <Trophy className="h-3 w-3" /> 1RM
            </button>
            {exerciseOptions.length > 0 && (
              <select
                value={selectedExercise}
                onChange={(event) => setSelectedExercise(event.target.value)}
                className="h-8 sm:h-9 max-w-[200px] truncate rounded-xl border border-border bg-muted/40 px-2 text-[11px] font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
              >
                {exerciseOptions.map((exercise) => (
                  <option key={exercise.exerciseId} value={exercise.exerciseId}>
                    {formatExerciseName(exercise.exerciseName)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mt-4 sm:mt-6 space-y-2">
          {exerciseProgress.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-secondary/30 border border-border/70 p-3.5 text-xs text-muted-foreground">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Dumbbell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-mono font-bold text-foreground">Sin datos para este ejercicio</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Registrá series con peso en tus sesiones para visualizar la progresión histórica.
                </p>
              </div>
            </div>
          ) : (
            exerciseProgress.slice(-8).map((point) => (
              <div key={point.date} className="flex items-center gap-2.5 py-0.5">
                <span className="w-12 text-[10px] font-mono text-muted-foreground font-medium">{point.date.slice(5)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${maxWeight > 0 ? Math.max((point.maxWeightKg / maxWeight) * 100, 5) : 5}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono text-[11px] font-bold text-foreground">
                  {point.maxWeightKg} kg <span className="text-[9px] text-muted-foreground font-normal">({point.totalReps}r)</span>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Componente de Peso Corporal */}
      <div className="mt-4 sm:mt-6">
        <BodyWeightTracker />
      </div>

      {/* Modal de Cálculo 1RM */}
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
