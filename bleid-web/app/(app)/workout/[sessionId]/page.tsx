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
  Plus,
  Sparkles,
  TimerReset,
  Trash2,
  Trophy,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getActiveRoutine, getLatestExercisePerformance } from "@/lib/api";
import { deleteSet, endSession, getSession, registerSet } from "@/lib/api/workout";
import { ApiError } from "@/lib/api/client";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RestTimer } from "@/components/features/rest-timer";
import { PlateCalculator } from "@/components/features/plate-calculator";
import { OneRepMaxModal } from "@/components/features/one-rep-max-modal";
import { formatExerciseName } from "@/lib/labels";
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
  const [extraInputOpen, setExtraInputOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadSession() {
      try {
        const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("bleid-active-session") : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as WorkoutSession;
            if (parsed.id === params.sessionId) {
              setSession(parsed);
              setLoading(false);
            }
          } catch {
            // parse error fallback
          }
        }

        const [sessionData, routineData] = await Promise.all([
          getSession(params.sessionId),
          getActiveRoutine().catch(() => null),
        ]);

        setSession(sessionData);
        setRoutine(routineData);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("bleid-active-session", JSON.stringify(sessionData));
        }

        const distinctExerciseIds = Array.from(new Set(sessionData.sets.map((s) => s.exerciseId)));
        if (routineData) {
          const day = routineData.days.find((d) => d.id === sessionData.routineDayId);
          day?.exercises.forEach((ex) => {
            if (!distinctExerciseIds.includes(ex.exerciseId)) {
              distinctExerciseIds.push(ex.exerciseId);
            }
          });
        }

        const performances = await Promise.all(
          distinctExerciseIds.map(async (id) => {
            try {
              const p = await getLatestExercisePerformance(id);
              return { id, performance: p };
            } catch {
              return { id, performance: null };
            }
          })
        );

        const perfMap: Record<string, ExerciseLatestPerformance | null> = {};
        performances.forEach((item) => {
          perfMap[item.id] = item.performance;
        });
        setLatestPerformances(perfMap);
      } catch (exception) {
        setError(exception instanceof ApiError ? exception.message : "No pudimos cargar la sesión activa.");
      } finally {
        setLoading(false);
      }
    }

    if (params.sessionId) {
      loadSession();
    }
  }, [params.sessionId]);

  const day = useMemo(() => {
    if (!routine || !session) return null;
    return routine.days.find((d) => d.id === session.routineDayId) ?? null;
  }, [routine, session]);

  const { doneSets, totalSets, progress } = useMemo(() => {
    if (!session || !day) return { doneSets: 0, totalSets: 0, progress: 0 };
    const done = session.sets.length;
    const total = day.exercises.reduce((acc, ex) => acc + ex.sets, 0);
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    return { doneSets: done, totalSets: total, progress: pct };
  }, [session, day]);

  async function saveSet(exercise: RoutineExercise) {
    if (!session) return;
    const w = parseFloat(weight[exercise.exerciseId] || "");
    const r = parseInt(reps[exercise.exerciseId] || "", 10);

    if (Number.isNaN(w) || w <= 0 || Number.isNaN(r) || r <= 0) {
      setError("Ingresá un peso y repeticiones válidos.");
      return;
    }

    setSaving(true);
    setError("");

    const currentSets = session.sets.filter((s) => s.exerciseId === exercise.exerciseId);
    const nextSetNumber = currentSets.length + 1;

    try {
      const updated = await registerSet(session.id, {
        exerciseId: exercise.exerciseId,
        setNumber: nextSetNumber,
        weightKg: w,
        reps: r,
        completed: true,
      });

      setSession(updated);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("bleid-active-session", JSON.stringify(updated));
      }

      setRestTimer({ seconds: exercise.restSeconds || 90, exerciseName: exercise.exerciseName });
      setExtraInputOpen((prev) => ({ ...prev, [exercise.exerciseId]: false }));
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos guardar la serie.");
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
      setSession(updated);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("bleid-active-session", JSON.stringify(updated));
      }
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos eliminar la serie.");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    setError("");

    try {
      const finished = await endSession(session.id, notes.trim() || undefined);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("bleid-active-session");
      }
      setSession(finished);
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos finalizar la sesión.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (!session) {
    return (
      <div className="px-4 py-4 sm:px-8 lg:px-12">
        <p className="text-xs font-bold text-destructive">{error || "Sesión no encontrada."}</p>
        <Link href="/workout" className="mt-3 inline-block text-xs font-mono font-bold text-primary underline">
          Volver a Entrenar
        </Link>
      </div>
    );
  }

  // Finished Session View
  if (session.finishedAt) {
    const totalVolume = session.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    const durationMinutes = Math.max(
      1,
      Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    );

    const distinctExercises = Array.from(new Set(session.sets.map((s) => s.exerciseId))).map((id) => {
      const sets = session.sets.filter((s) => s.exerciseId === id);
      const name = sets[0]?.exerciseName || "Ejercicio";
      return { id, name, sets };
    });

    return (
      <div className="px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
        <header className="flex items-center justify-between">
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors tactile-press"
          >
            <ChevronLeft className="h-4 w-4" /> Volver al Historial
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-2.5 py-0.5 text-[11px] font-bold text-success font-mono">
            <Check className="h-3 w-3" /> Completada
          </span>
        </header>

        <div className="mt-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">Resumen de Entrenamiento</p>
          <h1 className="display-face mt-1 text-2xl font-black text-foreground sm:text-3xl">{session.routineDayName}</h1>
          <p suppressHydrationWarning className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {new Intl.DateTimeFormat("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(session.startedAt))}
          </p>
        </div>

        {/* Stats summary banner */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="text-center sm:text-left">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Series</p>
            <p className="display-face mt-0.5 text-xl font-black text-foreground sm:text-2xl font-mono">{session.sets.length}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Volumen</p>
            <p className="display-face mt-0.5 text-xl font-black text-foreground sm:text-2xl font-mono">
              {totalVolume.toLocaleString("es-AR")} <span className="text-xs font-sans font-bold text-muted-foreground">kg</span>
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Tiempo</p>
            <p className="display-face mt-0.5 text-xl font-black text-foreground sm:text-2xl font-mono">
              {durationMinutes} <span className="text-xs font-sans font-bold text-muted-foreground">min</span>
            </p>
          </div>
        </div>

        {/* Exercises Breakdown */}
        <div className="mt-4 space-y-3">
          {distinctExercises.map((group) => (
            <div key={group.id} className="card-editorial rounded-2xl p-4 shadow-soft">
              <h3 className="font-bold text-sm text-foreground">{formatExerciseName(group.name)}</h3>
              <div className="mt-2.5 divide-y divide-border/60">
                {group.sets.map((set) => (
                  <div key={set.id} className="flex items-center justify-between py-1.5 text-xs font-mono">
                    <span className="text-muted-foreground">Serie {set.setNumber}</span>
                    <span className="font-bold text-foreground text-telemetry">
                      {set.weightKg} kg × {set.reps} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2.5">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
          >
            <House className="h-4 w-4" /> Ir al inicio
          </Link>
          <Link
            href="/history"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground shadow-soft hover:bg-secondary transition-all tactile-press"
          >
            Ver historial
          </Link>
        </div>
      </div>
    );
  }

  // Active workout view - Ultra-Compact High Density for iPhone 13
  return (
    <div className="px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Sleek Navigation Bar */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors tactile-press"
        >
          <ChevronLeft className="h-4 w-4" /> Tablero
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> En vivo
        </div>
      </header>

      {/* Compact Telemetry Title Row */}
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">Sesión en curso</p>
          <h1 className="display-face mt-0.5 text-xl font-black text-foreground sm:text-3xl truncate leading-tight">
            {session.routineDayName}
          </h1>
        </div>
        <div className="text-right shrink-0">
          <p className="display-face text-2xl font-black text-primary font-mono leading-none">
            {doneSets}
            <span className="text-xs text-muted-foreground font-sans">/{totalSets}</span>
          </p>
          <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">series ({progress}%)</p>
        </div>
      </div>

      {/* Sleek Progress Line */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {error && (
        <div className="mt-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {/* Exercises list - High Density */}
      <div className="mt-3.5 space-y-3">
        {day?.exercises.map((exercise, index) => {
          const exerciseSets = session.sets.filter((set) => set.exerciseId === exercise.exerciseId);
          const completed = exerciseSets.length;
          const finished = completed >= exercise.sets;
          const lastPerf = latestPerformances[exercise.exerciseId];

          return (
            <div
              key={exercise.id}
              className={`rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 ${
                finished
                  ? "border-success/40 bg-success/5 shadow-soft"
                  : "card-editorial shadow-soft hover:shadow-soft-hover"
              }`}
            >
              {/* Exercise Header Row with integrated tools */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      0{index + 1}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">· {exercise.sets} series objetivo</span>
                  </div>
                  <h2 className="mt-0.5 text-base font-black tracking-tight text-foreground truncate">
                    {formatExerciseName(exercise.exerciseName)}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {exercise.repsMin}-{exercise.repsMax} reps · {exercise.restSeconds}s descanso
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Quick Calculator Buttons */}
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
                    className="flex h-7 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[10px] font-mono font-bold text-accent hover:border-accent transition tactile-press"
                    title="Calcular 1RM"
                  >
                    <Trophy className="h-3 w-3" />
                    <span>1RM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPlateCalcTarget({
                        exerciseId: exercise.exerciseId,
                        weight: Number(weight[exercise.exerciseId] || lastPerf?.maxWeightKg || 60),
                      })
                    }
                    className="flex h-7 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[10px] font-mono font-bold text-primary hover:border-primary transition tactile-press"
                    title="Discos para barra"
                  >
                    <Calculator className="h-3 w-3" />
                  </button>

                  {/* Status indicator */}
                  {finished ? (
                    <CircleCheck className="h-6 w-6 text-success" />
                  ) : (
                    <span className="rounded-lg border border-border bg-secondary px-2 py-0.5 text-[11px] font-mono font-bold text-muted-foreground">
                      {completed}/{exercise.sets}
                    </span>
                  )}
                </div>
              </div>

              {/* Ghost Set / Chalk Memory Row */}
              {lastPerf ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-secondary/50 px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <History className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">
                      Anterior: <strong className="text-foreground text-telemetry">{lastPerf.maxWeightKg} kg</strong>
                    </span>
                  </div>
                  {!weight[exercise.exerciseId] && (
                    <button
                      type="button"
                      onClick={() => setWeight((prev) => ({ ...prev, [exercise.exerciseId]: String(lastPerf.maxWeightKg) }))}
                      className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-primary hover:bg-primary/20 shrink-0 transition"
                    >
                      Copiar {lastPerf.maxWeightKg}k
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1 rounded border border-border/60 bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  <span>Primera vez registrando</span>
                </div>
              )}

              {/* Logged sets table (Compact) */}
              {exerciseSets.length > 0 && (
                <div className="mt-2.5 divide-y divide-border/60 rounded-xl border border-border bg-secondary/30 px-3 py-0.5">
                  {exerciseSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between py-1 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">S{set.setNumber}</span>
                        {set.setNumber > exercise.sets && (
                          <span className="rounded bg-accent/15 px-1 text-[9px] font-bold text-accent">+Ex</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-foreground text-telemetry">
                          {set.weightKg} kg × {set.reps} reps
                        </span>
                        <button
                          onClick={() => removeSet(set.id)}
                          disabled={saving}
                          className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:text-destructive disabled:opacity-50 transition"
                          title="Eliminar serie"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra Set Trigger if Finished */}
              {finished && !extraInputOpen[exercise.exerciseId] && (
                <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-[10px] font-mono text-success font-semibold">✓ Objetivo cumplido</span>
                  <button
                    type="button"
                    onClick={() => setExtraInputOpen((prev) => ({ ...prev, [exercise.exerciseId]: true }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/80 px-2 py-1 text-[11px] font-mono font-bold text-foreground hover:bg-secondary transition tactile-press"
                  >
                    <Plus className="h-3 w-3 text-primary" /> Serie extra
                  </button>
                </div>
              )}

              {/* Fast Set Logging Row */}
              {(!finished || extraInputOpen[exercise.exerciseId]) && (
                <div className="mt-3">
                  {finished && (
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold uppercase text-accent">
                        Serie extra #{completed + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExtraInputOpen((prev) => ({ ...prev, [exercise.exerciseId]: false }))}
                        className="text-[9px] font-mono text-muted-foreground underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <div className="relative">
                      <input
                        className="h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-mono text-sm font-black text-foreground outline-none transition focus:border-primary focus:bg-background text-telemetry"
                        type="number"
                        min="0"
                        step="0.5"
                        value={weight[exercise.exerciseId] ?? ""}
                        onChange={(event) =>
                          setWeight({ ...weight, [exercise.exerciseId]: event.target.value })
                        }
                        placeholder={lastPerf ? String(lastPerf.maxWeightKg) : "Kg"}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-muted-foreground uppercase">
                        kg
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        className="h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-mono text-sm font-black text-foreground outline-none transition focus:border-primary focus:bg-background text-telemetry"
                        type="number"
                        min="1"
                        value={reps[exercise.exerciseId] ?? ""}
                        onChange={(event) => setReps({ ...reps, [exercise.exerciseId]: event.target.value })}
                        placeholder={String(exercise.repsMin)}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-muted-foreground uppercase">
                        reps
                      </span>
                    </div>

                    <button
                      onClick={() => saveSet(exercise)}
                      disabled={saving}
                      className="grid h-10 w-10 place-items-center rounded-xl bg-success text-success-foreground disabled:opacity-50 transition active:scale-95 shadow-soft hover:bg-success/90 shrink-0"
                      title="Guardar serie"
                    >
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* End Session Notes & Finish Button */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="h-14 w-full resize-none rounded-xl border border-border bg-muted/30 p-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-background transition"
          placeholder="Notas de sesión: sensaciones, RPE, fatiga... (opcional)"
        />

        <button
          onClick={finish}
          disabled={saving}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold font-mono text-primary-foreground disabled:opacity-60 transition active:scale-[0.99] shadow-soft hover:shadow-soft-hover border border-primary/25"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><TimerReset className="h-3.5 w-3.5" /> Finalizar sesión</>}
        </button>
      </div>

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
