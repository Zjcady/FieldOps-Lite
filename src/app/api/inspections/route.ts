import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, parseBody, apiError, safeDate } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const inspections = await prisma.inspection.findMany({
    where: { companyId: user.companyId },
    include: { job: true, permit: true },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json(inspections);
}

export async function POST(request: Request) {
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
}
