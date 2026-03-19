import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, validateBody } from "@/lib/api-utils";
import { campaignCreateSchema } from "@/lib/validations/job";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const campaigns = await prisma.emailCampaign.findMany({
    where: { companyId: user.companyId },
    include: {
      _count: { select: { recipients: true } },
      recipients: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns.map((c) => ({
    ...c,
    stats: {
      total: c.recipients.length,
      sent: c.recipients.filter((r) => r.status === "sent").length,
      opened: c.recipients.filter((r) => r.status === "opened").length,
    },
    recipients: undefined,
  })));
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, valErr] = await validateBody(request, campaignCreateSchema);
  if (valErr) return valErr;

  // Get eligible customers based on filter
  let customerWhere: Record<string, unknown> = { companyId: user.companyId, email: { not: null } };
  if (body.filter === "past") {
    customerWhere = { ...customerWhere, jobs: { some: { status: "completed" } } };
  } else if (body.filter === "active") {
    customerWhere = { ...customerWhere, jobs: { some: { status: "active" } } };
  }

  const customers = await prisma.customer.findMany({
    where: customerWhere,
    select: { id: true, email: true },
  });

  // Filter out customers with invalid emails (#13)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validCustomers = customers.filter((c) => c.email && emailRegex.test(c.email));

  const campaign = await prisma.emailCampaign.create({
    data: {
      companyId: user.companyId,
      name: body.name,
      subject: body.subject,
      body: body.body,
      template: body.template || "general",
      recipients: {
        create: validCustomers.map((c) => ({
          customerId: c.id,
          email: c.email!,
        })),
      },
    },
    include: { _count: { select: { recipients: true } } },
  });

  return NextResponse.json(campaign, { status: 201 });
}
