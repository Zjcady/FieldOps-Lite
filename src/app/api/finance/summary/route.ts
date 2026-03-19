import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, safeDate } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const companyId = user.companyId;

  // Date range filter (#43) — default to current month
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const from = safeDate(searchParams.get("from")) ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const to = safeDate(searchParams.get("to")) ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const dateFilter = { gte: from, lte: to };

  const [jobs, invoices, timeEntries] = await Promise.all([
    prisma.job.findMany({
      where: { companyId, createdAt: dateFilter },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        estimatedCost: true,
        actualCost: true,
        estimatedHours: true,
        actualHours: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { companyId, createdAt: dateFilter },
      select: { status: true, total: true, paidDate: true },
    }),
    prisma.timeEntry.findMany({
      where: { companyId, date: dateFilter },
      select: { hours: true, billable: true, date: true },
    }),
  ]);

  // Revenue metrics (Number() handles Decimal → number conversion)
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total), 0);

  // Margin analysis per job
  const marginByJob = jobs
    .filter((j) => j.estimatedCost && j.actualCost)
    .map((j) => {
      const estimated = Number(j.estimatedCost!);
      const actual = Number(j.actualCost!);
      return {
        title: j.title,
        customer: j.customer?.name || "Unknown",
        category: j.category,
        estimated,
        actual,
        margin: estimated - actual,
        marginPct: estimated > 0 ? ((estimated - actual) / estimated) * 100 : 0,
      };
    })
    .sort((a, b) => b.marginPct - a.marginPct);

  // Category performance
  const catMap = new Map<string, { revenue: number; cost: number; jobs: number }>();
  jobs.forEach((j) => {
    const cat = j.category || "Other";
    const entry = catMap.get(cat) || { revenue: 0, cost: 0, jobs: 0 };
    entry.revenue += Number(j.estimatedCost || 0);
    entry.cost += Number(j.actualCost || 0);
    entry.jobs += 1;
    catMap.set(cat, entry);
  });
  const categoryPerformance = Array.from(catMap.entries()).map(([name, v]) => ({
    name,
    ...v,
    margin: v.revenue - v.cost,
    marginPct: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
  }));

  // Bottleneck detection
  const bottlenecks = [];
  const waitingPermit = jobs.filter((j) => j.status === "waiting_permit").length;
  const waitingMaterials = jobs.filter((j) => j.status === "waiting_materials").length;
  const waitingInspection = jobs.filter((j) => j.status === "waiting_inspection").length;
  if (waitingPermit > 0) bottlenecks.push({ type: "Permit Delays", count: waitingPermit, severity: "high" });
  if (waitingMaterials > 0) bottlenecks.push({ type: "Material Delays", count: waitingMaterials, severity: "medium" });
  if (waitingInspection > 0) bottlenecks.push({ type: "Inspection Backlog", count: waitingInspection, severity: "medium" });

  // Over-budget jobs
  const overBudget = marginByJob.filter((j) => j.margin < 0);
  if (overBudget.length > 0) bottlenecks.push({ type: "Over-Budget Jobs", count: overBudget.length, severity: "high" });

  // Hours utilization
  const totalHours = timeEntries.reduce((s, e) => s + e.hours, 0);
  const billableHours = timeEntries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);

  return NextResponse.json({
    dateRange: { from: from.toISOString(), to: to.toISOString() },
    revenue: { totalInvoiced, totalPaid, totalOutstanding },
    margins: { byJob: marginByJob, byCategory: categoryPerformance },
    bottlenecks,
    hours: { total: totalHours, billable: billableHours, utilization: totalHours > 0 ? (billableHours / totalHours) * 100 : 0 },
  });
}
