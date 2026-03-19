import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, validateBody } from "@/lib/api-utils";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validations/job";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  // Verify job belongs to company
  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);

  const tasks = await prisma.task.findMany({
    where: { jobId: id },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);

  const [body, valErr] = await validateBody(request, taskCreateSchema);
  if (valErr) return valErr;

  const task = await prisma.task.create({
    data: {
      jobId: id,
      title: body.title,
      description: body.description || null,
      sortOrder: Date.now(),
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const [body, valErr] = await validateBody(request, taskUpdateSchema);
  if (valErr) return valErr;

  // Fix #1: Company-scope the task update by joining through the job
  const task = await prisma.task.findFirst({
    where: {
      id: body.taskId,
      job: { companyId: user.companyId },
    },
  });
  if (!task) return apiError("Task not found", 404);

  const updated = await prisma.task.update({
    where: { id: body.taskId },
    data: {
      status: body.status,
      completedAt: body.status === "completed" ? new Date() : null,
    },
  });

  // Auto-progress: recalculate job progress based on completed tasks
  const allTasks = await prisma.task.findMany({
    where: { jobId: task.jobId },
    select: { status: true },
  });
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  await prisma.job.update({
    where: { id: task.jobId },
    data: { progress },
  });

  return NextResponse.json(updated);
}
