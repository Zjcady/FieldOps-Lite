"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { JobForm } from "@/components/jobs/job-form";
import type { JobCreateInput } from "@/lib/validations/job";
import { toast } from "sonner";

export default function NewJobPage() {
  const router = useRouter();

  const handleSubmit = async (data: JobCreateInput) => {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to create job");
      return;
    }

    const job = await res.json();
    toast.success("Job created!");
    router.push(`/jobs/${job.id}`);
  };

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <h1 className="mb-4 text-lg font-semibold tracking-tight">New Job</h1>

      <JobForm onSubmit={handleSubmit} />
    </div>
  );
}
