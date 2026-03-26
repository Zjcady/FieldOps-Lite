import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Rate limit: max 5 setup attempts per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const setupSchema = z.object({
  authId: z.string().min(1).max(255),
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  companyName: z.string().min(1).max(255),
});

/**
 * POST /api/auth/setup
 * Called after Supabase signup to create Company + User in our database.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { authId, email, name, companyName } = parsed.data;

  try {
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

    const response = NextResponse.json({
      company: { id: result.company.id, name: result.company.name, slug: result.company.slug },
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role },
    }, { status: 201 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch {
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
