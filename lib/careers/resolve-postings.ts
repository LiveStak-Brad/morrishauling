import { ALL_REFERENCE_POSITIONS, referenceToJobPosting } from "@/lib/careers/reference-positions";
import type { JobPosting } from "@/types/hr/ats";

/** Synchronous fallback postings — always available without DB/migration. */
export function getReferenceCareerPostings(): JobPosting[] {
  return ALL_REFERENCE_POSITIONS.map(referenceToJobPosting);
}

/** Prefer API results; use reference templates when empty or unavailable. */
export function resolveCareersPostings(fetched: JobPosting[] | null | undefined): JobPosting[] {
  if (fetched && fetched.length > 0) return fetched;
  return getReferenceCareerPostings();
}

export function findCareerPosting(
  postings: JobPosting[],
  opts: { id?: string; slug?: string }
): JobPosting | undefined {
  if (opts.id) return postings.find((p) => p.id === opts.id);
  if (opts.slug) return postings.find((p) => p.slug === opts.slug);
  return undefined;
}

export function isTalentPoolPosting(posting: JobPosting): boolean {
  const mode = posting.hiringMode ?? "future_opening";
  return (
    posting.slug === "general-interest" ||
    mode === "future_opening" ||
    mode === "accepting_interest" ||
    mode === "hiring_soon"
  );
}

export function scrollToApplySection(postingId?: string) {
  if (typeof window === "undefined") return;
  if (postingId) {
    window.dispatchEvent(new CustomEvent("careers:select-posting", { detail: { postingId } }));
  }
  const el = document.getElementById("apply");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
