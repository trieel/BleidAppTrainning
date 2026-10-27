"use client";

import Link from "next/link";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { setToken } from "@/lib/auth";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await login({ email, password });
      setToken(result.token);
      router.replace(result.user.goal ? "/dashboard" : "/onboarding");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "No pudimos iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        <p className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-primary">Acceso de Atleta</p>
        <h1 className="display-face mt-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl">Volvé a tu ritmo.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Entrá para revisar tu split de hoy y continuar tu sobrecarga progresiva.</p>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-foreground">
            Email
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-xl border border-border bg-muted/40 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="atleta@ejemplo.com"
              />
            </span>
          </label>
          
          <label className="block text-sm font-semibold text-foreground">
            Contraseña
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-xl border border-border bg-muted/40 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </span>
          </label>
          
          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all duration-150 tactile-press disabled:cursor-not-allowed disabled:opacity-60 border border-primary/25"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar a mi espacio <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Todavía no entrenás con Bleid?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
