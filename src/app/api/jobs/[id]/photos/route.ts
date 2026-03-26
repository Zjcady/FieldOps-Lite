import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, validateFile, validateCoords } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // (#3) Enforce 5MB file size limit
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file && file.size > MAX_FILE_SIZE) {
    return apiError("File too large. Maximum 5MB.", 413);
  }

  // (#5) Idempotency: if x-idempotency-key header is present, check for a
  // duplicate upload. In production this should use a dedicated idempotency
  // table keyed on the idempotency token. For now, reject if a photo with
  // the same jobId + caption + category was created in the last 10 seconds.
  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (idempotencyKey) {
    const tenSecondsAgo = new Date(Date.now() - 10_000);
    const duplicate = await prisma.photo.findFirst({
      where: {
        jobId: id,
        caption: caption || null,
        category,
        createdAt: { gte: tenSecondsAgo },
      },
    });
    if (duplicate) {
      return NextResponse.json(duplicate, { status: 200 });
    }
  }

  // Validate coordinates (#10)
  const coords = validateCoords(formData.get("lat"), formData.get("lng"));

  let url = "/placeholder-photo.jpg";

  if (file) {
    // Validate file (#7)
    const fileErr = validateFile(file);
    if (fileErr) return apiError(fileErr, 400);

    // Upload to Supabase Storage if configured, otherwise use placeholder
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createAdminClient();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `jobs/${id}/${Date.now()}-${safeName}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { data, error } = await supabase.storage
          .from("photos")
          .upload(path, buffer, { contentType: file.type, upsert: false });

        if (error) return apiError(`Upload failed: ${error.message}`, 500);

        const { data: publicUrlData } = supabase.storage
          .from("photos")
          .getPublicUrl(data.path);

        url = publicUrlData.publicUrl;
      } catch {
        return apiError("Photo upload failed", 500);
      }
    } else {
      url = `/placeholder-photo-${Date.now()}.jpg`;
    }
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
