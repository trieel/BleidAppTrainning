"use client";

import { Check, ChevronLeft, CircleCheck, Loader2, Pause, TimerReset } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getActiveRoutine } from "@/lib/api";
import { endSession, registerSet } from "@/lib/api/workout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Routine, RoutineExercise, WorkoutSession } from "@/types";

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

  useEffect(() => {
    const stored = window.sessionStorage.getItem("bleid-active-session");
    const initialSession = stored ? JSON.parse(stored) as WorkoutSession : null;
    if (!initialSession || initialSession.id !== params.sessionId) {
      router.replace("/workout");
      return;
    }
    setSession(initialSession);
    getActiveRoutine().then(setRoutine).finally(() => setLoading(false));
  }, [params.sessionId, router]);

  const day = useMemo(() => routine?.days.find((item) => item.id === session?.routineDayId), [routine, session]);
  const totalSets = day?.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) ?? 0;
  const doneSets = session?.sets.filter((set) => set.completed).length ?? 0;
  const progress = totalSets ? Math.min((doneSets / totalSets) * 100, 100) : 0;

  function persist(updated: WorkoutSession) {
    setSession(updated);
    window.sessionStorage.setItem("bleid-active-session", JSON.stringify(updated));
  }

  async function saveSet(exercise: RoutineExercise) {
    if (!session) return;
    const exerciseSets = session.sets.filter((set) => set.exerciseId === exercise.exerciseId);
    const setNumber = exerciseSets.length + 1;
    if (setNumber > exercise.sets) return;
    setSaving(true);
    try {
      const updated = await registerSet(session.id, { exerciseId: exercise.exerciseId, setNumber, reps: Number(reps[exercise.exerciseId] || exercise.repsMin), weightKg: Number(weight[exercise.exerciseId] || 0), completed: true });
      persist(updated);
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    try {
      await endSession(session.id, notes);
      window.sessionStorage.removeItem("bleid-active-session");
      router.replace("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !session || !day) return <LoadingScreen />;

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10"><header className="flex items-center justify-between"><button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Salir</button><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> En vivo</div></header><div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Sesión en curso</p><h1 className="display-face mt-3 text-4xl font-black">{session.routineDayName}</h1></div><div className="text-right"><p className="display-face text-3xl font-black text-primary">{doneSets}<span className="text-base text-muted-foreground">/{totalSets}</span></p><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">series</p></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-7 space-y-3">{day.exercises.map((exercise, index) => { const completed = session.sets.filter((set) => set.exerciseId === exercise.exerciseId).length; const finished = completed >= exercise.sets; return <div key={exercise.id} className={`rounded-2xl border p-5 transition ${finished ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">0{index + 1} · {exercise.sets} series</p><h2 className="mt-2 text-lg font-bold">{exercise.exerciseName}</h2><p className="mt-1 text-xs text-muted-foreground">Objetivo: {exercise.repsMin}-{exercise.repsMax} reps · {exercise.restSeconds}s descanso</p></div>{finished ? <CircleCheck className="h-5 w-5 text-primary" /> : <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{completed}/{exercise.sets}</span>}</div>{!finished && <div className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kg<input className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold outline-none focus:border-primary" type="number" min="0" step="0.5" value={weight[exercise.exerciseId] ?? ""} onChange={(event) => setWeight({ ...weight, [exercise.exerciseId]: event.target.value })} placeholder="0" /></label><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reps<input className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold outline-none focus:border-primary" type="number" min="1" value={reps[exercise.exerciseId] ?? ""} onChange={(event) => setReps({ ...reps, [exercise.exerciseId]: event.target.value })} placeholder={String(exercise.repsMin)} /></label><button onClick={() => saveSet(exercise)} disabled={saving} className="mt-[17px] grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Check className="h-4 w-4" /></button></div>}</div>; })}</div><div className="mt-6 rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2 text-sm font-bold"><Pause className="h-4 w-4 text-primary" /> Cerrar sesión</div><p className="mt-2 text-xs leading-5 text-muted-foreground">No hace falta completar todo para guardar lo que hiciste hoy.</p><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4 min-h-20 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" placeholder="¿Cómo te sentiste? (opcional)" /></div><button onClick={finish} disabled={saving} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><TimerReset className="h-4 w-4" /> Finalizar entrenamiento</>}</button></div>
  );
}
