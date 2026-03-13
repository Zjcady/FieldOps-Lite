import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
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

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...body,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      estimatedEnd: body.estimatedEnd ? new Date(body.estimatedEnd) : undefined,
    },
    include: { customer: true, crew: true },
  });

  return NextResponse.json(job);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
