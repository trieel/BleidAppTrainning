import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 group select-none", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft border border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-transform duration-200 ease-out group-hover:scale-[1.04]">
        <span className="text-lg font-black leading-none tracking-tight">B</span>
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#D4A359] ring-2 ring-background shadow-xs" />
      </span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black uppercase tracking-[0.22em] text-foreground transition-colors group-hover:text-primary">
            Bleid
          </span>
          <span className="rounded px-1 py-0.2 text-[8px] font-mono font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
            Athletics
          </span>
        </div>
        <span className="text-[9px] font-mono font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Strength & Systems
        </span>
      </div>
    </div>
  );
}
