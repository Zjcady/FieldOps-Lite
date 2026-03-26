import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireAdmin, validateBody } from "@/lib/api-utils";
import { pricingTemplateSchema } from "@/lib/validations/job";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;
  const [body, valErr] = await validateBody(request, pricingTemplateSchema);
  if (valErr) return valErr;

  const existing = await prisma.pricingTemplate.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return apiError("Template not found", 404);

  const updated = await prisma.pricingTemplate.update({
    where: { id, companyId: user.companyId },
    data: {
      name: body.name,
      category: body.category,
      unit: body.unit,
      ratePerUnit: body.ratePerUnit,
      materialCostPerUnit: body.materialCostPerUnit,
      laborHoursPerUnit: body.laborHoursPerUnit,
      description: body.description || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;

  const existing = await prisma.pricingTemplate.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return apiError("Template not found", 404);

  await prisma.pricingTemplate.update({
    where: { id, companyId: user.companyId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
