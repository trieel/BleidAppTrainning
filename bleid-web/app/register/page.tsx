"use client";

import Link from "next/link";
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await register(form);
      setToken(result.token);
      router.replace("/onboarding");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos crear tu cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Arrancá hoy</p>
        <h1 className="display-face mt-4 text-4xl font-black tracking-tight sm:text-5xl">Tu próximo nivel empieza acá.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Te hacemos unas preguntas y armamos una base que tenga sentido para vos.</p>
        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <label className="block text-sm font-medium">Nombre completo<span className="relative mt-2 block"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Tu nombre" /></span></label>
          <label className="block text-sm font-medium">Email<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="vos@ejemplo.com" /></span></label>
          <label className="block text-sm font-medium">Contraseña<span className="relative mt-2 block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" type="password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8 caracteres y un número" /></span></label>
          {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Personalizar mi entrenamiento <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-muted-foreground">¿Ya tenés cuenta? <Link href="/login" className="font-semibold text-primary hover:underline">Iniciar sesión</Link></p>
      </div>
    </AuthLayout>
  );
}
