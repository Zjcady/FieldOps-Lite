import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireAdmin, validateBody } from "@/lib/api-utils";
import { pricingTemplateSchema } from "@/lib/validations/job";

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const templates = await prisma.pricingTemplate.findMany({
    where: {
      companyId: user.companyId,
      isActive: true,
      ...(category && { category }),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const [body, valErr] = await validateBody(request, pricingTemplateSchema);
  if (valErr) return valErr;

  const template = await prisma.pricingTemplate.create({
    data: {
      companyId: user.companyId,
      name: body.name,
      category: body.category,
      unit: body.unit,
      ratePerUnit: body.ratePerUnit,
      materialCostPerUnit: body.materialCostPerUnit,
      laborHoursPerUnit: body.laborHoursPerUnit,
      description: body.description || null,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
