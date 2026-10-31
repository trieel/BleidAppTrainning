"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  Loader2,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { deleteBodyWeight, getBodyWeightHistory, logBodyWeight } from "@/lib/api";
import type { BodyWeightEntry } from "@/types";

/**
 * Componente de registro y seguimiento de peso corporal del atleta.
 * Optimizado para pantallas móviles (iPhone 13) con formato condensado.
 */
export function BodyWeightTracker() {
  const [history, setHistory] = useState<BodyWeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [weightInput, setWeightInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getBodyWeightHistory(60);
        if (mounted) {
          setHistory(data);
          if (data.length > 0) {
            setWeightInput(String(data[0].weightKg));
          }
        }
      } catch {
        if (mounted) setError("No pudimos cargar el registro de peso.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(weightInput);
    if (!val || val <= 0 || val > 400) {
      setError("Ingresá un peso válido en kilogramos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await logBodyWeight({
        weightKg: Math.round(val * 10) / 10,
        notes: notesInput.trim() || undefined,
      });

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.date !== saved.date);
        return [saved, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
      });
      setShowLogForm(false);
      setNotesInput("");
    } catch {
      setError("Error al registrar el peso corporal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBodyWeight(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("No se pudo eliminar el registro.");
    }
  }

  const latest = history[0];
  const oldest = history[history.length - 1];
  const delta = latest && oldest && history.length > 1
    ? Math.round((latest.weightKg - oldest.weightKg) * 10) / 10
    : 0;

  const minWeight = history.length > 0 ? Math.min(...history.map((h) => h.weightKg)) - 1 : 50;
  const maxWeight = history.length > 0 ? Math.max(...history.map((h) => h.weightKg)) + 1 : 100;
  const range = Math.max(1, maxWeight - minWeight);

  return (
    <section className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-7 shadow-soft">
      {/* Cabecera compacta con lectura inmediata de peso y acción */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-primary">
            <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Composición Corporal
          </div>
          <h2 className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold tracking-tight text-foreground">Peso Corporal</h2>
        </div>

        <div className="flex items-center gap-2.5">
          {latest && (
            <div className="text-right">
              <span className="font-mono text-lg sm:text-2xl font-bold text-foreground">{latest.weightKg}</span>{" "}
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">kg</span>
              {delta !== 0 && (
                <div
                  className={`flex items-center justify-end gap-0.5 text-[10px] font-mono font-semibold ${
                    delta < 0 ? "text-[#3E6B48]" : "text-[#BB6C32]"
                  }`}
                >
                  {delta < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                  <span>{delta > 0 ? `+${delta}` : delta} kg</span>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowLogForm((prev) => !prev)}
            className="flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition shadow-soft shrink-0"
          >
            <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Registrar
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* Formulario desplegable para registrar peso */}
      {showLogForm && (
        <form onSubmit={handleLog} className="mt-3.5 rounded-xl border border-border bg-muted/30 p-3 sm:p-4 animate-in fade-in duration-200">
          <p className="text-xs font-bold text-foreground">Registrar peso de hoy</p>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Peso en Kg
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="350"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="75.5"
                required
                className="mt-0.5 h-9 sm:h-10 w-full rounded-xl border border-border bg-card px-3 font-mono text-sm sm:text-base font-bold text-foreground outline-none focus:border-primary/60 shadow-soft"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="En ayunas, post-entreno..."
                className="mt-0.5 h-9 sm:h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary/60 shadow-soft"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLogForm(false)}
              className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-[0.98] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50 active:scale-[0.98] transition shadow-soft"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3" /> Guardar</>}
            </button>
          </div>
        </form>
      )}

      {/* Gráfico Visual y Tendencia */}
      <div className="mt-4 sm:mt-6">
        {loading ? (
          <div className="flex h-28 sm:h-36 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-4 sm:p-6 text-center text-xs text-muted-foreground bg-muted/20">
            <Scale className="h-7 w-7 text-muted-foreground/40 mb-1.5" />
            <p className="font-semibold text-foreground">Sin registros de peso aún</p>
            <p className="mt-0.5 text-[11px] leading-relaxed">Registrá tu peso 1-2 veces por semana para ver tu tendencia real.</p>
          </div>
        ) : (
          <div>
            <div className="flex h-28 sm:h-36 items-end gap-1.5 overflow-x-auto pb-1.5 pt-2">
              {history.slice(0, 16).reverse().map((entry) => {
                const heightPct = Math.max(12, Math.min(100, ((entry.weightKg - minWeight) / range) * 100));
                return (
                  <div key={entry.id} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {entry.weightKg}
                    </span>
                    <div
                      className="w-full max-w-7 rounded-t-md bg-primary/70 transition-all duration-300 group-hover:bg-primary shadow-soft"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="mt-1 select-none text-[8px] sm:text-[9px] text-muted-foreground font-mono">
                      {entry.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Lista compacta de registros recientes */}
            <div className="mt-3 divide-y divide-border/60 border-t border-border/60">
              {history.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{entry.date}</span>
                    {entry.notes && (
                      <span className="truncate rounded-md bg-secondary/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {entry.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-foreground text-xs">{entry.weightKg} kg</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted-foreground hover:text-destructive transition p-0.5"
                      title="Eliminar registro"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
