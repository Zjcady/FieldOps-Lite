import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canTransition, type JobStatus } from "@/lib/job-state-machine";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status: newStatus } = await request.json();

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!canTransition(job.status as JobStatus, newStatus as JobStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${job.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "active" && !job.startDate) updateData.startDate = new Date();
  if (newStatus === "completed") updateData.completedDate = new Date();

  const updated = await prisma.job.update({
    where: { id },
    data: updateData,
    include: { customer: true, crew: true },
  });

  await prisma.activityLog.create({
    data: {
      jobId: id,
      action: "status_change",
      details: JSON.stringify({ from: job.status, to: newStatus }),
    },
  });

  return NextResponse.json(updated);
}
