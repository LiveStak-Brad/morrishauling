"use client";

import { useCallback, useEffect, useState } from "react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthProvider";
import type { EmployeeDocument, EmployeeDocumentUpload } from "@/types/hr/documents";
import { FileText, Upload, PenLine, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import { SignatureCanvas } from "@/components/employee/SignatureCanvas";
import { toast } from "@/lib/toast";

export default function EmployeeDocumentsPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [uploads, setUploads] = useState<EmployeeDocumentUpload[]>([]);
  const [signerName, setSignerName] = useState(profile?.full_name ?? "");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<EmployeeDocument | null>(null);
  const [uploadType, setUploadType] = useState<EmployeeDocumentUpload["documentType"]>("drivers_license");
  const [uploadLabel, setUploadLabel] = useState("Driver's license");
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    fetch("/api/me/hr")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setDocuments(d.documents ?? []);
          setUploads(d.uploads ?? []);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = documents.filter((d) => d.status === "pending");
  const signed = documents.filter((d) => d.status === "signed");

  const sign = async (docId: string) => {
    if (!signerName.trim()) {
      toast.error("Enter your legal name to sign");
      return;
    }
    if (!signatureDataUrl) {
      toast.error("Draw your signature below");
      return;
    }
    const res = await fetch(`/api/hr/documents/${docId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName: signerName.trim(), signatureDataUrl }),
    });
    const d = await res.json();
    if (d.ok) {
      toast.success("Document signed");
      setViewDoc(null);
      load();
    } else {
      toast.error(d.error ?? "Sign failed");
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", uploadType);
      form.append("label", uploadLabel);
      if (replaceId) form.append("replaceUploadId", replaceId);

      const res = await fetch("/api/me/documents/uploads", { method: "POST", body: form });
      const d = await res.json();
      if (d.ok) {
        toast.success(replaceId ? "Document resubmitted" : "Document uploaded");
        setReplaceId(null);
        load();
      } else {
        toast.error(d.error ?? "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const openView = async (doc: EmployeeDocument) => {
    const res = await fetch(`/api/hr/documents/${doc.id}`);
    const d = await res.json();
    if (d.ok) setViewDoc(d.document);
    else toast.error(d.error ?? "Could not load document");
  };

  return (
    <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">My Documents</h1>

      <PremiumCard className="p-3 text-sm text-muted-foreground">
        Review assigned policies, sign electronically, and upload required files (license, certifications).
      </PremiumCard>

      <Input
        placeholder="Full legal name for signature"
        value={signerName}
        onChange={(e) => setSignerName(e.target.value)}
      />

      <PremiumCard className="p-3">
        <p className="text-sm font-medium mb-2">Draw signature</p>
        <SignatureCanvas onChange={setSignatureDataUrl} />
      </PremiumCard>

      {viewDoc && (
        <PremiumCard className="p-4 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h2 className="font-bold">{viewDoc.name}</h2>
            <Button variant="ghost" size="sm" onClick={() => setViewDoc(null)}>Close</Button>
          </div>
          {viewDoc.contentHtml && (
            <div
              className="prose prose-sm max-w-none text-sm border rounded-lg p-3 max-h-64 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: viewDoc.contentHtml }}
            />
          )}
          {viewDoc.signedUrl && (
            <a
              href={viewDoc.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="mr-1 h-3 w-3 inline" /> Open PDF
            </a>
          )}
          {viewDoc.status === "pending" && (
            <Button onClick={() => void sign(viewDoc.id)}>Sign this document</Button>
          )}
        </PremiumCard>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">To sign ({pending.length})</TabsTrigger>
          <TabsTrigger value="signed">Signed ({signed.length})</TabsTrigger>
          <TabsTrigger value="uploads">My uploads ({uploads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2 mt-3">
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">No documents waiting for signature.</p>
          ) : (
            pending.map((doc) => (
              <DocCard key={doc.id} doc={doc} onView={() => void openView(doc)} onSign={() => void openView(doc)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="signed" className="space-y-2 mt-3">
          {signed.length === 0 ? (
            <p className="text-muted-foreground text-sm">No signed documents yet.</p>
          ) : (
            signed.map((doc) => (
              <DocCard key={doc.id} doc={doc} signed onView={() => void openView(doc)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="uploads" className="space-y-2 mt-3">
          {uploads.map((u) => (
            <PremiumCard key={u.id} className="p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{u.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.documentType.replace(/_/g, " ")} · v{u.version}</p>
                  {u.reviewNotes && (
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {u.reviewNotes}
                    </p>
                  )}
                </div>
                <Badge variant={u.status === "approved" ? "default" : u.status === "rejected" ? "destructive" : "secondary"}>
                  {u.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="mt-2 flex gap-2">
                {u.signedUrl && (
                  <a
                    href={u.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    View
                  </a>
                )}
                {u.status === "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplaceId(u.id);
                      setUploadType(u.documentType);
                      setUploadLabel(u.label);
                    }}
                  >
                    Resubmit
                  </Button>
                )}
              </div>
            </PremiumCard>
          ))}
        </TabsContent>
      </Tabs>

      <PremiumCard className="p-4 border-dashed space-y-3">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="font-medium text-sm">{replaceId ? "Resubmit document" : "Upload document"}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={uploadType} onValueChange={(v) => v && setUploadType(v as EmployeeDocumentUpload["documentType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="drivers_license">Driver&apos;s license</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Label</Label>
            <Input value={uploadLabel} onChange={(e) => setUploadLabel(e.target.value)} />
          </div>
        </div>
        <Input
          type="file"
          accept="image/*,application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f);
            e.target.value = "";
          }}
        />
        {replaceId && (
          <Button variant="ghost" size="sm" onClick={() => setReplaceId(null)}>Cancel resubmit</Button>
        )}
      </PremiumCard>
    </div>
  );
}

function DocCard({
  doc,
  onSign,
  onView,
  signed,
}: {
  doc: EmployeeDocument;
  onSign?: () => void;
  onView?: () => void;
  signed?: boolean;
}) {
  return (
    <PremiumCard className="p-4">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{doc.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{doc.documentKey.replace(/_/g, " ")} · v{doc.version}</p>
          <Badge className="mt-2" variant={signed ? "default" : "secondary"}>
            {signed ? "Signed" : "Pending signature"}
          </Badge>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={onView}>View</Button>
        {!signed && onSign && (
          <Button size="sm" onClick={onSign}>
            <PenLine className="mr-1 h-3 w-3" /> Sign
          </Button>
        )}
        {signed && (
          <span className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        )}
      </div>
    </PremiumCard>
  );
}
