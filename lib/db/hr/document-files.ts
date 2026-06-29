import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/db/activity";
import { uploadToStorage, createSignedStorageUrl } from "@/lib/storage/upload";
import { STORAGE_BUCKETS } from "@/lib/storage/buckets";
import {
  rowToEmployeeDocument,
  rowToDocumentTemplate,
  rowToDocumentSignature,
} from "@/lib/db/hr-mappers";
import type {
  ApplicantDocument,
  ApplicantDocumentType,
  DocumentAuditEntry,
  DocumentTemplate,
  EmployeeDocument,
  EmployeeDocumentUpload,
  EmployeeUploadStatus,
  EmployeeUploadType,
} from "@/types/hr/documents";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

const ALLOWED_DOC_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export function validateDocumentFile(file: File, maxBytes = 20 * 1024 * 1024) {
  if (!ALLOWED_DOC_MIME.has(file.type)) {
    throw new Error("Unsupported file type. Use JPEG, PNG, WebP, or PDF.");
  }
  if (file.size > maxBytes) throw new Error("File too large (max 20MB)");
}

async function logDocumentAudit(params: {
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  notes?: string;
  actorProfileId?: string;
}) {
  const sb = await sbWrite();
  await sb.from("document_audit_log").insert({
    id: id("daudit"),
    company_id: params.companyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    notes: params.notes ?? null,
    actor_profile_id: params.actorProfileId ?? null,
    created_at: new Date().toISOString(),
  });
}

export async function getDocumentAuditLog(
  companyId: string,
  entityType: string,
  entityId: string
): Promise<DocumentAuditEntry[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("document_audit_log")
    .select("*")
    .eq("company_id", companyId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    entityType: r.entity_type as string,
    entityId: r.entity_id as string,
    action: r.action as string,
    notes: (r.notes as string) ?? undefined,
    actorProfileId: (r.actor_profile_id as string) ?? undefined,
    createdAt: r.created_at as string,
  }));
}

function rowToEmployeeUpload(r: Record<string, unknown>): EmployeeDocumentUpload {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    employeeId: r.employee_id as string,
    documentType: r.document_type as EmployeeUploadType,
    label: r.label as string,
    storagePath: r.storage_path as string,
    mimeType: (r.mime_type as string) ?? undefined,
    fileSize: r.file_size != null ? Number(r.file_size) : undefined,
    status: r.status as EmployeeUploadStatus,
    reviewNotes: (r.review_notes as string) ?? undefined,
    reviewedAt: (r.reviewed_at as string) ?? undefined,
    version: Number(r.version ?? 1),
    createdAt: r.created_at as string,
  };
}

function rowToApplicantDocument(r: Record<string, unknown>): ApplicantDocument {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    applicantId: r.applicant_id as string,
    applicationId: (r.application_id as string) ?? undefined,
    documentType: r.document_type as ApplicantDocumentType,
    originalFilename: (r.original_filename as string) ?? undefined,
    storagePath: r.storage_path as string,
    mimeType: (r.mime_type as string) ?? undefined,
    fileSize: r.file_size != null ? Number(r.file_size) : undefined,
    createdAt: r.created_at as string,
  };
}

async function withSignedUrl<T extends { storagePath: string; signedUrl?: string }>(
  bucket: typeof STORAGE_BUCKETS.employeeDocuments,
  row: T
): Promise<T> {
  try {
    const signedUrl = await createSignedStorageUrl(bucket, row.storagePath);
    return { ...row, signedUrl };
  } catch {
    return row;
  }
}

export async function getEmployeeDocumentDetail(
  companyId: string,
  documentId: string,
  employeeId?: string
): Promise<EmployeeDocument | null> {
  const sb = await sbWrite();
  let query = sb
    .from("employee_documents")
    .select("*, document_templates(content_html, storage_path)")
    .eq("company_id", companyId)
    .eq("id", documentId);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const doc = rowToEmployeeDocument(data);
  const rawTpl = data.document_templates as unknown;
  const tpl = (Array.isArray(rawTpl) ? rawTpl[0] : rawTpl) as Record<string, unknown> | null;
  doc.contentHtml = (tpl?.content_html as string) ?? undefined;

  const { data: sigs } = await sb
    .from("document_signatures")
    .select("*")
    .eq("employee_document_id", documentId);
  doc.signatures = (sigs ?? []).map(rowToDocumentSignature);

  if (doc.storagePath) {
    doc.signedUrl = await createSignedStorageUrl(STORAGE_BUCKETS.employeeDocuments, doc.storagePath).catch(() => undefined);
  } else if (tpl?.storage_path) {
    doc.signedUrl = await createSignedStorageUrl(STORAGE_BUCKETS.hrDocuments, tpl.storage_path as string).catch(() => undefined);
  }

  return doc;
}

