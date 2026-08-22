import { cn } from "@/lib/utils";

/** Honest placeholder — not a stock project photo and not a claim that work is complete. */
export function PlaceholderMedia({
  label = "Project photography will be added from completed jobs.",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-[#2a211c] via-[#3d2a24] to-[#1a1412]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 20%, rgba(155,27,48,0.35), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative flex min-h-[12rem] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[16rem]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Media placeholder
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">{label}</p>
      </div>
    </div>
  );
}
