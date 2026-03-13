import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
  });

  if (!customer) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const message = await prisma.portalMessage.create({
    data: {
      customerId: customer.id,
      senderType: body.senderType || "customer",
      content: body.content,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
