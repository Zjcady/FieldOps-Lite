"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { JobForm } from "@/components/jobs/job-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { JobCreateInput } from "@/lib/validations/job";
import { toast } from "sonner";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [defaultValues, setDefaultValues] = useState<Partial<JobCreateInput> | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/jobs/${id}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load job");
        return r.json();
      })
      .then((job) => {
        if (!controller.signal.aborted) {
          setDefaultValues({
            title: job.title,
            customerId: job.customerId,
            propertyId: job.propertyId || undefined,
            crewId: job.crewId || undefined,
            description: job.description || undefined,
            type: job.type,
            category: job.category || undefined,
            priority: job.priority,
            scheduledDate: job.scheduledDate?.split("T")[0],
            estimatedEnd: job.estimatedEnd?.split("T")[0],
            estimatedCost: job.estimatedCost || undefined,
            estimatedHours: job.estimatedHours || undefined,
            address: job.address || undefined,
          });
        }
      })
      .catch((e) => { if (e.name !== "AbortError") setFetchError("Failed to load job data. Please go back and try again."); });
    return () => controller.abort();
  }, [id]);

  const handleSubmit = async (data: JobCreateInput) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Failed to update job");
      return;
    }

    toast.success("Job updated!");
    router.push(`/jobs/${id}`);
  };

  if (fetchError) {
    return (
      <div className="mx-auto max-w-xl p-4 md:p-6">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Jobs", href: "/jobs" }, { label: "Edit" }]} />
        <Card className="mt-4 border-red-500/30 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
          <p className="text-sm text-red-400">{fetchError}</p>
        </Card>
      </div>
    );
  }

  if (!defaultValues) {
    return (
      <div className="p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Jobs", href: "/jobs" }, { label: "Job", href: `/jobs/${id}` }, { label: "Edit" }]} />

      <h1 className="mb-4 text-lg font-semibold tracking-tight">Edit Job</h1>

      <JobForm defaultValues={defaultValues} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
