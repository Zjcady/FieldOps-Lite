import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/setup
 * Called after Supabase signup to create Company + User in our database.
 */
export async function POST(request: NextRequest) {
  const { authId, email, name, companyName } = await request.json();

  if (!authId || !email || !name || !companyName) {
    const errRes = NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
    errRes.headers.set("Cache-Control", "no-store, no-cache");
    return errRes;
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { authId } });
  if (existing) {
    const res = NextResponse.json({ message: "Already set up" });
    res.headers.set("Cache-Control", "no-store, no-cache");
    return res;
  }

  // Create company and user in a transaction
  const baseSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Ensure slug uniqueness by checking existing slugs with same prefix
  let slug = baseSlug;
  const existingSlug = await prisma.company.findFirst({
    where: { slug: { startsWith: baseSlug } },
  });
  if (existingSlug) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        slug,
        email,
      },
    });

    const user = await tx.user.create({
      data: {
        authId,
        companyId: company.id,
        email,
        name,
        role: "owner",
      },
    });

    return { company, user };
  });

  const response = NextResponse.json(result, { status: 201 });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
