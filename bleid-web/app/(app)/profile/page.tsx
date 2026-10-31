"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Dumbbell,
  Edit2,
  Loader2,
  LogOut,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IOSInstallModal } from "@/components/pwa/install-prompt";
import { getMe, updateProfile } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { clearToken } from "@/lib/auth";
import { goalLabels, goalShortLabels, levelLabels, limitationLabels, severityLabels } from "@/lib/labels";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { GoalType, LevelType, LimitationType, SeverityType, SexType, UserLimitation, UserProfile } from "@/types";

const ALL_LIMITATIONS: LimitationType[] = ["Knee", "Lumbar", "Shoulder", "Wrist", "Neck"];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Estados del formulario de edición
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [sex, setSex] = useState<SexType | "">("");
  const [goal, setGoal] = useState<GoalType>("GainMuscle");
  const [level, setLevel] = useState<LevelType>("Beginner");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [sessionMin, setSessionMin] = useState<number>(60);
  const [limitations, setLimitations] = useState<UserLimitation[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standaloneMode);
    }

    getMe()
      .then((data) => {
        setProfile(data);
        initForm(data);
      })
      .catch((err) => {
        setFeedback({
          message: err instanceof ApiError ? err.message : "No pudimos cargar tu perfil de atleta.",
          isError: true,
        });
      });
  }, []);

  function initForm(data: UserProfile) {
    setFullName(data.fullName);
    setAge(data.age ?? "");
    setSex(data.sex ?? "");
    setGoal(data.goal ?? "GainMuscle");
    setLevel(data.level ?? "Beginner");
    setDaysPerWeek(data.daysPerWeek ?? 3);
    setSessionMin(data.sessionMin ?? 60);
    setLimitations(data.limitations ?? []);
  }

  function toggleLimitation(type: LimitationType) {
    setLimitations((prev) => {
      const exists = prev.some((l) => l.type === type);
      if (exists) {
        return prev.filter((l) => l.type !== type);
      }
      return [...prev, { type, severity: "Moderate" }];
    });
  }

  function setLimitationSeverity(type: LimitationType, severity: SeverityType) {
    setLimitations((prev) =>
      prev.map((item) => (item.type === type ? { ...item, severity } : item))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim() || profile?.fullName,
        age: age ? Number(age) : null,
        sex: sex || null,
        goal,
        level,
        daysPerWeek,
        sessionMin,
        limitations,
      });
      setProfile(updated);
      initForm(updated);
      setEditing(false);
      setFeedback({ message: "Perfil y adaptaciones biomecánicas actualizados con éxito.", isError: false });
    } catch (ex) {
      setFeedback({
        message: ex instanceof ApiError ? ex.message : "No pudimos guardar los cambios. Intentá de nuevo.",
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (!profile) {
    if (feedback?.isError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-base font-semibold text-destructive">{feedback.message}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-foreground border border-border"
            >
              Reintentar
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      );
    }
    return <LoadingScreen />;
  }

  return (
    <div className="px-3.5 py-2 sm:px-8 sm:py-6 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      {/* Encabezado compacto */}
      <header className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary">
            <UserRound className="h-3 w-3" /> Cuenta y Preferencias
          </div>
          <h1 className="font-serif text-2xl font-bold sm:text-4xl text-foreground tracking-tight mt-1">
            Perfil del Atleta
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configuración personal, objetivos y adaptaciones articulares.
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

      {/* Banner de feedback */}
      {feedback && (
        <div
          className={`mt-3.5 flex items-center justify-between rounded-xl border p-3 text-xs font-semibold shadow-soft ${
            feedback.isError
              ? "border-[#9B2C2C]/30 bg-[#9B2C2C]/10 text-[#9B2C2C]"
              : "border-[#3E6B48]/30 bg-[#3E6B48]/10 text-[#3E6B48]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 p-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tarjeta resumen del atleta */}
      <section className="mt-4 sm:mt-8 card-editorial rounded-2xl sm:rounded-[28px] border border-border bg-card p-3.5 sm:p-8 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="grid h-11 w-11 sm:h-16 sm:w-16 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-primary text-lg sm:text-2xl font-serif font-bold text-primary-foreground shadow-soft">
              {profile.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-foreground truncate">{profile.fullName}</h2>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(!editing);
              if (!editing) initForm(profile);
            }}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-mono font-bold text-foreground hover:bg-muted/40 hover:border-primary/40 active:scale-[0.98] transition shadow-soft"
          >
            {editing ? (
              <>
                <X className="h-3.5 w-3.5" /> Cancelar
              </>
            ) : (
              <>
                <Edit2 className="h-3 w-3" /> Editar
              </>
            )}
          </button>
        </div>

        {/* Franja de 3 parámetros en fila compacta */}
        {!editing && (
          <div className="mt-3.5 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-2 sm:p-4 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Objetivo</p>
              <p className="mt-0.5 sm:mt-1.5 text-xs sm:text-sm font-bold text-foreground truncate">
                {profile.goal ? goalShortLabels[profile.goal] : "Sin definir"}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-2 sm:p-4 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Nivel</p>
              <p className="mt-0.5 sm:mt-1.5 text-xs sm:text-sm font-bold text-foreground truncate">
                {profile.level ? levelLabels[profile.level]?.split(" ")[0] : "Sin definir"}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-2 sm:p-4 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Frecuencia</p>
              <p className="mt-0.5 sm:mt-1.5 text-xs sm:text-sm font-mono font-bold text-foreground truncate">
                {profile.daysPerWeek ?? "-"} d/sem
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Formulario de Edición */}
      {editing ? (
        <form onSubmit={handleSave} className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Datos Personales */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
              <UserRound className="h-4 w-4 text-primary" /> Datos personales
            </div>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground sm:col-span-3">
                Nombre Completo
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 h-9 sm:h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-xs sm:text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                  required
                />
              </label>

              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Edad
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  placeholder="ej. 28"
                  className="mt-1 h-9 sm:h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-xs sm:text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                />
              </label>

              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Sexo
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as SexType)}
                  className="mt-1 h-9 sm:h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-xs sm:text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                >
                  <option value="">Prefiero no decir</option>
                  <option value="Male">Masculino</option>
                  <option value="Female">Femenino</option>
                </select>
              </label>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Minutos por sesión
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[30, 45, 60].map((min) => (
                    <button
                      type="button"
                      key={min}
                      onClick={() => setSessionMin(min)}
                      className={`h-9 sm:h-11 rounded-xl border text-center text-xs font-mono font-bold transition active:scale-[0.98] ${
                        sessionMin === min
                          ? "border-primary bg-primary text-primary-foreground shadow-soft"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Objetivo y Planificación */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
              <Dumbbell className="h-4 w-4 text-primary" /> Objetivo y Planificación
            </div>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Meta Principal</label>
                <div className="space-y-1.5">
                  {(["GainMuscle", "LoseWeight", "Endurance", "Maintain"] as GoalType[]).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`w-full rounded-xl border p-2.5 text-left text-xs font-bold transition active:scale-[0.98] ${
                        goal === g
                          ? "border-primary bg-primary/10 text-primary shadow-soft"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      {goalLabels[g]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Nivel de experiencia</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["Beginner", "Intermediate", "Advanced"] as LevelType[]).map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`rounded-xl border py-2 text-center text-xs font-mono font-bold transition active:scale-[0.98] ${
                          level === l
                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                            : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {levelLabels[l].split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Frecuencia semanal ({daysPerWeek} días)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[2, 3, 4, 5, 6].map((days) => (
                      <button
                        type="button"
                        key={days}
                        onClick={() => setDaysPerWeek(days)}
                        className={`rounded-xl border py-2 text-center text-xs font-mono font-bold transition active:scale-[0.98] ${
                          daysPerWeek === days
                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                            : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {days} d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Adaptaciones Articulares */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-soft">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
              <ShieldAlert className="h-4 w-4 text-primary" /> Limitaciones articulares o lesiones
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Seleccioná las áreas sensibles para excluir automáticamente movimientos contraindicados.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ALL_LIMITATIONS.map((limType) => {
                const item = limitations.find((l) => l.type === limType);
                const isSelected = Boolean(item);

                return (
                  <div
                    key={limType}
                    className={`rounded-xl border p-2.5 sm:p-3 transition ${
                      isSelected ? "border-primary/40 bg-primary/5 shadow-soft" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLimitation(limType)}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-bold text-foreground">{limitationLabels[limType]}</span>
                      </label>

                      {isSelected && (
                        <select
                          value={item?.severity ?? "Moderate"}
                          onChange={(e) => setLimitationSeverity(limType, e.target.value as SeverityType)}
                          className="rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-foreground outline-none focus:border-primary"
                        >
                          <option value="Mild">{severityLabels.Mild}</option>
                          <option value="Moderate">{severityLabels.Moderate}</option>
                          <option value="Severe">{severityLabels.Severe}</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra fija sticky para guardar en mobile sin tener que scrollear */}
          <div className="sticky bottom-3 z-30 flex gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-soft-lg backdrop-blur-md">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-xs sm:text-sm font-bold text-primary-foreground shadow-soft transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Guardar cambios</>}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-border bg-card px-4 text-xs sm:text-sm font-bold text-muted-foreground hover:bg-muted/40 active:scale-[0.98] transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        /* Vista Solo Lectura Compacta */
        <div className="mt-3.5 sm:mt-6 space-y-2.5 sm:space-y-3">
          {/* Tarjeta de limitaciones activas */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-foreground">Perfil Biomecánico Adaptado</p>
                  {profile.limitations.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {profile.limitations.map((l) => (
                        <span
                          key={l.type}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono font-semibold text-foreground"
                        >
                          {limitationLabels[l.type]} ({severityLabels[l.severity]})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sin limitaciones físicas declaradas (rutina completa sin restricciones).
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] font-mono font-bold text-primary hover:underline shrink-0"
              >
                Modificar
              </button>
            </div>
          </div>

          {/* Tarjeta de datos del atleta */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <UserRound className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-foreground">Datos del Atleta</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {profile.age ? `${profile.age} años` : "Edad s/d"} ·{" "}
                    {profile.sessionMin ? `${profile.sessionMin} min/sesión` : "60 min"} ·{" "}
                    {profile.sex === "Male" ? "Hombre" : profile.sex === "Female" ? "Mujer" : "No especificado"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] font-mono font-bold text-primary hover:underline shrink-0"
              >
                Modificar
              </button>
            </div>
          </div>

          {/* Tarjeta de acceso en pantalla de inicio (PWA) */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-bold text-foreground truncate">Pantalla de Inicio</p>
                    {isStandalone ? (
                      <span className="rounded-full bg-success/15 px-1.5 py-0.2 text-[9px] font-mono font-bold text-success border border-success/30">
                        ✓ Instalada
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-primary border border-primary/25">
                        PWA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {isStandalone
                      ? "Bleid funciona como app instalada a pantalla completa."
                      : "Instalá Bleid para abrirla sin barra de navegación."}
                  </p>
                </div>
              </div>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(true)}
                  className="shrink-0 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-2.5 py-1 text-[11px] font-bold transition tactile-press"
                >
                  Instalar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de instrucciones PWA */}
      {showInstallGuide && (
        <IOSInstallModal onClose={() => setShowInstallGuide(false)} />
      )}

      {/* Botón de cierre de sesión */}
      <div className="mt-8 pt-4 border-t border-border/60">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#9B2C2C] transition hover:text-[#9B2C2C]/80 active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión en este dispositivo
        </button>
      </div>
    </div>
  );
}
