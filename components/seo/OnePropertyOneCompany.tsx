import Link from "next/link";

const BUNDLES = [
  {
    title: "Overgrown property",
    items: [
      { href: "/land-clearing", label: "Land Clearing" },
      { href: "/junk-removal", label: "Junk Removal" },
      { href: "/hauling", label: "Hauling" },
    ],
  },
  {
    title: "Preparing a property for sale",
    items: [
      { href: "/junk-removal", label: "Junk Removal" },
      { href: "/land-clearing/brush-clearing", label: "Brush clearing" },
      { href: "/hauling", label: "Hauling" },
      { href: "/site-work", label: "Site Work" },
    ],
  },
  {
    title: "Building-site preparation",
    items: [
      { href: "/land-clearing#home-site-vegetation", label: "Vegetation clearing" },
      { href: "/equipment-services/grapple-services", label: "Grapple cleanup" },
      { href: "/hauling", label: "Hauling" },
      { href: "/site-work", label: "Available site work" },
    ],
  },
  {
    title: "Storm cleanup",
    items: [
      { href: "/equipment-services", label: "Equipment Services" },
      { href: "/junk-removal", label: "Junk Removal" },
      { href: "/hauling", label: "Hauling" },
    ],
  },
] as const;

export function OnePropertyOneCompany({ className }: { className?: string }) {
  return (
    <section className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
        Morris Service Group
      </p>
      <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
        One property. One company.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Tell us what you want the property to become. We determine which service — land clearing,
        site work, equipment, hauling, or junk removal — actually fits. Not every job needs every
        division.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {BUNDLES.map((bundle) => (
          <article key={bundle.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold tracking-tight">{bundle.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {bundle.items.map((item, i) => (
                <span key={item.href}>
                  {i > 0 ? " + " : ""}
                  <Link href={item.href} className="font-medium text-brand-primary hover:underline">
                    {item.label}
                  </Link>
                </span>
              ))}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
