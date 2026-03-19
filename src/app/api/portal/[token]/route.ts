import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Security note (#2): This endpoint is intentionally unauthenticated — it uses
// a per-customer portal token. In production, consider:
// - Timing-safe token comparison (e.g. crypto.timingSafeEqual) at the DB layer
//   or via a constant-time lookup to mitigate timing attacks.
// - Rate limiting via middleware or edge function to prevent token enumeration.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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
  // Rate limit hint for upstream proxy / CDN
  response.headers.set("X-RateLimit-Limit", "60");
  return response;
}
