import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const crews = await prisma.crew.findMany({
    where: { companyId: user.companyId },
    include: {
      members: { include: { user: true } },
      jobs: {
        where: { status: { in: ["active", "scheduled"] } },
        include: { customer: true },
        orderBy: { scheduledDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(crews);
}
