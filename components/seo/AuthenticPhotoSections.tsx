/**
 * Public photo story / gallery components.
 * Only render when authentic Morris content is supplied — never invent projects.
 */

import Image from "next/image";
import type { CrewMember, FleetItem, ProjectStory } from "@/lib/seo/authentic-content";
import { hasPublicPhotoContent } from "@/lib/seo/authentic-content";

export function BeforeAfterGallery({ projects }: { projects: ProjectStory[] }) {
  if (!hasPublicPhotoContent(projects)) return null;
  return (
    <section className="mt-16" aria-labelledby="before-after-heading">
      <h2 id="before-after-heading" className="font-heading text-3xl font-medium tracking-tight">
        Recent clear-outs
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Real Morris jobs — shared with customer permission.</p>
      <ul className="mt-8 grid gap-8 md:grid-cols-2">
        {projects.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="grid grid-cols-2 gap-px bg-border">
              {p.beforeSrc ? (
                <Image src={p.beforeSrc} alt={`Before: ${p.title}`} width={800} height={600} className="h-auto w-full object-cover" />
              ) : null}
              {p.afterSrc ? (
                <Image src={p.afterSrc} alt={`After: ${p.title}`} width={800} height={600} className="h-auto w-full object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
              {p.locationLabel ? (
                <p className="mt-2 text-xs text-muted-foreground">{p.locationLabel}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProjectCards({ projects }: { projects: ProjectStory[] }) {
  if (!hasPublicPhotoContent(projects)) return null;
  return (
    <section className="mt-16" aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="font-heading text-3xl font-medium tracking-tight">
        Project highlights
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-2xl border border-border bg-white p-5">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MeetTheOwner({
  name,
  role,
  bio,
  photoSrc,
}: {
  name: string;
  role: string;
  bio: string;
  photoSrc?: string;
}) {
  if (!name || !bio) return null;
  return (
    <section className="mt-16" aria-labelledby="owner-heading">
      <h2 id="owner-heading" className="font-heading text-3xl font-medium tracking-tight">
        Meet the owner
      </h2>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={name}
            width={320}
            height={320}
            className="h-40 w-40 rounded-2xl object-cover"
          />
        ) : null}
        <div>
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-sm text-brand-primary">{role}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>
        </div>
      </div>
    </section>
  );
}

export function MeetTheCrew({ members }: { members: CrewMember[] }) {
  if (!hasPublicPhotoContent(members)) return null;
  return (
    <section className="mt-16" aria-labelledby="crew-heading">
      <h2 id="crew-heading" className="font-heading text-3xl font-medium tracking-tight">
        Meet the crew
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {members.map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-white p-5">
            {m.photoSrc ? (
              <Image src={m.photoSrc} alt={m.name} width={240} height={240} className="mb-3 h-28 w-28 rounded-xl object-cover" />
            ) : null}
            <p className="font-semibold">{m.name}</p>
            <p className="text-sm text-brand-primary">{m.role}</p>
            {m.bio ? <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FleetGallery({ items }: { items: FleetItem[] }) {
  if (!hasPublicPhotoContent(items)) return null;
  return (
    <section className="mt-16" aria-labelledby="fleet-heading">
      <h2 id="fleet-heading" className="font-heading text-3xl font-medium tracking-tight">
        Fleet & equipment
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white">
            {item.photoSrc ? (
              <Image src={item.photoSrc} alt={item.name} width={800} height={500} className="h-auto w-full object-cover" />
            ) : null}
            <div className="p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
