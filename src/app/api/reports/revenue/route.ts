import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const jobs = await prisma.job.findMany({
    where: { companyId: user.companyId, status: { in: ["completed", "invoiced"] } },
    select: { category: true, actualCost: true, estimatedCost: true },
  });

  const byCategory: Record<string, number> = {};
  for (const job of jobs) {
    const cat = job.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + Number(job.actualCost || job.estimatedCost || 0);
  }

  const chartData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const invoices = await prisma.invoice.findMany({
    where: { companyId: user.companyId },
    select: { total: true, status: true, createdAt: true },
  });

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total), 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + Number(i.total), 0);

  return NextResponse.json({
    revenueByCategory: chartData,
    totalPaid,
    totalOutstanding,
    totalRevenue: totalPaid + totalOutstanding,
  }, { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } });
}
