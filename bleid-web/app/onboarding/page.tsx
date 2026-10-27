"use client";

import { ArrowLeft, ArrowRight, Check, Dumbbell, HeartPulse, ShieldCheck, Timer, Trophy } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BrandMark } from "@/components/ui/brand-mark";
import type { GoalType, LevelType, LimitationType, SeverityType, SexType } from "@/types";

const goals: { value: GoalType; label: string; description: string; icon: typeof Trophy }[] = [
  { value: "GainMuscle", label: "Ganar músculo", description: "Más fuerza, volumen y densidad muscular.", icon: Trophy },
  { value: "LoseWeight", label: "Definición y peso", description: "Moverte mejor y optimizar composición corporal.", icon: HeartPulse },
  { value: "Endurance", label: "Resistencia atlética", description: "Capacidad cardiovascular y recuperación entre series.", icon: Timer },
  { value: "Maintain", label: "Mantenimiento activo", description: "Una base sólida de salud, movilidad y fuerza.", icon: ShieldCheck },
];

const levels: { value: LevelType; label: string; description: string }[] = [
  { value: "Beginner", label: "Estoy empezando", description: "Quiero aprender patrones correctos desde la base." },
  { value: "Intermediate", label: "Ya tengo experiencia", description: "Entreno con regularidad y conozco los ejercicios básicos." },
  { value: "Advanced", label: "Nivel avanzado", description: "Busco optimizar volumen de series efectivas y sobrecarga." },
];

