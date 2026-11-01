"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Dumbbell, Loader2, Play, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addRoutineDay, deleteRoutineDay, getActiveRoutine } from "@/lib/api";
import { getActiveSession, startSession } from "@/lib/api/workout";
import { ApiError } from "@/lib/api/client";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RoutineEditor } from "@/components/features/routine-editor";
import { ExerciseModal } from "@/components/features/exercise-modal";
import { cn } from "@/lib/utils";
import { formatExerciseName } from "@/lib/labels";
import type { Routine, RoutineDay, WorkoutSession } from "@/types";

export default function WorkoutPage() {
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState("");

  // Add / Delete Day state
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [savingDay, setSavingDay] = useState(false);
  const [deletingDay, setDeletingDay] = useState(false);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const dayId = params?.get("dayId");
    const action = params?.get("action");

    Promise.all([
      getActiveRoutine(),
      getActiveSession().catch(() => null),
    ])
      .then(([result, active]) => {
        setRoutine(result);
        setSelectedDay(result.days.find((day) => day.id === dayId) ?? result.days[0] ?? null);
        setActiveSession(active ?? null);
        if (action === "new-day") {
          setNewDayName(`Día 0${result.days.length + 1}`);
          setShowAddDayModal(true);
        }
      })
      .catch((exception) => {
        if (exception instanceof ApiError && exception.status === 404) {
          router.replace("/onboarding");
        } else {
          setError(exception instanceof ApiError ? exception.message : "No pudimos cargar tu rutina.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function begin() {
    if (!selectedDay) return;
    setStarting(true);
    setError("");
    try {
      const session = await startSession(selectedDay.id);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("bleid-active-session", JSON.stringify(session));
      }
      router.push(`/workout/${session.id}`);
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos iniciar la sesión. Intentá de nuevo.");
    } finally {
      setStarting(false);
    }
  }

  function updateRoutine(updated: Routine) {
    setRoutine(updated);
    setSelectedDay(updated.days.find((day) => day.id === selectedDay?.id) ?? updated.days[0] ?? null);
  }

  async function handleAddDay(e: React.FormEvent) {
    e.preventDefault();
    if (!routine) return;
    setSavingDay(true);
    setError("");
    try {
      const updated = await addRoutineDay(routine.id, newDayName.trim() || undefined);
      setRoutine(updated);
      const createdDay = updated.days[updated.days.length - 1];
      if (createdDay) {
        setSelectedDay(createdDay);
      }
      setShowAddDayModal(false);
      setNewDayName("");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos agregar el día a la rutina.");
    } finally {
      setSavingDay(false);
    }
  }

  async function handleDeleteDay(dayId: string) {
    if (!routine || routine.days.length <= 1) return;
    if (!window.confirm("¿Seguro que querés eliminar este día de entrenamiento?")) return;
    setDeletingDay(true);
    setError("");
    try {
      const updated = await deleteRoutineDay(routine.id, dayId);
      setRoutine(updated);
      setSelectedDay(updated.days[0] ?? null);
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos eliminar el día de la rutina.");
    } finally {
      setDeletingDay(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!routine || !selectedDay) {
    return (
      <div className="px-4 py-4 sm:px-8 lg:px-12">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-bold text-destructive">
            {error}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No encontramos una rutina activa.</div>
        )}
      </div>
    );
  }

  const totalDaySets = selectedDay.exercises.reduce((total, exercise) => total + exercise.sets, 0);

  return (
    <div className="px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* High-Density Header */}
      <header className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
            Tu plan / entrenar
          </span>
          <h1 className="display-face text-xl font-black text-foreground sm:text-3xl leading-tight">
            Listo para moverte.
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shadow-soft tactile-press"
          aria-label="Volver al tablero"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </header>

      {/* Active Session Alert (if open) */}
      {activeSession && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card p-3 shadow-soft">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">En curso</p>
              <p className="truncate text-xs font-bold text-foreground">{activeSession.routineDayName}</p>
            </div>
          </div>
          <Link
            href={`/workout/${activeSession.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-mono font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press shrink-0 border border-primary/25"
          >
            <Play className="h-3 w-3 fill-current" /> Continuar
          </Link>
        </div>
      )}

      {/* Sleek Horizontal Day Selector Tabs */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {routine.days.map((day, index) => {
          const active = selectedDay.id === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-1.5 text-left transition-all tactile-press",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground shadow-soft"
              )}
            >
              <span className="block text-[9px] font-mono uppercase tracking-wider opacity-75">
                Día 0{index + 1}
              </span>
              <span className="block text-xs font-bold whitespace-nowrap">{day.name}</span>
            </button>
          );
        })}

        {/* Quick Add Day Button */}
        <button
          type="button"
          onClick={() => {
            setNewDayName(`Día 0${routine.days.length + 1}`);
            setShowAddDayModal(true);
          }}
          className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-card px-2.5 text-xs font-mono font-bold text-primary hover:bg-primary/5 transition-all shadow-soft tactile-press"
          title="Sumar día de entrenamiento"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Sumar día</span>
        </button>
      </div>

      {/* Selected Day Card - Immediate Primary Action Above The Fold */}
      <section className="mt-3 overflow-hidden rounded-2xl card-editorial shadow-soft">
        <div className="border-b border-border/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Sesión 0{selectedDay.dayNumber} · {routine.name}
                </span>
                {routine.days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDay(selectedDay.id)}
                    disabled={deletingDay}
                    className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition disabled:opacity-50"
                    title="Eliminar este día de la rutina"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <h2 className="display-face mt-1 text-xl font-black text-foreground sm:text-2xl tracking-tight">
                {selectedDay.name}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3 text-primary" /> {selectedDay.exercises.length} ejercicios
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3 text-primary" /> {totalDaySets} series objetivo
                </span>
              </p>
            </div>

            {/* Direct Start Button Right Above The Fold */}
            <button
              onClick={begin}
              disabled={starting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press disabled:opacity-60 border border-primary/25 shrink-0"
            >
              {starting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Empezar sesión</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Compact Exercise List */}
        {selectedDay.exercises.length === 0 ? (
          <div className="p-6 text-center">
            <Dumbbell className="h-6 w-6 text-muted-foreground/40 mx-auto" />
            <p className="mt-2 text-xs font-bold text-foreground">Este día todavía no tiene ejercicios asignados</p>
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-mono font-bold text-primary"
            >
              <Plus className="h-3 w-3" /> Agregar ejercicios
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {selectedDay.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary text-[10px] font-mono font-black text-primary border border-border">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedExerciseId(exercise.exerciseId)}
                      className="truncate text-xs font-bold text-left hover:text-primary transition-colors block text-foreground"
                    >
                      {formatExerciseName(exercise.exerciseName)}
                    </button>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {exercise.sets} series · {exercise.repsMin}-{exercise.repsMax} reps · {exercise.restSeconds}s
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedExerciseId(exercise.exerciseId)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-mono font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 shrink-0 transition"
                >
                  Técnica
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Collapsible Routine Editor Accordion */}
      <div className="mt-3 rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEditor(!showEditor)}
          className="flex w-full items-center justify-between p-3.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition tactile-press"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-primary" />
            Personalizar ejercicios de este día
          </span>
          <ChevronRight
            className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", showEditor && "rotate-90")}
          />
        </button>

        {showEditor && (
          <div className="border-t border-border p-4 bg-background/50">
            <RoutineEditor routine={routine} day={selectedDay} onRoutineChange={updateRoutine} />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-bold text-destructive">
          {error}
        </p>
      )}

      {/* Modal for adding training day */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-dock">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/25">
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                </span>
                <h3 className="text-base font-bold tracking-tight text-foreground">Sumar Día de Entrenamiento</h3>
              </div>
              <button
                onClick={() => setShowAddDayModal(false)}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDay} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre del día
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  placeholder={`Día 0${routine.days.length + 1} - Brazos / Core`}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-background transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-mono font-bold text-muted-foreground hover:bg-secondary transition tactile-press"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDay}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition tactile-press disabled:opacity-50 border border-primary/25"
                >
                  {savingDay ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Crear día</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exercise Details Modal */}
      <ExerciseModal
        exerciseId={selectedExerciseId}
        onClose={() => setSelectedExerciseId(null)}
      />
    </div>
  );
}
