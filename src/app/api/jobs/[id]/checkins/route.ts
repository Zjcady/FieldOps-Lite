import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, validateBody } from "@/lib/api-utils";
import { checkinSchema } from "@/lib/validations/job";
import { haversineDistance, VERIFICATION_RADIUS_METERS } from "@/lib/geo";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });
  if (!job) return apiError("Job not found", 404);

  const checkins = await prisma.checkin.findMany({
    where: { jobId: id },
    include: {
      user: { select: { name: true } },
      photo: { select: { id: true, url: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(checkins);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const [body, valErr] = await validateBody(request, checkinSchema);
  if (valErr) return valErr;

  const { id } = await params;

  // Fetch job with property coordinates for distance verification
  const job = await prisma.job.findUnique({
    where: { id, companyId: user.companyId },
    include: { property: { select: { lat: true, lng: true } } },
  });
  if (!job) return apiError("Job not found", 404);

  // Calculate distance verification
  let verified = false;
  let distance: number | null = null;

  const siteLat = job.property?.lat;
  const siteLng = job.property?.lng;

  if (body.lat != null && body.lng != null && siteLat != null && siteLng != null) {
    distance = Math.round(haversineDistance(body.lat, body.lng, siteLat, siteLng));
    verified = distance <= VERIFICATION_RADIUS_METERS;
  }

  // Verify photoId belongs to this job if provided
  if (body.photoId) {
    const photo = await prisma.photo.findFirst({
      where: { id: body.photoId, jobId: id },
      select: { id: true },
    });
    if (!photo) return apiError("Photo not found", 404);
  }

  const checkin = await prisma.checkin.create({
    data: {
      jobId: id,
      userId: user.id,
      type: body.type,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      verified,
      distance,
      photoId: body.photoId ?? null,
    },
    include: {
      user: { select: { name: true } },
    },
  });

  // Also log to activity timeline
  await prisma.activityLog.create({
    data: {
      jobId: id,
      userId: user.id,
      action: body.type === "checkout" ? "crew_checkout" : "crew_checkin",
      details: JSON.stringify({
        lat: body.lat,
        lng: body.lng,
        verified,
        distance,
        user: user.name,
      }),
    },
  });

  return NextResponse.json(checkin, { status: 201 });
}
