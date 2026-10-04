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
  { value: "GainMuscle", label: "Ganar músculo", description: "Más fuerza, volumen y presencia.", icon: Trophy },
  { value: "LoseWeight", label: "Bajar de peso", description: "Moverte mejor y sentirte más liviano.", icon: HeartPulse },
  { value: "Endurance", label: "Resistencia", description: "Aguantar más. Recuperarte mejor.", icon: Timer },
  { value: "Maintain", label: "Mantenerme", description: "Una base sólida para seguir activo.", icon: ShieldCheck },
];

const levels: { value: LevelType; label: string; description: string }[] = [
  { value: "Beginner", label: "Estoy empezando", description: "Quiero aprender bien desde la base." },
  { value: "Intermediate", label: "Ya tengo experiencia", description: "Entreno con cierta regularidad." },
  { value: "Advanced", label: "Voy en serio", description: "Conozco mi cuerpo y busco progresar." },
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
          <header className="flex items-center justify-between"><BrandMark /><span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Perfil / 05</span></header>
          <div className="mt-10 h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / 5) * 100}%` }} /></div>
          <div className="mt-12 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Primero, vos</p><h1 className="display-face mt-4 text-4xl font-black leading-none sm:text-6xl">{step === 0 ? "¿Qué querés construir?" : step === 1 ? "¿Dónde estás hoy?" : step === 2 ? "¿Cuánto espacio tenés?" : step === 3 ? "Entrenar también es cuidarte." : "Un poco más sobre vos."}</h1><p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">{step === 0 ? "Tu objetivo define el tipo de estímulo, el volumen y el ritmo de tu plan." : step === 1 ? "No hay respuestas buenas o malas. Hay una rutina que tiene que encontrarte donde estás." : step === 2 ? "La mejor rutina es la que entra en tu vida real." : step === 3 ? "Marcá cualquier limitación para que podamos filtrar ejercicios contraindicados." : "Estos datos nos ayudan a darte una recomendación más precisa."}</p></div>

          <section className="mt-10">
            {step === 0 && <div className="grid gap-3 sm:grid-cols-2">{goals.map((item) => { const Icon = item.icon; const selected = goal === item.value; return <button key={item.value} onClick={() => setGoal(item.value)} className={`group rounded-2xl border p-5 text-left transition ${selected ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(200,255,50,0.12)]" : "border-border bg-card hover:border-primary/50"}`}><div className={`mb-10 grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-primary-foreground/15" : "bg-secondary text-primary"}`}><Icon className="h-5 w-5" /></div><p className="font-bold">{item.label}</p><p className={`mt-1 text-sm ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{item.description}</p></button>; })}</div>}
            {step === 1 && <div className="space-y-3">{levels.map((item) => { const selected = level === item.value; return <button key={item.value} onClick={() => setLevel(item.value)} className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}><span><span className="block font-bold">{item.label}</span><span className={`mt-1 block text-sm ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{item.description}</span></span><span className={`grid h-7 w-7 place-items-center rounded-full border ${selected ? "border-primary-foreground bg-primary-foreground text-primary" : "border-border"}`}>{selected && <Check className="h-4 w-4" />}</span></button>; })}</div>}
            {step === 2 && <div className="grid gap-8 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Días por semana</p><div className="mt-7 flex items-end gap-3"><span className="display-face text-7xl font-black text-primary">{days}</span><span className="pb-3 text-sm text-muted-foreground">días</span></div><input className="mt-8 w-full accent-[#c8ff32]" type="range" min="2" max="6" value={days} onChange={(event) => setDays(Number(event.target.value))} /><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>2 días</span><span>6 días</span></div></div><div className="rounded-2xl border border-border bg-card p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Duración de sesión</p><div className="mt-7 flex items-end gap-3"><span className="display-face text-7xl font-black text-primary">{sessionMin}</span><span className="pb-3 text-sm text-muted-foreground">minutos</span></div><div className="mt-8 grid grid-cols-3 gap-2">{[30, 45, 60].map((value) => <button key={value} onClick={() => setSessionMin(value)} className={`rounded-xl border py-3 text-sm font-bold ${sessionMin === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{value}</button>)}</div></div></div>}
            {step === 3 && <div className="space-y-3"><div className="mb-5 flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p>Esto no reemplaza una consulta profesional. Nos ayuda a evitar recomendaciones que puedan hacerte mal.</p></div>{limitations.map((item) => { const selected = selectedLimitations.find((limitation) => limitation.type === item.value); return <div key={item.value} className={`rounded-2xl border transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}><button onClick={() => toggleLimitation(item.value)} className="flex w-full items-center justify-between p-4 text-left"><span className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{selected ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}</span><span className="font-semibold">{item.label}</span></span><span className="text-xs text-muted-foreground">{selected ? "Seleccionado" : "Sin limitación"}</span></button>{selected && <div className="border-t border-border/70 px-4 pb-4 pt-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Nivel de cuidado</p><div className="flex gap-2">{(["Mild", "Moderate", "Severe"] as SeverityType[]).map((severity) => <button key={severity} onClick={() => updateSeverity(item.value, severity)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${selected.severity === severity ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{severity === "Mild" ? "Leve" : severity === "Moderate" ? "Moderada" : "Severa"}</button>)}</div></div>}</div>; })}</div>}
            {step === 4 && <div className="grid gap-4 sm:grid-cols-2"><label className="rounded-2xl border border-border bg-card p-5 text-sm font-semibold">Edad<input className="mt-4 h-12 w-full rounded-xl border border-border bg-background px-4 text-lg outline-none focus:border-primary" type="number" min={13} max={100} value={age} onChange={(event) => setAge(Number(event.target.value))} /></label><div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm font-semibold">Sexo</p><div className="mt-4 grid grid-cols-2 gap-2">{(["Male", "Female"] as SexType[]).map((value) => <button key={value} onClick={() => setSex(value)} className={`h-12 rounded-xl text-sm font-bold ${sex === value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{value === "Male" ? "Masculino" : "Femenino"}</button>)}</div></div><div className="sm:col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex gap-3"><Dumbbell className="h-5 w-5 text-primary" /><div><p className="font-bold">Tu punto de partida está listo.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Vamos a cruzar tus respuestas con una rutina segura y diseñada para tu frecuencia.</p></div></div></div></div>}
          </section>

          {error && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <div className="mt-10 flex items-center justify-between"><button disabled={step === 0 || loading} onClick={() => setStep((current) => current - 1)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-30"><ArrowLeft className="h-4 w-4" /> Atrás</button><button disabled={!canContinue || loading} onClick={() => step === 4 ? finish() : setStep((current) => current + 1)} className="flex items-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Guardando..." : step === 4 ? "Crear mi rutina" : "Continuar"}<ArrowRight className="h-4 w-4" /></button></div>
        </div>
      </main>
    </AuthGuard>
  );
}
