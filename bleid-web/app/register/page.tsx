"use client";

import Link from "next/link";
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { BrandMark } from "@/components/ui/brand-mark";
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
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        {/* Brand Logo */}
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="display-face text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Registrate para personalizar tu plan y medir tu sobrecarga
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold text-foreground">
            Nombre completo
            <span className="relative mt-2 block">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-base sm:text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 shadow-soft"
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                placeholder="Tu nombre y apellido"
                autoComplete="name"
              />
            </span>
          </label>

          <label className="block text-sm font-semibold text-foreground">
            Email
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-base sm:text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 shadow-soft"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="atleta@ejemplo.com"
                autoComplete="email"
                inputMode="email"
              />
            </span>
          </label>

          <label className="block text-sm font-semibold text-foreground">
            Contraseña
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-base sm:text-sm text-foreground outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 shadow-soft"
                type="password"
                minLength={8}
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </span>
          </label>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium animate-in fade-in duration-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all duration-150 tactile-press disabled:cursor-not-allowed disabled:opacity-60 border border-primary/25"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Personalizar mi entrenamiento <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
