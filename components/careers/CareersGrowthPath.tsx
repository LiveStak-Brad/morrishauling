import { ArrowRight } from "lucide-react";

const PRIMARY_PATH = [
  {
    title: "Helper",
    description: "Learn the job, safety basics, loading, and customer service.",
  },
  {
    title: "Driver",
    description: "Run pickups, handle equipment, and represent Morris on the road.",
  },
  {
    title: "Crew Leader",
    description: "Lead a crew, manage jobs, train helpers, and protect profitability.",
  },
  {
    title: "Operations Manager",
    description: "Oversee scheduling, dispatch, crews, equipment, and growth.",
  },
];

const ALTERNATE_PATHS = [
  {
    label: "Office & dispatch track",
    steps: ["Dispatcher", "Estimator", "Operations Manager"],
    note: "Grow from routing jobs to quoting work and running daily operations.",
  },
  {
    label: "Equipment & hauling track",
    steps: ["Field Helper", "Equipment Operator", "Hauling Driver"],
    note: "Build specialized skills operating equipment and moving larger loads.",
  },
];

export function CareersGrowthPath() {
  return (
    <section className="py-16 sm:py-20 bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Room to Grow</h2>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Start in the field or office — Morris Hauling rewards people who show up, learn fast, and lead.
          </p>
        </div>

        <div className="hidden lg:flex items-stretch gap-0">
          {PRIMARY_PATH.map((step, i) => (
            <div key={step.title} className="flex items-stretch flex-1 min-w-0">
              <div className="flex-1 rounded-xl border border-white/15 bg-white/5 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-300 mb-2">
                  Step {i + 1}
                </p>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-white/75 leading-relaxed">{step.description}</p>
              </div>
              {i < PRIMARY_PATH.length - 1 && (
                <div className="flex items-center px-2 shrink-0">
                  <ArrowRight className="h-8 w-8 text-brand-primary" aria-hidden />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
          {PRIMARY_PATH.map((step, i) => (
            <div key={step.title} className="rounded-xl border border-white/15 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-300 mb-1">
                Step {i + 1}
              </p>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-white/75 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {ALTERNATE_PATHS.map((path) => (
            <div
              key={path.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-red-300/90 mb-3">
                {path.label}
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {path.steps.map((step, i) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="text-base font-semibold">{step}</span>
                    {i < path.steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-brand-primary shrink-0" />
                    )}
                  </span>
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{path.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
