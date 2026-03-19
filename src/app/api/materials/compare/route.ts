import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const materials = await prisma.material.findMany({
    where: { job: { companyId: user.companyId } },
    include: {
      vendor: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Group by material name (case-insensitive)
  const grouped = new Map<
    string,
    { vendorName: string; unitCost: number; quantity: number }[]
  >();

  for (const m of materials) {
    const key = m.name.toLowerCase().trim();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({
      vendorName: m.vendor?.name ?? "No vendor",
      unitCost: Number(m.unitCost ?? 0),
      quantity: m.quantity,
    });
  }

  const items = Array.from(grouped.entries()).map(([key, vendors]) => {
    const original = materials.find((m) => m.name.toLowerCase().trim() === key);
    return {
      name: original?.name ?? key,
      vendors: vendors.sort((a, b) => a.unitCost - b.unitCost),
    };
  });

  return NextResponse.json({ items });
}
