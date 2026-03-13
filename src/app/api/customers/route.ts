import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      properties: true,
      _count: { select: { jobs: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}
