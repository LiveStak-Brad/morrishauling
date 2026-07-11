import { HAULING_PROTOCOL } from "@/lib/public-copy";
import { cn } from "@/lib/utils";

/** Compact process steps — dense on mobile, light grid on desktop. */
export function MorrisProtocolSteps({
  className,
  id,
  eyebrow = "How Morris works",
  heading = "A calm protocol for every craft we add.",
}: {
  className?: string;
  id?: string;
  eyebrow?: string;
  heading?: string;
}) {
  return (
    <section id={id} className={cn(className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 max-w-2xl font-heading text-2xl font-medium tracking-tight sm:mt-3 sm:text-3xl md:text-4xl">
        {heading}
      </h2>

      {/* Mobile: compact list — no tall cards */}
      <ol className="mt-5 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white sm:hidden">
        {HAULING_PROTOCOL.map((item) => (
          <li key={item.step} className="flex gap-3 px-3.5 py-2.5">
            <span className="w-6 shrink-0 font-mono text-[11px] font-semibold leading-5 text-brand-primary">
              {item.step}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 tracking-tight">{item.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Tablet/desktop: tighter cards */}
      <ol className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5">
        {HAULING_PROTOCOL.map((item) => (
          <li
            key={item.step}
            className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <span className="font-mono text-[11px] font-semibold text-brand-primary">
              {item.step}
            </span>
            <h3 className="mt-2 text-sm font-semibold tracking-tight">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
