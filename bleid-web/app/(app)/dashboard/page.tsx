"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronRight, Flame, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveRoutine, getStreak, getVolumeProgress } from "@/lib/api";
import { getMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Routine, Streak, UserProfile, VolumeProgress } from "@/types";

const goalLabels = { GainMuscle: "Hipertrofia", LoseWeight: "Definición", Endurance: "Resistencia", Maintain: "Mantenimiento" };

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [volume, setVolume] = useState<VolumeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMe(), getActiveRoutine(), getStreak(), getVolumeProgress()])
      .then(([user, activeRoutine, currentStreak, progress]) => { setProfile(user); setRoutine(activeRoutine); setStreak(currentStreak); setVolume(progress); })
      .catch((exception) => { if (exception instanceof ApiError && exception.status === 404) router.replace("/onboarding"); else setError("No pudimos cargar tu tablero."); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingScreen />;
  if (error || !profile || !routine) return <div className="p-6 text-sm text-red-200">{error || "No encontramos tu rutina."}</div>;

  const day = routine.days[new Date().getDay() % routine.days.length];
  const maxVolume = Math.max(...volume.map((item) => item.totalVolumeKg), 1);
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1 className="display-face mt-3 text-4xl font-black tracking-tight sm:text-5xl">Hola, {firstName}<span className="text-primary">.</span></h1></div><Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-sm font-bold text-primary">{firstName.slice(0, 1).toUpperCase()}</Link></header>
      <section className="relative mt-8 overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground sm:p-8"><div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[34px] border-primary-foreground/10" /><div className="relative flex flex-col justify-between gap-10 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] opacity-60"><span className="h-2 w-2 rounded-full bg-primary-foreground" /> Tu sesión de hoy</p><h2 className="display-face mt-4 max-w-lg text-4xl font-black leading-none sm:text-5xl">{day.name}</h2><p className="mt-4 text-sm font-medium opacity-70">{goalLabels[routine.goal]} · {routine.daysPerWeek} días / semana</p></div><Link href={`/workout?dayId=${day.id}`} className="inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-primary-foreground px-5 text-sm font-black text-primary transition hover:bg-white">Empezar sesión <ArrowUpRight className="h-4 w-4" /></Link></div></section>
      {profile.limitations.length > 0 && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><p className="text-sm font-bold">Tu rutina está adaptada</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Filtramos ejercicios teniendo en cuenta: {profile.limitations.map((item) => item.type === "Knee" ? "rodilla" : item.type === "Lumbar" ? "zona lumbar" : item.type === "Shoulder" ? "hombro" : item.type === "Wrist" ? "muñeca" : "cuello").join(", ")}.</p></div></div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Racha actual</p><Flame className="h-4 w-4 text-accent" /></div><p className="display-face mt-5 text-4xl font-black">{streak?.currentDays ?? 0}<span className="ml-1 text-base font-bold text-muted-foreground">días</span></p><p className="mt-2 text-xs text-muted-foreground">Mejor: {streak?.longestDays ?? 0} días</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Esta semana</p><Sparkles className="h-4 w-4 text-primary" /></div><p className="display-face mt-5 text-4xl font-black">{volume.at(-1)?.totalVolumeKg.toLocaleString("es-AR") ?? "0"}<span className="ml-1 text-base font-bold text-muted-foreground">kg</span></p><p className="mt-2 text-xs text-muted-foreground">Volumen registrado</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Tu plan</p><CalendarDays className="h-4 w-4 text-primary" /></div><p className="mt-5 text-lg font-bold">{routine.name}</p><p className="mt-2 text-xs text-muted-foreground">{routine.days.length} días listos para vos</p></div></div>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Próximos días</p><h3 className="mt-2 text-xl font-bold">Tu semana, sin improvisar.</h3></div><Link href="/workout" className="text-xs font-bold text-primary">Ver rutina</Link></div><div className="mt-6 space-y-2">{routine.days.slice(0, 4).map((routineDay, index) => <Link href={`/workout?dayId=${routineDay.id}`} key={routineDay.id} className={`flex items-center justify-between rounded-xl border p-4 transition hover:border-primary/50 ${routineDay.id === day.id ? "border-primary/30 bg-primary/5" : "border-border/70"}`}><div className="flex items-center gap-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-xs font-bold text-primary">0{index + 1}</span><div><p className="text-sm font-bold">{routineDay.name}</p><p className="mt-1 text-xs text-muted-foreground">{routineDay.exercises.length} ejercicios</p></div></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>)}</div></div><div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Volumen</p><h3 className="mt-2 text-xl font-bold">La señal de tu esfuerzo.</h3><div className="mt-8 flex h-36 items-end gap-2">{volume.slice(-8).map((item) => <div key={item.weekStart} className="group flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-primary/80 transition group-hover:bg-primary" style={{ height: `${Math.max((item.totalVolumeKg / maxVolume) * 100, 5)}%` }} /><span className="text-[9px] text-muted-foreground">{item.weekStart.slice(5)}</span></div>)}</div></div></section>
    </div>
  );
}
