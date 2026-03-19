import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite } from "@/lib/api-utils";

export async function POST(
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
  if (campaign.status === "sent") return apiError("Campaign already sent", 400);

  // Update campaign status
  const updated = await prisma.emailCampaign.update({
    where: { id },
    data: { status: "sent", sentAt: new Date() },
  });

  // Mark all recipients as sent
  await prisma.emailRecipient.updateMany({
    where: { campaignId: id, status: "pending" },
    data: { status: "sent", sentAt: new Date() },
  });

  // TODO: Integrate with Resend API to actually send emails

  return NextResponse.json(updated);
}
