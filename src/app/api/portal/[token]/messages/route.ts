import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, validateBody } from "@/lib/api-utils";
import { portalMessageSchema } from "@/lib/validations/job";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
  });

  if (!customer) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const [body, valErr] = await validateBody(request, portalMessageSchema);
  if (valErr) return valErr;

  // Additional content length guard (schema already caps at 5000)
  if (body.content.length > 5000) {
    return apiError("Message content too long (max 5000 characters)", 400);
  }

  const message = await prisma.portalMessage.create({
    data: {
      customerId: customer.id,
      senderType: body.senderType,
      content: body.content,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
