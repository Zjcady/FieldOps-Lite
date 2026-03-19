import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, validateFile, validateCoords } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id, companyId: user.companyId }, select: { id: true } });
  if (!job) return apiError("Job not found", 404);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;
  const category = (formData.get("category") as string) || "progress";

  // Validate coordinates (#10)
  const coords = validateCoords(formData.get("lat"), formData.get("lng"));

  // For now, store as placeholder URL. In production, upload to Supabase Storage.
  let url = "/placeholder-photo.jpg";

  if (file) {
    // Validate file (#7)
    const fileErr = validateFile(file);
    if (fileErr) return apiError(fileErr, 400);

    // TODO: Upload to Supabase Storage
    // const { data } = await supabase.storage.from('photos').upload(`jobs/${id}/${Date.now()}-${file.name}`, file);
    // url = supabase.storage.from('photos').getPublicUrl(data.path).data.publicUrl;
    url = `https://placeholder.photos/job/${id}/${Date.now()}`;
  }

  const photo = await prisma.photo.create({
    data: {
      jobId: id,
      url,
      caption: caption || null,
      category,
      uploadedBy: user.id,
      lat: coords.lat,
      lng: coords.lng,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      jobId: id,
      userId: user.id,
      action: "photo_uploaded",
      details: JSON.stringify({ caption, category, hasGeo: coords.lat !== null }),
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
