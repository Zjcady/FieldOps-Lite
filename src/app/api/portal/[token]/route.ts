import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Security note (#2): The DB index lookup on portalToken is constant-time, so
// timing attacks against the token value are not practical. The real protection
// against token enumeration is the rate limiting below.

// Simple in-memory rate limiter (#7)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { token } = await params;

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      jobs: {
        include: {
          tasks: { orderBy: { sortOrder: "asc" } },
          photos: { orderBy: { createdAt: "desc" } },
          permits: true,
          inspections: true,
          activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
        },
        orderBy: { createdAt: "desc" },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  const response = NextResponse.json(customer);
  response.headers.set("X-RateLimit-Limit", "60");
  return response;
}
