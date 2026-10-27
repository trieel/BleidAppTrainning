"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Clock3, Dumbbell, Info, Loader2, Play, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addRoutineDay, deleteRoutineDay, getActiveRoutine } from "@/lib/api";
import { getActiveSession, startSession } from "@/lib/api/workout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RoutineEditor } from "@/components/features/routine-editor";
import { ExerciseModal } from "@/components/features/exercise-modal";
import type { Routine, RoutineDay, WorkoutSession } from "@/types";

export default function WorkoutPage() {
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
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
      .catch(() => router.replace("/onboarding"))
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
    } catch {
      setError("No pudimos iniciar la sesión. Intentá de nuevo.");
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
    } catch {
      setError("No pudimos agregar el día a la rutina.");
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
    } catch {
      setError("No pudimos eliminar el día de la rutina.");
    } finally {
      setDeletingDay(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!routine || !selectedDay) return <div className="p-6 text-sm text-muted-foreground">No encontramos una rutina activa.</div>;

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-primary">Tu plan / entrenar</p>
          <h1 className="display-face mt-2 text-4xl font-black text-foreground">Listo para moverte.</h1>
        </div>
        <Link
          href="/dashboard"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shadow-soft"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </header>

      {/* Active Session Warning */}
      {activeSession && (
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-primary/30 bg-card p-5 sm:flex-row sm:items-center shadow-soft">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-primary">Sesión pendiente</p>
              <p className="text-sm font-bold text-foreground">Tenés una sesión abierta: {activeSession.routineDayName}</p>
            </div>
          </div>
          <Link
            href={`/workout/${activeSession.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Continuar sesión abierta
          </Link>
        </div>
      )}

      {/* Day Selector Header & Action */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">Distribución Semanal</p>
          <h2 className="text-xl font-black tracking-tight text-foreground">Días de Entrenamiento</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewDayName(`Día 0${routine.days.length + 1}`);
            setShowAddDayModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Sumar día de entrenamiento</span>
        </button>
      </div>

      {/* Day Selector Tabs + Add Day Button */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pb-2">
        {routine.days.map((day, index) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day)}
            className={`min-w-[130px] rounded-xl border px-4 py-3 text-left transition-all tactile-press ${
              selectedDay.id === day.id
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-secondary/40 hover:text-foreground shadow-soft"
            }`}
          >
            <span className="block text-[10px] font-mono font-bold uppercase opacity-75">Día 0{index + 1}</span>
            <span className="mt-1 block truncate text-sm font-bold">{day.name}</span>
          </button>
        ))}

        {/* Plus Tab Button */}
        <button
          type="button"
          onClick={() => {
            setNewDayName(`Día 0${routine.days.length + 1}`);
            setShowAddDayModal(true);
          }}
          className="flex min-w-[130px] h-[68px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-all px-4 py-3 shadow-soft group shrink-0 tactile-press"
          title="Sumar día de entrenamiento"
        >
          <Plus className="h-5 w-5 stroke-[2.5] transition-transform group-hover:scale-110" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">+ Nuevo Día</span>
        </button>
      </div>

      {/* Current Selected Day Card */}
      <section className="mt-6 overflow-hidden rounded-[26px] card-editorial shadow-soft">
        <div className="border-b border-border p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Sesión 0{selectedDay.dayNumber} · {routine.name}
              </p>
              <h2 className="display-face mt-2 text-3xl font-black sm:text-4xl text-foreground">{selectedDay.name}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              {routine.days.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteDay(selectedDay.id)}
                  disabled={deletingDay}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/50 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-50 tactile-press"
                  title="Eliminar este día de la rutina"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Dumbbell className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5 text-primary" /> {selectedDay.exercises.length} ejercicios
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-primary" />{" "}
              {selectedDay.exercises.reduce((total, exercise) => total + exercise.sets, 0)} series estimadas
            </span>
          </div>
        </div>

        {selectedDay.exercises.length === 0 ? (
          <div className="p-8 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="mt-2 text-sm font-bold text-foreground">Este día todavía no tiene ejercicios asignados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Usá el editor de abajo &ldquo;Personalizá este día&rdquo; para agregar tus ejercicios preferidos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {selectedDay.exercises.map((exercise, index) => (
              <div key={exercise.id} className="flex items-center gap-4 p-5 sm:px-8">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-xs font-mono font-black text-primary border border-border">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelectedExerciseId(exercise.exerciseId)}
                    className="truncate text-sm font-bold text-left hover:text-primary transition-colors block w-full text-foreground"
                  >
                    {exercise.exerciseName}
                  </button>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {exercise.sets} series · {exercise.repsMin}-{exercise.repsMax} reps · {exercise.restSeconds}s descanso
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExerciseId(exercise.exerciseId)}
                  className="hidden rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-muted-foreground sm:block hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all tactile-press"
                >
                  Ver técnica
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Routine Customization */}
      <RoutineEditor routine={routine} day={selectedDay} onRoutineChange={updateRoutine} />

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs leading-5 text-muted-foreground shadow-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>Registrá cada serie mientras entrenás. Bleid guarda tu carga histórica y te sugiere sobrecarga progresiva en vivo.</p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {error}
        </p>
      )}

      <button
        onClick={begin}
        disabled={starting}
        className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press disabled:opacity-60 sm:w-auto sm:px-8 border border-primary/25"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Empezar esta sesión <ArrowRight className="h-4 w-4" /></>}
      </button>

      {/* Modal para Sumar Día de Entrenamiento */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-dock">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/25">
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Sumar Día de Entrenamiento</h3>
              </div>
              <button
                onClick={() => setShowAddDayModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Agregá un nuevo día a tu split semanal. Vas a poder asignarle ejercicios personalizados libremente.
            </p>

            <form onSubmit={handleAddDay} className="mt-5 space-y-4">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre del día
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  placeholder={`Día 0${routine.days.length + 1} - Brazos / Core`}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3.5 text-sm font-semibold text-foreground outline-none focus:border-primary focus:bg-background transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-mono font-bold text-muted-foreground hover:bg-secondary transition tactile-press"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDay}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition tactile-press disabled:opacity-50 border border-primary/25"
                >
                  {savingDay ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Crear día</>}
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
