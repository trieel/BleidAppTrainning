import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-[0_0_24px_rgba(200,255,50,0.22)]">
        <span className="text-lg font-black leading-none">B</span>
      </span>
      <span className="text-sm font-bold uppercase tracking-[0.18em]">Bleid</span>
    </div>
  );
}
