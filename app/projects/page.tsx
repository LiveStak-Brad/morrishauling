import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { listPublishedProjects } from "@/lib/db/published-projects";
import { getDivision } from "@/lib/divisions";

export const metadata: Metadata = buildPageMetadata({
  title: "Projects | Morris Service Group",
  description:
    "Published land-clearing, site-work, and equipment projects from Morris Service Group. Pages are added only after real jobs are completed.",
  path: "/projects",
});

export default async function ProjectsIndexPage() {
  const projects = await listPublishedProjects();

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Morris Services", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[{ name: "Morris Services", href: "/" }, { name: "Projects" }]}
        />
        <h1 className="mt-6 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Projects
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          These pages are reserved for completed work with real photos. We do not publish
          placeholder job stories.
        </p>

        {projects.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-black/5 bg-white p-6 text-sm text-muted-foreground">
            No projects have been published yet. After land-clearing and equipment jobs are
            completed, they will appear here with city, service type, and before/after media.
          </p>
        ) : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="block rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:border-brand-primary/25"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    {getDivision(p.divisionId).shortName}
                    {p.city ? ` · ${p.city}` : ""}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">{p.title}</h2>
                  {p.customerGoal && (
                    <p className="mt-2 text-sm text-muted-foreground">{p.customerGoal}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge />
    </div>
  );
}
