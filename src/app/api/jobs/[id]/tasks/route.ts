import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const { id } = await params;
  const body = await request.json();

  const maxOrder = await prisma.task.findFirst({
    where: { jobId: id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      jobId: id,
      title: body.title,
      description: body.description || null,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const task = await prisma.task.update({
    where: { id: body.taskId },
    data: {
      status: body.status,
      completedAt: body.status === "completed" ? new Date() : null,
    },
  });

  return NextResponse.json(task);
}
