import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canTransition, type JobStatus } from "@/lib/job-state-machine";
import { authenticateApi, apiError, validateBody } from "@/lib/api-utils";
import { jobStatusSchema } from "@/lib/validations/job";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const [data, valErr] = await validateBody(request, jobStatusSchema);
  if (valErr) return valErr;

  const { id } = await params;
  const newStatus = data.status;

  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId } });
  if (!job) return apiError("Job not found", 404);

  if (!canTransition(job.status as JobStatus, newStatus as JobStatus)) {
    return apiError(`Cannot transition from ${job.status} to ${newStatus}`, 400);
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "active" && !job.startDate) updateData.startDate = new Date();
  if (newStatus === "completed") updateData.completedDate = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const updatedJob = await tx.job.update({
      where: { id },
      data: updateData,
      include: { customer: true, crew: true },
    });

    await tx.activityLog.create({
      data: {
        jobId: id,
        userId: user.id,
        action: "status_change",
        details: JSON.stringify({ from: job.status, to: newStatus }),
      },
    });

    return updatedJob;
  });

  return NextResponse.json(updated);
}
