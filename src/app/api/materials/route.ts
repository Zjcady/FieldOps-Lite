import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, parseBody, apiError } from "@/lib/api-utils";
import { MATERIAL_STATUSES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    job: { companyId: user.companyId },
  };

  if (status && (MATERIAL_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }

  const materials = await prisma.material.findMany({
    where,
    include: {
      job: { select: { title: true, jobNumber: true } },
      vendor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{
    jobId?: string;
    vendorId?: string;
    name?: string;
    quantity?: number;
    unit?: string;
    unitCost?: number;
  }>(request as never);
  if (parseErr) return parseErr;

  if (!body.jobId || !body.name?.trim()) {
    return apiError("jobId and name are required", 400);
  }
  if (typeof body.quantity !== "number" || body.quantity <= 0) {
    return apiError("quantity must be a positive number", 400);
  }
  if (typeof body.unitCost !== "number" || body.unitCost < 0) {
    return apiError("unitCost must be a non-negative number", 400);
  }

  // Verify job belongs to company
  const job = await prisma.job.findFirst({
    where: { id: body.jobId, companyId: user.companyId },
  });
  if (!job) return apiError("Job not found", 404);

  const totalCost = body.quantity * body.unitCost;

  const material = await prisma.material.create({
    data: {
      jobId: body.jobId,
      vendorId: body.vendorId || null,
      name: body.name.trim(),
      quantity: body.quantity,
      unit: body.unit || "each",
      unitCost: body.unitCost,
      totalCost,
    },
  });

  return NextResponse.json(material, { status: 201 });
}
