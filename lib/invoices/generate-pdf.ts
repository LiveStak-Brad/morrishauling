import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { morrisConfig, COMPANY_TERMS, ESTIMATE_DISCLAIMER } from "@/lib/morris-config";
import type { Invoice, Payment } from "@/types/payment";
import type { Job } from "@/types/job";
import type { Customer } from "@/types/user";

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

async function tryEmbedLogo(doc: PDFDocument) {
  const candidates = ["MorrisServicesLogo.png", "logo.png", "logos/morris.png"];
  for (const name of candidates) {
    try {
      const filePath = path.join(process.cwd(), "public", name);
      const bytes = await readFile(filePath);
      return await doc.embedPng(bytes);
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function buildInvoicePdf(params: {
  invoice: Invoice;
  job?: Job;
  customer?: Customer;
  payments: Payment[];
}): Promise<Uint8Array> {
  const { invoice, job, customer, payments } = params;
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  let y = height - 50;

  const draw = (text: string, x: number, size = 10, bold = false, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
  };

  const logo = await tryEmbedLogo(doc);
  if (logo) {
    page.drawImage(logo, { x: 50, y: y - 10, width: 48, height: 48 });
    draw(morrisConfig.companyName, 110, 14, true);
    y -= 8;
    draw(morrisConfig.companyAddress ?? morrisConfig.serviceArea.label, 110, 9);
    y -= 12;
    draw(`${morrisConfig.phone} · ${morrisConfig.email}`, 110, 9);
    y -= 28;
  } else {
    draw(morrisConfig.companyName, 50, 16, true);
    y -= 18;
    draw(morrisConfig.companyAddress ?? morrisConfig.serviceArea.label, 50, 9);
    y -= 12;
    draw(`Phone: ${morrisConfig.phone} · ${morrisConfig.email}`, 50, 9);
    y -= 28;
  }

  draw("INVOICE", 50, 14, true);
  draw(invoice.invoiceNumber, 400, 14, true);
  y -= 20;

  draw(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50);
  if (invoice.dueDate) draw(`Due: ${invoice.dueDate}`, 250);
  y -= 22;

  draw("Bill to", 50, 11, true);
  y -= 14;
  draw(customer?.name ?? "Customer", 50);
  if (customer?.email) {
    y -= 12;
    draw(customer.email, 50);
  }
  if (customer?.phone) {
    y -= 12;
    draw(customer.phone, 50);
  }
  y -= 20;

  if (job) {
    draw("Job", 50, 11, true);
    y -= 14;
    draw(`${job.address.street}, ${job.address.city}, ${job.address.state} ${job.address.zip}`, 50);
    y -= 12;
    draw(`Service: ${job.serviceType?.replace(/_/g, " ") ?? "Junk removal"}`, 50);
    y -= 20;
  }

  draw("Description", 50, 10, true);
  draw("Amount", 480, 10, true);
  y -= 14;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;

  draw("Estimate / service", 50);
  draw(money(invoice.estimateAmount), 480);
  y -= 14;

  for (const adj of invoice.adjustments ?? []) {
    draw(adj.label, 50);
    draw(money(adj.amount), 480);
    y -= 14;
  }

  if (invoice.fees > 0) {
    draw("Fees", 50);
    draw(money(invoice.fees), 480);
    y -= 14;
  }

  y -= 8;
  page.drawLine({ start: { x: 50, y: y + 6 }, end: { x: width - 50, y: y + 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 10;
  draw("Subtotal", 50, 10, true);
  draw(money(invoice.subtotal + invoice.fees), 480, 10, true);
  y -= 14;
  draw("Total", 50, 11, true);
  draw(money(invoice.total), 480, 11, true);
  y -= 14;
  draw("Amount paid", 50);
  draw(money(invoice.amountPaid), 480);
  y -= 14;
  draw("Balance due", 50, 11, true);
  draw(money(invoice.balanceDue), 480, 11, true);
  y -= 22;

  if (payments.length) {
    draw("Payments received", 50, 10, true);
    y -= 14;
    for (const p of payments) {
      draw(`${p.method} · ${new Date(p.createdAt).toLocaleDateString()}`, 50, 9);
      draw(money(p.amount), 480, 9);
      y -= 12;
    }
    y -= 10;
  }

  draw("Payment instructions", 50, 10, true);
  y -= 14;
  draw("Online card payment is not enabled yet. Accepted methods:", 50, 9);
  y -= 12;
  draw("• Cash  • Check  • Card in person / by phone  • Bank transfer  • Other (call office)", 50, 8);
  y -= 12;
  draw(`Checks payable to Morris Junk Removal / Morris Hauling · Call ${morrisConfig.phone}`, 50, 9);
  y -= 12;
  draw(`Account: ${morrisConfig.website}`, 50, 9);
  y -= 20;

  const terms = invoice.terms ?? COMPANY_TERMS;
  draw("Terms", 50, 10, true);
  y -= 14;
  const wrap = (text: string, maxWidth: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, 8) > maxWidth) {
        if (line) lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  for (const line of wrap(terms, width - 100)) {
    if (y < 60) break;
    draw(line, 50, 8);
    y -= 10;
  }
  y -= 8;
  for (const line of wrap(ESTIMATE_DISCLAIMER, width - 100)) {
    if (y < 40) break;
    draw(line, 50, 8);
    y -= 10;
  }

  return doc.save();
}
