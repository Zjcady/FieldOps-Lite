import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: user.companyId,
      status: { in: ["paid", "sent"] },
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      total: true,
      status: true,
      createdAt: true,
    },
  });

  const monthMap = new Map<string, { revenue: number; cost: number }>();

  // Initialize all 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { revenue: 0, cost: 0 });
  }

  for (const inv of invoices) {
    const d = new Date(inv.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (entry) {
      entry.revenue += Number(inv.total);
    }
  }

  const months = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue * 100) / 100,
    cost: data.cost,
  }));

  return NextResponse.json({ months });
}
