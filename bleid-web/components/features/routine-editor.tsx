"use client";

import { Check, Edit3, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { addRoutineExercise, getExercises, removeRoutineExercise } from "@/lib/api";
import type { Exercise, Routine, RoutineDay } from "@/types";

export function RoutineEditor({ routine, day, onRoutineChange }: { routine: Routine; day: RoutineDay; onRoutineChange: (routine: Routine) => void }) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [savingId, setSavingId] = useState("");

  async function openEditor() {
    setOpen(true);
    if (catalog.length === 0) setCatalog(await getExercises());
  }

  async function add(exercise: Exercise) {
    setSavingId(exercise.id);
    try {
      const updated = await addRoutineExercise(routine.id, day.id, { exerciseId: exercise.id, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 });
      onRoutineChange(updated);
    } finally {
      setSavingId("");
    }
  }

  async function remove(exerciseId: string) {
    setSavingId(exerciseId);
    try {
      const updated = await removeRoutineExercise(routine.id, day.id, exerciseId);
      onRoutineChange(updated);
    } finally {
      setSavingId("");
    }
  }

  const existingIds = new Set(day.exercises.map((exercise) => exercise.exerciseId));
  const available = catalog.filter((exercise) => !existingIds.has(exercise.id)).slice(0, 12);

  return <section className="mt-6 rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Tu rutina, tus reglas</p><h2 className="mt-2 text-lg font-bold">Personalizá este día</h2></div>{open ? <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button> : <button onClick={openEditor} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-primary transition hover:border-primary"><Edit3 className="h-3.5 w-3.5" /> Editar</button>}</div>{open && <><p className="mt-2 text-xs leading-5 text-muted-foreground">Los ejercicios disponibles ya están filtrados por tus limitaciones.</p><div className="mt-5 space-y-2">{available.map((exercise) => <div key={exercise.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{exercise.name}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{exercise.muscleGroupName} · {exercise.equipment}</p></div><button onClick={() => add(exercise)} disabled={Boolean(savingId)} className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50">{savingId === exercise.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}</button></div>)}{available.length === 0 && <p className="rounded-xl bg-secondary p-4 text-xs text-muted-foreground">No hay más ejercicios seguros para agregar.</p>}</div></>}{!open && <div className="mt-4 flex flex-wrap gap-2">{day.exercises.map((exercise) => <span key={exercise.id} className="flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-3 pr-1.5 text-xs text-muted-foreground"><span className="max-w-[150px] truncate">{exercise.exerciseName}</span><button onClick={() => remove(exercise.id)} disabled={Boolean(savingId)} className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"><Trash2 className="h-3 w-3" /></button></span>)}<span className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"><Check className="h-3 w-3 text-primary" /> Día personalizado</span></div>}</section>;
}
