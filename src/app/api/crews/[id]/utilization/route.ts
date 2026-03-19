import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id: crewId } = await params;

  const crew = await prisma.crew.findUnique({
    where: { id: crewId, companyId: user.companyId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!crew) return apiError("Crew not found", 404);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const members = await Promise.all(
    crew.members.map(async (member) => {
      const entries = await prisma.timeEntry.aggregate({
        where: {
          userId: member.userId,
          companyId: user.companyId,
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { hours: true },
      });

      const billableEntries = await prisma.timeEntry.aggregate({
        where: {
          userId: member.userId,
          companyId: user.companyId,
          date: { gte: monthStart, lt: monthEnd },
          billable: true,
        },
        _sum: { hours: true },
      });

      return {
        name: member.user.name,
        hours: entries._sum.hours ?? 0,
        billableHours: billableEntries._sum.hours ?? 0,
      };
    })
  );

  const totalHours = members.reduce((sum, m) => sum + m.hours, 0);
  const totalBillable = members.reduce((sum, m) => sum + m.billableHours, 0);

  return NextResponse.json({ members, totalHours, totalBillable });
}
