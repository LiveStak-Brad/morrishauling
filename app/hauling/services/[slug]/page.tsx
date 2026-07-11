import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceMarketingPage } from "@/components/seo/ServiceMarketingPage";
import { getService, servicesForDivision } from "@/lib/seo/services";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return servicesForDivision("hauling").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService("hauling", slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.title.replace(" | Morris Hauling", ""),
    description: service.description,
    path: `/hauling/services/${slug}`,
    ogImage: DIVISION_SEO.hauling.ogImage,
    keywords: [service.name, "hauling", "Missouri", "Morris Hauling"],
  });
}

export default async function HaulingServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService("hauling", slug);
  if (!service) notFound();
  return <ServiceMarketingPage service={service} />;
}
