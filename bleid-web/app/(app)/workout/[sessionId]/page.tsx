"use client";

import Link from "next/link";
import {
  CalendarDays,
  Calculator,
  Check,
  ChevronLeft,
  CircleCheck,
  History,
  House,
  Loader2,
  Pause,
  Sparkles,
  TimerReset,
  Trash2,
  Trophy,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getActiveRoutine, getLatestExercisePerformance } from "@/lib/api";
import { deleteSet, endSession, getSession, registerSet } from "@/lib/api/workout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RestTimer } from "@/components/features/rest-timer";
import { PlateCalculator } from "@/components/features/plate-calculator";
import { OneRepMaxModal } from "@/components/features/one-rep-max-modal";
import type { ExerciseLatestPerformance, Routine, RoutineExercise, WorkoutSession } from "@/types";

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState<Record<string, string>>({});
  const [reps, setReps] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [restTimer, setRestTimer] = useState<{ seconds: number; exerciseName: string } | null>(null);
  const [latestPerformances, setLatestPerformances] = useState<Record<string, ExerciseLatestPerformance | null>>({});
  const [plateCalcTarget, setPlateCalcTarget] = useState<{ exerciseId: string; weight: number } | null>(null);
  const [oneRepMaxTarget, setOneRepMaxTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
  } | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        let currentSession: WorkoutSession | null = null;
        const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("bleid-active-session") : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as WorkoutSession;
            if (parsed.id === params.sessionId) {
              currentSession = parsed;
            }
          } catch {
            // ignore JSON error
          }
        }

        if (!currentSession) {
          currentSession = await getSession(params.sessionId);
        }

        setSession(currentSession);
        if (currentSession.notes) {
          setNotes(currentSession.notes);
        }

        const activeRoutine = await getActiveRoutine();
        setRoutine(activeRoutine);

        const currentDay = activeRoutine.days.find((item) => item.id === currentSession.routineDayId);
        if (currentDay) {
          const perfMap: Record<string, ExerciseLatestPerformance | null> = {};
          await Promise.all(
            currentDay.exercises.map(async (ex) => {
              try {
                const perf = await getLatestExercisePerformance(ex.exerciseId, params.sessionId);
                perfMap[ex.exerciseId] = perf;
              } catch {
                perfMap[ex.exerciseId] = null;
              }
            })
          );
          setLatestPerformances(perfMap);
        }
      } catch {
        setError("No pudimos encontrar los datos de esta sesión.");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [params.sessionId]);

  const day = useMemo(() => {
    return routine?.days.find((item) => item.id === session?.routineDayId) ?? null;
  }, [routine, session]);

  const totalSets = day?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;
  const doneSets = session?.sets.filter((set) => set.completed).length ?? 0;
  const progress = totalSets ? Math.min((doneSets / totalSets) * 100, 100) : 0;

  function persist(updated: WorkoutSession) {
    setSession(updated);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("bleid-active-session", JSON.stringify(updated));
    }
  }

  async function saveSet(exercise: RoutineExercise) {
    if (!session) return;
    const exerciseSets = session.sets.filter((set) => set.exerciseId === exercise.exerciseId);
    const setNumber = exerciseSets.length + 1;
    if (setNumber > exercise.sets) return;
    setSaving(true);
    setError("");
    try {
      const updated = await registerSet(session.id, {
        exerciseId: exercise.exerciseId,
        setNumber,
        reps: Number(reps[exercise.exerciseId] || exercise.repsMin),
        weightKg: Number(weight[exercise.exerciseId] || 0),
        completed: true,
      });
      persist(updated);
      setRestTimer({
        seconds: exercise.restSeconds > 0 ? exercise.restSeconds : 90,
        exerciseName: exercise.exerciseName,
      });
    } catch {
      setError("No pudimos registrar la serie. Intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSet(setId: string) {
    if (!session) return;
    setSaving(true);
    setError("");
    try {
      const updated = await deleteSet(session.id, setId);
      persist(updated);
    } catch {
      setError("No pudimos eliminar la serie.");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    try {
      const finished = await endSession(session.id, notes);
      setSession(finished);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("bleid-active-session");
      }
      router.replace("/dashboard");
    } catch {
      setError("Error al finalizar el entrenamiento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (error && !session) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-semibold text-destructive">{error || "Sesión no encontrada."}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press"
        >
          <House className="h-4 w-4" /> Volver al Inicio
        </Link>
      </div>
    );
  }

  // If the session has already been completed, show a detailed read-only summary view
  if (session && session.finishedAt) {
    const totalVolume = session.sets
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.weightKg * s.reps, 0);

    const distinctExercises = Array.from(new Set(session.sets.map((s) => s.exerciseId))).map((id) => {
      const sets = session.sets.filter((s) => s.exerciseId === id);
      const name = sets[0]?.exerciseName || "Ejercicio";
      return { id, name, sets };
    });

    return (
      <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="flex items-center justify-between">
          <Link
            href="/history"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors tactile-press"
          >
            <ChevronLeft className="h-4 w-4" /> Volver al Historial
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-3 py-1 text-xs font-bold text-success font-mono">
            <Check className="h-3.5 w-3.5" /> Completada
          </span>
        </header>

        <div className="mt-8">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">Resumen de Entrenamiento</p>
          <h1 className="display-face mt-2 text-4xl font-black text-foreground">{session.routineDayName}</h1>
          <p suppressHydrationWarning className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {new Intl.DateTimeFormat("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(session.startedAt))}
          </p>
        </div>

        {/* Stats summary banner */}
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Series</p>
            <p className="display-face mt-1 text-2xl font-black text-foreground sm:text-3xl font-mono">{session.sets.length}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Volumen</p>
            <p className="display-face mt-1 text-2xl font-black text-primary sm:text-3xl font-mono">
              {Math.round(totalVolume).toLocaleString("es-AR")}
              <span className="ml-1 text-xs font-sans font-bold text-muted-foreground">kg</span>
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Ejercicios</p>
            <p className="display-face mt-1 text-2xl font-black text-foreground sm:text-3xl font-mono">{distinctExercises.length}</p>
          </div>
        </div>

        {/* Logged exercises breakdown */}
        <div className="mt-6 space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Ejercicios ejecutados</h2>
          {distinctExercises.length === 0 ? (
            <p className="text-xs text-muted-foreground">No se registraron series en esta sesión.</p>
          ) : (
            distinctExercises.map((group, index) => (
              <div key={group.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-xs font-mono font-bold text-primary border border-border">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{group.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{group.sets.length} series completadas</p>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-border/60 rounded-xl bg-secondary/40 px-4 py-1">
                  {group.sets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between py-2 text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">Serie {set.setNumber}</span>
                      <div className="flex items-center gap-4 font-bold text-foreground">
                        <span>{set.weightKg} kg</span>
                        <span>·</span>
                        <span>{set.reps} reps</span>
                        <Check className="h-3.5 w-3.5 text-success ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notes if present */}
        {session.notes && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-muted-foreground">Notas de la sesión</p>
            <p className="mt-2 text-sm text-foreground/90 leading-relaxed italic">&ldquo;{session.notes}&rdquo;</p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
          >
            <House className="h-4 w-4" /> Ir al Tablero
          </Link>
          <Link
            href="/history"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground shadow-soft hover:bg-secondary transition-all tactile-press"
          >
            <History className="h-4 w-4" /> Historial
          </Link>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Active workout view
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors tactile-press"
        >
          <ChevronLeft className="h-4 w-4" /> Salir al tablero
        </button>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-bold uppercase tracking-[0.15em] text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> En vivo
        </div>
      </header>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">Sesión en curso</p>
          <h1 className="display-face mt-2 text-4xl font-black text-foreground">{session.routineDayName}</h1>
        </div>
        <div className="text-right">
          <p className="display-face text-3xl font-black text-primary font-mono">
            {doneSets}
            <span className="text-base text-muted-foreground font-sans">/{totalSets}</span>
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">series</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {/* Exercises list */}
      <div className="mt-7 space-y-4">
        {day?.exercises.map((exercise, index) => {
          const exerciseSets = session.sets.filter((set) => set.exerciseId === exercise.exerciseId);
          const completed = exerciseSets.length;
          const finished = completed >= exercise.sets;
          const lastPerf = latestPerformances[exercise.exerciseId];

          return (
            <div
              key={exercise.id}
              className={`rounded-2xl border p-5 transition-all duration-200 ${
                finished
                  ? "border-success/40 bg-success/5 shadow-soft"
                  : "card-editorial shadow-soft hover:shadow-soft-hover"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    0{index + 1} · {exercise.sets} series objetivo
                  </p>
                  <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">{exercise.exerciseName}</h2>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    Objetivo: {exercise.repsMin}-{exercise.repsMax} reps · {exercise.restSeconds}s descanso
                  </p>

                  {/* Progressive Overload / Ghost Set "Chalk Memory" Indicator */}
                  {lastPerf ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                        <History className="h-3.5 w-3.5 text-primary" />
                        <span>
                          Anterior: <strong className="text-foreground text-telemetry">{lastPerf.maxWeightKg} kg</strong> ({lastPerf.sets.length} {lastPerf.sets.length === 1 ? "serie" : "series"})
                        </span>
                      </div>
                      {!weight[exercise.exerciseId] && (
                        <button
                          type="button"
                          onClick={() => setWeight((prev) => ({ ...prev, [exercise.exerciseId]: String(lastPerf.maxWeightKg) }))}
                          className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary hover:bg-primary/20 transition tactile-press"
                        >
                          Usar {lastPerf.maxWeightKg} kg
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span>Primera vez registrando este ejercicio</span>
                    </div>
                  )}
                </div>
                {finished ? (
                  <CircleCheck className="h-6 w-6 text-success" />
                ) : (
                  <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-mono font-bold text-muted-foreground">
                    {completed}/{exercise.sets}
                  </span>
                )}
              </div>

              {/* Logged sets for this exercise */}
              {exerciseSets.length > 0 && (
                <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-secondary/30 px-3.5 py-1">
                  {exerciseSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between py-2 text-xs font-mono">
                      <span className="font-semibold text-muted-foreground">Serie {set.setNumber}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-foreground text-telemetry">
                          {set.weightKg} kg × {set.reps} reps
                        </span>
                        <button
                          onClick={() => removeSet(set.id)}
                          disabled={saving}
                          className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-50 transition"
                          title="Eliminar serie"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!finished && (
                <div className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Kg</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setOneRepMaxTarget({
                              exerciseId: exercise.exerciseId,
                              exerciseName: exercise.exerciseName,
                              weight: Number(weight[exercise.exerciseId] || lastPerf?.maxWeightKg || 60),
                              reps: Number(reps[exercise.exerciseId] || exercise.repsMin || 8),
                            })
                          }
                          className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent hover:underline transition"
                          title="Calcular 1RM y zonas"
                        >
                          <Trophy className="h-3 w-3" /> 1RM
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPlateCalcTarget({
                              exerciseId: exercise.exerciseId,
                              weight: Number(weight[exercise.exerciseId] || lastPerf?.maxWeightKg || 60),
                            })
                          }
                          className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary hover:underline transition"
                          title="Calcular discos para barra"
                        >
                          <Calculator className="h-3 w-3" /> Discos
                        </button>
                      </div>
                    </div>
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 font-mono text-sm font-black text-foreground outline-none transition focus:border-primary focus:bg-background text-telemetry"
                      type="number"
                      min="0"
                      step="0.5"
                      value={weight[exercise.exerciseId] ?? ""}
                      onChange={(event) =>
                        setWeight({ ...weight, [exercise.exerciseId]: event.target.value })
                      }
                      placeholder={lastPerf ? String(lastPerf.maxWeightKg) : "0"}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Reps</span>
                    <input
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 font-mono text-sm font-black text-foreground outline-none transition focus:border-primary focus:bg-background text-telemetry"
                      type="number"
                      min="1"
                      value={reps[exercise.exerciseId] ?? ""}
                      onChange={(event) => setReps({ ...reps, [exercise.exerciseId]: event.target.value })}
                      placeholder={String(exercise.repsMin)}
                    />
                  </div>
                  <button
                    onClick={() => saveSet(exercise)}
                    disabled={saving}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-success text-success-foreground disabled:opacity-50 transition active:scale-95 shadow-soft hover:bg-success/90"
                    title="Guardar serie e iniciar descanso"
                  >
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* End session notes */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Pause className="h-4 w-4 text-primary" /> Cerrar sesión
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Podés finalizar cuando quieras; el progreso realizado se guardará inmediatamente en tu historial.
        </p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-4 min-h-20 w-full resize-none rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none focus:border-primary focus:bg-background transition"
          placeholder="¿Cómo te sentiste? Sensaciones, RPE, fatiga... (opcional)"
        />
      </div>

      <button
        onClick={finish}
        disabled={saving}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-60 transition active:scale-[0.99] shadow-soft hover:shadow-soft-hover border border-primary/25"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><TimerReset className="h-4 w-4" /> Finalizar entrenamiento</>}
      </button>

      {/* Floating Rest Timer */}
      {restTimer && (
        <RestTimer
          initialSeconds={restTimer.seconds}
          exerciseName={restTimer.exerciseName}
          onClose={() => setRestTimer(null)}
        />
      )}

      {/* Barbell Plate Calculator */}
      {plateCalcTarget && (
        <PlateCalculator
          initialWeightKg={plateCalcTarget.weight}
          onClose={() => setPlateCalcTarget(null)}
          onApplyWeight={(appliedWeight) => {
            setWeight((prev) => ({ ...prev, [plateCalcTarget.exerciseId]: String(appliedWeight) }));
          }}
        />
      )}

      {/* 1RM Calculator Modal */}
      {oneRepMaxTarget && (
        <OneRepMaxModal
          initialWeightKg={oneRepMaxTarget.weight}
          initialReps={oneRepMaxTarget.reps}
          exerciseName={oneRepMaxTarget.exerciseName}
          onClose={() => setOneRepMaxTarget(null)}
          onSelectWeight={(selectedKg) => {
            setWeight((prev) => ({ ...prev, [oneRepMaxTarget.exerciseId]: String(selectedKg) }));
          }}
        />
      )}
    </div>
  );
}
