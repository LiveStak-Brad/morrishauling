import { HAULING_PROTOCOL } from "@/lib/public-copy";
import { cn } from "@/lib/utils";

type ProtocolStep = {
  step: string;
  title: string;
  description: string;
};

/** Compact process steps — one semantic list, responsive layout. */
export function MorrisProtocolSteps({
  className,
  id,
  eyebrow = "How Morris works",
  heading = "A calm protocol for every craft we add.",
  steps = HAULING_PROTOCOL,
}: {
  className?: string;
  id?: string;
  eyebrow?: string;
  heading?: string;
  steps?: readonly ProtocolStep[];
}) {
  return (
    <section id={id} className={cn(className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 max-w-2xl font-heading text-2xl font-medium tracking-tight sm:mt-3 sm:text-3xl md:text-4xl">
        {heading}
      </h2>

      <ol className="mt-5 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:border-0 sm:bg-transparent lg:grid-cols-5">
        {steps.map((item) => (
          <li
            key={item.step}
            className="flex gap-3 px-3.5 py-2.5 sm:block sm:rounded-2xl sm:border sm:border-black/5 sm:bg-white sm:p-4 sm:shadow-sm"
          >
            <span className="w-6 shrink-0 font-mono text-[11px] font-semibold leading-5 text-brand-primary sm:w-auto">
              {item.step}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-5 tracking-tight sm:mt-2">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:mt-1.5 sm:leading-relaxed">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
