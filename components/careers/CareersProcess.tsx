import { PremiumCard } from "@/components/morris/PremiumCard";
import { APPLY_PROCESS_STEPS } from "@/lib/careers/constants";

export function CareersProcess() {
  return (
    <section className="py-14 sm:py-16 bg-[#F8F9FB]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">What Happens After You Apply</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Whether you apply for an active role or a future opening, here&apos;s what to expect.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLY_PROCESS_STEPS.map((item) => (
            <PremiumCard key={item.step} className="p-5 h-full">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white text-sm font-bold mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CareersLegalNote() {
  return (
    <section className="py-10 bg-white border-t">
      <div className="mx-auto max-w-3xl px-4 text-center text-sm text-muted-foreground space-y-3">
        <p>
          Morris Junk Removal is an equal opportunity employer. We consider all
          qualified applicants without regard to race, color, religion, sex, national origin,
          age, disability, or veteran status.
        </p>
        <p>
          Field roles involve physical labor, lifting, and working outdoors. Safety training and
          proper equipment will be provided for applicable positions. Drug screening and background
          checks may be required for certain positions.
        </p>
      </div>
    </section>
  );
}
