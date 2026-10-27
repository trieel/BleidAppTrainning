"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronRight, Dumbbell, History as HistoryIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getHistory } from "@/lib/api/workout";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { WorkoutSession } from "@/types";

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
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-bold text-primary">
            <HistoryIcon className="h-3.5 w-3.5" /> Bitácora de Sesiones
          </div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl text-foreground tracking-tight mt-2">
            Historial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Registro cronológico de tus entrenamientos completados.</p>
        </div>
        <Link
          href="/dashboard"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      <div className="mt-8 space-y-4">
        {sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
            <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <h2 className="mt-4 font-bold text-base text-foreground">Todavía no hay sesiones registradas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tu primera sesión va a aparecer acá con su desglose completo.</p>
            <Link
              href="/workout"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.98] transition"
            >
              Empezar a entrenar
            </Link>
          </div>
        ) : (
          sessions.map((session) => {
            const volume = session.sets
              .filter((set) => set.completed)
              .reduce((total, set) => total + set.weightKg * set.reps, 0);

            return (
              <Link
                key={session.id}
                href={`/workout/${session.id}`}
                className="group block card-editorial rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all hover:border-primary/40 hover:shadow-soft-lg shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/80 border border-border/60 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <Dumbbell className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {session.routineDayName}
                      </h3>
                      <p suppressHydrationWarning className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <CalendarDays className="h-3.5 w-3.5" />
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
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${
                      session.finishedAt
                        ? "bg-[#3E6B48]/10 text-[#3E6B48] border border-[#3E6B48]/20"
                        : "bg-[#BB6C32]/10 text-[#BB6C32] border border-[#BB6C32]/20"
                    }`}
                  >
                    {session.finishedAt ? "Completada" : "En curso"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/70 pt-4">
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{session.sets.length}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">series</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{Math.round(volume).toLocaleString("es-AR")}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">kg volumen</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">
                      {session.sets.length ? new Set(session.sets.map((set) => set.exerciseId)).size : 0}
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">ejercicios</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end text-xs font-mono font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                  Ver detalle <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
