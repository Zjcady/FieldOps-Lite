import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, withRequestId } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const logs = await prisma.activityLog.findMany({
    where: {
      job: { companyId: user.companyId },
    },
    select: {
      id: true,
      action: true,
      details: true,
      createdAt: true,
      job: { select: { id: true, title: true, jobNumber: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return withRequestId(NextResponse.json(logs));
}
