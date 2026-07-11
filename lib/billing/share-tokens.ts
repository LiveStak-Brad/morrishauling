import { createAdminClient } from "@/lib/supabase/admin";
import { createShareToken, hashShareToken } from "@/lib/billing/utils";
import { getAppBaseUrl } from "@/lib/payments/stripe-client";

type ShareEntity = "estimate" | "invoice";

function tableFor(entity: ShareEntity) {
  return entity === "estimate" ? "estimates" : "invoices";
}

function pathFor(entity: ShareEntity, token: string) {
  return entity === "estimate" ? `/e/${token}` : `/i/${token}`;
}

export type ShareTokenAccess =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "inactive" };

export async function resolveShareToken(
  entity: ShareEntity,
  token: string
): Promise<ShareTokenAccess> {
  const sb = createAdminClient();
  if (!sb || !token) return { ok: false, reason: "not_found" };

  const { data, error } = await sb
    .from(tableFor(entity))
    .select("*")
    .eq("share_token_hash", hashShareToken(token))
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "not_found" };

  if (data.share_token_revoked_at) return { ok: false, reason: "revoked" };

  const expiresAt = data.share_token_expires_at as string | null;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (entity === "invoice" && data.status === "void") {
    return { ok: false, reason: "inactive" };
  }

  return { ok: true, row: data as Record<string, unknown> };
}

export async function regenerateShareToken(
  entity: ShareEntity,
  companyId: string,
  id: string,
  options?: { extendDays?: number }
): Promise<{ token: string; customerUrl: string; expiresAt: string }> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database unavailable");

  const created = createShareToken();
  if (options?.extendDays && options.extendDays > 0) {
    created.expiresAt = new Date(
      Date.now() + options.extendDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const { error } = await sb
    .from(tableFor(entity))
    .update({
      share_token_hash: created.hash,
      share_token_expires_at: created.expiresAt,
      share_token_revoked_at: null,
    })
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;

  return {
    token: created.token,
    customerUrl: `${getAppBaseUrl()}${pathFor(entity, created.token)}`,
    expiresAt: created.expiresAt,
  };
}

export async function revokeShareToken(
  entity: ShareEntity,
  companyId: string,
  id: string
): Promise<void> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database unavailable");
  const { error } = await sb
    .from(tableFor(entity))
    .update({ share_token_revoked_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
}

export async function extendShareToken(
  entity: ShareEntity,
  companyId: string,
  id: string,
  days = 90
): Promise<{ expiresAt: string }> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database unavailable");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await sb
    .from(tableFor(entity))
    .update({
      share_token_expires_at: expiresAt,
      share_token_revoked_at: null,
    })
    .eq("company_id", companyId)
    .eq("id", id);
  if (error) throw error;
  return { expiresAt };
}
