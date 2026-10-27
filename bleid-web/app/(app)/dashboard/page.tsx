"use client";

import Link from "next/link";
import {
  ArrowRight,
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
import type { BodyWeightEntry, Routine, RoutineDay, Streak, UserProfile, VolumeProgress, WorkoutSession } from "@/types";

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

        const finished = history.find((session) => Boolean(session.finishedAt));
        if (finished) {
          setLastFinishedSession(finished);
        }
      })
      .catch((exception) => {
        if (exception instanceof ApiError && exception.status === 404) {
          router.replace("/onboarding");
        } else {
          setError("No pudimos cargar tu tablero de entrenamiento.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Determine the recommended next day
  const defaultDay = useMemo(() => {
    if (!routine || routine.days.length === 0) return null;
    if (!lastFinishedSession) return routine.days[0];

    const lastIndex = routine.days.findIndex((d) => d.id === lastFinishedSession.routineDayId);
    if (lastIndex === -1) return routine.days[0];

    const nextIndex = (lastIndex + 1) % routine.days.length;
    return routine.days[nextIndex];
  }, [routine, lastFinishedSession]);

  const activeDay: RoutineDay | null = useMemo(() => {
    if (!routine) return null;
    if (selectedDayOverride) {
      return routine.days.find((d) => d.id === selectedDayOverride) ?? defaultDay;
    }
    return defaultDay;
  }, [routine, selectedDayOverride, defaultDay]);

  if (loading) return <LoadingScreen />;

  if (error || !profile || !routine) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-semibold text-destructive">{error || "No encontramos tu rutina activa."}</p>
        <p className="mt-2 text-sm text-muted-foreground">Configurá tu perfil o intentá recargar la página.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary/80 tactile-press border border-border"
          >
            <RotateCcw className="h-4 w-4" /> Reintentar
          </button>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
          >
            Asignar Rutina en Onboarding
          </Link>
        </div>
      </div>
    );
  }

  const firstName = profile.fullName.trim().split(" ")[0] || "Atleta";
  const maxVolume = Math.max(...volume.map((item) => item.totalVolumeKg), 1);
  const currentWeekVolume = volume.at(-1)?.totalVolumeKg ?? 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const trainedToday = streak?.lastWorkoutDate === todayIso;

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p suppressHydrationWarning className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </p>
          <h1 className="display-face mt-2 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Hola, {firstName}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeSession
              ? "Tenés un entrenamiento en curso. ¡Vamos a completarlo!"
              : trainedToday
              ? "Excelente trabajo. Ya registraste tu sesión de hoy."
              : "Todo listo para tu siguiente sesión de entrenamiento."}
          </p>
        </div>
        <Link
          href="/profile"
          aria-label="Ver perfil"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-card text-base font-bold text-primary shadow-soft transition hover:border-primary/50 tactile-press"
        >
          {firstName.slice(0, 1).toUpperCase()}
        </Link>
      </header>

      {/* Active Workout Banner (if in progress) */}
      {activeSession && (
        <div className="mt-6 overflow-hidden rounded-[24px] border border-primary/30 bg-card p-5 sm:p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5">
              <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-80" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-primary" />
              </span>
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary">Sesión en progreso</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">{activeSession.routineDayName}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {activeSession.sets.length} {activeSession.sets.length === 1 ? "serie registrada" : "series registradas"} · Sobrecarga activa
                </p>
              </div>
            </div>
            <Link
              href={`/workout/${activeSession.id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
            >
              <Play className="h-4 w-4 fill-current" /> Continuar sesión
            </Link>
          </div>
        </div>
      )}

      {/* Main Feature: Today's / Next Session Hero Card */}
      {activeDay && (
        <section className="relative mt-6 overflow-hidden rounded-[28px] border border-border bg-card p-6 text-foreground shadow-soft sm:p-8">
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                  <Dumbbell className="h-3.5 w-3.5" /> Día 0{activeDay.dayNumber}
                </span>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {routine.goal in goalShortLabels ? goalShortLabels[routine.goal] : routine.name} · {routine.daysPerWeek} DÍAS / SEM
                </span>
              </div>

              <h2 className="display-face mt-4 text-3xl font-black leading-tight sm:text-5xl text-foreground">
                {activeDay.name}
              </h2>

              {/* Day exercises preview pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {activeDay.exercises.slice(0, 4).map((ex) => (
                  <span
                    key={ex.id}
                    className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {ex.exerciseName} <span className="font-mono text-primary font-bold text-[11px]">({ex.sets}s)</span>
                  </span>
                ))}
                {activeDay.exercises.length > 4 && (
                  <span className="rounded-lg border border-border bg-secondary/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    +{activeDay.exercises.length - 4} más
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-secondary/50 p-1">
                {routine.days.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDayOverride(d.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold transition-all tactile-press ${
                      activeDay.id === d.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Día {d.dayNumber}
                  </button>
                ))}
                <Link
                  href="/workout?action=new-day"
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-mono font-bold text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-secondary/40 transition-all tactile-press"
                  title="Sumar nuevo día a tu rutina"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5] text-primary" />
                  <span>Sumar día</span>
                </Link>
              </div>

              <Link
                href={`/workout?dayId=${activeDay.id}`}
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press border border-primary/25"
              >
                Empezar sesión <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Adapted Routine Badge (if user has limitations) */}
      {profile.limitations.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-foreground">Rutina adaptada y protegida: </span>
            <span className="text-muted-foreground">
              Filtramos ejercicios lesivos considerando:{" "}
              {profile.limitations.map((item) => limitationLabels[item.type] ?? item.type).join(", ")}.
            </span>
          </div>
        </div>
      )}

      {/* Metrics Grid with Tactile Number Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak Card */}
        <div className="card-editorial rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Racha actual</p>
            <div className={`grid h-8 w-8 place-items-center rounded-xl ${trainedToday ? "bg-amber-500/15 border border-amber-500/30" : "bg-secondary"}`}>
              <Flame className={`h-4 w-4 ${trainedToday ? "text-amber-600 fill-amber-500/20" : "text-primary"}`} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-telemetry text-4xl sm:text-5xl font-black text-foreground">{streak?.currentDays ?? 0}</span>
            <span className="text-xs font-mono font-bold text-muted-foreground uppercase">Días</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5 font-mono">
            <span>Récord: {streak?.longestDays ?? 0} d</span>
            {trainedToday ? (
              <span className="flex items-center gap-1 font-semibold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Hoy listo
              </span>
            ) : (
              <span className="font-semibold text-primary">Por entrenar</span>
            )}
          </div>
        </div>

        {/* Volume Card */}
        <div className="card-editorial rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Volumen semana</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-telemetry text-4xl sm:text-5xl font-black text-foreground">{currentWeekVolume.toLocaleString("es-AR")}</span>
            <span className="text-xs font-mono font-bold text-muted-foreground uppercase">Kg</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5 font-mono">
            <span>{volume.length} semanas</span>
            <Link href="/progress" className="font-semibold text-primary hover:underline flex items-center gap-0.5">
              Detalle <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Body Weight Metric Card */}
        <div className="card-editorial rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Peso corporal</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 border border-accent/20">
              <Scale className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {bodyWeight ? (
              <>
                <span className="text-telemetry text-4xl sm:text-5xl font-black text-foreground">{bodyWeight.weightKg}</span>
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase">Kg</span>
              </>
            ) : (
              <span className="text-base font-mono font-bold text-muted-foreground">Sin registro</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5 font-mono">
            <span>{bodyWeight ? bodyWeight.date : "1-2 sem"}</span>
            <Link href="/progress" className="font-semibold text-primary hover:underline flex items-center gap-0.5">
              Registrar <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Routine Split Card */}
        <div className="card-editorial rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-hover">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Plan activo</p>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary border border-border">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-4 truncate text-xl font-black tracking-tight text-foreground">{routine.name}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5 font-mono">
            <span>{routine.days.length} días configurados</span>
            <Link href="/workout" className="font-semibold text-primary hover:underline flex items-center gap-0.5">
              Ver <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Routine Split & Volume Evolution */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Days of Routine Split */}
        <div className="card-editorial rounded-2xl p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Estructura semanal</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">Tu split de entrenamiento</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/workout?action=new-day"
                className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/25 px-3 py-1.5 text-xs font-mono font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all tactile-press"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Sumar día</span>
              </Link>
              <Link href="/workout" className="text-xs font-mono font-bold text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {routine.days.map((routineDay, index) => {
              const isRecommended = activeDay?.id === routineDay.id;
              const totalSetsCount = routineDay.exercises.reduce((acc, ex) => acc + ex.sets, 0);

              return (
                <Link
                  href={`/workout?dayId=${routineDay.id}`}
                  key={routineDay.id}
                  className={`group flex items-center justify-between rounded-xl border p-4 transition-all duration-150 tactile-press ${
                    isRecommended
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-xs font-black transition ${
                        isRecommended ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{routineDay.name}</p>
                        {isRecommended && (
                          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                            Siguiente
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span>{routineDay.exercises.length} ejercicios</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" /> ~{totalSetsCount} series
                        </span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}

            {/* Direct action button to add a day to the routine */}
            <Link
              href="/workout?action=new-day"
              className="group flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3.5 text-xs font-mono font-bold text-primary hover:border-primary hover:bg-primary/10 transition-all tactile-press"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:scale-110 stroke-[2.5]" />
              <span>Sumar nuevo día de entrenamiento</span>
            </Link>
          </div>
        </div>

        {/* Volume Evolution Chart */}
        <div className="card-editorial rounded-2xl p-5 sm:p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Progresión</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">Volumen Semanal</h3>
              </div>
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 border border-primary/20">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Kilos totales acumulados en tus series de entrenamiento.</p>
          </div>

          <div className="mt-6">
            {volume.length === 0 ? (
              <div className="grid h-36 place-items-center rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground font-mono">
                Completá tu primer entrenamiento para visualizar la telemetría de volumen.
              </div>
            ) : (
              <div className="flex h-36 items-end gap-2 pt-4">
                {volume.slice(-8).map((item) => {
                  const percentage = Math.max((item.totalVolumeKg / maxVolume) * 100, 8);
                  return (
                    <div key={item.weekStart} className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="pointer-events-none absolute -top-8 hidden rounded-md border border-border bg-card px-2 py-1 text-[10px] font-mono font-bold text-foreground shadow-soft group-hover:block whitespace-nowrap z-10">
                        {Math.round(item.totalVolumeKg).toLocaleString("es-AR")} kg
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-primary/80 transition-all duration-200 group-hover:bg-primary group-hover:shadow-soft"
                        style={{ height: `${percentage}%` }}
                      />
                      <span className="text-[9px] font-mono text-muted-foreground truncate w-full text-center">
                        {item.weekStart.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Récord: {maxVolume.toLocaleString("es-AR")} kg</span>
            <Link href="/history" className="text-primary font-bold hover:underline">
              Ver sesiones →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
