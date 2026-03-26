import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, parseBody, apiError, safeDate, getPagination, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { skip, take } = getPagination(request, 200);

  const inspections = await prisma.inspection.findMany({
    where: { companyId: user.companyId },
    include: { job: true, permit: true },
    orderBy: { scheduledDate: "asc" },
    skip,
    take,
  });
  return NextResponse.json(inspections);
});

export const POST = withErrorHandler(async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{
    type?: string;
    scheduledDate?: string;
    inspector?: string;
    jobId?: string;
    permitId?: string;
  }>(request as never);
  if (parseErr) return parseErr;

  if (!body.type || !body.type.trim()) {
    return apiError("Inspection type is required", 400);
  }

  // Verify FK references belong to this company
  if (body.jobId) {
    const job = await prisma.job.findUnique({ where: { id: body.jobId, companyId: user.companyId }, select: { id: true } });
    if (!job) return apiError("Job not found", 404);
  }
  if (body.permitId) {
    const permit = await prisma.permit.findUnique({ where: { id: body.permitId, companyId: user.companyId }, select: { id: true } });
    if (!permit) return apiError("Permit not found", 404);
  }

  const inspection = await prisma.inspection.create({
    data: {
      companyId: user.companyId,
      type: body.type.trim(),
      scheduledDate: body.scheduledDate ? safeDate(body.scheduledDate) : null,
      inspector: body.inspector || null,
      jobId: body.jobId || null,
      permitId: body.permitId || null,
      status: "scheduled",
    },
    include: { job: true, permit: true },
  });

  return NextResponse.json(inspection, { status: 201 });
});
