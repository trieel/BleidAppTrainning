"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Play,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getActiveRoutine, getLatestBodyWeight, getStreak, getVolumeProgress } from "@/lib/api";
import { getMe } from "@/lib/api/auth";
import { getActiveSession, getHistory } from "@/lib/api/workout";
import { ApiError } from "@/lib/api/client";
import { goalShortLabels, limitationLabels } from "@/lib/labels";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { BodyWeightEntry, Routine, Streak, UserProfile, VolumeProgress, WorkoutSession } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [volume, setVolume] = useState<VolumeProgress[]>([]);
  const [bodyWeight, setBodyWeight] = useState<BodyWeightEntry | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [lastFinishedSession, setLastFinishedSession] = useState<WorkoutSession | null>(null);
  const [selectedDayOverride, setSelectedDayOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getMe(),
      getActiveRoutine(),
      getStreak(),
      getVolumeProgress(),
      getLatestBodyWeight().catch(() => null),
      getActiveSession().catch(() => null),
      getHistory(1, 5).catch(() => []),
    ])
      .then(([user, activeRoutine, currentStreak, progress, latestWeight, active, history]) => {
        setProfile(user);
        setRoutine(activeRoutine);
        setStreak(currentStreak);
        setVolume(progress);
        setBodyWeight(latestWeight ?? null);
        setActiveSession(active ?? null);
        if (history && history.length > 0) {
          setLastFinishedSession(history[0]);
        }
      })
      .catch((exception) => {
        if (exception instanceof ApiError && exception.status === 404) {
          router.replace("/onboarding");
        } else {
          setError(exception instanceof ApiError ? exception.message : "No pudimos cargar tus datos de entrenamiento.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const activeDay = useMemo(() => {
    if (!routine || routine.days.length === 0) return null;
    if (selectedDayOverride) {
      const match = routine.days.find((d) => d.id === selectedDayOverride);
      if (match) return match;
    }
    if (activeSession) {
      const current = routine.days.find((d) => d.id === activeSession.routineDayId);
      if (current) return current;
    }
    if (lastFinishedSession) {
      const lastIndex = routine.days.findIndex((d) => d.id === lastFinishedSession.routineDayId);
      if (lastIndex !== -1) {
        const nextIndex = (lastIndex + 1) % routine.days.length;
        return routine.days[nextIndex];
      }
    }
    return routine.days[0];
  }, [routine, selectedDayOverride, activeSession, lastFinishedSession]);

  if (loading) return <LoadingScreen />;

  if (!profile || !routine) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-destructive">{error || "No encontramos tu rutina activa."}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">Configurá tu perfil o intentá recargar la página.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary/80 tactile-press border border-border"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reintentar
          </button>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
          >
            Asignar Rutina
          </Link>
        </div>
      </div>
    );
  }

  const firstName = profile.fullName.trim().split(" ")[0] || "Atleta";
  const maxVolume = volume.length > 0 ? Math.max(...volume.map((item) => item.totalVolumeKg), 1) : 0;
  const currentWeekVolume = volume.at(-1)?.totalVolumeKg ?? 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const trainedToday = streak?.lastWorkoutDate === todayIso;

  return (
    <div className="px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* High-Density Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p suppressHydrationWarning className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </p>
          <h1 className="display-face mt-0.5 text-2xl font-black tracking-tight text-foreground sm:text-4xl leading-tight">
            Hola, {firstName}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activeSession
              ? "Tenés un entrenamiento en curso. ¡A completarlo!"
              : trainedToday
              ? "Excelente trabajo. Ya registraste tu sesión de hoy."
              : "Todo listo para tu siguiente sesión de entrenamiento."}
          </p>
        </div>
        <Link
          href="/profile"
          aria-label="Ver perfil"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-sm font-bold text-primary shadow-soft transition hover:border-primary/50 tactile-press"
        >
          {firstName.slice(0, 1).toUpperCase()}
        </Link>
      </header>

      {/* Active Workout Banner (if in progress) */}
      {activeSession && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-primary/30 bg-card p-3.5 sm:p-5 shadow-soft">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-80" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-primary">Sesión en progreso</p>
                <h3 className="text-base font-black tracking-tight text-foreground">{activeSession.routineDayName}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {activeSession.sets.length} {activeSession.sets.length === 1 ? "serie registrada" : "series registradas"}
                </p>
              </div>
            </div>
            <Link
              href={`/workout/${activeSession.id}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-mono font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
            >
              <Play className="h-3 w-3 fill-current" /> Continuar sesión
            </Link>
          </div>
        </div>
      )}

      {/* Main Feature: Today's / Next Session Hero Card (Compact for iPhone 13) */}
      {activeDay && (
        <section className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-card p-4 text-foreground shadow-soft sm:p-6 lg:p-7">
          <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                  <Dumbbell className="h-3 w-3" /> Día 0{activeDay.dayNumber}
                </span>
                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                  {routine.goal in goalShortLabels ? goalShortLabels[routine.goal] : routine.name} · {routine.daysPerWeek}D/SEM
                </span>
              </div>

              <h2 className="display-face mt-2 text-2xl font-black leading-tight sm:text-4xl text-foreground">
                {activeDay.name}
              </h2>

              {/* Day exercises preview pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeDay.exercises.slice(0, 4).map((ex) => (
                  <span
                    key={ex.id}
                    className="rounded-lg border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {ex.exerciseName} <span className="font-mono text-primary font-bold">({ex.sets}s)</span>
                  </span>
                ))}
                {activeDay.exercises.length > 4 && (
                  <span className="rounded-lg border border-border bg-secondary/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    +{activeDay.exercises.length - 4} más
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-secondary/50 p-1">
                {routine.days.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDayOverride(d.id)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition-all tactile-press ${
                      activeDay.id === d.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    D{d.dayNumber}
                  </button>
                ))}
                <Link
                  href="/workout?action=new-day"
                  className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-mono font-bold text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-secondary/40 transition-all tactile-press"
                  title="Sumar nuevo día a tu rutina"
                >
                  <Plus className="h-3 w-3 stroke-[2.5] text-primary" />
                </Link>
              </div>

              <Link
                href={`/workout?dayId=${activeDay.id}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25 shrink-0"
              >
                Empezar sesión <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Adapted Routine Badge (if user has limitations) */}
      {profile.limitations.length > 0 && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-foreground">Rutina adaptada: </span>
            <span className="text-muted-foreground">
              Protección articular para:{" "}
              {profile.limitations.map((item) => limitationLabels[item.type] ?? item.type).join(", ")}.
            </span>
          </div>
        </div>
      )}

      {/* Metrics Grid 2x2 for iPhone 13 (High Density) */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak Card */}
        <div className="card-editorial rounded-2xl p-3.5 sm:p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Racha</p>
            <div className={`grid h-7 w-7 place-items-center rounded-lg ${trainedToday ? "bg-amber-500/15 border border-amber-500/30" : "bg-secondary"}`}>
              <Flame className={`h-3.5 w-3.5 ${trainedToday ? "text-amber-600 fill-amber-500/20" : "text-primary"}`} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-telemetry text-2xl sm:text-4xl font-black text-foreground">{streak?.currentDays ?? 0}</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Días</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-1.5 font-mono">
            <span>Récord: {streak?.longestDays ?? 0}d</span>
            {trainedToday ? (
              <span className="text-success font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" /> Listo
              </span>
            ) : (
              <span className="text-primary font-semibold">Hoy</span>
            )}
          </div>
        </div>

        {/* Volume Card */}
        <div className="card-editorial rounded-2xl p-3.5 sm:p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Volumen</p>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-telemetry text-2xl sm:text-4xl font-black text-foreground">{currentWeekVolume.toLocaleString("es-AR")}</span>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Kg</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-1.5 font-mono">
            <span>{volume.length} sem</span>
            <Link href="/progress" className="font-semibold text-primary hover:underline flex items-center">
              Ver <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        {/* Body Weight Metric Card */}
        <div className="card-editorial rounded-2xl p-3.5 sm:p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Peso</p>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 border border-accent/20">
              <Scale className="h-3.5 w-3.5 text-accent" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            {bodyWeight ? (
              <>
                <span className="text-telemetry text-2xl sm:text-4xl font-black text-foreground">{bodyWeight.weightKg}</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Kg</span>
              </>
            ) : (
              <span className="text-sm font-mono font-bold text-muted-foreground">Sin datos</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-1.5 font-mono">
            <span>{bodyWeight ? bodyWeight.date.slice(5) : "—"}</span>
            <Link href="/progress" className="font-semibold text-primary hover:underline flex items-center">
              Log <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        {/* Routine Split Card */}
        <div className="card-editorial rounded-2xl p-3.5 sm:p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Plan</p>
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-secondary border border-border">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <p className="mt-2.5 truncate text-sm sm:text-base font-black tracking-tight text-foreground">{routine.name}</p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-1.5 font-mono">
            <span>{routine.days.length} días</span>
            <Link href="/workout" className="font-semibold text-primary hover:underline flex items-center">
              Ver <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Routine Split & Volume Evolution */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Days of Routine Split */}
        <div className="card-editorial rounded-2xl p-4 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Estructura semanal</p>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">Tu split de entrenamiento</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/workout?action=new-day"
                className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all tactile-press"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
                <span>Sumar día</span>
              </Link>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {routine.days.map((routineDay, index) => {
              const isRecommended = activeDay?.id === routineDay.id;
              const totalSetsCount = routineDay.exercises.reduce((acc, ex) => acc + ex.sets, 0);

              return (
                <Link
                  href={`/workout?dayId=${routineDay.id}`}
                  key={routineDay.id}
                  className={`group flex items-center justify-between rounded-xl border p-3 transition-all duration-150 tactile-press ${
                    isRecommended
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-black transition ${
                        isRecommended ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{routineDay.name}</p>
                        {isRecommended && (
                          <span className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary">
                            Siguiente
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span>{routineDay.exercises.length} ejercicios</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-2.5 w-2.5" /> ~{totalSetsCount} series
                        </span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Volume Evolution Chart */}
        <div className="card-editorial rounded-2xl p-4 sm:p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Progresión</p>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">Volumen Semanal</h3>
              </div>
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/20">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Kilos totales acumulados en tus series.</p>
          </div>

          <div className="mt-4">
            {volume.length === 0 ? (
              <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-secondary/20 p-3 text-center">
                <Sparkles className="h-4 w-4 text-primary/70 mb-1" />
                <p className="text-xs font-mono font-bold text-foreground">Sin registros de volumen todavía</p>
              </div>
            ) : (
              <div className="flex h-28 items-end gap-1.5 pt-2">
                {volume.slice(-8).map((item) => {
                  const percentage = maxVolume > 0 ? Math.max((item.totalVolumeKg / maxVolume) * 100, 8) : 8;
                  return (
                    <div key={item.weekStart} className="group relative flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                      <div className="pointer-events-none absolute -top-7 hidden rounded-md border border-border bg-card px-1.5 py-0.5 text-[9px] font-mono font-bold text-foreground shadow-soft group-hover:block whitespace-nowrap z-10">
                        {Math.round(item.totalVolumeKg).toLocaleString("es-AR")} kg
                      </div>
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all duration-200 group-hover:bg-primary group-hover:shadow-soft"
                        style={{ height: `${percentage}%` }}
                      />
                      <span className="text-[8px] font-mono text-muted-foreground truncate w-full text-center">
                        {item.weekStart.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Récord: {maxVolume > 0 ? `${maxVolume.toLocaleString("es-AR")} kg` : "—"}</span>
            <Link href="/history" className="text-primary font-bold hover:underline">
              Sesiones →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
