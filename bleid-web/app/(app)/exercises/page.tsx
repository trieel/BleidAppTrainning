"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Dumbbell,
  Globe,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getExercises } from "@/lib/api";
import { getCachedDataSync } from "@/lib/api/cache";
import { ExerciseModal } from "@/components/features/exercise-modal";
import { formatContraindications, formatEquipment, formatExerciseName, levelLabels } from "@/lib/labels";
import {
  getEquipmentDisplayName,
  getExerciseName,
  getMuscleGroupName,
  useLanguage,
} from "@/lib/exercise-i18n";
import { useExerciseSearch, type SearchResultItem } from "@/lib/exercise-search";
import type { Exercise } from "@/types";

const POPULAR_SUGGESTIONS = [
  "bench press",
  "serrucho",
  "rdl",
  "lat pulldown",
  "sentadilla",
  "mancuerna",
  "biceps",
  "polea",
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>(() => getCachedDataSync("exercises_all") ?? []);
  const [loading, setLoading] = useState(() => !Boolean(getCachedDataSync("exercises_all")));
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [hideContraindicated, setHideContraindicated] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  const { language, toggleLanguage, isEnglish } = useLanguage();

  // Carga inicial de ejercicios desde el backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getExercises();
        setExercises(data);
      } catch {
        setError(isEnglish ? "Could not load the exercise library." : "No pudimos cargar la biblioteca de ejercicios.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isEnglish]);

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

  // Lista base filtrada por advertencia articular
  const baseExercises = useMemo(() => {
    if (hideContraindicated) {
      return exercises.filter((ex) => !ex.isContraindicated);
    }
    return exercises;
  }, [exercises, hideContraindicated]);

  // Búsqueda inteligente con Fuse.js, normalización de acentos y detección de alias
  const searchResults = useExerciseSearch(baseExercises, search, language);

  const hasAnyContraindicated = useMemo(() => {
    return exercises.some((e) => e.isContraindicated);
  }, [exercises]);

  // Ejercicios filtrados según la píldora de grupo muscular seleccionada
  const displayedByFilter = useMemo(() => {
    let list = baseExercises;
    if (selectedMuscleGroup !== "all") {
      list = list.filter((ex) => (ex.muscleGroupName || "Otros") === selectedMuscleGroup);
    }
    return list;
  }, [baseExercises, selectedMuscleGroup]);

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
   * Soporta nombres en español o inglés y badge de coincidencia por alias.
   */
  function renderExerciseCard(item: Exercise | SearchResultItem) {
    const exercise = "exercise" in item ? item.exercise : item;
    const matchedAlias = "matchedAlias" in item ? item.matchedAlias : undefined;

    const hasContraindications =
      exercise.isContraindicated || (exercise.contraindications && exercise.contraindications.length > 0);

    const localizedTitle = getExerciseName(exercise, language);
    const localizedMuscle = getMuscleGroupName(exercise.muscleGroupName, language);
    const localizedEquipment = isEnglish
      ? getEquipmentDisplayName(exercise.equipment, "en")
      : formatEquipment(exercise.equipment);

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
              <Dumbbell className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {localizedMuscle}
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground">
              {localizedEquipment}
            </span>
          </div>

          {/* Nombre normalizado según idioma activo */}
          <h3 className="mt-2 text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
            {formatExerciseName(localizedTitle)}
          </h3>

          {/* Badge de coincidencia por alias o inglés */}
          {matchedAlias && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-mono font-medium text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                <span>
                  {isEnglish ? "Matched" : "Coincide con"}: &ldquo;{matchedAlias}&rdquo;
                </span>
              </span>
            </div>
          )}

          {/* Descripción concisa para evitar scroll vertical */}
          <p className="mt-1 line-clamp-1 sm:line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {exercise.description}
          </p>
        </div>

        {/* Fila inferior: Estado de seguridad articular y acción */}
        <div className="mt-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between gap-2">
          {/* Badge articular */}
          <div className="min-w-0 flex-1">
            {exercise.isContraindicated ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#9B2C2C] bg-[#9B2C2C]/10 border border-[#9B2C2C]/20 rounded-md px-2 py-0.5 truncate max-w-full">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="truncate">{isEnglish ? "Contraindicated" : "Contraindicado"}</span>
              </span>
            ) : hasContraindications ? (
              <span
                title={isEnglish ? `Attention: ${translatedContraindications}` : `Atención: ${translatedContraindications}`}
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#BB6C32] bg-[#BB6C32]/10 border border-[#BB6C32]/20 rounded-md px-2 py-0.5 truncate max-w-full"
              >
                <Info className="h-3 w-3 shrink-0 text-[#BB6C32]" />
                <span className="truncate">
                  {isEnglish ? "Caution" : "Atención"}: {translatedContraindications}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#3E6B48] bg-[#3E6B48]/10 border border-[#3E6B48]/20 rounded-md px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                <span>{isEnglish ? "Joint-safe" : "Seguro articular"}</span>
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
              {isEnglish ? "Guide" : "Técnica"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3.5 py-2 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Encabezado compacto con selector de idioma y filtros */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary">
            <BookOpen className="h-3 w-3" />
            <span>{isEnglish ? "Biomechanical Catalog" : "Catálogo Biomecánico"}</span>
          </div>
          <h1 className="font-serif text-2xl font-bold sm:text-4xl text-foreground tracking-tight mt-1">
            {isEnglish ? "Exercise Library" : "Biblioteca de Ejercicios"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isEnglish
              ? "Search by English, Argentine slang, machine or muscle target."
              : "Buscá por jerga argentina, nombres en inglés, implemento o músculo."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
          {/* Selector de idioma */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-mono font-semibold hover:border-primary/40 transition shadow-soft text-foreground active:scale-95"
            title={isEnglish ? "Cambiar a Español" : "Switch to English"}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{isEnglish ? "EN 🇺🇸" : "ES 🇦🇷"}</span>
          </button>

          {/* Filtro de seguridad articular */}
          {hasAnyContraindicated && (
            <button
              type="button"
              onClick={() => setHideContraindicated((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-mono font-medium transition shadow-soft ${
                hideContraindicated
                  ? "bg-[#3E6B48]/15 border-[#3E6B48]/40 text-[#3E6B48]"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
              title={
                hideContraindicated
                  ? isEnglish
                    ? "Show all exercises"
                    : "Mostrar todos los ejercicios"
                  : isEnglish
                  ? "Hide contraindicated exercises for your joints"
                  : "Ocultar ejercicios contraindicados para tus articulaciones"
              }
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                {hideContraindicated
                  ? isEnglish
                    ? "Joint-safe only"
                    : "Solo seguros"
                  : isEnglish
                  ? "All"
                  : "Todos"}
              </span>
            </button>
          )}

          <span className="rounded-xl border border-border bg-card px-2.5 py-1.5 shadow-soft">
            <strong className="text-primary font-bold">{exercises.length}</strong>{" "}
            {isEnglish ? "exercises" : "ejercicios"}
          </span>
        </div>
      </header>

      {/* Buscador difuso (Fuse.js) con sugerencias instantáneas */}
      <div className="mt-4 sm:mt-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isEnglish
                ? "Search by name, English term, slang (e.g. Bench press, Serrucho, Squat, OHP)..."
                : "Buscar por nombre, término en inglés o jerga (ej. Bench press, Serrucho, RDL, Polea)..."
            }
            className="h-10 sm:h-12 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-9 text-xs sm:text-sm font-medium outline-none focus:bg-background focus:border-primary/60 shadow-soft transition text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              title={isEnglish ? "Clear search" : "Limpiar búsqueda"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selector horizontal deslizable de grupos musculares */}
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
            {isEnglish ? "All" : "Todos"} ({exercises.length})
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
              {getMuscleGroupName(group.name, language)} ({group.count})
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
        /* MODO 1: Resultados de Búsqueda Inteligente */
        <div className="mt-5">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                {isEnglish ? "Results for" : "Resultados para"} &ldquo;{search}&rdquo;
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              {searchResults.length}{" "}
              {searchResults.length === 1
                ? isEnglish
                  ? "match"
                  : "coincidencia"
                : isEnglish
                ? "matches"
                : "coincidencias"}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="flex min-h-[25vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center bg-card/40">
              <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
              <h2 className="mt-2.5 text-sm font-bold text-foreground">
                {isEnglish ? "No exercises found" : "No se encontraron ejercicios"}
              </h2>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                {isEnglish
                  ? `No matching movements for "${search}". Try checking common typos or explore these popular searches:`
                  : `No hay ejercicios para "${search}". Probá con una de estas sugerencias populares:`}
              </p>

              {/* Píldoras de sugerencias interactivas */}
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 max-w-md">
                {POPULAR_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setSearch(suggestion)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:border-primary/40 hover:text-primary transition shadow-soft"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground transition shadow-soft"
              >
                {isEnglish ? "View all exercises" : "Ver todos los ejercicios"}
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
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    {getMuscleGroupName(muscleGroup, language)}
                  </h2>
                </div>
                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                  {groupExercises.length}{" "}
                  {groupExercises.length === 1
                    ? isEnglish
                      ? "exercise"
                      : "ejercicio"
                    : isEnglish
                    ? "exercises"
                    : "ejercicios"}
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
