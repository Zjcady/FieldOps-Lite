import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const permits = await prisma.permit.findMany({
    include: { job: true, inspections: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(permits);
}
