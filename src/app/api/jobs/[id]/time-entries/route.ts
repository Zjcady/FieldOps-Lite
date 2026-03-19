import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);
  const body = await request.json();
  const hours = parseFloat(body.hours);
  if (!hours || hours <= 0) return apiError("Hours must be greater than 0", 400);
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
}
