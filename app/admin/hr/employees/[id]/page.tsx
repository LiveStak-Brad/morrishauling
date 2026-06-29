"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { OnboardingWizard } from "@/components/hr/OnboardingWizard";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/morris/StatCard";
import type { HrEmployee, EmployeeDispatchStats } from "@/types/hr/employee";
import type { EmployeeDocument, EmployeeDocumentUpload } from "@/types/hr/documents";
import { EmployeeTrainingTab } from "@/components/hr/EmployeeTrainingTab";
import { toast } from "@/lib/toast";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    employee: HrEmployee;
    dispatchStats: EmployeeDispatchStats;
    documents: EmployeeDocument[];
  } | null>(null);
  const [uploads, setUploads] = useState<EmployeeDocumentUpload[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const load = () => {
    fetch(`/api/hr/employees/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); });
    fetch(`/api/hr/employees/${id}/documents/uploads`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setUploads(d.uploads ?? []); });
  };

  useEffect(() => { load(); }, [id]);

  const activate = async () => {
    await fetch(`/api/hr/employees/${id}/activate`, { method: "POST" });
    load();
  };

  const reviewUpload = async (uploadId: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/hr/documents/uploads/${uploadId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNotes: reviewNotes[uploadId] }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success(status === "approved" ? "Approved" : "Rejected");
      load();
    } else toast.error(d.error ?? "Failed");
  };

  const uploadForEmployee = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", "other");
    form.append("label", file.name);
    const res = await fetch(`/api/hr/employees/${id}/documents/uploads`, { method: "POST", body: form });
    const d = await res.json();
    if (d.ok) {
      toast.success("Uploaded on behalf of employee");
      load();
    } else toast.error(d.error ?? "Upload failed");
  };

  const openPolicyDoc = async (doc: EmployeeDocument) => {
    const res = await fetch(`/api/hr/documents/${doc.id}`);
    const d = await res.json();
    if (d.ok && d.document?.signedUrl) {
      window.open(d.document.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.error(d.error ?? "Could not open document");
    }
  };

  if (!data) return <AdminPageShell title="Employee"><p>Loading…</p></AdminPageShell>;

  const { employee, dispatchStats, documents } = data;

  return (
    <AdminPageShell
      title={`${employee.firstName} ${employee.lastName}`}
      description={`${employee.employeeNumber ?? ""} · ${employee.position?.title ?? employee.role}`}
    >
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Today's Jobs" value={String(dispatchStats.todayJobs)} />
            <StatCard label="Lifetime Jobs" value={String(dispatchStats.lifetimeJobs)} />
            <StatCard label="Revenue" value={`$${dispatchStats.revenueProduced.toLocaleString()}`} />
            <StatCard label="Avg Job Value" value={`$${dispatchStats.avgJobValue}`} />
          </div>
          <PremiumCard className="p-4">
            <div className="flex gap-2 mb-4">
              <Badge>{employee.lifecycleStatus}</Badge>
              {employee.employmentType && <Badge variant="outline">{employee.employmentType}</Badge>}
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><strong>Email:</strong> {employee.email ?? "—"}</p>
              <p><strong>Phone:</strong> {employee.phone ?? "—"}</p>
              <p><strong>Hire Date:</strong> {employee.hireDate ?? "—"}</p>
              <p><strong>Pay Rate:</strong> ${employee.hourlyRate ?? "—"}/hr</p>
            </div>
          </PremiumCard>
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingWizard
            employeeId={id}
            onActivate={employee.lifecycleStatus === "onboarding" ? activate : undefined}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <PremiumCard className="p-4">
            <h3 className="font-semibold mb-2">Assigned policies</h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">v{doc.version}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "signed" ? "default" : "secondary"}>{doc.status}</Badge>
                    <Button variant="outline" size="sm" onClick={() => openPolicyDoc(doc)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard className="p-4 space-y-3">
            <h3 className="font-semibold">Employee uploads</h3>
            {uploads.length === 0 && (
              <p className="text-sm text-muted-foreground">No uploads yet.</p>
            )}
            {uploads.map((u) => (
              <div key={u.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{u.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.documentType.replace(/_/g, " ")} · {u.status}</p>
                  </div>
                  {u.signedUrl && (
                    <a
                      href={u.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Download
                    </a>
                  )}
                </div>
                {u.status === "pending_review" && (
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[160px]">
                      <Label className="text-xs">Review notes</Label>
                      <Textarea
                        rows={2}
                        value={reviewNotes[u.id] ?? ""}
                        onChange={(e) => setReviewNotes((n) => ({ ...n, [u.id]: e.target.value }))}
                      />
                    </div>
                    <Button size="sm" onClick={() => void reviewUpload(u.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => void reviewUpload(u.id, "rejected")}>Reject</Button>
                  </div>
                )}
                {u.reviewNotes && <p className="text-xs text-muted-foreground">Notes: {u.reviewNotes}</p>}
              </div>
            ))}
          </PremiumCard>

          <PremiumCard className="p-4">
            <Label>Upload on behalf of employee</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              className="mt-2"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadForEmployee(f);
                e.target.value = "";
              }}
            />
          </PremiumCard>
        </TabsContent>

        <TabsContent value="training">
          <EmployeeTrainingTab employeeId={id} />
        </TabsContent>

        <TabsContent value="dispatch">
          <PremiumCard className="p-4 grid gap-2 sm:grid-cols-2">
            <p><strong>Profit Produced:</strong> ${dispatchStats.profitProduced.toLocaleString()}</p>
            <p><strong>Labor Cost:</strong> ${dispatchStats.laborCost.toLocaleString()}</p>
          </PremiumCard>
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
