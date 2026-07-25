# SEO Scorecard — Morris Service Group LLC

## Before (architecture audit)

| Category | Score | Notes |
|----------|------:|-------|
| Technical SEO | 70 | Sitemap/robots/metadata solid; careers canonical bug |
| On-page content | 68 | Strong junk cluster; thin hauling; no demolition |
| Local SEO | 65 | 23 areas; missing nearby towns |
| Structured data | 72 | Org/LB/FAQ/Breadcrumb present |
| Images | 35 | Stock-heavy; reuse; empty authentic slots |
| Internal linking | 60 | Footer dense; demolition/scrap bridges weak |
| **Overall** | **62** | |

## After (post-implementation)

| Category | Score | Notes |
|----------|------:|-------|
| Technical SEO | 88 | Careers jobs canonical fixed; planner noindex; sitemap covers demolition + FAQ; ImageObject helper |
| On-page content | 86 | Demolition pillar (10 + hub), same-day/brush/foreclosure guides, scrap-metal item, dumpster+construction long-tails |
| Local SEO | 84 | +7 communities with unique blurbs/FAQs; P2 city heroes; uniqueFaq on area pages |
| Structured data | 86 | FAQ + Breadcrumb on demolition; FAQ hub; existing Org/LB retained |
| Images | 78 | Manifest + branded WebP P0–P2; stock demoted; real Morris photos for equipment hubs; AI interim marked NeedsReplaced — **no fake/third-party trailer ads** |
| Internal linking | 84 | Nav/footer demolition+FAQ; related-links; junk hub teaser; gallery cards |
| **Overall** | **84** | |

## Files / areas touched

- `docs/seo/*` — keyword coverage, competitor gap, image manifest, scorecard
- `lib/seo/demolition.ts`, `image-manifest.ts`, `images.ts`, `locations.ts`, `guides.ts`, `services.ts`, `items.ts`, `schema.ts`
- `app/junk-removal/demolition/**`, `app/junk-removal/faq/page.tsx`, gallery enhancements
- `components/seo/*`, `components/authority/ProjectGalleryCard.tsx`, public nav/footer/hubs
- `public/marketing/branded/*.webp` — interim branded heroes (unmarked equipment / property scenes)

## Remaining recommendations

1. Replace AI interim heroes with **real Morris job photos** (status → `Complete`).
2. Never publish vehicle images with non-Morris phone numbers, names, or trailer ads.
3. Publish permissioned before/after stories into the gallery (no fake jobs).
4. P3: remaining city/guide OG images where ROI justifies.
5. Continue de-templating FAQs for older cities still on shared shells.
6. Optional: JobPosting schema on careers detail pages.
