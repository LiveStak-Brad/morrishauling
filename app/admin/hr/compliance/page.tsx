"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentTemplate } from "@/types/hr/documents";
import { toast } from "@/lib/toast";
import { FileText, Upload } from "lucide-react";

export default function HrCompliancePage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => {
    fetch("/api/hr/document-templates")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTemplates(d.templates ?? []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const uploadTemplate = async (file: File) => {
    if (!selectedTemplate) {
      toast.error("Select a template first");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("templateId", selectedTemplate);
      if (changeSummary) form.append("changeSummary", changeSummary);
      const res = await fetch("/api/hr/document-templates", { method: "POST", body: form });
      const d = await res.json();
      if (d.ok) {
        toast.success("Template file uploaded — new version created");
        setChangeSummary("");
        load();
      } else toast.error(d.error ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminPageShell
      title="HR Documents & Compliance"
      description="Company policy templates, versioned files, and template management"
    >
      <PremiumCard className="p-5 mb-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" /> Upload template file (new version)
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload a PDF or image to the hr-documents bucket. Previous versions are archived in document_template_versions.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={(v) => v && setSelectedTemplate(v)}>
              <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (v{t.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Change summary</Label>
            <Input value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="e.g. Updated safety section" />
          </div>
        </div>
        <Input
          type="file"
          accept="image/*,application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadTemplate(f);
            e.target.value = "";
          }}
        />
      </PremiumCard>

      <div className="space-y-2">
        <h3 className="font-semibold">Active templates</h3>
        {templates.map((t) => (
          <PremiumCard key={t.id} className="p-4 flex items-start gap-3">
            <FileText className="h-5 w-5 text-brand-primary shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {t.documentKey} · v{t.version} · {t.isRequired ? "Required" : "Optional"}
              </p>
              {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
              {t.storagePath && (
                <p className="text-xs font-mono mt-1 text-muted-foreground">File on file</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTemplate(t.id)}
            >
              Upload new version
            </Button>
          </PremiumCard>
        ))}
      </div>
    </AdminPageShell>
  );
}
