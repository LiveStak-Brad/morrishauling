# Image Manifest (human index)

Machine-readable source of truth: [`lib/seo/image-manifest.ts`](../../lib/seo/image-manifest.ts)

Runtime resolver: [`lib/seo/images.ts`](../../lib/seo/images.ts) + [`MarketingImage`](../../components/seo/MarketingImage.tsx)

## Status values

| Status | Meaning |
|--------|---------|
| Existing | Already on site |
| NeedsGenerated | AI branded interim to create |
| NeedsReplaced | Interim or stock — replace with real Morris photos |
| Complete | Final authentic asset |

## Priority queues

- **P0:** Home, Junk hub, Hauling hub, Free Scrap Fridays, Pricing, Book, Service-area, Demolition hub — **branded interim generated** (`public/marketing/branded/`)
- **P1:** 10 demolition pages — **branded interim generated**
- **P2:** Warrenton, Wright City, Troy, Wentzville, Foristell, Washington, O’Fallon — **branded interim generated**
- **P3:** Remaining cities + key guides — OG/shared-section as ROI allows

## Authenticity rule

Any before/after, crew-at-work, equipment-in-use, or completed-job slot must include:

> Replace with real project photos when available

Generated AI heroes are marked `NeedsReplaced` for that reason. Company-owned photos (`junk.jpg`, `furniture.jpeg`, `gooseneckhaulingphoto.jpg`) remain `representative: false`.

## Stock demotion

Unsplash/Pexels keys remain in the registry for legacy section use but must not be primary heroes when a branded `imageKey` exists.

## Scrappy usage

Only Free Scrap Fridays and community/promo surfaces — never service or demolition heroes.

## Hard rule — no fake/foreign advertising on vehicles

AI or stock marketing images must **never** show phone numbers, company names, websites, logos, or trailer/truck advertisements that are not Morris Service Group LLC / Morris Junk Removal / Morris Hauling.

- Prefer **blank, unmarked** dump trailers and trucks (no lettering).
- Prefer **real Morris company photos** when equipment is the hero (`junk.jpg`, `gooseneckhaulingphoto.jpg`, `furniture.jpeg`).
- If any generated asset shows competitor, fake, or random business advertising — delete and replace.

## Swap procedure

1. Replace the file under `public/marketing/branded/` (keep filename or update manifest `src`/`filename`).
2. Set manifest `status` to `Complete`.
3. Clear `replaceWithRealPhotosNote` when the asset is authentic.
4. No layout changes required — aspect ratios stay 16:9.
