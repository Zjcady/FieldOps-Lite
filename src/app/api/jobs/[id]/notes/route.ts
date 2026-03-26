import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, parseBody, withErrorHandler } from "@/lib/api-utils";

export const POST = withErrorHandler(async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);
  const [body, parseErr] = await parseBody<{ content?: string; type?: string }>(request);
  if (parseErr) return parseErr;
  if (!body.content?.trim()) return apiError("Content required", 400);
  const note = await prisma.note.create({
    data: { jobId: id, userId: user.id, content: body.content.trim(), type: body.type || "general" },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(note, { status: 201 });
});
