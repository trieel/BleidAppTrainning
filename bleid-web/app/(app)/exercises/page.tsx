"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Dumbbell,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getExercises } from "@/lib/api";
import { ExerciseModal } from "@/components/features/exercise-modal";
import { levelLabels } from "@/lib/labels";
import type { Exercise } from "@/types";

const EQUIPMENT_LABELS: Record<string, string> = {
  Barbell: "Barra",
  Dumbbell: "Mancuerna",
  Machine: "Máquina",
  Cable: "Polea",
  Bodyweight: "Corporal",
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getExercises();
        setExercises(data);
      } catch {
        setError("No pudimos cargar la biblioteca de ejercicios.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isSearching = search.trim().length > 0;

  // Search Results: Filters exclusively by exercise name
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const term = search.toLowerCase().trim();
    return exercises.filter((item) => item.name.toLowerCase().includes(term));
  }, [exercises, search, isSearching]);

  // Default View: Grouped by Muscle Group
  const groupedByMuscle = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const exercise of exercises) {
      const group = exercise.muscleGroupName || "Otros";
      if (!map.has(group)) {
        map.set(group, []);
      }
      map.get(group)!.push(exercise);
    }
    // Sort muscle groups alphabetically
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [exercises]);

  function renderExerciseCard(exercise: Exercise) {
    const hasContraindications =
      exercise.isContraindicated || (exercise.contraindications && exercise.contraindications.length > 0);

    return (
      <div
        key={exercise.id}
        className="group flex flex-col justify-between card-editorial border border-border shadow-soft rounded-2xl p-5 hover:border-primary/40 hover:shadow-soft-lg transition-all"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-mono font-semibold text-primary">
              <Dumbbell className="h-3 w-3" /> {exercise.muscleGroupName}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
              {EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-foreground group-hover:text-primary transition-colors">
            {exercise.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {exercise.description}
          </p>
        </div>

        <div className="mt-5 space-y-3 pt-3 border-t border-border/70">
          {/* Articular Safety Status */}
          {exercise.isContraindicated ? (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9B2C2C] bg-[#9B2C2C]/10 border border-[#9B2C2C]/20 rounded-lg px-2.5 py-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Contraindicado según tu perfil</span>
            </div>
          ) : hasContraindications ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#BB6C32] bg-[#BB6C32]/10 border border-[#BB6C32]/20 rounded-lg px-2.5 py-1">
              <Info className="h-3.5 w-3.5 shrink-0 text-[#BB6C32]" />
              <span>Atención: {exercise.contraindications.join(", ")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#3E6B48] bg-[#3E6B48]/10 border border-[#3E6B48]/20 rounded-lg px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Seguro para articulaciones</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">
              Nivel: {levelLabels[exercise.level] || exercise.level}
            </span>
            <button
              type="button"
              onClick={() => setActiveExerciseId(exercise.id)}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-mono font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-[0.98] transition-all"
            >
              Ver técnica
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-bold text-primary">
            <BookOpen className="h-3.5 w-3.5" /> Catálogo Biomecánico
          </div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl text-foreground tracking-tight mt-2">
            Biblioteca de Ejercicios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explorá por grupo muscular o buscá directamente por nombre del ejercicio.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="rounded-xl border border-border bg-card px-3.5 py-2 shadow-soft">
            <strong className="text-primary font-bold text-sm">{exercises.length}</strong> ejercicios disponibles
          </span>
        </div>
      </header>

      {/* Search Input */}
      <div className="mt-7">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Escribí para buscar ejercicio por nombre (ej. Press, Curl, Sentadilla)..."
            className="h-12 w-full rounded-2xl border border-border bg-muted/40 pl-11 pr-10 text-sm font-medium outline-none focus:bg-background focus:border-primary/60 shadow-soft transition text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm font-semibold text-destructive">
          {error}
        </div>
      ) : isSearching ? (
        /* MODE 1: Search Results by Name */
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Resultados para &ldquo;{search}&rdquo;
              </h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {searchResults.length} {searchResults.length === 1 ? "coincidencia" : "coincidencias"}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border p-8 text-center bg-card/40">
              <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
              <h2 className="mt-3 text-base font-bold text-foreground">No se encontraron ejercicios</h2>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                No hay ejercicios con el nombre &ldquo;{search}&rdquo;. Probá con otro término o limpiá el buscador para ver los grupos musculares.
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground transition shadow-soft"
              >
                Ver todos por grupo muscular
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map(renderExerciseCard)}
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: Default - Grouped by Muscle Group */
        <div className="mt-8 space-y-10">
          {groupedByMuscle.map(([muscleGroup, groupExercises]) => (
            <section key={muscleGroup} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <h2 className="text-lg font-bold tracking-tight text-foreground">{muscleGroup}</h2>
                </div>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {groupExercises.length} {groupExercises.length === 1 ? "ejercicio" : "ejercicios"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupExercises.map(renderExerciseCard)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      <ExerciseModal
        exerciseId={activeExerciseId}
        onClose={() => setActiveExerciseId(null)}
      />
    </div>
  );
}
