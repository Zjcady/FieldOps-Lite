import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, parseBody, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const [body, parseErr] = await parseBody<{
    vendorId?: string;
    materialIds?: string[];
  }>(request as never);
  if (parseErr) return parseErr;

  if (!body.vendorId || !body.materialIds?.length) {
    return apiError("vendorId and materialIds are required", 400);
  }

  const vendor = await prisma.vendor.findFirst({
    where: { id: body.vendorId, companyId: user.companyId },
  });
  if (!vendor) return apiError("Vendor not found", 404);

  const materials = await prisma.material.findMany({
    where: {
      id: { in: body.materialIds },
      job: { companyId: user.companyId },
    },
    include: {
      job: { select: { title: true, jobNumber: true } },
    },
  });

  if (materials.length === 0) return apiError("No materials found", 404);

  const totalCost = materials.reduce((sum, m) => sum + Number(m.totalCost ?? 0), 0);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rowsHtml = materials
    .map(
      (m) =>
        `<tr>
          <td>${escapeHtml(m.name)}</td>
          <td>${escapeHtml(m.job.title)} (${escapeHtml(m.job.jobNumber)})</td>
          <td class="num">${m.quantity}</td>
          <td>${escapeHtml(m.unit)}</td>
          <td class="num">$${Number(m.unitCost ?? 0).toFixed(2)}</td>
          <td class="num">$${Number(m.totalCost ?? 0).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Purchase Order — ${escapeHtml(vendor.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    .grid { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .grid div { font-size: 13px; line-height: 1.6; }
    .label { font-weight: 600; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    .num { text-align: right; }
    .total-row { font-weight: 700; font-size: 15px; background: #f9f9f9; }
    .total-row td { border-top: 2px solid #333; padding-top: 10px; }
    .footer { margin-top: 32px; font-size: 12px; color: #888; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <h1>PURCHASE ORDER</h1>
  <div class="subtitle">Date: ${today}</div>

  <div class="grid">
    <div>
      <div class="label">Vendor</div>
      <div>${escapeHtml(vendor.name)}</div>
      ${vendor.contact ? `<div>${escapeHtml(vendor.contact)}</div>` : ""}
      ${vendor.email ? `<div>${escapeHtml(vendor.email)}</div>` : ""}
      ${vendor.phone ? `<div>${escapeHtml(vendor.phone)}</div>` : ""}
      ${vendor.address ? `<div>${escapeHtml(vendor.address)}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="label">PO Number</div>
      <div>PO-${Date.now().toString(36).toUpperCase()}</div>
      <div style="margin-top:8px;"><span class="label">Materials:</span> ${materials.length} item${materials.length !== 1 ? "s" : ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Material</th>
        <th>Job</th>
        <th class="num">Qty</th>
        <th>Unit</th>
        <th class="num">Unit Cost</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="total-row">
        <td colspan="5">Total</td>
        <td class="num">$${totalCost.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">Generated on ${today}</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
