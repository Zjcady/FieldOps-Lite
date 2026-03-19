import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      job: {
        include: {
          customer: true,
        },
      },
      lineItems: true,
    },
  });

  if (!invoice) return apiError("Invoice not found", 404);

  const customer = invoice.job.customer;

  const lineItemsHtml = invoice.lineItems.length > 0
    ? invoice.lineItems
        .map(
          (li) =>
            `<tr>
              <td>${escapeHtml(li.description)}</td>
              <td class="num">${li.quantity}</td>
              <td class="num">$${Number(li.unitPrice).toFixed(2)}</td>
              <td class="num">$${Number(li.total).toFixed(2)}</td>
            </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="text-align:center;color:#888;">No line items</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    .grid { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .grid div { font-size: 13px; line-height: 1.6; }
    .label { font-weight: 600; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    .num { text-align: right; }
    .totals { margin-left: auto; width: 260px; }
    .totals tr td { border: none; padding: 4px 12px; }
    .totals .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #333; padding-top: 8px; }
    .notes { margin-top: 24px; font-size: 13px; color: #555; }
    .status { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-draft { background: #eee; color: #666; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-paid { background: #dcfce7; color: #16a34a; }
    .status-overdue { background: #fee2e2; color: #dc2626; }

    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <h1>INVOICE</h1>
  <div class="subtitle">${escapeHtml(invoice.invoiceNumber)} &middot; <span class="status status-${invoice.status}">${invoice.status}</span></div>

  <div class="grid">
    <div>
      <div class="label">Bill To</div>
      <div>${escapeHtml(customer.name)}</div>
      ${customer.email ? `<div>${escapeHtml(customer.email)}</div>` : ""}
      ${customer.phone ? `<div>${escapeHtml(customer.phone)}</div>` : ""}
      ${customer.address ? `<div>${escapeHtml(customer.address)}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="label">Job</div>
      <div>${escapeHtml(invoice.job.title)}</div>
      <div style="color:#666;">${escapeHtml(invoice.job.jobNumber)}</div>
      ${invoice.dueDate ? `<div style="margin-top:8px;"><span class="label">Due:</span> ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ""}
      ${invoice.paidDate ? `<div><span class="label">Paid:</span> ${new Date(invoice.paidDate).toLocaleDateString()}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td class="num">$${Number(invoice.subtotal).toFixed(2)}</td></tr>
    <tr><td>Tax</td><td class="num">$${Number(invoice.tax).toFixed(2)}</td></tr>
    <tr class="total-row"><td>Total</td><td class="num">$${Number(invoice.total).toFixed(2)}</td></tr>
  </table>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</div>` : ""}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
