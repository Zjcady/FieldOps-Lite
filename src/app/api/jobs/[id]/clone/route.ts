import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id } = await params;

  const original = await prisma.job.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      tasks: { select: { title: true, description: true, sortOrder: true } },
      materials: { select: { name: true, quantity: true, unit: true, unitCost: true, vendorId: true } },
    },
  });
  if (!original) return apiError("Job not found", 404);

  const year = new Date().getFullYear();
  const rand = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  const jobNumber = `JOB-${year}-${rand}`;

  const cloned = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        companyId: user.companyId,
        customerId: original.customerId,
        propertyId: original.propertyId,
        jobNumber,
        title: `Copy of ${original.title}`,
        description: original.description,
        type: original.type,
        category: original.category,
        priority: original.priority,
        address: original.address,
        estimatedCost: original.estimatedCost,
        estimatedHours: original.estimatedHours,
        status: "scheduled",
        progress: 0,
      },
      include: { customer: true, crew: true },
    });

    // Clone tasks
    if (original.tasks.length > 0) {
      await tx.task.createMany({
        data: original.tasks.map((t) => ({
          jobId: job.id,
          title: t.title,
          description: t.description,
          sortOrder: t.sortOrder,
          status: "pending",
        })),
      });
    }

    // Clone materials (reset status to "needed")
    if (original.materials.length > 0) {
      await tx.material.createMany({
        data: original.materials.map((m) => ({
          jobId: job.id,
          name: m.name,
          quantity: m.quantity,
          unit: m.unit,
          unitCost: m.unitCost,
          vendorId: m.vendorId,
          status: "needed",
        })),
      });
    }

    return job;
  });

  return NextResponse.json(cloned, { status: 201 });
}
