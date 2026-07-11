import nodemailer from "nodemailer";
import { Resend } from "resend";
import { isEmailDeliveryConfigured } from "@/lib/billing/utils";

export type EmailSendResult =
  | { ok: true; provider: "resend" | "smtp"; messageId: string }
  | { ok: false; provider: "resend" | "smtp" | "none"; error: string; skipped?: boolean };

export function getEmailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Morris Services <noreply@morris-services.com>"
  );
}

export async function sendEmailMessage(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<EmailSendResult> {
  if (!isEmailDeliveryConfigured()) {
    return {
      ok: false,
      provider: "none",
      error: "Email provider not configured",
      skipped: true,
    };
  }

  const to = input.to.trim();
  if (!to || !to.includes("@")) {
    return { ok: false, provider: "none", error: "Invalid recipient email" };
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY.trim());
      const { data, error } = await resend.emails.send({
        from: getEmailFromAddress(),
        to: [to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
      });
      if (error) {
        return { ok: false, provider: "resend", error: error.message };
      }
      return {
        ok: true,
        provider: "resend",
        messageId: data?.id ?? `resend-${Date.now()}`,
      };
    } catch (e) {
      return {
        ok: false,
        provider: "resend",
        error: e instanceof Error ? e.message : "Resend send failed",
      };
    }
  }

  if (process.env.SMTP_HOST?.trim()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      });
      const info = await transporter.sendMail({
        from: getEmailFromAddress(),
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
      });
      return {
        ok: true,
        provider: "smtp",
        messageId: info.messageId || `smtp-${Date.now()}`,
      };
    } catch (e) {
      return {
        ok: false,
        provider: "smtp",
        error: e instanceof Error ? e.message : "SMTP send failed",
      };
    }
  }

  return {
    ok: false,
    provider: "none",
    error: "Email provider not configured",
    skipped: true,
  };
}
