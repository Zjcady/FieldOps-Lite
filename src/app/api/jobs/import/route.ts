import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

interface ImportRow {
  title: string;
  customerName: string;
  category: string;
  address: string;
  estimatedCost: string | number;
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{ rows: ImportRow[] }>(request);
  if (parseErr) return parseErr;

  if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
    return apiError("rows array is required", 400);
  }

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  const year = new Date().getFullYear();

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i];
    try {
      if (!row.title) {
        throw new Error("title is required");
      }

      // Look up customer by name (case-insensitive)
      const customer = await prisma.customer.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: row.customerName, mode: "insensitive" },
        },
      });

      if (!customer) {
        throw new Error(`Customer "${row.customerName}" not found`);
      }

      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const jobNumber = `JOB-${year}-${rand}`;
      const cost = typeof row.estimatedCost === "string" ? parseFloat(row.estimatedCost) : row.estimatedCost;

      await prisma.job.create({
        data: {
          companyId: user.companyId,
          customerId: customer.id,
          jobNumber,
          title: row.title,
          category: row.category || null,
          address: row.address || null,
          estimatedCost: isNaN(cost) ? null : cost,
          type: "project",
          priority: "medium",
        },
      });

      imported++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Row ${i + 1}: ${msg}`);
    }
  }

  return NextResponse.json({ imported, failed, errors });
}
