"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, History, House, UserRound } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/workout", label: "Entrenar", icon: Dumbbell },
  { href: "/history", label: "Historial", icon: History },
  { href: "/progress", label: "Progreso", icon: BarChart3 },
  { href: "/profile", label: "Perfil", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background grain">
        <div className="mx-auto min-h-screen max-w-[1440px] lg:grid lg:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-border/70 px-5 py-7 lg:flex lg:flex-col">
            <BrandMark />
            <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Tu zona</p>
            <nav className="mt-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary">MODO BLEID</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Entrená con intención. El progreso se construye serie a serie.</p>
            </div>
          </aside>

          <main className="min-h-screen pb-24 lg:pb-8">{children}</main>

          <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 px-3 pt-2 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-lg items-center justify-around">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}
                  >
                    <Icon className={cn("h-5 w-5", active && "fill-primary/15")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </AuthGuard>
  );
}