export async function getEmployeeUploads(
  companyId: string,
  employeeId: string,
  withUrls = true
): Promise<EmployeeDocumentUpload[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("employee_document_uploads")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .neq("status", "superseded")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).map(rowToEmployeeUpload);
  if (!withUrls) return rows;
  return Promise.all(rows.map((r) => withSignedUrl(STORAGE_BUCKETS.employeeDocuments, r)));
}

export async function uploadEmployeeDocument(
  companyId: string,
  employeeId: string,
  params: {
    file: Buffer;
    fileName: string;
    mimeType: string;
    fileSize: number;
    documentType: EmployeeUploadType;
    label: string;
    uploadedByProfileId?: string;
    replaceUploadId?: string;
  }
): Promise<EmployeeDocumentUpload> {
  const uploadId = id("edup");
  const ext = params.mimeType === "application/pdf" ? "pdf" : params.mimeType.includes("png") ? "png" : "jpg";
  const storagePath = `${companyId}/${employeeId}/${uploadId}.${ext}`;

  await uploadToStorage({
    bucket: STORAGE_BUCKETS.employeeDocuments,
    path: storagePath,
    body: params.file,
    contentType: params.mimeType,
  });

  if (params.replaceUploadId) {
    const sb = await sbWrite();
    const { data: prev } = await sb
      .from("employee_document_uploads")
      .select("version")
      .eq("id", params.replaceUploadId)
      .maybeSingle();
    await sb
      .from("employee_document_uploads")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("id", params.replaceUploadId);
    const version = Number(prev?.version ?? 1) + 1;
    const row = {
      id: uploadId,
      company_id: companyId,
      employee_id: employeeId,
      document_type: params.documentType,
      label: params.label,
      storage_path: storagePath,
      mime_type: params.mimeType,
      file_size: params.fileSize,
      status: "pending_review",
      version,
      previous_upload_id: params.replaceUploadId,
      uploaded_by_profile_id: params.uploadedByProfileId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await sb.from("employee_document_uploads").insert(row);
    await logDocumentAudit({
      companyId,
      entityType: "employee_upload",
      entityId: uploadId,
      action: "resubmitted",
      actorProfileId: params.uploadedByProfileId,
    });
    return rowToEmployeeUpload(row);
  }

  const sb = await sbWrite();
  const row = {
    id: uploadId,
    company_id: companyId,
    employee_id: employeeId,
    document_type: params.documentType,
    label: params.label,
    storage_path: storagePath,
    mime_type: params.mimeType,
    file_size: params.fileSize,
    status: "pending_review",
    version: 1,
    uploaded_by_profile_id: params.uploadedByProfileId ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await sb.from("employee_document_uploads").insert(row);
  await logDocumentAudit({
    companyId,
    entityType: "employee_upload",
    entityId: uploadId,
    action: "uploaded",
    actorProfileId: params.uploadedByProfileId,
  });
  return rowToEmployeeUpload(row);
}

export async function reviewEmployeeUpload(
  companyId: string,
  uploadId: string,
  params: {
    status: "approved" | "rejected";
    reviewNotes?: string;
    reviewedByProfileId?: string;
  }
) {
  const sb = await sbWrite();
  await sb
    .from("employee_document_uploads")
    .update({
      status: params.status,
      review_notes: params.reviewNotes ?? null,
      reviewed_by_profile_id: params.reviewedByProfileId ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", uploadId)
    .eq("company_id", companyId);

  await logDocumentAudit({
    companyId,
    entityType: "employee_upload",
    entityId: uploadId,
    action: params.status,
    notes: params.reviewNotes,
    actorProfileId: params.reviewedByProfileId,
  });
}

export async function uploadApplicantDocument(
  companyId: string,
  params: {
    applicantId: string;
    applicationId?: string;
    documentType: ApplicantDocumentType;
    file: Buffer;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedByProfileId?: string;
  }
): Promise<ApplicantDocument> {
  const docId = id("adoc");
  const ext = params.mimeType === "application/pdf" ? "pdf" : params.mimeType.includes("png") ? "png" : "jpg";
  const storagePath = `${companyId}/${params.applicantId}/${docId}.${ext}`;

  await uploadToStorage({
    bucket: STORAGE_BUCKETS.applicantDocuments,
    path: storagePath,
    body: params.file,
    contentType: params.mimeType,
  });

  const sb = await sbWrite();
  const row = {
    id: docId,
    company_id: companyId,
    applicant_id: params.applicantId,
    application_id: params.applicationId ?? null,
    document_type: params.documentType,
    original_filename: params.fileName,
    storage_path: storagePath,
    mime_type: params.mimeType,
    file_size: params.fileSize,
    uploaded_by_profile_id: params.uploadedByProfileId ?? null,
    created_at: new Date().toISOString(),
  };
  await sb.from("applicant_documents").insert(row);
  await logDocumentAudit({
    companyId,
    entityType: "applicant_document",
    entityId: docId,
    action: "uploaded",
    actorProfileId: params.uploadedByProfileId,
  });
  return rowToApplicantDocument(row);
}

export async function getApplicantDocuments(
  companyId: string,
  applicantId: string,
  withUrls = true
): Promise<ApplicantDocument[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("applicant_documents")
    .select("*")
    .eq("company_id", companyId)
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).map(rowToApplicantDocument);
  if (!withUrls) return rows;
  return Promise.all(
    rows.map(async (r) => {
      try {
        return { ...r, signedUrl: await createSignedStorageUrl(STORAGE_BUCKETS.applicantDocuments, r.storagePath) };
      } catch {
        return r;
      }
    })
  );
}

export async function getDocumentTemplatesAdmin(companyId: string): Promise<DocumentTemplate[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("document_templates")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(rowToDocumentTemplate);
}

export async function uploadHrTemplateFile(
  companyId: string,
  templateId: string,
  params: {
    file: Buffer;
    mimeType: string;
    fileName: string;
    actorProfileId?: string;
    changeSummary?: string;
  }
): Promise<DocumentTemplate> {
  const sb = await sbWrite();
  const { data: tmpl } = await sb
    .from("document_templates")
    .select("*")
    .eq("id", templateId)
    .eq("company_id", companyId)
    .single();
  if (!tmpl) throw new Error("Template not found");

  const newVersion = Number(tmpl.version ?? 1) + 1;
  const ext = params.mimeType === "application/pdf" ? "pdf" : "jpg";
  const storagePath = `${companyId}/templates/${templateId}/v${newVersion}.${ext}`;

  await uploadToStorage({
    bucket: STORAGE_BUCKETS.hrDocuments,
    path: storagePath,
    body: params.file,
    contentType: params.mimeType,
  });

  const versionId = id("dtv");
  await sb.from("document_template_versions").insert({
    id: versionId,
    company_id: companyId,
    template_id: templateId,
    version: newVersion,
    content_html: (tmpl.content_html as string) ?? `<p>${tmpl.name}</p>`,
    storage_path: storagePath,
    change_summary: params.changeSummary ?? "File uploaded",
    created_at: new Date().toISOString(),
  });

  await sb
    .from("document_templates")
    .update({
      version: newVersion,
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);

  await logDocumentAudit({
    companyId,
    entityType: "document_template",
    entityId: templateId,
    action: "version_uploaded",
    notes: `v${newVersion}`,
    actorProfileId: params.actorProfileId,
  });

  return rowToDocumentTemplate({ ...tmpl, version: newVersion, storage_path: storagePath });
}

export async function setEmployeeAvatar(
  companyId: string,
  employeeId: string,
  params: { file: Buffer; mimeType: string; actorProfileId?: string }
): Promise<string> {
  const ext = params.mimeType.includes("png") ? "png" : "jpg";
  const storagePath = `${companyId}/${employeeId}/avatar.${ext}`;
  await uploadToStorage({
    bucket: STORAGE_BUCKETS.employeeDocuments,
    path: storagePath,
    body: params.file,
    contentType: params.mimeType,
  });
  const sb = await sbWrite();
  await sb
    .from("employees")
    .update({ avatar_storage_path: storagePath, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("company_id", companyId);
  await logDocumentAudit({
    companyId,
    entityType: "employee_avatar",
    entityId: employeeId,
    action: "updated",
    actorProfileId: params.actorProfileId,
  });
  return storagePath;
}

export async function clearEmployeeAvatar(companyId: string, employeeId: string, actorProfileId?: string) {
  const sb = await sbWrite();
  await sb
    .from("employees")
    .update({ avatar_storage_path: null, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("company_id", companyId);
  await logDocumentAudit({
    companyId,
    entityType: "employee_avatar",
    entityId: employeeId,
    action: "removed",
    actorProfileId,
  });
}

export async function getEmployeeAvatarUrl(companyId: string, employeeId: string): Promise<string | null> {
  const sb = await sbWrite();
  const { data } = await sb
    .from("employees")
    .select("avatar_storage_path")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();
  const path = data?.avatar_storage_path as string | undefined;
  if (!path) return null;
  return createSignedStorageUrl(STORAGE_BUCKETS.employeeDocuments, path);
}

async function dataUrlToPngBuffer(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
}

export async function signEmployeeDocumentWithStorage(
  companyId: string,
  documentId: string,
  payload: {
    signerName: string;
    signerProfileId?: string;
    employeeId: string;
    ipAddress?: string;
    userAgent?: string;
    signatureDataUrl?: string;
  }
): Promise<{ signatureId: string; pdfStoragePath?: string }> {
  const doc = await getEmployeeDocumentDetail(companyId, documentId, payload.employeeId);
  if (!doc) throw new Error("Document not found");
  if (doc.status === "signed") throw new Error("Document already signed");

  const sb = await sbWrite();
  const sigId = id("dsig");
  let signaturePath: string | null = null;

  if (payload.signatureDataUrl) {
    signaturePath = `${companyId}/${payload.employeeId}/signatures/${sigId}.png`;
    const png = await dataUrlToPngBuffer(payload.signatureDataUrl);
    await uploadToStorage({
      bucket: STORAGE_BUCKETS.employeeDocuments,
      path: signaturePath,
      body: png,
      contentType: "image/png",
    });
  }

  let pdfStoragePath: string | undefined;
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let y = 750;
    const draw = (text: string, size = 11, bold = false) => {
      page.drawText(text, { x: 50, y, size, font: bold ? fontBold : font, color: rgb(0.1, 0.1, 0.1) });
      y -= size + 6;
    };
    draw(doc.name, 16, true);
    draw(`Signed by: ${payload.signerName}`, 10, true);
    draw(`Date: ${new Date().toLocaleString()}`, 10);
    draw(`Document key: ${doc.documentKey} · v${doc.version}`, 9);
    const plain = (doc.contentHtml ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    for (const chunk of plain.match(/.{1,90}/g) ?? []) {
      if (y < 80) break;
      draw(chunk, 9);
    }
    if (signaturePath && payload.signatureDataUrl) {
      const png = await dataUrlToPngBuffer(payload.signatureDataUrl);
      const img = await pdfDoc.embedPng(png);
      page.drawImage(img, { x: 50, y: 40, width: 180, height: 60 });
    }
    const pdfBytes = await pdfDoc.save();
    pdfStoragePath = `${companyId}/${payload.employeeId}/signed/${documentId}.pdf`;
    await uploadToStorage({
      bucket: STORAGE_BUCKETS.employeeDocuments,
      path: pdfStoragePath,
      body: Buffer.from(pdfBytes),
      contentType: "application/pdf",
    });
  } catch {
    pdfStoragePath = undefined;
  }

  await sb.from("document_signatures").insert({
    id: sigId,
    company_id: companyId,
    employee_document_id: documentId,
    signer_profile_id: payload.signerProfileId,
    signer_name: payload.signerName,
    ip_address: payload.ipAddress,
    user_agent: payload.userAgent,
    signature_image_path: signaturePath,
    pdf_storage_path: pdfStoragePath ?? null,
    template_version: doc.version,
  });

  await sb
    .from("employee_documents")
    .update({
      status: "signed",
      storage_path: pdfStoragePath ?? null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  await logDocumentAudit({
    companyId,
    entityType: "employee_document",
    entityId: documentId,
    action: "signed",
    actorProfileId: payload.signerProfileId,
  });

  await logActivity({
    companyId,
    actorProfileId: payload.signerProfileId,
    entityType: "employee_document",
    entityId: documentId,
    action: "signed",
    message: `${payload.signerName} signed ${doc.name}`,
  });

  return { signatureId: sigId, pdfStoragePath };
}
