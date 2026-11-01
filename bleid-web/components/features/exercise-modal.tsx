"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Dumbbell, Loader2, ShieldCheck, X } from "lucide-react";
import { getExerciseById } from "@/lib/api";
import { formatContraindications, formatEquipment, formatExerciseName, levelLabels } from "@/lib/labels";
import {
  getEquipmentDisplayName,
  getExerciseName,
  getMuscleGroupName,
  useLanguage,
} from "@/lib/exercise-i18n";
import type { Exercise } from "@/types";

interface ExerciseModalProps {
  exerciseId: string | null;
  onClose: () => void;
}

export function ExerciseModal({ exerciseId, onClose }: ExerciseModalProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { language, isEnglish } = useLanguage();

  useEffect(() => {
    if (!exerciseId) {
      setExercise(null);
      return;
    }

    setLoading(true);
    setError("");
    getExerciseById(exerciseId)
      .then(setExercise)
      .catch(() =>
        setError(
          isEnglish
            ? "Could not load exercise information."
            : "No pudimos cargar la información del ejercicio."
        )
      )
      .finally(() => setLoading(false));
  }, [exerciseId, isEnglish]);

  if (!exerciseId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de ejercicio"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-soft-lg">
        <button
          onClick={onClose}
          aria-label={isEnglish ? "Close modal" : "Cerrar modal"}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {loading && (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm font-semibold text-destructive">{error}</div>
        )}

        {exercise && !loading && (
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1 text-[11px] font-mono font-semibold text-primary">
                <Dumbbell className="h-3 w-3" /> {getMuscleGroupName(exercise.muscleGroupName, language)}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-mono font-medium text-muted-foreground">
                {isEnglish
                  ? getEquipmentDisplayName(exercise.equipment, "en")
                  : formatEquipment(exercise.equipment)}
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold sm:text-3xl text-foreground mt-3 tracking-tight">
              {formatExerciseName(getExerciseName(exercise, language))}
            </h2>

            {/* Subtítulo si está en inglés mostrando el nombre original en español */}
            {isEnglish && exercise.name !== getExerciseName(exercise, "en") && (
              <p className="mt-0.5 text-xs font-mono text-muted-foreground/80">
                ES: {exercise.name}
              </p>
            )}

            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {isEnglish ? "Level" : "Nivel"}: {levelLabels[exercise.level] ?? exercise.level}
            </p>

            <div className="mt-5 rounded-2xl bg-muted/40 border border-border/70 p-4">
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider font-bold text-primary mb-1.5">
                {isEnglish ? "Quick Technique & Biomechanics Guide" : "Guía rápida de técnica y biomecánica"}
              </span>
              <p className="text-sm leading-relaxed text-foreground">
                {exercise.description ||
                  (isEnglish
                    ? "Movement designed for muscular growth and functional strength."
                    : "Ejercicio diseñado para desarrollo muscular y fuerza funcional.")}
              </p>
            </div>

            {/* Contraindications & Safety Info */}
            <div className="mt-5">
              {exercise.isContraindicated ? (
                <div className="rounded-2xl border border-[#9B2C2C]/25 bg-[#9B2C2C]/10 p-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#9B2C2C]">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {isEnglish
                        ? "Contraindicated for your joint profile"
                        : "Contraindicado para tus articulaciones"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-foreground/80 leading-relaxed">
                    {isEnglish
                      ? `This movement stresses registered joint areas: ${formatContraindications(exercise.contraindications)}.`
                      : `Este movimiento compromete zonas declaradas: ${formatContraindications(exercise.contraindications)}.`}
                  </p>
                  {exercise.modificationTip && (
                    <p className="mt-2 text-[#9B2C2C] font-semibold">
                      {isEnglish ? "Safe tip" : "Tip seguro"}: {exercise.modificationTip}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-[#3E6B48]/25 bg-[#3E6B48]/10 p-4 text-xs font-medium text-[#3E6B48]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    {isEnglish
                      ? "Joint-safe exercise compatible with your profile."
                      : "Ejercicio compatible con tus articulaciones y seguro para ejecutar."}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border/70 flex justify-end">
              <button
                onClick={onClose}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition shadow-soft"
              >
                {isEnglish ? "Got it" : "Entendido"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
