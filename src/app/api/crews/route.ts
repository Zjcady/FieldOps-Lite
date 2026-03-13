import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const crews = await prisma.crew.findMany({
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
