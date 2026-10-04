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

  useEffect(() => { getHistory().then(setSessions).finally(() => setLoading(false)); }, []);

  if (loading) return <LoadingScreen />;
  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10"><header className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Tu recorrido</p><h1 className="display-face mt-3 text-4xl font-black">Historial.</h1><p className="mt-3 text-sm text-muted-foreground">Cada sesión cuenta. Incluso las que no salieron perfectas.</p></div><Link href="/dashboard" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link></header><div className="mt-8 space-y-3">{sessions.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-4 font-bold">Todavía no hay sesiones.</p><p className="mt-2 text-sm text-muted-foreground">Tu primera sesión va a aparecer acá.</p><Link href="/workout" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Empezar a entrenar</Link></div> : sessions.map((session) => { const volume = session.sets.filter((set) => set.completed).reduce((total, set) => total + set.weightKg * set.reps, 0); return <div key={session.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Dumbbell className="h-5 w-5" /></span><div><p className="text-sm font-bold">{session.routineDayName}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(session.startedAt))}</p></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${session.finishedAt ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>{session.finishedAt ? "Completada" : "En curso"}</span></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/70 pt-4"><div><p className="text-lg font-black">{session.sets.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">series</p></div><div><p className="text-lg font-black">{Math.round(volume).toLocaleString("es-AR")}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">kg volumen</p></div><div><p className="text-lg font-black">{session.sets.length ? new Set(session.sets.map((set) => set.exerciseId)).size : 0}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">ejercicios</p></div></div><div className="mt-4 flex items-center justify-end text-xs font-bold text-primary">Ver detalle <ChevronRight className="ml-1 h-3.5 w-3.5" /></div></div>; })}</div></div>
  );
}
