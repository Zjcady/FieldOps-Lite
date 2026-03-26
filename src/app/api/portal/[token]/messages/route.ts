import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError, validateBody } from "@/lib/api-utils";
import { portalMessageSchema } from "@/lib/validations/job";

// Rate limiting for message POST (10 per minute per token)
const msgRateMap = new Map<string, { count: number; resetAt: number }>();
function checkMsgRate(token: string): boolean {
  const now = Date.now();
  const entry = msgRateMap.get(token);
  if (!entry || now >= entry.resetAt) {
    msgRateMap.set(token, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!checkMsgRate(token)) {
    return NextResponse.json({ error: "Too many messages. Please wait." }, { status: 429 });
  }

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
  });

  if (!customer) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const [body, valErr] = await validateBody(request, portalMessageSchema);
  if (valErr) return valErr;

  if (body.content.length > 5000) {
    return apiError("Message content too long (max 5000 characters)", 400);
  }

  // Force senderType to "customer" — portal users cannot impersonate contractors
  const message = await prisma.portalMessage.create({
    data: {
      customerId: customer.id,
      senderType: "customer",
      content: body.content,
    },
  });

  return NextResponse.json(message, { status: 201 });
}

// Mark all messages as read for this customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    select: { id: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  await prisma.portalMessage.updateMany({
    where: {
      customerId: customer.id,
      senderType: "contractor",
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
