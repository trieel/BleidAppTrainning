"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api/auth";
import { clearToken } from "@/lib/auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { UserProfile } from "@/types";

const goalLabels = { GainMuscle: "Ganar músculo", LoseWeight: "Bajar de peso", Endurance: "Resistencia", Maintain: "Mantenerme" };
const levelLabels = { Beginner: "Inicial", Intermediate: "Intermedio", Advanced: "Avanzado" };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => { getMe().then(setProfile); }, []);
  if (!profile) return <LoadingScreen />;
  function logout() { clearToken(); router.replace("/login"); }
  return <div className="px-5 py-6 sm:px-8 lg:px-12 lg:py-10"><header className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Tu configuración</p><h1 className="display-face mt-3 text-4xl font-black">Perfil.</h1></div><Link href="/dashboard" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link></header><section className="mt-8 rounded-[26px] border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">{profile.fullName.slice(0, 1).toUpperCase()}</div><div><h2 className="text-xl font-bold">{profile.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">{profile.email}</p></div></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-secondary p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Objetivo</p><p className="mt-2 text-sm font-bold">{profile.goal ? goalLabels[profile.goal] : "Sin definir"}</p></div><div className="rounded-xl bg-secondary p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nivel</p><p className="mt-2 text-sm font-bold">{profile.level ? levelLabels[profile.level] : "Sin definir"}</p></div><div className="rounded-xl bg-secondary p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Frecuencia</p><p className="mt-2 text-sm font-bold">{profile.daysPerWeek ?? "-"} días / semana</p></div></div></section><div className="mt-4 space-y-2"><div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><ShieldCheck className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-bold">Perfil adaptado</p><p className="mt-1 text-xs text-muted-foreground">{profile.limitations.length ? `${profile.limitations.length} limitación(es) consideradas` : "Sin limitaciones declaradas"}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div><div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><UserRound className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-bold">Datos personales</p><p className="mt-1 text-xs text-muted-foreground">{profile.age ? `${profile.age} años` : "Completá tu información"}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></div><button onClick={logout} className="mt-8 flex items-center gap-2 text-sm font-bold text-destructive transition hover:text-red-300"><LogOut className="h-4 w-4" /> Cerrar sesión</button></div>;
}
