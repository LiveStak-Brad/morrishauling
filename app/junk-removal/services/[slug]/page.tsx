import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceMarketingPage } from "@/components/seo/ServiceMarketingPage";
import { getService, servicesForDivision } from "@/lib/seo/services";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return servicesForDivision("junk_removal").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService("junk_removal", slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.title.replace(" | Morris Junk Removal", ""),
    description: service.description,
    path: `/junk-removal/services/${slug}`,
    ogImage: DIVISION_SEO.junk_removal.ogImage,
    keywords: [service.name, "junk removal", "Missouri", "Morris Junk Removal"],
  });
}

export default async function JunkServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService("junk_removal", slug);
  if (!service) notFound();
  return <ServiceMarketingPage service={service} />;
}
