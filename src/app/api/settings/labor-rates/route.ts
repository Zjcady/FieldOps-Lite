import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireAdmin, validateBody } from "@/lib/api-utils";
import { laborRateArraySchema } from "@/lib/validations/job";
import { JOB_CATEGORIES } from "@/lib/constants";

const DEFAULT_RATE = 45;

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const rates = await prisma.laborRate.findMany({
    where: { companyId: user.companyId },
    orderBy: { category: "asc" },
  });

  // Return defaults for any categories without custom rates
  const rateMap = new Map(rates.map((r) => [r.category, Number(r.ratePerHour)]));
  const result = JOB_CATEGORIES.map((cat) => ({
    category: cat,
    ratePerHour: rateMap.get(cat) ?? DEFAULT_RATE,
  }));

  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const [body, valErr] = await validateBody(request, laborRateArraySchema);
  if (valErr) return valErr;

  // Upsert each rate
  const results = await Promise.all(
    body.map((rate) =>
      prisma.laborRate.upsert({
        where: { companyId_category: { companyId: user.companyId, category: rate.category } },
        update: { ratePerHour: rate.ratePerHour },
        create: { companyId: user.companyId, category: rate.category, ratePerHour: rate.ratePerHour },
      })
    )
  );

  return NextResponse.json(results);
}
