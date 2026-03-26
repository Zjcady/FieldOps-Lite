import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const cid = user.companyId;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    // Revenue
    invoices,
    // Jobs
    allJobs,
    // Crew hours
    timeEntries,
    // Customers
    customers,
    // Materials
    materials,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId: cid },
      select: { total: true, status: true, createdAt: true, paidDate: true },
    }),
    prisma.job.findMany({
      where: { companyId: cid },
      select: {
        id: true, status: true, category: true, progress: true,
        estimatedCost: true, actualCost: true,
        startDate: true, completedDate: true, createdAt: true, scheduledDate: true,
      },
    }),
    prisma.timeEntry.findMany({
      where: { companyId: cid, date: { gte: sixMonthsAgo } },
      select: { hours: true, date: true, userId: true },
    }),
    prisma.customer.findMany({
      where: { companyId: cid },
      select: { id: true, createdAt: true, _count: { select: { jobs: true } } },
    }),
    prisma.material.findMany({
      where: { job: { companyId: cid } },
      select: { unitCost: true, quantity: true, status: true },
    }),
  ]);

  // ── Revenue Metrics ──
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + Number(i.total), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);

  const thisMonthRevenue = invoices
    .filter((i) => i.status === "paid" && i.paidDate && i.paidDate >= thisMonthStart)
    .reduce((s, i) => s + Number(i.total), 0);
  const lastMonthRevenue = invoices
    .filter((i) => i.status === "paid" && i.paidDate && i.paidDate >= lastMonthStart && i.paidDate < thisMonthStart)
    .reduce((s, i) => s + Number(i.total), 0);

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue: { month: string; revenue: number; invoiceCount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleDateString("en-US", { month: "short" });
    const monthInvoices = invoices.filter(
      (inv) => inv.status === "paid" && inv.paidDate && inv.paidDate >= start && inv.paidDate < end
    );
    monthlyRevenue.push({
      month: label,
      revenue: monthInvoices.reduce((s, i) => s + Number(i.total), 0),
      invoiceCount: monthInvoices.length,
    });
  }

  // ── Job Metrics ──
  const activeStatuses = ["active", "scheduled", "paused", "waiting_permit", "waiting_inspection", "waiting_materials"];
  const activeJobs = allJobs.filter((j) => activeStatuses.includes(j.status)).length;
  const completedJobs = allJobs.filter((j) => j.status === "completed").length;
  const avgProgress = allJobs.filter((j) => activeStatuses.includes(j.status)).length > 0
    ? Math.round(allJobs.filter((j) => activeStatuses.includes(j.status)).reduce((s, j) => s + j.progress, 0) / allJobs.filter((j) => activeStatuses.includes(j.status)).length)
    : 0;

  // Jobs by status
  const jobsByStatus: Record<string, number> = {};
  allJobs.forEach((j) => { jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1; });

  // Jobs by category
  const jobsByCategory: Record<string, number> = {};
  allJobs.forEach((j) => { jobsByCategory[j.category || "Other"] = (jobsByCategory[j.category || "Other"] || 0) + 1; });

  // Revenue by category
  const revenueByCategory: Record<string, number> = {};
  allJobs.filter((j) => j.status === "completed" || j.status === "invoiced").forEach((j) => {
    const cat = j.category || "Other";
    revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(j.actualCost || j.estimatedCost || 0);
  });

  // Completion velocity by category
  const velocityByCategory: Record<string, { totalDays: number; count: number }> = {};
  allJobs.filter((j) => j.status === "completed" && j.startDate && j.completedDate).forEach((j) => {
    const days = Math.max(1, Math.round((j.completedDate!.getTime() - j.startDate!.getTime()) / 86400000));
    const cat = j.category || "Other";
    if (!velocityByCategory[cat]) velocityByCategory[cat] = { totalDays: 0, count: 0 };
    velocityByCategory[cat].totalDays += days;
    velocityByCategory[cat].count += 1;
  });

  // Profit margins
  const profitData = allJobs
    .filter((j) => j.estimatedCost && j.actualCost && (j.status === "completed" || j.status === "invoiced"))
    .map((j) => ({
      category: j.category || "Other",
      estimated: Number(j.estimatedCost),
      actual: Number(j.actualCost),
      margin: Number(j.estimatedCost) > 0
        ? Math.round(((Number(j.estimatedCost) - Number(j.actualCost)) / Number(j.estimatedCost)) * 100)
        : 0,
    }));
  const avgMargin = profitData.length > 0
    ? Math.round(profitData.reduce((s, p) => s + p.margin, 0) / profitData.length)
    : 0;

  // ── Crew Hours ──
  const totalHoursThisMonth = timeEntries
    .filter((t) => t.date >= thisMonthStart)
    .reduce((s, t) => s + Number(t.hours), 0);
  const totalHoursLastMonth = timeEntries
    .filter((t) => t.date >= lastMonthStart && t.date < thisMonthStart)
    .reduce((s, t) => s + Number(t.hours), 0);

  // Monthly hours trend
  const monthlyHours: { month: string; hours: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = start.toLocaleDateString("en-US", { month: "short" });
    const hours = timeEntries.filter((t) => t.date >= start && t.date < end).reduce((s, t) => s + Number(t.hours), 0);
    monthlyHours.push({ month: label, hours: Math.round(hours * 10) / 10 });
  }

  // Revenue per hour
  const revenuePerHour = totalHoursThisMonth > 0 ? Math.round(thisMonthRevenue / totalHoursThisMonth) : 0;

  // ── Customer Metrics ──
  const totalCustomers = customers.length;
  const newCustomersThisMonth = customers.filter((c) => c.createdAt >= thisMonthStart).length;
  const repeatCustomers = customers.filter((c) => c._count.jobs > 1).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  // ── Material Costs ──
  const totalMaterialCost = materials.reduce((s, m) => s + Number(m.unitCost || 0) * (m.quantity || 1), 0);

  return NextResponse.json({
    revenue: {
      totalPaid,
      totalOutstanding,
      totalOverdue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      changePercent: lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0,
      monthlyTrend: monthlyRevenue,
      byCategory: Object.entries(revenueByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    },
    jobs: {
      total: allJobs.length,
      active: activeJobs,
      completed: completedJobs,
      avgProgress,
      byStatus: Object.entries(jobsByStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      byCategory: Object.entries(jobsByCategory).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
      velocity: Object.entries(velocityByCategory).map(([name, data]) => ({
        name,
        avgDays: Math.round((data.totalDays / data.count) * 10) / 10,
        count: data.count,
      })).sort((a, b) => b.avgDays - a.avgDays),
    },
    profitability: {
      avgMargin,
      revenuePerHour,
      totalMaterialCost,
      details: profitData.slice(0, 20),
    },
    crew: {
      hoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
      hoursLastMonth: Math.round(totalHoursLastMonth * 10) / 10,
      monthlyTrend: monthlyHours,
    },
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomersThisMonth,
      repeatCustomers,
      repeatRate,
    },
  }, { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } });
}
