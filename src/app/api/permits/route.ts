import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, validateBody, getPagination, safeDate } from "@/lib/api-utils";
import { permitCreateSchema } from "@/lib/validations/job";

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { skip, take } = getPagination(request);

  const permits = await prisma.permit.findMany({
    where: { companyId: user.companyId },
    include: { job: true, inspections: true },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
  return NextResponse.json(permits);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, valErr] = await validateBody(request, permitCreateSchema);
  if (valErr) return valErr;

  // Verify jobId belongs to this company
  if (body.jobId) {
    const job = await prisma.job.findUnique({ where: { id: body.jobId, companyId: user.companyId }, select: { id: true } });
    if (!job) return apiError("Job not found", 404);
  }

  const permit = await prisma.permit.create({
    data: {
      companyId: user.companyId,
      jobId: body.jobId || null,
      permitNumber: body.permitNumber || null,
      type: body.type,
      status: body.status || "pending",
      jurisdiction: body.jurisdiction || null,
      issuedDate: body.issuedDate ? safeDate(body.issuedDate) : null,
      expiryDate: body.expiryDate ? safeDate(body.expiryDate) : null,
      cost: body.cost || null,
      notes: body.notes || null,
    },
    include: { job: { select: { title: true } } },
  });

  return NextResponse.json(permit, { status: 201 });
}
