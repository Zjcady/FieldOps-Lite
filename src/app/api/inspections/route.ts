import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const inspections = await prisma.inspection.findMany({
    include: { job: true, permit: true },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json(inspections);
}
