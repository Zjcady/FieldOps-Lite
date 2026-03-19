import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, validateBody } from "@/lib/api-utils";
import { checkinSchema } from "@/lib/validations/job";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const [body, valErr] = await validateBody(request, checkinSchema);
  if (valErr) return valErr;

  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);

  // Log check-in as activity
  await prisma.activityLog.create({
    data: {
      jobId: id,
      userId: user.id,
      action: body.type === "checkout" ? "crew_checkout" : "crew_checkin",
      details: JSON.stringify({
        lat: body.lat,
        lng: body.lng,
        timestamp: new Date().toISOString(),
        user: user.name,
      }),
    },
  });

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
}
