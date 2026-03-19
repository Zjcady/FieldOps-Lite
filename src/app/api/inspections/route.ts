import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const inspections = await prisma.inspection.findMany({
    where: { companyId: user.companyId },
    include: { job: true, permit: true },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json(inspections);
}
