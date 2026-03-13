import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ["completed", "invoiced"] } },
    select: { category: true, actualCost: true, estimatedCost: true },
  });

  const byCategory: Record<string, number> = {};
  for (const job of jobs) {
    const cat = job.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (job.actualCost || job.estimatedCost || 0);
  }

  const chartData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const invoices = await prisma.invoice.findMany({
    select: { total: true, status: true, createdAt: true },
  });

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + i.total, 0);

  return NextResponse.json({
    revenueByCategory: chartData,
    totalPaid,
    totalOutstanding,
    totalRevenue: totalPaid + totalOutstanding,
  });
}
