import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, validateBody, safeDate } from "@/lib/api-utils";
import { inspectionUpdateSchema } from "@/lib/validations/job";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, valErr] = await validateBody(request, inspectionUpdateSchema);
  if (valErr) return valErr;

  const { id } = await params;

  const existing = await prisma.inspection.findUnique({ where: { id, companyId: user.companyId } });
  if (!existing) return apiError("Inspection not found", 404);

  const inspection = await prisma.inspection.update({
    where: { id },
    data: {
      type: body.type ?? existing.type,
      status: body.status ?? existing.status,
      scheduledDate: body.scheduledDate ? safeDate(body.scheduledDate) : existing.scheduledDate,
      completedDate: body.completedDate ? safeDate(body.completedDate) : existing.completedDate,
      inspector: body.inspector ?? existing.inspector,
      result: body.result ?? existing.result,
      notes: body.notes ?? existing.notes,
    },
    include: { job: { select: { title: true } } },
  });

  // Log to activity if status changed and tied to a job
  if (body.status && body.status !== existing.status && existing.jobId) {
    await prisma.activityLog.create({
      data: {
        jobId: existing.jobId,
        userId: user.id,
        action: body.status === "passed" ? "inspection_passed" : body.status === "failed" ? "inspection_failed" : "inspection_updated",
        details: JSON.stringify({ type: inspection.type, status: body.status }),
      },
    });
  }

  return NextResponse.json(inspection);
}
