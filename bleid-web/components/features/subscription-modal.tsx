"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { createSubscriptionCheckout } from "@/lib/api";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onContinueFree?: () => void;
  source?: "onboarding" | "workout";
}

const PRO_BENEFITS = [
  "Rutinas personalizadas de 5 y 6 días por semana",
  "Distribución y periodización avanzada (PPL, Upper/Lower)",
  "Débito automático mensual seguro vía Mercado Pago",
  "Cancelá en cualquier momento sin penalizaciones",
  "Si cancelás, tu acceso sigue activo hasta fin del mes pago",
];

export function SubscriptionModal({
  open,
  onClose,
  onContinueFree,
  source = "workout",
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const result = await createSubscriptionCheckout();
      if (result.initPoint) {
        window.location.href = result.initPoint;
      } else {
        setError("No pudimos iniciar el pago con Mercado Pago. Intentá de nuevo.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error al contactar Mercado Pago.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Suscripción Bleid Pro"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[28px] border border-border bg-card p-6 sm:p-7 shadow-soft-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          disabled={loading}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            BLEID PRO
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {source === "onboarding"
              ? "Llevá tu entrenamiento a +4 días"
              : "Desbloqueá rutinas de 5 y 6 días"}
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-sm">
            Las rutinas de más de 4 días requieren el plan Pro para diseñar y gestionar divisiones
            de alta frecuencia.
          </p>
        </div>

        {/* Price Card */}
        <div className="mt-5 rounded-2xl border border-primary/25 bg-secondary/40 p-4 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Suscripción mensual recurrente
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold font-mono text-foreground">$6.500</span>
            <span className="text-sm font-semibold text-muted-foreground">ARS / mes</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Equivalente a ~5 USD. Débito automático transparente vía Mercado Pago.
          </p>
        </div>

        {/* Benefits List */}
        <div className="mt-5 space-y-2.5">
          {PRO_BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <div className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="text-xs text-foreground/90 leading-tight">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-soft hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Conectando con Mercado Pago...
              </>
            ) : (
              <>Suscribirme con Mercado Pago</>
            )}
          </button>

          {onContinueFree && (
            <button
              onClick={onContinueFree}
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-xl border border-border bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition disabled:opacity-50"
            >
              Continuar gratis con 4 días
            </button>
          )}

          {!onContinueFree && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-full items-center justify-center rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            >
              Quizás más tarde
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Podés pausar o cancelar tu suscripción en cualquier momento. Sin ataduras.
        </p>
      </div>
    </div>
  );
}
