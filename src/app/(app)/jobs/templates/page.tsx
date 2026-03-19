"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEMPLATES = [
  {
    name: "Basic Lawn Maintenance",
    category: "Maintenance",
    estimatedHours: 2,
    estimatedCost: 150,
  },
  {
    name: "Full Landscape Design",
    category: "Landscaping",
    estimatedHours: 40,
    estimatedCost: 8500,
  },
  {
    name: "Paver Patio Install",
    category: "Hardscape",
    estimatedHours: 24,
    estimatedCost: 6000,
  },
  {
    name: "Privacy Fence",
    category: "Fencing",
    estimatedHours: 16,
    estimatedCost: 4200,
  },
  {
    name: "Landscape Lighting",
    category: "Lighting",
    estimatedHours: 12,
    estimatedCost: 3500,
  },
];

export default function JobTemplatesPage() {
  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <h1 className="mb-1 text-lg font-semibold tracking-tight">Job Templates</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Start a new job from a predefined template.
      </p>

      <div className="space-y-3">
        {TEMPLATES.map((t) => {
          const params = new URLSearchParams({
            template: t.name,
            title: t.name,
            category: t.category,
            estimatedHours: String(t.estimatedHours),
            estimatedCost: String(t.estimatedCost),
          });
          return (
            <Card key={t.name} className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.category} &middot; {t.estimatedHours}hrs &middot; $
                  {t.estimatedCost.toLocaleString()}
                </div>
              </div>
              <Button size="sm" nativeButton={false} render={<Link href={`/jobs/new?${params.toString()}`} />}>
                Use Template
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
