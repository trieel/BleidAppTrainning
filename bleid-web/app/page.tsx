import Link from "next/link";
import { ArrowRight, Check, Flame } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground grain selection:bg-primary selection:text-primary-foreground">
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute -right-40 top-12 h-[34rem] w-[34rem] rounded-full bg-primary/5 blur-3xl" />
        
        <header className="relative flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all duration-150 tactile-press border border-primary/25">
              Comenzar
            </Link>
          </div>
        </header>

        <section className="relative grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Entrenamiento con dirección
            </div>
            
            <h1 className="display-face max-w-3xl text-6xl font-black leading-[0.92] tracking-tight sm:text-8xl text-foreground">
              No entrenes<br />
              <span className="text-primary">a ciegas.</span>
            </h1>
            
            <p className="mt-8 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Bleid convierte tus objetivos en una rutina que podés sostener, medir y hacer tuya. Cada repetición queda registrada con sobrecarga progresiva en vivo.
            </p>
            
            <div className="mt-10 flex flex-col gap-3.5 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-13 items-center justify-center rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-soft-hover transition-all duration-150 tactile-press border border-primary/25"
              >
                Armar mi plan <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-13 items-center justify-center rounded-xl border border-border bg-card px-7 text-sm font-semibold text-foreground shadow-soft hover:bg-secondary/50 transition-all duration-150 tactile-press"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>Sobrecarga en vivo</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>Calculadora olímpica</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>+60 ejercicios biomecánicos</span>
              </div>
            </div>
          </div>

          {/* Editorial Visual Preview Card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-soft-hover">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Sesión activa de hoy
                </span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-foreground font-semibold">Día 01 / 04</span>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground uppercase">TREN SUPERIOR · HIPERTROFIA</p>
                <h2 className="display-face mt-1.5 text-3xl font-black text-foreground">Fuerza Base & Torso</h2>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-primary p-4 text-primary-foreground shadow-soft">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary-foreground/75">EJERCICIO 01</p>
                    <p className="mt-0.5 font-bold text-base">Press de banca plano con barra</p>
                    <p className="mt-0.5 text-xs text-primary-foreground/80">4 series · 8-10 reps objetivo</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black">80<span className="text-sm font-sans font-bold">kg</span></span>
                    <p className="text-[10px] font-mono text-primary-foreground/70 uppercase">Última: 77.5kg</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">EJERCICIO 02</p>
                    <p className="mt-0.5 font-bold text-foreground">Remo con barra pecho apoyado</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">3 series · 10-12 reps</p>
                  </div>
                  <span className="rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">En cola</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">EJERCICIO 03</p>
                    <p className="mt-0.5 font-bold text-foreground">Press militar con mancuernas</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">3 series · 10-12 reps</p>
                  </div>
                  <span className="rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">En cola</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold text-foreground">Racha semanal</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 1, 1, 1, 0, 0, 0].map((done, index) => (
                    <span
                      key={index}
                      className={`h-2.5 w-6 rounded-full transition-colors ${done ? "bg-primary" : "bg-secondary border border-border"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative flex flex-col justify-between gap-3 border-t border-border pt-6 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:flex-row">
          <span>Bleid Athletics · Alto rendimiento biomecánico</span>
          <span>Buenos Aires · Argentina</span>
        </footer>
      </div>
    </main>
  );
}
