import Link from "next/link";
import type { PublishedProject } from "@/types/equipment";

/** Renders nothing when there is no legitimate published work. Never shows zero-stats. */
export function ProjectTrustStrip({
  projects,
  title = "Completed Morris projects",
}: {
  projects: PublishedProject[];
  title?: string;
}) {
  if (projects.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-heading text-2xl font-medium tracking-tight">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.slug}`}
              className="block rounded-2xl border border-black/5 bg-white p-4 text-sm font-medium text-brand-primary hover:underline"
            >
              {p.title}
              {p.city ? ` · ${p.city}` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
