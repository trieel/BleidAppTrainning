"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { completeOnboarding, getSubscriptionStatus, verifySubscription } from "@/lib/api";

function SubscriptionCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [title, setTitle] = useState("Confirmando tu suscripción...");
  const [description, setDescription] = useState(
    "Estamos sincronizando tu pago con Mercado Pago para activar tu acceso Pro."
  );
  const [targetUrl, setTargetUrl] = useState("/dashboard");

  useEffect(() => {
    let isMounted = true;

    async function handleVerification() {
      const preapprovalId = searchParams.get("preapproval_id");

      try {
        let isPro = false;
        if (preapprovalId) {
          const result = await verifySubscription(preapprovalId);
          isPro = result.isProActive;
        } else {
          // If query param wasn't provided, check current user subscription status
          const status = await getSubscriptionStatus();
          isPro = status.isProActive;
        }

        if (!isMounted) return;

        if (isPro) {
          // Check for pending onboarding
          const pendingDraft =
            typeof window !== "undefined"
              ? localStorage.getItem("bleid-pending-onboarding")
              : null;

          if (pendingDraft) {
            try {
              const payload = JSON.parse(pendingDraft);
              await completeOnboarding(payload);
              if (typeof window !== "undefined") {
                localStorage.removeItem("bleid-pending-onboarding");
              }
              if (!isMounted) return;
              setTitle("¡Plan Pro y Rutina Listos!");
              setDescription(
                `Tu suscripción se acreditó exitosamente. Creamos tu rutina de ${payload.daysPerWeek} días.`
              );
              setTargetUrl("/dashboard");
            } catch {
              if (!isMounted) return;
              setTitle("¡Bienvenido a Bleid Pro!");
              setDescription("Tu suscripción Pro está activa. Ya podés disfrutar de todas las funciones.");
              setTargetUrl("/dashboard");
            }
          } else {
            setTitle("¡Bienvenido a Bleid Pro!");
            setDescription("Tu suscripción Pro está activa. Ya podés sumar días de alta frecuencia a tu rutina.");
            setTargetUrl("/workout");
          }

          setState("success");
          // Short delay so the user sees the confirmation before redirect
          setTimeout(() => {
            if (isMounted) {
              router.replace(pendingDraft ? "/dashboard" : "/workout");
            }
          }, 2200);
        } else {
          setState("error");
          setTitle("No pudimos verificar la suscripción");
          setDescription(
            "Mercado Pago aún no confirmó el débito automático o la operación fue cancelada. Si realizaste el pago, se activará en cuanto recibamos el aviso."
          );
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setState("error");
        setTitle("Error al procesar la confirmación");
        setDescription(
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al contactar los servidores. Podés verificar el estado desde tu perfil."
        );
      }
    }

    handleVerification();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-7 text-center shadow-soft-lg">
        {state === "loading" && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3 text-amber-500" /> PRO ACTIVADO
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-6">
              <Link
                href={targetUrl}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-soft hover:opacity-95 transition"
              >
                Continuar a la app <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/dashboard"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-soft hover:opacity-95 transition"
              >
                Ir al Dashboard
              </Link>
              <Link
                href="/workout"
                className="flex h-10 w-full items-center justify-center rounded-xl border border-border bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              >
                Volver a Entrenamientos
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SubscriptionCallbackContent />
    </Suspense>
  );
}
