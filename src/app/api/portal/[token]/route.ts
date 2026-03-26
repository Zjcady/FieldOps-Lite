import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit("portal", ip, 60)) {
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

  // Strip sensitive fields before returning to portal
  const { portalToken: _pt, companyId: _cid, ...safeCustomer } = customer;
  // Strip internal user IDs from activity logs
  const safeJobs = safeCustomer.jobs.map((job) => ({
    ...job,
    activityLogs: job.activityLogs.map(({ userId: _uid, ...log }) => log),
  }));

  const response = NextResponse.json({ ...safeCustomer, jobs: safeJobs });
  response.headers.set("X-RateLimit-Limit", "60");
  return response;
}
