"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Clock3, Dumbbell, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveRoutine } from "@/lib/api";
import { startSession } from "@/lib/api/workout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RoutineEditor } from "@/components/features/routine-editor";
import type { Routine, RoutineDay } from "@/types";

export default function WorkoutPage() {
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dayId = new URLSearchParams(window.location.search).get("dayId");
    getActiveRoutine().then((result) => {
      setRoutine(result);
      setSelectedDay(result.days.find((day) => day.id === dayId) ?? result.days[0] ?? null);
    }).catch(() => router.replace("/onboarding")).finally(() => setLoading(false));
  }, [router]);

  async function begin() {
    if (!selectedDay) return;
    setStarting(true);
    setError("");
    try {
      const session = await startSession(selectedDay.id);
      window.sessionStorage.setItem("bleid-active-session", JSON.stringify(session));
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

  if (loading) return <LoadingScreen />;
  if (!routine || !selectedDay) return <div className="p-6 text-sm text-muted-foreground">No encontramos una rutina activa.</div>;

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Tu plan / entrenar</p><h1 className="display-face mt-3 text-4xl font-black">Listo para moverte.</h1></div><Link href="/dashboard" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></Link></header>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">{routine.days.map((day, index) => <button key={day.id} onClick={() => setSelectedDay(day)} className={`min-w-[126px] rounded-xl border px-4 py-3 text-left transition ${selectedDay.id === day.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}><span className="block text-[10px] font-bold uppercase opacity-60">Día 0{index + 1}</span><span className="mt-1 block truncate text-sm font-bold">{day.name}</span></button>)}</div>
      <section className="mt-6 overflow-hidden rounded-[26px] border border-border bg-card"><div className="border-b border-border/70 p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Sesión {selectedDay.dayNumber} · {routine.name}</p><h2 className="display-face mt-3 text-3xl font-black sm:text-4xl">{selectedDay.name}</h2></div><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Dumbbell className="h-5 w-5" /></div></div><div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Dumbbell className="h-3.5 w-3.5 text-primary" /> {selectedDay.exercises.length} ejercicios</span><span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-primary" /> {selectedDay.exercises.reduce((total, exercise) => total + exercise.sets, 0)} series estimadas</span></div></div><div className="divide-y divide-border/70">{selectedDay.exercises.map((exercise, index) => <div key={exercise.id} className="flex items-center gap-4 p-5 sm:px-8"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{exercise.exerciseName}</p><p className="mt-1 text-xs text-muted-foreground">{exercise.sets} series · {exercise.repsMin}-{exercise.repsMax} reps · {exercise.restSeconds}s descanso</p></div><span className="hidden rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground sm:block">Preparado</span></div>)}</div></section>
      <RoutineEditor routine={routine} day={selectedDay} onRoutineChange={updateRoutine} />
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Registrá cada serie mientras entrenás. Bleid guarda tu carga y te ayuda a ver la tendencia, no solo un número aislado.</p></div>
      {error && <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-red-200">{error}</p>}
      <button onClick={begin} disabled={starting} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground shadow-[0_12px_35px_rgba(200,255,50,0.13)] transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:px-8">{starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Empezar esta sesión <ArrowRight className="h-4 w-4" /></>}</button>
    </div>
  );
}
