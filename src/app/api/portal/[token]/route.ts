import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      jobs: {
        include: {
          tasks: { orderBy: { sortOrder: "asc" } },
          photos: { orderBy: { createdAt: "desc" } },
          permits: true,
          inspections: true,
          activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
        },
        orderBy: { createdAt: "desc" },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}
