import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { getCurrentProfile } from "@/lib/auth/server";
import { isAdmin, isPlanner } from "@/lib/auth/permissions";
import { getJobById, updateJob } from "@/lib/db";
import { logActivity } from "@/lib/db/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { useSupabaseData } from "@/lib/db/config";
import { verifyPlaceId, isGooglePlacesConfigured } from "@/lib/geo/verify-place";
import { verifiedToJobAddress } from "@/lib/geo/address-from-location";
import { RouteCalculationError } from "@/lib/geo/types";
import type { VerifiedAddress } from "@/types/address";

type Body = {
  reason: string;
  /** When provided, re-verify via Places; otherwise treat as manual override coords */
  placeId?: string;
  line2?: string;
  address?: Partial<VerifiedAddress> & {
    line1?: string;
    street?: string;
    lat?: number;
    lng?: number;
  };
  addressRole?: "service" | "pickup" | "delivery";
};

function overrideId() {
  return `ao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || (!isAdmin(profile) && !isPlanner(profile))) {
      return apiError("Manager or planner access required", 403);
    }

    const { id: jobId } = await context.params;
    const body = await parseJson<Body>(request);
    if (!body.reason?.trim() || body.reason.trim().length < 5) {
      return apiError("A reason (at least 5 characters) is required for address overrides.", 400);
    }

    const companyId = profile.company_id;
    if (!companyId) return apiError("Company context required", 400);

    const job = await getJobById(companyId, jobId);
    if (!job) return apiError("Job not found", 404);

    let nextAddress = job.address;
    let snapshot: VerifiedAddress;

    if (body.placeId && isGooglePlacesConfigured()) {
      const verified = await verifyPlaceId(body.placeId, {
        line2: body.line2 ?? body.address?.line2,
        lat: body.address?.lat,
        lng: body.address?.lng,
      });
      snapshot = {
        ...verified.address,
        verificationStatus: "manual_override",
        provider: "google_places",
        verifiedAt: new Date().toISOString(),
      };
      nextAddress = verifiedToJobAddress(snapshot);
    } else if (
      body.address?.lat != null &&
      body.address?.lng != null &&
      (body.address.line1 || body.address.street)
    ) {
      const line1 = (body.address.line1 ?? body.address.street)!.trim();
      snapshot = {
        line1,
        line2: body.line2 ?? body.address.line2,
        city: body.address.city ?? job.address.city,
        state: body.address.state ?? job.address.state,
        zip: body.address.zip ?? job.address.zip,
        country: body.address.country ?? "US",
        formattedAddress:
          body.address.formattedAddress ??
          [line1, body.address.city ?? job.address.city, body.address.state ?? job.address.state, body.address.zip ?? job.address.zip]
            .filter(Boolean)
            .join(", "),
        lat: body.address.lat,
        lng: body.address.lng,
        placeId: body.placeId ?? body.address.placeId ?? `manual-${jobId}`,
        verificationStatus: "manual_override",
        provider: "manual",
        verifiedAt: new Date().toISOString(),
      };
      nextAddress = verifiedToJobAddress(snapshot);
    } else {
      return apiError(
        "Provide a placeId to re-verify, or a full address with lat/lng for a manual override.",
        400
      );
    }

    const updated = await updateJob(
      companyId,
      jobId,
      { address: nextAddress },
      { actorProfileId: profile.id }
    );
    if (!updated) return apiError("Failed to update job address", 500);

    const row = {
      id: overrideId(),
      company_id: companyId,
      job_id: jobId,
      actor_profile_id: profile.id,
      reason: body.reason.trim(),
      address_role: body.addressRole ?? "service",
      address_snapshot: snapshot,
      latitude: snapshot.lat,
      longitude: snapshot.lng,
      created_at: new Date().toISOString(),
    };

    if (useSupabaseData()) {
      try {
        const sb = createAdminClient() ?? (await createClient());
        await sb.from("address_overrides").insert(row);
      } catch {
        // Table may not exist yet — activity log still records the override
      }
    }

    await logActivity({
      companyId,
      actorProfileId: profile.id,
      entityType: "job",
      entityId: jobId,
      action: "address_override",
      message: `Address override: ${snapshot.formattedAddress} — ${body.reason.trim()}`,
      metadata: {
        reason: body.reason.trim(),
        placeId: snapshot.placeId,
        previous: job.address,
        next: nextAddress,
      },
    });

    return apiOk({ job: updated, override: snapshot });
  } catch (e) {
    if (e instanceof RouteCalculationError) {
      return apiError(e.message, e.code === "incomplete_address" ? 400 : 502);
    }
    return apiError(e instanceof Error ? e.message : "Address override failed", 500);
  }
}
