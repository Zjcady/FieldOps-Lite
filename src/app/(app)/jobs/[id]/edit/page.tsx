"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { JobForm } from "@/components/jobs/job-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import type { JobCreateInput } from "@/lib/validations/job";
import { toast } from "sonner";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [defaultValues, setDefaultValues] = useState<Partial<JobCreateInput> | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((job) => {
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
      });
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
