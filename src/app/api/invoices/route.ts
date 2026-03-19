// TODO: When creating invoices, validate that subtotal = sum(lineItems.total) and total = subtotal + tax
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const invoices = await prisma.invoice.findMany({
    where: { companyId: user.companyId },
    include: { job: { select: { title: true, jobNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}
