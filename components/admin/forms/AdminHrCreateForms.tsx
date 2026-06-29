"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import type { EmploymentType, JobPosting } from "@/types/hr/ats";

export function AdminApplicantCreateForm() {
  const router = useRouter();
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    jobPostingId: "",
    source: "phone",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/hr/job-postings")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPostings(d.postings ?? []);
      });
  }, []);

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.jobPostingId) {
      toast.error("Name and job posting required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success("Applicant created");
      router.push(`/admin/hr/applicants/${d.applicationId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard className="p-4 space-y-4 max-w-lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
        <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      </div>
      <div>
        <Label>Job posting</Label>
        <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.jobPostingId} onChange={(e) => setForm({ ...form, jobPostingId: e.target.value })}>
          <option value="">Select posting</option>
          {postings.map((p) => (
            <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
          ))}
        </select>
        {postings.length === 0 && <p className="text-xs text-muted-foreground mt-1">Create a job posting first.</p>}
      </div>
      <div>
        <Label>Source</Label>
        <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          <option value="phone">Phone</option>
          <option value="text">Text</option>
          <option value="referral">Referral</option>
          <option value="walk-in">Walk-in</option>
        </select>
      </div>
      <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      <Button onClick={() => void submit()} disabled={saving}>Save applicant</Button>
    </PremiumCard>
  );
}

export function AdminEmployeeCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employmentType: "w2_full_time" as EmploymentType,
    role: "helper",
    payType: "hourly",
    hourlyRate: "",
    hireDate: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success(`Employee ${d.employeeNumber} created`);
      router.push(`/admin/hr/employees/${d.employeeId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard className="p-4 space-y-4 max-w-lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
        <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
        <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Employment type</Label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}>
            <option value="w2_full_time">W-2 Full Time</option>
            <option value="w2_part_time">W-2 Part Time</option>
            <option value="1099_contractor">1099 Contractor</option>
            <option value="seasonal">Seasonal</option>
            <option value="temporary">Temporary</option>
            <option value="office_staff">Office Staff</option>
          </select>
        </div>
        <div>
          <Label>Role</Label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="helper">Helper</option>
            <option value="driver">Driver</option>
            <option value="lead">Lead</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="office">Office</option>
          </select>
        </div>
        <div><Label>Pay type</Label><Input value={form.payType} onChange={(e) => setForm({ ...form, payType: e.target.value })} /></div>
        <div><Label>Hourly rate ($)</Label><Input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} /></div>
        <div><Label>Start date</Label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
      </div>
      <p className="text-xs text-muted-foreground">Onboarding template and document pack are assigned automatically from employment type.</p>
      <Button onClick={() => void submit()} disabled={saving}>Create employee</Button>
    </PremiumCard>
  );
}

export function AdminJobPostingCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    requirements: "",
    employmentType: "w2_full_time" as EmploymentType,
    payRangeMin: "",
    payRangeMax: "",
    location: "",
    status: "draft" as "draft" | "published",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title || !form.description) {
      toast.error("Title and description required");
      return;
    }
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setSaving(true);
    try {
      const res = await fetch("/api/hr/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug,
          description: form.description,
          requirements: form.requirements || undefined,
          employmentType: form.employmentType,
          payRangeMin: form.payRangeMin ? Number(form.payRangeMin) : undefined,
          payRangeMax: form.payRangeMax ? Number(form.payRangeMax) : undefined,
          payRangeUnit: "hourly",
          location: form.location || undefined,
          status: form.status,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast.success("Job posting saved");
      router.push("/admin/hr/postings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumCard className="p-4 space-y-4 max-w-lg">
      <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><Label>Slug (optional)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from title" /></div>
      <div><Label>Description</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div><Label>Requirements</Label><textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[72px]" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Pay min ($/hr)</Label><Input type="number" value={form.payRangeMin} onChange={(e) => setForm({ ...form, payRangeMin: e.target.value })} /></div>
        <div><Label>Pay max ($/hr)</Label><Input type="number" value={form.payRangeMax} onChange={(e) => setForm({ ...form, payRangeMax: e.target.value })} /></div>
        <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div>
          <Label>Status</Label>
          <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <Button onClick={() => void submit()} disabled={saving}>Save posting</Button>
    </PremiumCard>
  );
}
