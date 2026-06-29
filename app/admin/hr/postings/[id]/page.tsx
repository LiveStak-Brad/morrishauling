"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { CAREER_CATEGORIES } from "@/lib/careers/constants";
import type { CareerCategory, EmploymentType, HiringMode, JobPosting, JobPostingStatus } from "@/types/hr/ats";

const HIRING_MODES: { value: HiringMode; label: string }[] = [
  { value: "active_hiring", label: "Active hiring" },
  { value: "accepting_interest", label: "Accepting interest" },
  { value: "future_opening", label: "Future opening" },
  { value: "hiring_soon", label: "Hiring soon" },
  { value: "hidden", label: "Hidden" },
];

export default function EditJobPostingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/hr/job-postings/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPosting(d.posting); });
  }, [id]);

  const update = (patch: Partial<JobPosting>) =>
    setPosting((p) => (p ? { ...p, ...patch } : p));

  const save = async () => {
    if (!posting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/job-postings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: posting.title,
          slug: posting.slug,
          description: posting.description,
          requirements: posting.requirements,
          responsibilities: posting.responsibilities,
          niceToHave: posting.niceToHave,
          growthPath: posting.growthPath,
          schedule: posting.schedule,
          category: posting.category,
          departmentLabel: posting.departmentLabel,
          hiringMode: posting.hiringMode,
          employmentType: posting.employmentType,
          location: posting.location,
          payNote: posting.payNote,
          payRangeMin: posting.payRangeMin,
          payRangeMax: posting.payRangeMax,
          payRangeUnit: posting.payRangeUnit,
          status: posting.status,
          sortOrder: posting.sortOrder,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success("Posting updated");
      router.push("/admin/hr/postings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!posting) {
    return <AdminPageShell title="Edit Posting"><p>Loading…</p></AdminPageShell>;
  }

  return (
    <AdminPageShell
      title="Edit Job Posting"
      description={posting.title}
      action={
        <Link href={`/careers/jobs/${posting.slug}`} className="text-sm text-brand-primary hover:underline">
          View public page
        </Link>
      }
    >
      <PremiumCard className="p-4 space-y-4 max-w-2xl">
        <div className="flex flex-wrap gap-2">
          <Badge>{posting.status}</Badge>
          {posting.isReferenceTemplate && <Badge variant="outline">Reference template</Badge>}
          {posting.hiringMode && <Badge variant="secondary">{posting.hiringMode.replace(/_/g, " ")}</Badge>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Title</Label><Input value={posting.title} onChange={(e) => update({ title: e.target.value })} /></div>
          <div><Label>Slug</Label><Input value={posting.slug} onChange={(e) => update({ slug: e.target.value })} /></div>
          <div>
            <Label>Visibility status</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={posting.status} onChange={(e) => update({ status: e.target.value as JobPostingStatus })}>
              <option value="draft">Draft</option>
              <option value="published">Published (visible)</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <Label>Hiring mode</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={posting.hiringMode ?? "future_opening"} onChange={(e) => update({ hiringMode: e.target.value as HiringMode })}>
              {HIRING_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Category</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={posting.category ?? ""} onChange={(e) => update({ category: e.target.value as CareerCategory })}>
              <option value="">—</option>
              {CAREER_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div><Label>Department label</Label><Input value={posting.departmentLabel ?? ""} onChange={(e) => update({ departmentLabel: e.target.value })} /></div>
          <div>
            <Label>Employment type</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={posting.employmentType} onChange={(e) => update({ employmentType: e.target.value as EmploymentType })}>
              <option value="w2_full_time">Full Time</option>
              <option value="w2_part_time">Part Time</option>
              <option value="1099_contractor">Contractor</option>
              <option value="seasonal">Seasonal</option>
              <option value="temporary">Temporary</option>
              <option value="office_staff">Office</option>
            </select>
          </div>
          <div><Label>Location</Label><Input value={posting.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Schedule</Label><Input value={posting.schedule ?? ""} onChange={(e) => update({ schedule: e.target.value })} /></div>
          <div><Label>Pay min</Label><Input type="number" value={posting.payRangeMin ?? ""} onChange={(e) => update({ payRangeMin: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div><Label>Pay max</Label><Input type="number" value={posting.payRangeMax ?? ""} onChange={(e) => update({ payRangeMax: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div className="sm:col-span-2"><Label>Pay note</Label><Input value={posting.payNote ?? ""} onChange={(e) => update({ payNote: e.target.value })} placeholder="Pay based on experience" /></div>
        </div>

        <div><Label>Description</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]" value={posting.description} onChange={(e) => update({ description: e.target.value })} /></div>
        <div><Label>Responsibilities</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]" value={posting.responsibilities ?? ""} onChange={(e) => update({ responsibilities: e.target.value })} /></div>
        <div><Label>Requirements</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]" value={posting.requirements ?? ""} onChange={(e) => update({ requirements: e.target.value })} /></div>
        <div><Label>Nice to have</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px]" value={posting.niceToHave ?? ""} onChange={(e) => update({ niceToHave: e.target.value })} /></div>
        <div><Label>Growth path</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[60px]" value={posting.growthPath ?? ""} onChange={(e) => update({ growthPath: e.target.value })} /></div>

        <div className="flex gap-2">
          <Button onClick={() => void save()} disabled={saving}>Save changes</Button>
          <Button variant="outline" onClick={() => router.push("/admin/hr/postings")}>Cancel</Button>
        </div>
      </PremiumCard>
    </AdminPageShell>
  );
}
