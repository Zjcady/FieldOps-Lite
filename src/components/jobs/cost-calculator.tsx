"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JOB_CATEGORIES, UNIT_LABELS } from "@/lib/constants";
import { Calculator } from "lucide-react";

interface PricingTemplate {
  id: string;
  name: string;
  category: string;
  unit: string;
  ratePerUnit: number;
  materialCostPerUnit: number;
  laborHoursPerUnit: number;
  description: string | null;
}

interface LaborRate {
  category: string;
  ratePerHour: number;
}

interface CostCalculatorProps {
  category?: string;
  onApply?: (result: { estimatedCost: number; estimatedHours: number }) => void;
}

export function CostCalculator({ category, onApply }: CostCalculatorProps) {
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [templates, setTemplates] = useState<PricingTemplate[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [quantity, setQuantity] = useState("");

  // Fetch templates and labor rates
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/settings/pricing-templates", { signal: controller.signal }).then((r) => r.ok ? r.json() : []),
      fetch("/api/settings/labor-rates", { signal: controller.signal }).then((r) => r.ok ? r.json() : []),
    ]).then(([t, r]) => {
      if (!controller.signal.aborted) {
        setTemplates(t);
        setLaborRates(r);
      }
    }).catch(() => {});
    return () => controller.abort();
  }, []);

  // Update category when prop changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (category) setSelectedCategory(category); }, [category]);

  const filteredTemplates = useMemo(
    () => templates.filter((t) => !selectedCategory || t.category === selectedCategory),
    [templates, selectedCategory]
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const laborRate = laborRates.find((r) => r.category === (selectedTemplate?.category || selectedCategory))?.ratePerHour ?? 45;

  // Calculate quantity based on unit type
  const calculatedQty = useMemo(() => {
    if (!selectedTemplate) return 0;
    switch (selectedTemplate.unit) {
      case "sqft": {
        const l = parseFloat(length) || 0;
        const w = parseFloat(width) || 0;
        return l * w;
      }
      case "linft":
        return parseFloat(length) || 0;
      default:
        return parseFloat(quantity) || 0;
    }
  }, [selectedTemplate, length, width, quantity]);

  // Calculations
  const laborHours = selectedTemplate ? calculatedQty * selectedTemplate.laborHoursPerUnit : 0;
  const laborCost = laborHours * laborRate;
  const materialCost = selectedTemplate ? calculatedQty * Number(selectedTemplate.materialCostPerUnit) : 0;
  const serviceCost = selectedTemplate ? calculatedQty * Number(selectedTemplate.ratePerUnit) : 0;
  const totalCost = serviceCost + materialCost;

  return (
    <div className="space-y-3">
      {/* Category selector */}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Category</label>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setSelectedTemplateId(""); }}
        >
          <option value="">All Categories</option>
          {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Template selector */}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Service Type</label>
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={selectedTemplateId}
          onChange={(e) => { setSelectedTemplateId(e.target.value); setLength(""); setWidth(""); setQuantity(""); }}
        >
          <option value="">Select a service...</option>
          {filteredTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({UNIT_LABELS[t.unit] || t.unit} — ${Number(t.ratePerUnit)})
            </option>
          ))}
        </select>
      </div>

      {/* Measurement inputs */}
      {selectedTemplate && (
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            {selectedTemplate.unit === "sqft" ? "Dimensions" :
             selectedTemplate.unit === "linft" ? "Length (ft)" :
             selectedTemplate.unit === "day" ? "Number of Days" :
             selectedTemplate.unit === "hour" ? "Number of Hours" :
             "Quantity"}
          </label>
          {selectedTemplate.unit === "sqft" ? (
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Length (ft)" value={length} onChange={(e) => setLength(e.target.value)} min="0" step="0.5" />
              <span className="text-muted-foreground">×</span>
              <Input type="number" placeholder="Width (ft)" value={width} onChange={(e) => setWidth(e.target.value)} min="0" step="0.5" />
              {calculatedQty > 0 && <span className="whitespace-nowrap text-xs text-muted-foreground">= {calculatedQty.toLocaleString()} sqft</span>}
            </div>
          ) : selectedTemplate.unit === "linft" ? (
            <Input type="number" placeholder="Length (ft)" value={length} onChange={(e) => setLength(e.target.value)} min="0" step="0.5" />
          ) : (
            <Input type="number" placeholder={selectedTemplate.unit === "day" ? "Days" : selectedTemplate.unit === "hour" ? "Hours" : "Qty"} value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" step="1" />
          )}
        </div>
      )}

      {/* Cost breakdown */}
      {selectedTemplate && calculatedQty > 0 && (
        <Card className="bg-secondary/50 p-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Service: {calculatedQty.toLocaleString()} {selectedTemplate.unit} × ${Number(selectedTemplate.ratePerUnit)}/{selectedTemplate.unit}
              </span>
              <span>${serviceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {Number(selectedTemplate.materialCostPerUnit) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Materials: {calculatedQty.toLocaleString()} × ${Number(selectedTemplate.materialCostPerUnit)}/{selectedTemplate.unit}
                </span>
                <span>${materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Labor estimate: {laborHours.toFixed(1)} hrs × ${laborRate}/hr</span>
              <span>${laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
              <span>Total Estimate</span>
              <span className="text-green-400">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {onApply && (
            <Button
              size="sm"
              className="mt-3 w-full"
              onClick={() => onApply({ estimatedCost: Math.round(totalCost * 100) / 100, estimatedHours: Math.round(laborHours * 10) / 10 })}
            >
              <Calculator className="mr-1 h-3.5 w-3.5" />
              Apply to Job
            </Button>
          )}
        </Card>
      )}

      {templates.length === 0 && (
        <p className="text-xs text-muted-foreground">No pricing templates configured. Add them in Settings → Pricing Templates.</p>
      )}
    </div>
  );
}
