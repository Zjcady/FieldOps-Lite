import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id, companyId: user.companyId } });
  if (!campaign) return apiError("Campaign not found", 404);
  if (campaign.status !== "draft") return apiError("Cannot edit a sent campaign", 400);

  const [body, parseErr] = await parseBody<{
    name?: string;
    subject?: string;
    body?: string;
    template?: string;
  }>(request);
  if (parseErr) return parseErr;

  const VALID_TEMPLATES = ["general", "seasonal_discount", "followup", "referral", "maintenance_reminder"];
  if (body.template && !VALID_TEMPLATES.includes(body.template)) {
    return apiError(`Invalid template. Must be one of: ${VALID_TEMPLATES.join(", ")}`, 400);
  }

  const updated = await prisma.emailCampaign.update({
    where: { id, companyId: user.companyId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.subject !== undefined && { subject: body.subject }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.template !== undefined && { template: body.template }),
    },
  });

  return NextResponse.json(updated);
}

// POST /send is handled by the dedicated send/ route
