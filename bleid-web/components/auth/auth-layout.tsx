import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-5 py-5 grain sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-border bg-card shadow-soft-hover lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground shadow-[inset_-1px_0_0_rgba(255,255,255,0.1)] lg:flex lg:flex-col">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[42px] border-primary-foreground/10" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full border-[42px] border-primary-foreground/10" />
          <BrandMark />
          <div className="relative mt-auto">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-[#D4A359]">Entrenamiento de Precisión</p>
            <h1 className="display-face max-w-md text-6xl font-black leading-[0.92] text-primary-foreground">Entrená con una dirección.</h1>
            <p className="mt-7 max-w-sm text-sm leading-6 opacity-85">Tu objetivo, tus límites y tu progreso en un solo lugar. Menos ruido. Más consistencia real.</p>
            <div className="mt-10 space-y-3 text-sm font-medium">
              {["Rutinas adaptadas a tu nivel", "Sobrecarga progresiva en vivo", "Historial y analíticas táctiles"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-foreground/15"><Check className="h-3 w-3" /></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-10 flex items-center justify-between text-xs opacity-75 font-mono">
            <span>BLEID ATHLETICS / 2026</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </section>
        <section className="flex flex-col bg-card px-6 py-7 sm:px-12 sm:py-10">
          <div className="flex items-center justify-between lg:justify-end">
            <div className="lg:hidden"><BrandMark /></div>
            <Link href="/" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">Volver al inicio</Link>
          </div>
          <div className="my-auto py-12">{children}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Diseñado para atletas que buscan progreso medible.</div>
        </section>
      </div>
    </main>
  );
}
