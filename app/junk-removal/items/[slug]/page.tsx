import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorityArticleLayout } from "@/components/seo/AuthorityArticleLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ACCEPTANCE_LABELS, allItemSlugs, getItem } from "@/lib/seo/items";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allItemSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return {};
  return buildPageMetadata({
    title: item.title,
    description: item.description,
    path: `/junk-removal/items/${slug}`,
    ogImage: DIVISION_SEO.junk_removal.ogImage,
    keywords: item.keywords,
  });
}

export default async function JunkItemPage({ params }: Props) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();

  return (
    <AuthorityArticleLayout
      path={`/junk-removal/items/${slug}`}
      crumbs={[
        { name: "Morris Services", href: "/" },
        { name: "Morris Junk Removal", href: "/junk-removal" },
        { name: "Items", href: "/junk-removal/items" },
        { name: item.name },
      ]}
      eyebrow="Can we take this?"
      h1={`${item.name} Removal`}
      summary={item.description}
      sections={[
        {
          heading: "Acceptance overview",
          body: ACCEPTANCE_LABELS[item.acceptance],
        },
      ]}
      faqs={item.faqs}
      relatedServiceSlugs={item.relatedServices}
      relatedGuideSlugs={item.relatedGuides}
      relatedItemSlugs={item.relatedItems}
    >
      <section className="mt-12 space-y-8">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            {ACCEPTANCE_LABELS[item.acceptance]}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-medium">Can we remove it?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {item.canRemove}
          </p>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-medium">Special handling</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {item.specialHandling}
          </p>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-medium">Recycling</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {item.recycling}
          </p>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-medium">Donation</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {item.donation}
          </p>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-medium">Manual review</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {item.manualReview}
          </p>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-medium">Pricing factors</h2>
          <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
            {item.pricingFactors.map((factor) => (
              <li key={factor}>• {factor}</li>
            ))}
          </ul>
        </div>
      </section>
    </AuthorityArticleLayout>
  );
}