const limitations: { value: LimitationType; label: string }[] = [
  { value: "Lumbar", label: "Zona lumbar" },
  { value: "Knee", label: "Rodilla" },
  { value: "Shoulder", label: "Hombro" },
  { value: "Wrist", label: "Muñeca" },
  { value: "Neck", label: "Cuello" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<GoalType>("GainMuscle");
  const [level, setLevel] = useState<LevelType>("Beginner");
  const [days, setDays] = useState(3);
  const [sessionMin, setSessionMin] = useState(60);
  const [selectedLimitations, setSelectedLimitations] = useState<{ type: LimitationType; severity: SeverityType }[]>([]);
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<SexType>("Male");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleLimitation(type: LimitationType) {
    setSelectedLimitations((current) => current.some((item) => item.type === type)
      ? current.filter((item) => item.type !== type)
      : [...current, { type, severity: "Mild" }]);
  }

  function updateSeverity(type: LimitationType, severity: SeverityType) {
    setSelectedLimitations((current) => current.map((item) => item.type === type ? { ...item, severity } : item));
  }

  async function finish() {
    setLoading(true);
    setError("");
    try {
      await completeOnboarding({ goal, level, daysPerWeek: days, sessionMin, age, sex, limitations: selectedLimitations });
      router.replace("/dashboard");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos guardar tu perfil.");
    } finally {
      setLoading(false);
    }
  }

  const canContinue = step < 4 || age >= 13;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background px-5 py-6 grain sm:px-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between">
            <BrandMark />
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">Paso {step + 1} / 05</span>
          </header>
          
          <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>

          <div className="mt-10 max-w-2xl">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-primary">Diagnóstico Inicial</p>
            <h1 className="display-face mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              {step === 0 ? "¿Cuál es tu objetivo?" : step === 1 ? "¿Cuál es tu punto de partida?" : step === 2 ? "¿Cuánto tiempo tenés disponible?" : step === 3 ? "Seguridad y adaptación articular." : "Datos para calibrar tu plan."}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              {step === 0 ? "Tu objetivo define la selección de ejercicios, rango de repeticiones y volumen." : step === 1 ? "La rutina se adaptará al nivel de estímulo adecuado para tu capacidad de recuperación." : step === 2 ? "La consistencia supera la intensidad esporádica. Elegí lo que puedas sostener." : step === 3 ? "Filtramos ejercicios que puedan comprometer zonas sensibles y sugerimos variantes." : "Estos parámetros ajustan la estimación de gasto calórico y progresión."}
            </p>
          </div>

          <section className="mt-8">
            {step === 0 && (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {goals.map((item) => {
                  const Icon = item.icon;
                  const selected = goal === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setGoal(item.value)}
                      className={`group rounded-2xl border p-5 text-left transition-all duration-150 tactile-press ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-soft"
                          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/30"
                      }`}
                    >
                      <div className={`mb-6 grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary text-primary"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-bold text-base">{item.label}</p>
                      <p className={`mt-1 text-sm ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{item.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {levels.map((item) => {
                  const selected = level === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setLevel(item.value)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all duration-150 tactile-press ${
                        selected ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card hover:border-primary/40 hover:bg-secondary/30"
                      }`}
                    >
                      <span>
                        <span className="block font-bold text-base">{item.label}</span>
                        <span className={`mt-1 block text-sm ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{item.description}</span>
                      </span>
                      <span className={`grid h-7 w-7 place-items-center rounded-full border ${selected ? "border-primary-foreground bg-primary-foreground text-primary" : "border-border"}`}>
                        {selected && <Check className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Frecuencia semanal</p>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="display-face text-7xl font-mono font-black text-primary">{days}</span>
                    <span className="pb-3 text-sm font-semibold text-muted-foreground">días / semana</span>
                  </div>
                  <input
                    className="mt-6 w-full accent-[#854826]"
                    type="range"
                    min="2"
                    max="6"
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-mono text-muted-foreground">
                    <span>2 días (Mínimo)</span>
                    <span>6 días (Avanzado)</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">Duración de sesión</p>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="display-face text-7xl font-mono font-black text-primary">{sessionMin}</span>
                    <span className="pb-3 text-sm font-semibold text-muted-foreground">minutos</span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {[30, 45, 60].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSessionMin(value)}
                        className={`rounded-xl border py-3 text-sm font-bold transition-all tactile-press ${
                          sessionMin === value
                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                            : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {value}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="mb-5 flex gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p>Adaptamos el split para cuidar tus articulaciones. Podés modificar estas selecciones en cualquier momento desde tu perfil.</p>
                </div>
                {limitations.map((item) => {
                  const selected = selectedLimitations.find((limitation) => limitation.type === item.value);
                  return (
                    <div key={item.value} className={`rounded-2xl border transition-all ${selected ? "border-primary bg-primary/5" : "border-border bg-card shadow-soft"}`}>
                      <button
                        onClick={() => toggleLimitation(item.value)}
                        className="flex w-full items-center justify-between p-4 text-left tactile-press"
                      >
                        <span className="flex items-center gap-3">
                          <span className={`grid h-8 w-8 place-items-center rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                            {selected ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                          </span>
                          <span className="font-semibold text-foreground">{item.label}</span>
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">{selected ? "Activa" : "Sin limitación"}</span>
                      </button>
                      {selected && (
                        <div className="border-t border-border px-4 pb-4 pt-3">
                          <p className="mb-2 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-muted-foreground">Severidad / Cuidado</p>
                          <div className="flex gap-2">
                            {(["Mild", "Moderate", "Severe"] as SeverityType[]).map((severity) => (
                              <button
                                key={severity}
                                onClick={() => updateSeverity(item.value, severity)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                  selected.severity === severity ? "bg-primary text-primary-foreground shadow-xs" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                }`}
                              >
                                {severity === "Mild" ? "Leve" : severity === "Moderate" ? "Moderada" : "Alta"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-2xl border border-border bg-card p-5 text-sm font-semibold text-foreground shadow-soft">
                  Edad
                  <input
                    className="mt-3 h-12 w-full rounded-xl border border-border bg-background px-4 text-lg font-mono outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    type="number"
                    min={13}
                    max={100}
                    value={age}
                    onChange={(event) => setAge(Number(event.target.value))}
                  />
                </label>
                
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <p className="text-sm font-semibold text-foreground">Sexo biológico</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(["Male", "Female"] as SexType[]).map((value) => (
                      <button
                        key={value}
                        onClick={() => setSex(value)}
                        className={`h-12 rounded-xl text-sm font-bold transition-all tactile-press ${
                          sex === value ? "bg-primary text-primary-foreground shadow-xs" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {value === "Male" ? "Masculino" : "Femenino"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex gap-3.5">
                    <Dumbbell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Tu diagnóstico inicial está completo.</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">Cruzaremos tus parámetros con la biblioteca de ejercicios para estructurar tu split semanal con sobrecarga progresiva.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {error && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">{error}</p>}

          <div className="mt-10 flex items-center justify-between">
            <button
              disabled={step === 0 || loading}
              onClick={() => setStep((current) => current - 1)}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-30 tactile-press"
            >
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
            <button
              disabled={!canContinue || loading}
              onClick={() => step === 4 ? finish() : setStep((current) => current + 1)}
              className="flex items-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all tactile-press disabled:cursor-not-allowed disabled:opacity-50 border border-primary/25"
            >
              {loading ? "Creando rutina..." : step === 4 ? "Crear mi rutina" : "Continuar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
