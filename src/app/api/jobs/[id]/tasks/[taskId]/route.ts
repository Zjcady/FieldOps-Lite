import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id, taskId } = await params;

  // Verify job belongs to company
  const job = await prisma.job.findUnique({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });
  if (!job) return apiError("Job not found", 404);

  // Verify task belongs to job
  const task = await prisma.task.findFirst({
    where: { id: taskId, jobId: id },
  });
  if (!task) return apiError("Task not found", 404);

  await prisma.task.delete({ where: { id: taskId } });

  return NextResponse.json({ success: true });
}
