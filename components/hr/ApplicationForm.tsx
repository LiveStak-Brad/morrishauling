"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PremiumCard } from "@/components/morris/PremiumCard";
import type { ApplicationSubmitPayload, EmploymentType } from "@/types/hr/ats";
import type { JobPosting } from "@/types/hr/ats";
import { toast } from "@/lib/toast";

interface ApplicationFormProps {
  posting: JobPosting;
}

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "w2_full_time", label: "Full Time" },
  { value: "w2_part_time", label: "Part Time" },
  { value: "1099_contractor", label: "Contractor" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
  { value: "office_staff", label: "Office" },
];

export function ApplicationForm({ posting }: ApplicationFormProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Partial<ApplicationSubmitPayload>>({
    jobPostingId: posting.id,
    drugTestConsent: false,
    backgroundCheckConsent: false,
    employmentHistory: [{ employerName: "", jobTitle: "", isCurrent: false }],
    references: [{ name: "", phone: "", relationship: "" }],
    education: [],
    certifications: [],
    source: "careers_page",
  });

  const update = (patch: Partial<ApplicationSubmitPayload>) =>
    setForm((f) => ({ ...f, ...patch }));

  const [docFiles, setDocFiles] = useState<{
    resume?: File;
    drivers_license?: File;
    certification?: File;
  }>({});

  const uploadApplicantDocs = async (result: {
    applicantId: string;
    applicationId: string;
    statusToken: string;
  }) => {
    const entries = Object.entries(docFiles).filter(([, f]) => !!f) as [string, File][];
    for (const [documentType, file] of entries) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicantId", result.applicantId);
      formData.append("applicationId", result.applicationId);
      formData.append("statusToken", result.statusToken);
      formData.append("documentType", documentType);
      const res = await fetch("/api/careers/applications/documents", { method: "POST", body: formData });
      const d = await res.json();
      if (!d.ok) toast.error(`Failed to upload ${documentType.replace(/_/g, " ")}`);
    }
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.firstName?.trim() || !form.lastName?.trim() || !form.email?.trim()) {
        toast.error("First name, last name, and email are required");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!form.drugTestConsent || !form.backgroundCheckConsent) {
      toast.error("Please accept required consents");
      return;
    }
    setSubmitting(true);
    try {
      const payload: ApplicationSubmitPayload = {
        jobPostingId: posting.id,
        firstName: form.firstName!,
        lastName: form.lastName!,
        email: form.email!,
        phone: form.phone,
        addressLine1: form.addressLine1,
        city: form.city,
        state: form.state,
        zip: form.zip,
        desiredPay: form.desiredPay,
        availability: form.availability,
        employmentTypePreference: form.employmentTypePreference,
        canLift100lbs: form.canLift100lbs,
        hasDriversLicense: form.hasDriversLicense,
        hasCdl: form.hasCdl,
        hasReliableTransportation: form.hasReliableTransportation,
        experienceSummary: form.experienceSummary,
        whyMorris: form.whyMorris,
        drugTestConsent: form.drugTestConsent!,
        backgroundCheckConsent: form.backgroundCheckConsent!,
        source: "careers_page",
        employmentHistory: (form.employmentHistory ?? []).filter((e) => e.employerName?.trim()),
        references: (form.references ?? []).filter((r) => r.name?.trim()),
        education: form.education,
        certifications: form.certifications,
      };

      const res = await fetch("/api/careers/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.ok) {
        if (d.applicantId && d.applicationId && d.statusToken) {
          await uploadApplicantDocs({
            applicantId: d.applicantId,
            applicationId: d.applicationId,
            statusToken: d.statusToken,
          });
        }
        setSubmitted(true);
      } else {
        toast.error(d.error ?? "Submission failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PremiumCard className="p-8 text-center border-green-200 bg-green-50/50">
        <h2 className="text-2xl font-bold text-green-800">Application Submitted!</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Thank you for applying to Morris Junk Removal. Our HR team will review your application and
          contact you if there&apos;s a match for {posting.title} or a related future opening.
        </p>
      </PremiumCard>
    );
  }

  const steps = ["Contact", "Experience", "Qualifications", "Documents", "Review"];
  const employment = form.employmentHistory?.[0];
  const reference = form.references?.[0];

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand-primary" : "bg-muted"}`} />
            <p className={`text-[10px] mt-1 hidden sm:block ${i === step ? "text-brand-primary font-medium" : "text-muted-foreground"}`}>
              {s}
            </p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <PremiumCard className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Contact Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>First Name *</Label><Input value={form.firstName ?? ""} onChange={(e) => update({ firstName: e.target.value })} /></div>
            <div><Label>Last Name *</Label><Input value={form.lastName ?? ""} onChange={(e) => update({ lastName: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></div>
            <div><Label>Phone *</Label><Input type="tel" value={form.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Street Address</Label><Input value={form.addressLine1 ?? ""} onChange={(e) => update({ addressLine1: e.target.value })} /></div>
            <div><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => update({ city: e.target.value })} /></div>
            <div><Label>State</Label><Input value={form.state ?? ""} onChange={(e) => update({ state: e.target.value })} placeholder="MO" /></div>
            <div><Label>ZIP</Label><Input value={form.zip ?? ""} onChange={(e) => update({ zip: e.target.value })} /></div>
            <div>
              <Label>Employment type preference</Label>
              <Select
                value={form.employmentTypePreference ?? ""}
                onValueChange={(v) => update({ employmentTypePreference: v as EmploymentType })}
              >
                <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Availability</Label><Input value={form.availability ?? ""} onChange={(e) => update({ availability: e.target.value })} placeholder="Mon–Fri, weekends, etc." /></div>
            <div><Label>Desired pay ($/hr)</Label><Input type="number" min={0} value={form.desiredPay ?? ""} onChange={(e) => update({ desiredPay: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
          </div>
        </PremiumCard>
      )}

      {step === 1 && (
        <PremiumCard className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Experience &amp; References</h3>
          <div>
            <Label>Experience summary</Label>
            <Textarea
              value={form.experienceSummary ?? ""}
              onChange={(e) => update({ experienceSummary: e.target.value })}
              rows={4}
              placeholder="Summarize your relevant work experience…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
            <div className="sm:col-span-2"><Label className="text-sm font-medium">Previous employer</Label></div>
            <div><Label className="text-xs text-muted-foreground">Company</Label><Input value={employment?.employerName ?? ""} onChange={(e) => update({ employmentHistory: [{ ...employment!, employerName: e.target.value, jobTitle: employment?.jobTitle ?? "", isCurrent: false }] })} /></div>
            <div><Label className="text-xs text-muted-foreground">Job title</Label><Input value={employment?.jobTitle ?? ""} onChange={(e) => update({ employmentHistory: [{ ...employment!, employerName: employment?.employerName ?? "", jobTitle: e.target.value, isCurrent: false }] })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
            <div className="sm:col-span-2"><Label className="text-sm font-medium">Reference</Label></div>
            <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={reference?.name ?? ""} onChange={(e) => update({ references: [{ ...reference!, name: e.target.value }] })} /></div>
            <div><Label className="text-xs text-muted-foreground">Relationship</Label><Input value={reference?.relationship ?? ""} onChange={(e) => update({ references: [{ ...reference!, name: reference?.name ?? "", relationship: e.target.value }] })} /></div>
            <div className="sm:col-span-2"><Label className="text-xs text-muted-foreground">Phone</Label><Input value={reference?.phone ?? ""} onChange={(e) => update({ references: [{ ...reference!, name: reference?.name ?? "", phone: e.target.value }] })} /></div>
          </div>
          <div>
            <Label>Why do you want to work with Morris?</Label>
            <Textarea
              value={form.whyMorris ?? ""}
              onChange={(e) => update({ whyMorris: e.target.value })}
              rows={3}
              placeholder="Tell us what interests you about Morris Junk Removal…"
            />
          </div>
        </PremiumCard>
      )}

      {step === 2 && (
        <PremiumCard className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Qualifications</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.hasDriversLicense} onCheckedChange={(v) => update({ hasDriversLicense: !!v })} /> Valid driver&apos;s license?</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.hasCdl} onCheckedChange={(v) => update({ hasCdl: !!v })} /> CDL?</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.canLift100lbs} onCheckedChange={(v) => update({ canLift100lbs: !!v })} /> Can lift 75+ lbs?</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.hasReliableTransportation} onCheckedChange={(v) => update({ hasReliableTransportation: !!v })} /> Reliable transportation?</label>
          </div>
        </PremiumCard>
      )}

      {step === 3 && (
        <PremiumCard className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Documents</h3>
          <p className="text-sm text-muted-foreground">PDF or image files accepted. Resume recommended.</p>
          <div className="space-y-3">
            <div><Label>Resume</Label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setDocFiles((f) => ({ ...f, resume: e.target.files?.[0] }))} /></div>
            <div><Label>Driver&apos;s license (optional)</Label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setDocFiles((f) => ({ ...f, drivers_license: e.target.files?.[0] }))} /></div>
            <div><Label>Certifications (optional)</Label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setDocFiles((f) => ({ ...f, certification: e.target.files?.[0] }))} /></div>
          </div>
        </PremiumCard>
      )}

      {step === 4 && (
        <>
          <PremiumCard className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Consents *</h3>
            <label className="flex items-start gap-2">
              <Checkbox checked={form.drugTestConsent} onCheckedChange={(v) => update({ drugTestConsent: !!v })} className="mt-1" />
              <span className="text-sm">I consent to drug testing as a condition of employment.</span>
            </label>
            <label className="flex items-start gap-2">
              <Checkbox checked={form.backgroundCheckConsent} onCheckedChange={(v) => update({ backgroundCheckConsent: !!v })} className="mt-1" />
              <span className="text-sm">I consent to a background check as a condition of employment.</span>
            </label>
          </PremiumCard>
          <PremiumCard className="p-6 space-y-2 text-sm">
            <h3 className="font-semibold text-lg mb-3">Review</h3>
            <p><strong>Name:</strong> {form.firstName} {form.lastName}</p>
            <p><strong>Email:</strong> {form.email}</p>
            <p><strong>Phone:</strong> {form.phone ?? "—"}</p>
            <p><strong>Position:</strong> {posting.title}</p>
            <p><strong>Desired Pay:</strong> {form.desiredPay != null ? `$${form.desiredPay}/hr` : "—"}</p>
          </PremiumCard>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
        {step < steps.length - 1 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button onClick={submit} disabled={submitting || !form.drugTestConsent || !form.backgroundCheckConsent}>
            {submitting ? "Submitting…" : "Submit Application"}
          </Button>
        )}
      </div>
    </div>
  );
}
