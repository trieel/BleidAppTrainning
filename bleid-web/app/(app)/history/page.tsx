"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronRight, Dumbbell, History as HistoryIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getHistory } from "@/lib/api/workout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { WorkoutSession } from "@/types";

/**
 * Vista de historial de entrenamientos del atleta.
 * Rediseñada para máxima compacidad en iPhone 13 (tarjetas de ~80px de alto).
 */
export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="px-3.5 py-2 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Encabezado compacto */}
      <header className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary">
            <HistoryIcon className="h-3 w-3" /> Bitácora de Sesiones
          </div>
          <h1 className="font-serif text-2xl font-bold sm:text-4xl text-foreground tracking-tight mt-1">
            Historial
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro cronológico de tus entrenamientos completados.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shadow-soft"
          aria-label="Volver al panel"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      {/* Lista de sesiones */}
      <div className="mt-4 sm:mt-8 space-y-2.5 sm:space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            <HistoryIcon className="mx-auto h-7 w-7 text-muted-foreground/60" />
            <h2 className="mt-3 font-bold text-sm sm:text-base text-foreground">Todavía no hay sesiones registradas</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tu primera sesión va a aparecer acá con su desglose completo.</p>
            <Link
              href="/workout"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.98] transition"
            >
              Empezar a entrenar
            </Link>
          </div>
        ) : (
          sessions.map((session) => {
            const volume = session.sets
              .filter((set) => set.completed)
              .reduce((total, set) => total + set.weightKg * set.reps, 0);

            const exerciseCount = session.sets.length
              ? new Set(session.sets.map((set) => set.exerciseId)).size
              : 0;

            return (
              <Link
                key={session.id}
                href={`/workout/${session.id}`}
                className="group block card-editorial rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 transition-all hover:border-primary/40 hover:shadow-soft-lg active:scale-[0.99] shadow-soft"
              >
                {/* Fila principal: Nombre, fecha, estado y flecha */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-lg bg-secondary/80 border border-border/60 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <Dumbbell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {session.routineDayName}
                      </h3>
                      <p suppressHydrationWarning className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono mt-0.5">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {new Intl.DateTimeFormat("es-AR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(session.startedAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider ${
                        session.finishedAt
                          ? "bg-[#3E6B48]/10 text-[#3E6B48] border border-[#3E6B48]/20"
                          : "bg-[#BB6C32]/10 text-[#BB6C32] border border-[#BB6C32]/20"
                      }`}
                    >
                      {session.finishedAt ? "Completada" : "En curso"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Franja métrica compacta en una sola línea */}
                <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <div>
                    <strong className="text-foreground font-bold">{session.sets.length}</strong> series
                  </div>
                  <div>
                    <strong className="text-foreground font-bold">{Math.round(volume).toLocaleString("es-AR")}</strong> kg volumen
                  </div>
                  <div>
                    <strong className="text-foreground font-bold">{exerciseCount}</strong> ejercicios
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
