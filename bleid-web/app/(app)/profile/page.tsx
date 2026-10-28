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

  // Form states
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

    getMe().then((data) => {
      setProfile(data);
      initForm(data);
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
    } catch {
      setFeedback({ message: "No pudimos guardar los cambios. Intentá de nuevo.", isError: true });
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (!profile) return <LoadingScreen />;

  return (
    <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10 max-w-7xl mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-bold text-primary">
            <UserRound className="h-3.5 w-3.5" /> Cuenta y Preferencias
          </div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl text-foreground tracking-tight mt-2">
            Perfil del Atleta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Configuración personal, objetivos biomecánicos y adaptaciones articulares.</p>
        </div>
        <Link
          href="/dashboard"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mt-6 flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-soft ${
            feedback.isError
              ? "border-[#9B2C2C]/30 bg-[#9B2C2C]/10 text-[#9B2C2C]"
              : "border-[#3E6B48]/30 bg-[#3E6B48]/10 text-[#3E6B48]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Profile summary card */}
      <section className="mt-8 card-editorial rounded-[28px] border border-border bg-card p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl font-serif font-bold text-primary-foreground shadow-soft">
              {profile.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{profile.fullName}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(!editing);
              if (!editing) initForm(profile);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-mono font-bold text-foreground hover:bg-muted/40 hover:border-primary/40 active:scale-[0.98] transition shadow-soft"
          >
            {editing ? (
              <>
                <X className="h-4 w-4" /> Cancelar edición
              </>
            ) : (
              <>
                <Edit2 className="h-3.5 w-3.5" /> Editar perfil y metas
              </>
            )}
          </button>
        </div>

        {/* Quick parameters readout */}
        {!editing && (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Objetivo</p>
              <p className="mt-2 text-sm font-bold text-foreground">{profile.goal ? goalShortLabels[profile.goal] : "Sin definir"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Nivel</p>
              <p className="mt-2 text-sm font-bold text-foreground">{profile.level ? levelLabels[profile.level] : "Sin definir"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Frecuencia</p>
              <p className="mt-2 text-sm font-mono font-bold text-foreground">{profile.daysPerWeek ?? "-"} días / semana</p>
            </div>
          </div>
        )}
      </section>

      {/* Editing Form */}
      {editing ? (
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Personal Data Section */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <UserRound className="h-4 w-4 text-primary" /> Datos personales
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground sm:col-span-3">
                Nombre Completo
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                  required
                />
              </label>

              <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Edad
                <input
                  type="number"
                  min="14"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  placeholder="ej. 28"
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                />
              </label>

              <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Sexo
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as SexType)}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                >
                  <option value="">Prefiero no decir</option>
                  <option value="Male">Masculino</option>
                  <option value="Female">Femenino</option>
                </select>
              </label>

              <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Minutos por sesión
                <input
                  type="number"
                  min="20"
                  max="180"
                  step="5"
                  value={sessionMin}
                  onChange={(e) => setSessionMin(Number(e.target.value))}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground outline-none focus:bg-background focus:border-primary/60 shadow-soft"
                />
              </label>
            </div>
          </div>

          {/* Goal & Training Split Section */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Dumbbell className="h-4 w-4 text-primary" /> Objetivo y Planificación
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Meta Principal</label>
                <div className="space-y-2">
                  {(["GainMuscle", "LoseWeight", "Endurance", "Maintain"] as GoalType[]).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`w-full rounded-xl border p-3 text-left text-xs font-bold transition active:scale-[0.98] ${
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

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Nivel de experiencia</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Beginner", "Intermediate", "Advanced"] as LevelType[]).map((l) => (
                      <button
                        type="button"
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`rounded-xl border py-2.5 text-center text-xs font-mono font-bold transition active:scale-[0.98] ${
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
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Frecuencia semanal ({daysPerWeek} días)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[2, 3, 4, 5, 6].map((days) => (
                      <button
                        type="button"
                        key={days}
                        onClick={() => setDaysPerWeek(days)}
                        className={`rounded-xl border py-2.5 text-center text-xs font-mono font-bold transition active:scale-[0.98] ${
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

          {/* Physical Limitations Section */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldAlert className="h-4 w-4 text-primary" /> Limitaciones articulares o lesiones
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Seleccioná las áreas sensibles para que el sistema excluya automáticamente ejercicios contraindicados.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ALL_LIMITATIONS.map((limType) => {
                const item = limitations.find((l) => l.type === limType);
                const isSelected = Boolean(item);

                return (
                  <div
                    key={limType}
                    className={`rounded-xl border p-4 transition ${
                      isSelected ? "border-primary/40 bg-primary/5 shadow-soft" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLimitation(limType)}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                        <span className="text-sm font-bold text-foreground">{limitationLabels[limType]}</span>
                      </label>

                      {isSelected && (
                        <select
                          value={item?.severity ?? "Moderate"}
                          onChange={(e) => setLimitationSeverity(limType, e.target.value as SeverityType)}
                          className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
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

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Guardar cambios</>}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-border bg-card px-5 text-sm font-bold text-muted-foreground hover:bg-muted/40 active:scale-[0.98] transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        /* Read-only sections */
        <div className="mt-6 space-y-3">
          {/* Limitations view */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Perfil adaptado y seguro</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.limitations.length
                      ? `${profile.limitations.length} limitación(es) consideradas: ${profile.limitations
                          .map((l) => `${limitationLabels[l.type]} (${severityLabels[l.severity]})`)
                          .join(", ")}`
                      : "Sin limitaciones físicas declaradas (rutina completa sin restricciones)"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-mono font-bold text-primary hover:underline"
              >
                Modificar
              </button>
            </div>
          </div>

          {/* Personal data view */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Datos del atleta</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.age ? `${profile.age} años` : "Edad sin especificar"} ·{" "}
                    {profile.sessionMin ? `${profile.sessionMin} min por sesión` : "Duración no definida"} ·{" "}
                    {profile.sex === "Male" ? "Hombre" : profile.sex === "Female" ? "Mujer" : "No especificado"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-mono font-bold text-primary hover:underline"
              >
                Modificar
              </button>
            </div>
          </div>

          {/* Mobile App & Shortcut view */}
          <div className="card-editorial rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">Acceso en Pantalla de Inicio</p>
                    {isStandalone ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-mono font-bold text-success border border-success/30">
                        ✓ Instalada
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary border border-primary/25">
                        PWA Móvil
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isStandalone
                      ? "Estás usando Bleid como aplicación instalada en este dispositivo."
                      : "Instalá Bleid en tu teléfono para abrirla a pantalla completa sin barra del navegador."}
                  </p>
                </div>
              </div>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(true)}
                  className="shrink-0 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-3 py-1.5 text-xs font-bold transition tactile-press"
                >
                  Cómo instalar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* iOS & Mobile Install Guide Modal */}
      {showInstallGuide && (
        <IOSInstallModal onClose={() => setShowInstallGuide(false)} />
      )}

      {/* Logout button */}
      <div className="mt-10 pt-6 border-t border-border/60">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-bold text-[#9B2C2C] transition hover:text-[#9B2C2C]/80 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión en este dispositivo
        </button>
      </div>
    </div>
  );
}
