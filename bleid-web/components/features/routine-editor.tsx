"use client";

import { Check, Edit3, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { addRoutineExercise, getExercises, removeRoutineExercise } from "@/lib/api";
import type { Exercise, Routine, RoutineDay } from "@/types";

export function RoutineEditor({
  routine,
  day,
  onRoutineChange,
}: {
  routine: Routine;
  day: RoutineDay;
  onRoutineChange: (routine: Routine) => void;
}) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [savingId, setSavingId] = useState("");
  const [search, setSearch] = useState("");

  async function openEditor() {
    setOpen(true);
    if (catalog.length === 0) {
      const all = await getExercises();
      setCatalog(all);
    }
  }

  async function add(exercise: Exercise) {
    setSavingId(exercise.id);
    try {
      const updated = await addRoutineExercise(routine.id, day.id, {
        exerciseId: exercise.id,
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        restSeconds: 90,
      });
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

  const existingIds = useMemo(() => new Set(day.exercises.map((exercise) => exercise.exerciseId)), [day.exercises]);

  const available = useMemo(() => {
    return catalog.filter((exercise) => {
      if (existingIds.has(exercise.id)) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        exercise.name.toLowerCase().includes(term) ||
        exercise.muscleGroupName.toLowerCase().includes(term) ||
        exercise.equipment.toLowerCase().includes(term)
      );
    });
  }, [catalog, existingIds, search]);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Tu rutina, tus reglas</p>
          <h2 className="mt-1 text-lg font-bold text-foreground">Personalizá este día</h2>
        </div>
        {open ? (
          <button
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors tactile-press"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={openEditor}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3.5 py-2 text-xs font-bold text-primary transition hover:border-primary/40 hover:bg-secondary tactile-press"
          >
            <Edit3 className="h-3.5 w-3.5" /> Editar ejercicios
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            Los ejercicios disponibles ya están pre-filtrados para evitar tus zonas sensibles y lesiones.
          </p>

          {/* Search box */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ejercicio, grupo muscular o equipo..."
              className="h-10 w-full rounded-xl border border-border bg-muted/40 pl-9 pr-4 text-xs font-medium text-foreground outline-none focus:border-primary focus:bg-background transition"
            />
          </div>

          <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
            {available.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition hover:border-primary/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{exercise.name}</p>
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {exercise.muscleGroupName} · {exercise.equipment}
                  </p>
                </div>
                <button
                  onClick={() => add(exercise)}
                  disabled={Boolean(savingId)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition tactile-press border border-primary/20 shadow-xs"
                  title="Agregar a este día"
                >
                  {savingId === exercise.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}

            {available.length === 0 && (
              <p className="rounded-xl bg-secondary/50 p-4 text-center text-xs text-muted-foreground">
                {search.trim() ? "No encontramos ejercicios que coincidan con tu búsqueda." : "No hay más ejercicios disponibles para agregar."}
              </p>
            )}
          </div>
        </div>
      )}

      {!open && (
        <div className="mt-4 flex flex-wrap gap-2">
          {day.exercises.map((exercise) => (
            <span
              key={exercise.id}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 py-1.5 pl-3.5 pr-1.5 text-xs text-muted-foreground shadow-xs"
            >
              <span className="max-w-[150px] truncate font-medium text-foreground">{exercise.exerciseName}</span>
              <button
                onClick={() => remove(exercise.id)}
                disabled={Boolean(savingId)}
                className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive disabled:opacity-50 transition-colors"
                title="Quitar ejercicio"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground font-mono">
            <Check className="h-3.5 w-3.5 text-primary" /> Día personalizado
          </span>
        </div>
      )}
    </section>
  );
}
