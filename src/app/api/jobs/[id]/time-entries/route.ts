import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, parseBody, withErrorHandler } from "@/lib/api-utils";

export const POST = withErrorHandler(async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);
  const [body, parseErr] = await parseBody<{ hours?: number; date?: string; notes?: string }>(request);
  if (parseErr) return parseErr;
  const hours = parseFloat(String(body.hours ?? 0));
  if (!hours || hours <= 0) return apiError("Hours must be greater than 0", 400);
  if (hours > 24) return apiError("Hours cannot exceed 24", 400);
  const date = body.date ? new Date(body.date) : new Date();
  if (isNaN(date.getTime())) return apiError("Invalid date", 400);
  const entry = await prisma.timeEntry.create({
    data: {
      companyId: user.companyId,
      jobId: id,
      userId: user.id,
      hours,
      date,
      notes: body.notes?.trim() || null,
      billable: true,
    },
  });
  return NextResponse.json(entry, { status: 201 });
});
