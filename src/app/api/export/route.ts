import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, getPagination } from "@/lib/api-utils";

// Whitelist of allowed export types
const ALLOWED_TYPES = new Set(["jobs", "invoices", "customers"]);

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "jobs";
  const format = searchParams.get("format") || "csv";

  // Validate type against whitelist
  if (!ALLOWED_TYPES.has(type)) {
    return apiError(`Invalid export type. Allowed: ${[...ALLOWED_TYPES].join(", ")}`, 400);
  }

  const { skip, take } = getPagination(request);
  const companyId = user.companyId;

  if (type === "jobs") {
    const jobs = await prisma.job.findMany({
      where: { companyId },
      include: { customer: true, crew: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    if (format === "json") {
      return NextResponse.json(jobs);
    }

    const headers = ["Job Number", "Title", "Status", "Category", "Customer", "Crew", "Address", "Estimated Cost", "Actual Cost", "Progress"];
    const rows = jobs.map((j) => [
      j.jobNumber, j.title, j.status, j.category || "", j.customer?.name || "", j.crew?.name || "",
      j.address || "", String(j.estimatedCost || ""), String(j.actualCost || ""), String(j.progress),
    ]);

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fieldops-jobs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (type === "invoices") {
    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      include: { job: { select: { title: true, jobNumber: true, customer: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    if (format === "json") {
      return NextResponse.json(invoices);
    }

    const headers = ["Invoice #", "Job", "Customer", "Status", "Subtotal", "Tax", "Total", "Due Date", "Paid Date"];
    const rows = invoices.map((i) => [
      i.invoiceNumber, i.job.title, i.job.customer?.name || "", i.status,
      String(i.subtotal), String(i.tax), String(i.total),
      i.dueDate?.toISOString().split("T")[0] || "", i.paidDate?.toISOString().split("T")[0] || "",
    ]);

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fieldops-invoices-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (type === "customers") {
    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: { _count: { select: { jobs: true } } },
      orderBy: { name: "asc" },
      skip,
      take,
    });

    if (format === "json") {
      return NextResponse.json(customers);
    }

    const headers = ["Name", "Email", "Phone", "Address", "Total Jobs"];
    const rows = customers.map((c) => [c.name, c.email || "", c.phone || "", c.address || "", String(c._count.jobs)]);

    return new NextResponse(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="fieldops-customers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
}
