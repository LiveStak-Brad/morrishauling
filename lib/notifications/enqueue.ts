import { createAdminClient } from "@/lib/supabase/admin";
import type { DivisionId } from "@/lib/divisions";
import { isEmailDeliveryConfigured } from "@/lib/billing/utils";
import { sendEmailMessage } from "@/lib/email/send";
import { customerEmailShell, emailCopyForEvent } from "@/lib/email/templates";
import { billingId } from "@/lib/billing/utils";

export type NotificationEventType =
  | "request_received"
  | "estimate_ready"
  | "estimate_revised"
  | "estimate_reminder"
  | "estimate_approved"
  | "job_scheduled"
  | "schedule_changed"
  | "crew_assigned"
  | "crew_en_route"
  | "arrival_update"
  | "job_completed"
  | "invoice_available"
  | "invoice_reminder"
  | "partial_payment"
  | "payment_received"
  | "balance_paid"
  | "invoice_void";

export type NotificationDeliveryStatus =
  | "queued"
  | "pending"
  | "sending"
  | "provider_accepted"
  | "delivered"
  | "failed"
  | "bounced"
  | "skipped"
  | "sent"
  | "resent";

const COPY: Record<string, { title: string; body: string }> = {
  request_received: {
    title: "Request received",
    body: "We received your request and will follow up with next steps.",
  },
  estimate_ready: {
    title: "Estimate ready",
    body: "Your estimate is ready to review.",
  },
  estimate_revised: {
    title: "Estimate updated",
    body: "Your estimate was revised. Please review the updated details.",
  },
  estimate_reminder: {
    title: "Estimate reminder",
    body: "Friendly reminder — your estimate is waiting for your review.",
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
    body: "Your invoice is available to view.",
  },
  invoice_reminder: {
    title: "Invoice reminder",
    body: "Friendly reminder — you have an open invoice balance.",
  },
  partial_payment: {
    title: "Partial payment received",
    body: "We recorded a partial payment on your account.",
  },
  payment_received: {
    title: "Payment received",
    body: "We recorded your payment. Thank you.",
  },
  balance_paid: {
    title: "Balance paid",
    body: "Your invoice balance is paid in full. Thank you.",
  },
  invoice_void: {
    title: "Invoice update",
    body: "An invoice on your account was voided or replaced. Contact us if you have questions.",
  },
};

async function resolveCustomerEmail(
  sb: NonNullable<ReturnType<typeof createAdminClient>>,
  customerId?: string | null,
  profileId?: string | null
): Promise<string | null> {
  if (customerId) {
    const { data } = await sb.from("customers").select("email").eq("id", customerId).maybeSingle();
    if (data?.email) return String(data.email);
  }
  if (profileId) {
    const { data } = await sb.from("profiles").select("email").eq("id", profileId).maybeSingle();
    if (data?.email) return String(data.email);
  }
  return null;
}

/**
 * Creates a notification event and attempts email delivery when channel=email.
 * Provider acceptance ≠ confirmed delivery (delivered/bounced come from provider webhooks later).
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
  toEmail?: string;
}): Promise<{
  ok: boolean;
  id?: string;
  deliveryStatus?: NotificationDeliveryStatus;
  deliveryMessage?: string;
  customerUrl?: string;
}> {
  const defaults = COPY[input.eventType] ?? { title: "Morris Services", body: "" };
  const title = input.title ?? defaults.title;
  const body = input.body ?? defaults.body;
  const channel = input.channel ?? "in_app";
  const customerUrl =
    typeof input.payload?.customerUrl === "string" ? input.payload.customerUrl : undefined;

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
      status: "queued",
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
          metadata: {
            jobId: input.jobId,
            divisionId: input.divisionId,
            ...(input.payload ?? {}),
          },
        });
      } catch {
        /* legacy table optional */
      }
    }

    if (channel === "in_app") {
      await sb
        .from("notification_events")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", id);
      return { ok: true, id, deliveryStatus: "sent", customerUrl };
    }

    if (channel === "sms") {
      if (process.env.NOTIFICATIONS_SMS_ENABLED !== "true") {
        await sb
          .from("notification_events")
          .update({
            status: "skipped",
            error_message: "SMS provider not configured",
          })
          .eq("id", id);
        return {
          ok: true,
          id,
          deliveryStatus: "skipped",
          deliveryMessage: "SMS provider not configured",
          customerUrl,
        };
      }
      await sb
        .from("notification_events")
        .update({
          status: "skipped",
          error_message: "SMS provider not implemented yet",
        })
        .eq("id", id);
      return {
        ok: true,
        id,
        deliveryStatus: "skipped",
        deliveryMessage: "SMS provider not implemented yet",
        customerUrl,
      };
    }

    // Email channel
    if (!isEmailDeliveryConfigured()) {
      await sb
        .from("notification_events")
        .update({
          status: "skipped",
          error_message: "Email provider not configured",
        })
        .eq("id", id);
      return {
        ok: true,
        id,
        deliveryStatus: "skipped",
        deliveryMessage: "Email provider not configured",
        customerUrl,
      };
    }

    const to =
      input.toEmail ||
      (await resolveCustomerEmail(sb, input.customerId, input.profileId));

    if (!to) {
      await sb
        .from("notification_events")
        .update({
          status: "failed",
          error_message: "No customer email on file",
        })
        .eq("id", id);
      return {
        ok: true,
        id,
        deliveryStatus: "failed",
        deliveryMessage: "No customer email on file",
        customerUrl,
      };
    }

    const result = await deliverEmailEvent({
      eventId: id,
      companyId: input.companyId,
      eventType: input.eventType,
      to,
      title,
      body,
      payload: input.payload ?? {},
    });

    return {
      ok: true,
      id,
      deliveryStatus: result.status,
      deliveryMessage: result.message,
      customerUrl,
    };
  } catch (e) {
    console.warn("[notifications] enqueue error:", e);
    return { ok: false };
  }
}

