import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const invoices = await prisma.invoice.findMany({
    where: { companyId: user.companyId },
    include: { job: { select: { title: true, jobNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{
    jobId: string;
    dueDate?: string;
    notes?: string;
    lineItems?: { description: string; quantity: number; unitPrice: number }[];
  }>(request);
  if (parseErr) return parseErr;

  if (!body.jobId) return apiError("jobId is required", 400);

  const job = await prisma.job.findUnique({
    where: { id: body.jobId, companyId: user.companyId },
  });
  if (!job) return apiError("Job not found", 404);

  // Validate line items
  if (body.lineItems && body.lineItems.length > 0) {
    for (const item of body.lineItems) {
      if (typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
        return apiError("Line items must have numeric quantity and unitPrice", 400);
      }
      if (item.quantity <= 0) return apiError("Line item quantity must be positive", 400);
      if (item.unitPrice < 0) return apiError("Line item unitPrice cannot be negative", 400);
      if (!item.description || item.description.trim().length === 0) {
        return apiError("Line item description is required", 400);
      }
    }
  }

  let subtotal: number;
  if (body.lineItems && body.lineItems.length > 0) {
    subtotal = body.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  } else {
    subtotal = job.estimatedCost ? Number(job.estimatedCost) : 0;
  }

  const tax = Math.round(subtotal * 0.07 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const year = new Date().getFullYear();
  const rand = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  const invoiceNumber = `INV-${year}-${rand}`;

  const invoice = await prisma.invoice.create({
    data: {
      companyId: user.companyId,
      jobId: body.jobId,
      invoiceNumber,
      subtotal,
      tax,
      total,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || null,
      status: "draft",
      ...(body.lineItems && body.lineItems.length > 0 && {
        lineItems: {
          create: body.lineItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Math.round(item.quantity * item.unitPrice * 100) / 100,
          })),
        },
      }),
    },
    include: {
      job: { select: { title: true, jobNumber: true } },
      lineItems: true,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
