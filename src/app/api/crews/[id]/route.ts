import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const crew = await prisma.crew.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      members: { include: { user: true } },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { name: true } } },
      },
    },
  });

  if (!crew) return apiError("Crew not found", 404);

  return NextResponse.json(crew);
}
