"use client";

import { useState } from "react";
import { Calculator, Check, Minus, Plus, X } from "lucide-react";

interface PlateCalculatorProps {
  initialWeightKg?: number;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
}

interface PlateConfig {
  weight: number;
  label: string;
  color: string;
  textColor: string;
  heightClass: string;
}

const AVAILABLE_PLATES: PlateConfig[] = [
  { weight: 25, label: "25", color: "bg-[#C83A3A]", textColor: "text-white", heightClass: "h-28" },
  { weight: 20, label: "20", color: "bg-[#2A6F97]", textColor: "text-white", heightClass: "h-26" },
  { weight: 15, label: "15", color: "bg-[#D4A31E]", textColor: "text-[#1D1714]", heightClass: "h-22" },
  { weight: 10, label: "10", color: "bg-[#3E6B48]", textColor: "text-white", heightClass: "h-18" },
  { weight: 5, label: "5", color: "bg-[#FAF7F2] border border-[#D5C9B8]", textColor: "text-[#1D1714]", heightClass: "h-14" },
  { weight: 2.5, label: "2.5", color: "bg-[#4A423D]", textColor: "text-white", heightClass: "h-11" },
  { weight: 1.25, label: "1.25", color: "bg-[#A8A29E]", textColor: "text-[#1D1714]", heightClass: "h-8" },
];

export function PlateCalculator({
  initialWeightKg = 60,
  onClose,
  onApplyWeight,
}: PlateCalculatorProps) {
  const [weight, setWeight] = useState<number>(Math.max(0, initialWeightKg));
  const [barWeight, setBarWeight] = useState<number>(20);

  const totalPlateWeight = Math.max(0, weight - barWeight);
  const perSideWeight = totalPlateWeight / 2;

  let remaining = perSideWeight;
  const breakdown: { plate: PlateConfig; count: number }[] = [];
  const visualPlates: PlateConfig[] = [];

  for (const plate of AVAILABLE_PLATES) {
    if (remaining >= plate.weight - 0.001) {
      const count = Math.floor((remaining + 0.0001) / plate.weight);
      if (count > 0) {
        breakdown.push({ plate, count });
        for (let i = 0; i < count; i++) {
          visualPlates.push(plate);
        }
        remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
      }
    }
  }

  const remainderTotal = remaining > 0.01 ? Math.round(remaining * 2 * 100) / 100 : 0;

  const handleAdjustWeight = (delta: number) => {
    setWeight((prev) => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calculadora de discos de barra olímpica"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-border bg-card p-6 shadow-soft-lg">
        <button
          onClick={onClose}
          aria-label="Cerrar calculadora"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">Calculadora de Discos</h2>
            <p className="text-xs text-muted-foreground">Desglose exacto por lado para barra olímpica</p>
          </div>
        </div>

        {/* Selector de barra */}
        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Peso de la barra
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {[
              { label: "Olímpica (20 kg)", val: 20 },
              { label: "Técnica (15 kg)", val: 15 },
              { label: "Ligera (10 kg)", val: 10 },
            ].map((option) => (
              <button
                key={option.val}
                type="button"
                onClick={() => {
                  setBarWeight(option.val);
                  if (weight < option.val) setWeight(option.val);
                }}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  barWeight === option.val
                    ? "border-primary bg-primary/10 text-primary shadow-soft"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input y ajuste de peso */}
        <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Peso Objetivo Total
          </span>
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleAdjustWeight(-5)}
              aria-label="Restar 5 kilos"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary active:scale-[0.98] transition shadow-soft"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                step="0.5"
                min={barWeight}
                value={weight || ""}
                onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                className="w-28 text-center text-3xl font-mono font-bold tracking-tight bg-transparent focus:outline-none focus:ring-0 text-foreground"
              />
              <span className="text-sm font-semibold text-muted-foreground">kg</span>
            </div>
            <button
              type="button"
              onClick={() => handleAdjustWeight(5)}
              aria-label="Sumar 5 kilos"
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary active:scale-[0.98] transition shadow-soft"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {[-10, -2.5, +2.5, +10].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => handleAdjustWeight(delta)}
                className="rounded-lg bg-card px-2.5 py-1 text-[11px] font-mono font-semibold text-muted-foreground hover:text-foreground border border-border shadow-soft active:scale-[0.98] transition"
              >
                {delta > 0 ? `+${delta}` : delta} kg
              </button>
            ))}
          </div>
        </div>

        {/* Representación visual de la barra (un lado) */}
        <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4 shadow-inner">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Visualizador (por lado):</span>
            <span className="font-mono text-foreground font-bold">{perSideWeight} kg</span>
          </div>

          <div className="mt-3 flex min-h-32 items-center justify-center overflow-x-auto py-2">
            <div className="flex items-center">
              {/* Barra central */}
              <div className="h-4 w-12 rounded-l-md bg-stone-300 border border-stone-400" />
              {/* Tope / collar */}
              <div className="h-16 w-2.5 rounded-sm bg-stone-400 border border-stone-500 shadow-sm" />

              {/* Discos montados */}
              <div className="flex items-center gap-0.5 ml-0.5">
                {visualPlates.length === 0 ? (
                  <span className="ml-3 text-xs italic text-muted-foreground">Solo la barra</span>
                ) : (
                  visualPlates.map((plate, index) => (
                    <div
                      key={index}
                      title={`${plate.weight} kg`}
                      className={`flex w-4 items-center justify-center rounded-sm border border-black/20 font-bold shadow-soft transition-transform hover:scale-105 ${plate.heightClass} ${plate.color} ${plate.textColor}`}
                    >
                      <span className="rotate-90 select-none text-[9px] font-mono leading-none">
                        {plate.label}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Manga exterior */}
              <div className="h-3.5 w-8 rounded-r-md bg-stone-300 border border-stone-400" />
            </div>
          </div>

          {remainderTotal > 0 && (
            <p className="mt-2 text-center text-[11px] font-medium text-[#BB6C32] bg-[#BB6C32]/10 border border-[#BB6C32]/20 rounded-lg py-1 px-2">
              Atención: {remainderTotal} kg restantes no divisibles con discos de 1.25 kg
            </p>
          )}
        </div>

        {/* Resumen por lado */}
        <div className="mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Cargar en cada lado
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {breakdown.length === 0 ? (
              <span className="text-xs text-muted-foreground">Sin discos (solo la barra)</span>
            ) : (
              breakdown.map(({ plate, count }) => (
                <div
                  key={plate.weight}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-soft"
                >
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${plate.color}`} />
                  <span>
                    {count}× <strong className="text-foreground font-mono font-bold">{plate.label} kg</strong>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botón de acción */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border bg-card py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition active:scale-[0.98]"
          >
            Cerrar
          </button>
          {onApplyWeight && (
            <button
              type="button"
              onClick={() => {
                onApplyWeight(weight);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition active:scale-[0.98]"
            >
              <Check className="h-4 w-4" /> Aplicar {weight} kg
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
