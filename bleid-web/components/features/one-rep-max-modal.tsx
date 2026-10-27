"use client";

import { useMemo, useState } from "react";
import { Flame, Trophy, X } from "lucide-react";

interface OneRepMaxModalProps {
  initialWeightKg?: number;
  initialReps?: number;
  exerciseName?: string;
  onClose: () => void;
  onSelectWeight?: (weightKg: number) => void;
}

interface ZoneInfo {
  percent: number;
  reps: number;
  zone: string;
  description: string;
  badgeClass: string;
}

const ZONES: ZoneInfo[] = [
  { percent: 100, reps: 1, zone: "1RM Máximo", description: "Pico de fuerza absoluta", badgeClass: "bg-[#9B2C2C]/10 text-[#9B2C2C] border-[#9B2C2C]/30" },
  { percent: 95, reps: 2, zone: "Fuerza Extrema", description: "Esfuerzo neuromuscular máximo", badgeClass: "bg-[#BB6C32]/10 text-[#BB6C32] border-[#BB6C32]/30" },
  { percent: 90, reps: 4, zone: "Fuerza Pura", description: "Desarrollo de fuerza máxima", badgeClass: "bg-[#854826]/10 text-[#854826] border-[#854826]/30" },
  { percent: 85, reps: 6, zone: "Fuerza / Masa", description: "Tensión mecánica alta", badgeClass: "bg-primary/10 text-primary border-primary/30" },
  { percent: 80, reps: 8, zone: "Hipertrofia Óptima", description: "Rango dorado de hipertrofia", badgeClass: "bg-[#3E6B48]/10 text-[#3E6B48] border-[#3E6B48]/30" },
  { percent: 75, reps: 10, zone: "Hipertrofia / Volumen", description: "Acumulación de volumen", badgeClass: "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/30" },
  { percent: 70, reps: 12, zone: "Fatiga Metabólica", description: "Estrés metabólico controlado", badgeClass: "bg-[#2A6F97]/10 text-[#2A6F97] border-[#2A6F97]/30" },
  { percent: 65, reps: 15, zone: "Resistencia Muscular", description: "Capacidad de trabajo submáxima", badgeClass: "bg-[#4A423D]/10 text-[#4A423D] border-[#4A423D]/30" },
];

export function OneRepMaxModal({
  initialWeightKg = 80,
  initialReps = 8,
  exerciseName,
  onClose,
  onSelectWeight,
}: OneRepMaxModalProps) {
  const [weight, setWeight] = useState<number>(Math.max(1, initialWeightKg));
  const [reps, setReps] = useState<number>(Math.min(30, Math.max(1, initialReps)));

  const { oneRepMaxEpley, oneRepMaxBrzycki, calculated1RM } = useMemo(() => {
    if (reps === 1) {
      return {
        oneRepMaxEpley: weight,
        oneRepMaxBrzycki: weight,
        calculated1RM: weight,
      };
    }
    // Epley: w * (1 + r / 30)
    const epley = weight * (1 + reps / 30);
    // Brzycki: w * (36 / (37 - r))
    const brzycki = reps < 37 ? weight * (36 / (37 - reps)) : epley;

    const avg = Math.round(((epley + brzycki) / 2) * 10) / 10;
    return {
      oneRepMaxEpley: Math.round(epley * 10) / 10,
      oneRepMaxBrzycki: Math.round(brzycki * 10) / 10,
      calculated1RM: avg,
    };
  }, [weight, reps]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calculadora de 1RM y Zonas de Entrenamiento"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-border bg-card p-6 sm:p-7 shadow-soft-lg">
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">Calculadora de 1RM</h2>
            <p className="text-xs text-muted-foreground">
              {exerciseName ? `Estimación para ${exerciseName}` : "Cálculo de repetición máxima y zonas de carga"}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Peso levantado (kg)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              value={weight || ""}
              onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
              className="mt-1 h-10 w-full text-center text-2xl font-mono font-bold bg-transparent text-foreground outline-none focus:ring-0"
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Reps realizadas
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={reps || ""}
              onChange={(e) => setReps(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="mt-1 h-10 w-full text-center text-2xl font-mono font-bold bg-transparent text-foreground outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* 1RM Display Hero */}
        <div className="mt-4 rounded-2xl border border-primary/20 bg-secondary/60 p-4 text-center shadow-soft">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
            <Flame className="h-4 w-4 text-[#BB6C32]" /> 1RM Teórico Estimado
          </div>
          <div className="mt-1 text-4xl font-mono font-bold tracking-tight text-foreground">
            {calculated1RM} <span className="text-lg font-bold text-muted-foreground font-sans">kg</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground font-mono">
            <span>Epley: {oneRepMaxEpley} kg</span>
            <span>·</span>
            <span>Brzycki: {oneRepMaxBrzycki} kg</span>
          </div>
        </div>

        {/* Zonas de Carga */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Zonas de Entrenamiento (% del 1RM)
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">Carga objetivo</span>
          </div>

          <div className="mt-2 space-y-2">
            {ZONES.map((zone) => {
              const zoneWeight = Math.round((calculated1RM * (zone.percent / 100)) * 2) / 2;
              return (
                <div
                  key={zone.percent}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5 shadow-soft transition hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-lg border px-2 py-0.5 font-mono text-xs font-bold ${zone.badgeClass}`}>
                      {zone.percent}%
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{zone.zone}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ~{zone.reps} {zone.reps === 1 ? "rep" : "reps"} · {zone.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{zoneWeight} kg</span>
                    {onSelectWeight && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectWeight(zoneWeight);
                          onClose();
                        }}
                        className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98] transition"
                      >
                        Usar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-border bg-card py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 active:scale-[0.98] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