export async function deliverEmailEvent(input: {
  eventId: string;
  companyId: string;
  eventType: string;
  to: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  resent?: boolean;
}): Promise<{ status: NotificationDeliveryStatus; message?: string }> {
  const sb = createAdminClient();
  if (!sb) return { status: "failed", message: "Database unavailable" };

  await sb
    .from("notification_events")
    .update({
      status: "sending",
      last_attempt_at: new Date().toISOString(),
      attempt_count: undefined,
    })
    .eq("id", input.eventId);

  // Increment attempt_count via read-modify
  const { data: row } = await sb
    .from("notification_events")
    .select("attempt_count")
    .eq("id", input.eventId)
    .maybeSingle();
  const attempts = Number(row?.attempt_count ?? 0) + 1;
  await sb
    .from("notification_events")
    .update({ attempt_count: attempts, last_attempt_at: new Date().toISOString() })
    .eq("id", input.eventId);

  const copy =
    emailCopyForEvent(input.eventType, input.payload) ?? {
      title: input.title,
      body: `<p>${input.body}</p>`,
      ctaUrl: typeof input.payload.customerUrl === "string" ? input.payload.customerUrl : undefined,
      ctaLabel: "Open link",
    };
  const rendered = customerEmailShell(copy);

  const sendResult = await sendEmailMessage({
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const logId = billingId("elog");
  await sb.from("email_delivery_log").insert({
    id: logId,
    notification_event_id: input.eventId,
    company_id: input.companyId,
    provider: sendResult.provider,
    to_email: input.to,
    subject: rendered.subject,
    status: sendResult.ok
      ? "provider_accepted"
      : "skipped" in sendResult && sendResult.skipped
        ? "skipped"
        : "failed",
    provider_message_id: sendResult.ok ? sendResult.messageId : null,
    error_message: sendResult.ok ? null : sendResult.error,
  });

  if (!sendResult.ok && "skipped" in sendResult && sendResult.skipped) {
    await sb
      .from("notification_events")
      .update({
        status: "skipped",
        error_message: sendResult.error,
        provider: sendResult.provider,
      })
      .eq("id", input.eventId);
    return { status: "skipped", message: sendResult.error };
  }

  if (!sendResult.ok) {
    const nextRetry =
      attempts < 5
        ? new Date(Date.now() + Math.min(60_000 * 2 ** attempts, 3600_000)).toISOString()
        : null;
    await sb
      .from("notification_events")
      .update({
        status: "failed",
        error_message: sendResult.error,
        provider: sendResult.provider,
        next_retry_at: nextRetry,
      })
      .eq("id", input.eventId);
    return { status: "failed", message: sendResult.error };
  }

  // Provider accepted — not confirmed delivery
  await sb
    .from("notification_events")
    .update({
      status: input.resent ? "resent" : "provider_accepted",
      provider: sendResult.provider,
      provider_message_id: sendResult.messageId,
      sent_at: new Date().toISOString(),
      error_message: null,
      next_retry_at: null,
    })
    .eq("id", input.eventId);

  return { status: input.resent ? "resent" : "provider_accepted" };
}

/** Process failed/queued email events due for retry. */
export async function processEmailRetries(limit = 25): Promise<{ processed: number }> {
  const sb = createAdminClient();
  if (!sb || !isEmailDeliveryConfigured()) return { processed: 0 };

  const now = new Date().toISOString();
  const { data: rows } = await sb
    .from("notification_events")
    .select("*")
    .eq("channel", "email")
    .in("status", ["failed", "queued", "pending"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .limit(limit);

  let processed = 0;
  for (const row of rows ?? []) {
    const to = await resolveCustomerEmail(
      sb,
      row.customer_id as string | null,
      row.profile_id as string | null
    );
    if (!to) continue;
    await deliverEmailEvent({
      eventId: row.id as string,
      companyId: row.company_id as string,
      eventType: row.event_type as string,
      to,
      title: row.title as string,
      body: row.body as string,
      payload: (row.payload as Record<string, unknown>) ?? {},
    });
    processed += 1;
  }
  return { processed };
}
