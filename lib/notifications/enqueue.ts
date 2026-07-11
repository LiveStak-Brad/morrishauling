import { createAdminClient } from "@/lib/supabase/admin";
import type { DivisionId } from "@/lib/divisions";

export type NotificationEventType =
  | "request_received"
  | "estimate_ready"
  | "estimate_revised"
  | "estimate_approved"
  | "job_scheduled"
  | "schedule_changed"
  | "crew_assigned"
  | "crew_en_route"
  | "arrival_update"
  | "job_completed"
  | "invoice_available"
  | "payment_received";

const COPY: Record<NotificationEventType, { title: string; body: string }> = {
  request_received: {
    title: "Request received",
    body: "We received your request and will follow up with next steps.",
  },
  estimate_ready: {
    title: "Estimate ready",
    body: "Your estimate is ready to review in your Morris account.",
  },
  estimate_revised: {
    title: "Estimate updated",
    body: "Your estimate was revised. Please review the updated details.",
  },
  estimate_approved: {
    title: "Estimate approved",
    body: "Thanks — your estimate approval was recorded.",
  },
  job_scheduled: {
    title: "Job scheduled",
    body: "Your job has been scheduled. Check your account for the arrival window.",
  },
  schedule_changed: {
    title: "Schedule changed",
    body: "Your scheduled window was updated. Please review the new details.",
  },
  crew_assigned: {
    title: "Crew assigned",
    body: "A crew has been assigned to your job.",
  },
  crew_en_route: {
    title: "Crew en route",
    body: "Your crew is on the way.",
  },
  arrival_update: {
    title: "Arrival update",
    body: "Your crew has arrived or is arriving shortly.",
  },
  job_completed: {
    title: "Job completed",
    body: "Your job is marked complete. An invoice will follow if one is due.",
  },
  invoice_available: {
    title: "Invoice available",
    body: "Your invoice is available in your Morris account.",
  },
  payment_received: {
    title: "Payment received",
    body: "We recorded your payment. Thank you.",
  },
};

/**
 * Creates an in-app notification event.
 * Email/SMS delivery stays behind configuration until providers are live.
 */
export async function enqueueNotification(input: {
  companyId: string;
  divisionId?: DivisionId;
  jobId?: string;
  customerId?: string | null;
  profileId?: string | null;
  eventType: NotificationEventType;
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
  channel?: "in_app" | "email" | "sms";
}): Promise<{ ok: boolean; id?: string }> {
  const defaults = COPY[input.eventType];
  const title = input.title ?? defaults.title;
  const body = input.body ?? defaults.body;
  const channel = input.channel ?? "in_app";

  try {
    const sb = createAdminClient();
    if (!sb) return { ok: false };

    const id = `ne-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { error } = await sb.from("notification_events").insert({
      id,
      company_id: input.companyId,
      division_id: input.divisionId ?? null,
      job_id: input.jobId ?? null,
      customer_id: input.customerId ?? null,
      profile_id: input.profileId ?? null,
      event_type: input.eventType,
      channel,
      title,
      body,
      payload: input.payload ?? {},
      status: "pending",
    });

    if (error) {
      console.warn("[notifications] enqueue failed:", error.message);
      return { ok: false };
    }

    if (input.profileId) {
      try {
        await sb.from("notifications").insert({
          id: `n-${id}`,
          company_id: input.companyId,
          profile_id: input.profileId,
          customer_id: input.customerId ?? null,
          title,
          body,
          type: input.eventType,
          status: "unread",
          metadata: { jobId: input.jobId, divisionId: input.divisionId, ...(input.payload ?? {}) },
        });
      } catch {
        /* legacy table optional */
      }
    }

    const emailEnabled = process.env.NOTIFICATIONS_EMAIL_ENABLED === "true";
    const smsEnabled = process.env.NOTIFICATIONS_SMS_ENABLED === "true";
    if ((channel === "email" && !emailEnabled) || (channel === "sms" && !smsEnabled)) {
      await sb
        .from("notification_events")
        .update({ status: "skipped", error_message: `${channel} provider not enabled` })
        .eq("id", id);
    } else if (channel === "in_app") {
      await sb
        .from("notification_events")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", id);
    }

    return { ok: true, id };
  } catch (e) {
    console.warn("[notifications] enqueue error:", e);
    return { ok: false };
  }
}
