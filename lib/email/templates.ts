import { getAppBaseUrl } from "@/lib/payments/stripe-client";

/** Customer-safe email HTML — no margins, internal notes, or routing details. */
export function customerEmailShell(input: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): { subject: string; html: string; text: string } {
  const base = getAppBaseUrl();
  const cta =
    input.ctaUrl && input.ctaLabel
      ? `<p style="margin:24px 0"><a href="${input.ctaUrl}" style="background:#b91c1c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${input.ctaLabel}</a></p>`
      : "";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;background:#f8f8f8;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#b91c1c;font-weight:700">Morris Services</p>
    <h1 style="font-size:22px;margin:0 0 16px">${input.title}</h1>
    <div style="font-size:15px;color:#333">${input.body}</div>
    ${cta}
    <p style="margin-top:32px;font-size:12px;color:#888">Questions? Reply to this email or visit <a href="${base}">${base.replace(/^https?:\/\//, "")}</a>.</p>
  </div>
</body></html>`;
  const text = [
    input.title,
    "",
    input.body.replace(/<[^>]+>/g, ""),
    input.ctaUrl ? `${input.ctaLabel ?? "Open"}: ${input.ctaUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject: input.title, html, text };
}

export function emailCopyForEvent(
  eventType: string,
  payload: Record<string, unknown>
): { title: string; body: string; ctaLabel?: string; ctaUrl?: string } | null {
  const link = typeof payload.customerUrl === "string" ? payload.customerUrl : undefined;
  switch (eventType) {
    case "estimate_ready":
      return {
        title: "Your estimate is ready",
        body: "<p>Your Morris Services estimate is ready to review.</p>",
        ctaLabel: "View estimate",
        ctaUrl: link,
      };
    case "estimate_revised":
      return {
        title: "Your estimate was updated",
        body: "<p>Please review the revised estimate.</p>",
        ctaLabel: "View estimate",
        ctaUrl: link,
      };
    case "estimate_approved":
      return {
        title: "Estimate approved",
        body: "<p>Thanks — we recorded your approval and will follow up with next steps.</p>",
      };
    case "job_scheduled":
      return {
        title: "Your job is scheduled",
        body: "<p>Your service window has been scheduled. Check your account for details.</p>",
        ctaLabel: "View job",
        ctaUrl: link,
      };
    case "schedule_changed":
      return {
        title: "Schedule update",
        body: "<p>Your scheduled window was updated. Please review the new details.</p>",
        ctaLabel: "View details",
        ctaUrl: link,
      };
    case "crew_assigned":
      return {
        title: "Crew assigned",
        body: "<p>A crew has been assigned to your job.</p>",
      };
    case "crew_en_route":
      return {
        title: "Crew en route",
        body: "<p>Your crew is on the way.</p>",
      };
    case "job_completed":
      return {
        title: "Job completed",
        body: "<p>Your job is marked complete. An invoice will follow if one is due.</p>",
      };
    case "invoice_available":
      return {
        title: "Your invoice is ready",
        body: "<p>Your invoice is available to view and pay.</p>",
        ctaLabel: "View invoice",
        ctaUrl: link,
      };
    case "payment_received":
      return {
        title: "Payment received",
        body: `<p>We received your payment${payload.amount ? ` of $${Number(payload.amount).toFixed(2)}` : ""}. Thank you.</p>`,
      };
    case "request_received":
      return {
        title: "We received your request",
        body: "<p>Thanks for contacting Morris Services. We will follow up with next steps.</p>",
        ctaLabel: link ? "View request" : undefined,
        ctaUrl: link,
      };
    default:
      return null;
  }
}
