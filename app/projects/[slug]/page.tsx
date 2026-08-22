import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, imageObjectSchema } from "@/lib/seo/schema";
import { getPublishedProjectBySlug, listPublishedProjects } from "@/lib/db/published-projects";
import { DIVISION_SEO } from "@/lib/seo/site";
import { getDivision } from "@/lib/divisions";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await listPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return { robots: { index: false, follow: false } };
  const loc = [project.city, project.county].filter(Boolean).join(", ");
  return buildPageMetadata({
    title: `${project.title}${loc ? ` | ${loc}` : ""}`,
    description: project.workCompleted || project.customerGoal || project.title,
    path: `/projects/${slug}`,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  const division = getDivision(project.divisionId);
  const seo = DIVISION_SEO[project.divisionId];
  const path = `/projects/${project.slug}`;
  const images = [
    ...project.beforeImageUrls,
    ...project.duringImageUrls,
    ...project.afterImageUrls,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Morris Services", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: project.title, path },
          ]),
          ...images.slice(0, 4).map((url) => imageObjectSchema({ url, name: project.title })),
        ]}
      />
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Projects", href: "/projects" },
            { name: project.title },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          {division.name}
          {project.city ? ` · ${project.city}` : ""}
          {project.county ? `, ${project.county}` : ""}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          {project.title}
        </h1>
        {project.customerGoal && (
          <p className="mt-4 text-lg text-muted-foreground">{project.customerGoal}</p>
        )}

        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          {project.serviceSlug && (
            <div>
              <dt className="text-muted-foreground">Service</dt>
              <dd className="font-medium">{project.serviceSlug.replace(/-/g, " ")}</dd>
            </div>
          )}
          {project.acreage != null && (
            <div>
              <dt className="text-muted-foreground">Acreage</dt>
              <dd className="font-medium">{project.acreage}</dd>
            </div>
          )}
          {project.vegetationType && (
            <div>
              <dt className="text-muted-foreground">Vegetation</dt>
              <dd className="font-medium">{project.vegetationType}</dd>
            </div>
          )}
          {project.equipmentUsed && (
            <div>
              <dt className="text-muted-foreground">Equipment</dt>
              <dd className="font-medium">{project.equipmentUsed}</dd>
            </div>
          )}
          {project.attachmentUsed && (
            <div>
              <dt className="text-muted-foreground">Attachment</dt>
              <dd className="font-medium">{project.attachmentUsed}</dd>
            </div>
          )}
          {project.approximateMachineHours != null && (
            <div>
              <dt className="text-muted-foreground">Approx. machine hours</dt>
              <dd className="font-medium">{project.approximateMachineHours}</dd>
            </div>
          )}
        </dl>

        {project.workCompleted && (
          <section className="mt-10">
            <h2 className="font-heading text-2xl font-medium">Work completed</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {project.workCompleted}
            </p>
          </section>
        )}

        {project.beforeImageUrls.length > 0 && (
          <MediaBlock title="Before" urls={project.beforeImageUrls} />
        )}
        {project.duringImageUrls.length > 0 && (
          <MediaBlock title="During" urls={project.duringImageUrls} />
        )}
        {project.afterImageUrls.length > 0 && (
          <MediaBlock title="After" urls={project.afterImageUrls} />
        )}

        {project.testimonial && (
          <blockquote className="mt-10 border-l-4 border-brand-primary pl-4 text-sm italic text-muted-foreground">
            {project.testimonial}
          </blockquote>
        )}

        <p className="mt-10 text-sm">
          <Link href={seo.path} className="font-medium text-brand-primary hover:underline">
            More about {division.shortName}
          </Link>
        </p>
        <ConversionCtaGroup divisionId={project.divisionId} className="mt-8" />
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge divisionId={project.divisionId} />
    </div>
  );
}

function MediaBlock({ title, urls }: { title: string; urls: string[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl font-medium">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {urls.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${title} photo`}
            className="h-auto w-full rounded-xl border border-black/5 object-cover"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
