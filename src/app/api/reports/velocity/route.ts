import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const completedJobs = await prisma.job.findMany({
    where: {
      companyId: user.companyId,
      status: "completed",
      startDate: { not: null },
      completedDate: { not: null },
    },
    select: {
      category: true,
      startDate: true,
      completedDate: true,
    },
  });

  const categoryMap = new Map<string, { totalDays: number; count: number }>();

  for (const job of completedJobs) {
    if (!job.startDate || !job.completedDate) continue;
    const days = Math.max(
      1,
      Math.round(
        (new Date(job.completedDate).getTime() - new Date(job.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const cat = job.category || "Other";
    const entry = categoryMap.get(cat) ?? { totalDays: 0, count: 0 };
    entry.totalDays += days;
    entry.count += 1;
    categoryMap.set(cat, entry);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    avgDays: Math.round((data.totalDays / data.count) * 10) / 10,
    count: data.count,
  }));

  categories.sort((a, b) => b.avgDays - a.avgDays);

  return NextResponse.json({ categories });
}
