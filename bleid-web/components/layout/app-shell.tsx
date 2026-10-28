"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Dumbbell, History, House, UserRound } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BrandMark } from "@/components/ui/brand-mark";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getActiveSession } from "@/lib/api/workout";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/workout", label: "Entrenar", icon: Dumbbell },
  { href: "/exercises", label: "Ejercicios", icon: BookOpen },
  { href: "/progress", label: "Progreso", icon: BarChart3 },
  { href: "/history", label: "Historial", icon: History },
  { href: "/profile", label: "Perfil", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getActiveSession()
      .then((session) => {
        if (isMounted) {
          setHasActiveWorkout(Boolean(session?.id && !session.finishedAt));
        }
      })
      .catch(() => {
        if (isMounted) setHasActiveWorkout(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background grain text-foreground selection:bg-primary selection:text-primary-foreground">
        <div className="mx-auto min-h-screen max-w-[1440px] lg:grid lg:grid-cols-[240px_1fr]">
          {/* Desktop Warm Editorial Sidebar */}
          <aside className="hidden border-r border-border bg-card/60 px-5 py-7 backdrop-blur-xl lg:flex lg:flex-col lg:min-h-screen">
            <BrandMark />
            
            <div className="mt-10 flex items-center justify-between px-1">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Navegación
              </p>
              <span className="flex h-2 w-2 rounded-full bg-primary/80 animate-pulse" />
            </div>

            <nav className="mt-3 space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const isWorkoutWithSession = item.href === "/workout" && hasActiveWorkout;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-150 tactile-press",
                      active
                        ? "bg-secondary text-foreground font-semibold border-l-2 border-primary shadow-xs"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4 transition-colors", active ? "text-primary stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground")} />
                      <span>{item.label}</span>
                    </div>

                    {isWorkoutWithSession && (
                      <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-primary border border-primary/25">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                        En vivo
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Athlete Mode Status Card */}
            <div className="mt-auto rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">SISTEMA BLEID</span>
                <span className="flex h-2 w-2 rounded-full bg-success" />
              </div>
              <p className="mt-2 text-xs font-bold text-foreground">Alto Rendimiento</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Entrená con intención biomecánica. Cada serie cuenta para la sobrecarga progresiva.
              </p>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="min-h-screen pb-32 lg:pb-10">{children}</main>

          {/* Mobile Monolithic Inverted Navigation Dock (Option 1) */}
          <nav className="fixed bottom-4 inset-x-3 z-50 lg:hidden pointer-events-none">
            <div className="mx-auto flex max-w-md items-center justify-around rounded-2xl border border-stone-800/80 bg-[#16120E] px-2 py-2 shadow-dock backdrop-blur-2xl pointer-events-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const isWorkoutWithSession = item.href === "/workout" && hasActiveWorkout;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex min-w-[54px] flex-col items-center justify-center rounded-xl py-1.5 px-2 transition-all duration-150 tactile-press",
                      active
                        ? "bg-stone-800/90 text-[#FAF7F2] border border-stone-700/60 shadow-xs"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn("h-5 w-5 transition-transform duration-150", active ? "scale-105 stroke-[2.2] text-[#FAF7F2]" : "text-stone-400")} />
                      {isWorkoutWithSession && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#BB6C32] opacity-80" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#BB6C32]" />
                        </span>
                      )}
                    </div>
                    <span className={cn("mt-1 text-[9px] tracking-tight transition-colors", active ? "text-[#FAF7F2] font-bold" : "text-stone-400")}>
                      {item.label}
                    </span>
                    {active && (
                      <span className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-[#BB6C32]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* PWA Mobile Installation Prompt */}
          <InstallPrompt />
        </div>
      </div>
    </AuthGuard>
  );
}
