import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, requireAdmin, validateBody, safeDate } from "@/lib/api-utils";
import { jobUpdateSchema } from "@/lib/validations/job";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      customer: true,
      crew: { include: { members: { include: { user: true } } } },
      tasks: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
      notes: { include: { user: true }, orderBy: { createdAt: "desc" } },
      permits: true,
      inspections: true,
      materials: { include: { vendor: true } },
      activityLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) return apiError("Job not found", 404);

  return NextResponse.json(job);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, valErr] = await validateBody(request, jobUpdateSchema);
  if (valErr) return valErr;

  const { id } = await params;

  const existing = await prisma.job.findUnique({ where: { id, companyId: user.companyId } });
  if (!existing) return apiError("Job not found", 404);

  const job = await prisma.job.update({
    where: { id, companyId: user.companyId },
    data: {
      title: body.title,
      description: body.description,
      type: body.type,
      category: body.category,
      priority: body.priority,
      crewId: body.crewId,
      progress: body.progress,
      estimatedHours: body.estimatedHours,
      actualHours: body.actualHours,
      estimatedCost: body.estimatedCost,
      actualCost: body.actualCost,
      address: body.address,
      scheduledDate: body.scheduledDate ? safeDate(body.scheduledDate) : undefined,
      estimatedEnd: body.estimatedEnd ? safeDate(body.estimatedEnd) : undefined,
    },
    include: { customer: true, crew: true },
  });

  return NextResponse.json(job);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;
  const existing = await prisma.job.findUnique({ where: { id, companyId: user.companyId } });
  if (!existing) return apiError("Job not found", 404);

  // Fix #5: Use companyId on the actual delete to prevent race condition
  await prisma.job.delete({ where: { id, companyId: user.companyId } });
  return NextResponse.json({ success: true });
}
