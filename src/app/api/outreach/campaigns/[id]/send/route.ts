import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite } from "@/lib/api-utils";
import { getResend } from "@/lib/resend";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      recipients: { include: { customer: true } },
    },
  });

  if (!campaign) return apiError("Campaign not found", 404);
  if (campaign.status === "sent") return apiError("Campaign already sent", 400);
  if (campaign.recipients.length === 0) return apiError("Campaign has no recipients", 400);

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true },
  });

  let resend;
  try {
    resend = getResend();
  } catch {
    return apiError("Email service not configured. Set RESEND_API_KEY.", 503);
  }

  let sentCount = 0;
  let failedCount = 0;

  // Send emails to each recipient
  for (const recipient of campaign.recipients) {
    if (recipient.status !== "pending") continue;

    try {
      await resend.emails.send({
        from: `${company?.name || "FieldOps"} <onboarding@resend.dev>`,
        to: recipient.email,
        subject: campaign.subject,
        html: campaign.body,
      });

      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { status: "sent", sentAt: new Date() },
      });
      sentCount++;
    } catch {
      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { status: "failed" },
      });
      failedCount++;
    }
  }

  // Mark campaign as sent
  const updated = await prisma.emailCampaign.update({
    where: { id, companyId: user.companyId },
    data: { status: "sent", sentAt: new Date() },
  });

  return NextResponse.json({
    ...updated,
    sentCount,
    failedCount,
  });
}
