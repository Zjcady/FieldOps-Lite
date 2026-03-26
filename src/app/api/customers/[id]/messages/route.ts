import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

// Contractor sends a message to a customer via their portal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });

  if (!customer) return apiError("Customer not found", 404);

  const [body, parseErr] = await parseBody<{ content?: string }>(request);
  if (parseErr) return parseErr;
  if (!body.content?.trim()) return apiError("Message content required", 400);
  if (body.content.length > 5000) return apiError("Message too long", 400);

  const message = await prisma.portalMessage.create({
    data: {
      customerId: id,
      senderType: "contractor",
      content: body.content.trim(),
    },
  });

  return NextResponse.json(message, { status: 201 });
}

// Get messages for a customer (contractor view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });

  if (!customer) return apiError("Customer not found", 404);

  const messages = await prisma.portalMessage.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
