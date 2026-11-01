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
import { formatContraindications, formatEquipment, formatExerciseName, levelLabels } from "@/lib/labels";
import type { Exercise } from "@/types";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // Carga inicial de ejercicios desde el backend
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

  // Lista única y ordenada de grupos musculares con sus respectivos conteos
  const muscleGroupsList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ex of exercises) {
      const group = ex.muscleGroupName || "Otros";
      counts.set(group, (counts.get(group) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [exercises]);

  // Modo búsqueda por texto libre (ignora grupo muscular para no limitar resultados)
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const term = search.toLowerCase().trim();
    return exercises.filter((item) =>
      formatExerciseName(item.name).toLowerCase().includes(term)
    );
  }, [exercises, search, isSearching]);

  // Ejercicios filtrados según la píldora de grupo muscular seleccionada
  const displayedByFilter = useMemo(() => {
    if (selectedMuscleGroup === "all") return exercises;
    return exercises.filter((ex) => (ex.muscleGroupName || "Otros") === selectedMuscleGroup);
  }, [exercises, selectedMuscleGroup]);

  // Agrupación por grupo muscular para la vista estructurada
  const groupedByMuscle = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const exercise of displayedByFilter) {
      const group = exercise.muscleGroupName || "Otros";
      if (!map.has(group)) {
        map.set(group, []);
      }
      map.get(group)!.push(exercise);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [displayedByFilter]);

  /**
   * Renderiza la tarjeta de ejercicio optimizada para pantallas móviles.
   * Diseñada para reducir altura vertical y permitir ver múltiples tarjetas simultáneamente en iPhone 13.
   */
  function renderExerciseCard(exercise: Exercise) {
    const hasContraindications =
      exercise.isContraindicated || (exercise.contraindications && exercise.contraindications.length > 0);
    const formattedTitle = formatExerciseName(exercise.name);
    const translatedContraindications = formatContraindications(exercise.contraindications);

    return (
      <div
        key={exercise.id}
        onClick={() => setActiveExerciseId(exercise.id)}
        className="group cursor-pointer flex flex-col justify-between card-editorial border border-border shadow-soft rounded-2xl p-3.5 sm:p-5 hover:border-primary/40 hover:shadow-soft-lg active:scale-[0.99] transition-all"
      >
        <div>
          {/* Fila superior: Grupo muscular y tipo de equipo */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-semibold text-primary">
              <Dumbbell className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {exercise.muscleGroupName}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground">
              {formatEquipment(exercise.equipment)}
            </span>
          </div>

          {/* Nombre normalizado con 'ñ' y tildes */}
          <h3 className="mt-2 text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
            {formattedTitle}
          </h3>

          {/* Descripción concisa para evitar scroll vertical */}
          <p className="mt-1 line-clamp-1 sm:line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {exercise.description}
          </p>
        </div>

        {/* Fila inferior: Estado de seguridad articular y acción */}
        <div className="mt-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between gap-2">
          {/* Badge articular en español (ej. Atención: Muñeca en lugar de wrist) */}
          <div className="min-w-0 flex-1">
            {exercise.isContraindicated ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#9B2C2C] bg-[#9B2C2C]/10 border border-[#9B2C2C]/20 rounded-md px-2 py-0.5 truncate max-w-full">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="truncate">Contraindicado</span>
              </span>
            ) : hasContraindications ? (
              <span
                title={`Atención: ${translatedContraindications}`}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#BB6C32] bg-[#BB6C32]/10 border border-[#BB6C32]/20 rounded-md px-2 py-0.5 truncate max-w-full"
              >
                <Info className="h-3 w-3 shrink-0 text-[#BB6C32]" />
                <span className="truncate">Atención: {translatedContraindications}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#3E6B48] bg-[#3E6B48]/10 border border-[#3E6B48]/20 rounded-md px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                <span>Seguro articular</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground">
              {levelLabels[exercise.level] ? levelLabels[exercise.level].split(" ")[0] : exercise.level}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveExerciseId(exercise.id);
              }}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-mono font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-[0.98] transition-all shadow-soft"
            >
              Técnica
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3.5 py-2 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Encabezado compacto */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary">
            <BookOpen className="h-3 w-3" /> Catálogo Biomecánico
          </div>
          <h1 className="font-serif text-2xl font-bold sm:text-4xl text-foreground tracking-tight mt-1">
            Biblioteca de Ejercicios
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Explorá por grupo muscular o buscá directamente por nombre del ejercicio.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="rounded-xl border border-border bg-card px-3 py-1.5 shadow-soft">
            <strong className="text-primary font-bold">{exercises.length}</strong> ejercicios
          </span>
        </div>
      </header>

      {/* Buscador de ejercicios */}
      <div className="mt-4 sm:mt-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre (ej. Press, Curl araña, Sentadilla)..."
            className="h-10 sm:h-12 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-9 text-xs sm:text-sm font-medium outline-none focus:bg-background focus:border-primary/60 shadow-soft transition text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              title="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selector horizontal deslizable de grupos musculares (tipo píldoras) */}
      {!isSearching && (
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setSelectedMuscleGroup("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-mono font-bold transition-all active:scale-[0.98] ${
              selectedMuscleGroup === "all"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Todos ({exercises.length})
          </button>
          {muscleGroupsList.map((group) => (
            <button
              key={group.name}
              type="button"
              onClick={() => setSelectedMuscleGroup(group.name)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-mono font-bold transition-all active:scale-[0.98] ${
                selectedMuscleGroup === group.name
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {group.name} ({group.count})
            </button>
          ))}
        </div>
      )}

      {/* Estado del contenido */}
      {loading ? (
        <div className="flex min-h-[35vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-center text-xs font-semibold text-destructive">
          {error}
        </div>
      ) : isSearching ? (
        /* MODO 1: Resultados de Búsqueda */
        <div className="mt-5">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Resultados para &ldquo;{search}&rdquo;
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {searchResults.length} {searchResults.length === 1 ? "coincidencia" : "coincidencias"}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="flex min-h-[25vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center bg-card/40">
              <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
              <h2 className="mt-2.5 text-sm font-bold text-foreground">No se encontraron ejercicios</h2>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                No hay ejercicios con el nombre &ldquo;{search}&rdquo;. Probá con otro término o limpiá el buscador.
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-3.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground transition shadow-soft"
              >
                Ver todos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map(renderExerciseCard)}
            </div>
          )}
        </div>
      ) : (
        /* MODO 2: Lista por Grupos Musculares */
        <div className="mt-5 space-y-6">
          {groupedByMuscle.map(([muscleGroup, groupExercises]) => (
            <section key={muscleGroup} className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <h2 className="text-base font-bold tracking-tight text-foreground">{muscleGroup}</h2>
                </div>
                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                  {groupExercises.length} {groupExercises.length === 1 ? "ejercicio" : "ejercicios"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {groupExercises.map(renderExerciseCard)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal de Detalle Biomecánico */}
      <ExerciseModal
        exerciseId={activeExerciseId}
        onClose={() => setActiveExerciseId(null)}
      />
    </div>
  );
}
