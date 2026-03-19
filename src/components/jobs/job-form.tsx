"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobCreateSchema, type JobCreateInput } from "@/lib/validations/job";
import { JOB_CATEGORIES, JOB_PRIORITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  properties: { id: string; address: string }[];
}

interface Crew {
  id: string;
  name: string;
}

interface JobFormProps {
  defaultValues?: Partial<JobCreateInput>;
  onSubmit: (data: JobCreateInput) => Promise<void>;
  submitLabel?: string;
}

export function JobForm({ defaultValues, onSubmit, submitLabel = "Create Job" }: JobFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<JobCreateInput>({
    resolver: zodResolver(jobCreateSchema) as any,
    defaultValues: {
      type: "project",
      priority: "medium",
      ...defaultValues,
    },
  });

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/crews").then((r) => r.json()),
    ]).then(([c, cr]) => {
      setCustomers(c);
      setCrews(cr);
    });
  }, []);

  const handleFormSubmit = async (data: JobCreateInput) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <fieldset disabled={submitting}>
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Job Details</h3>
        <div>
          <Input placeholder="Job title *" {...register("title")} />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <textarea
          placeholder="Description (optional)"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register("description")}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="job-type" className="mb-1 block text-xs text-muted-foreground">Type</label>
            <select
              id="job-type"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("type")}
            >
              <option value="project">Project</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          <div>
            <label htmlFor="job-category" className="mb-1 block text-xs text-muted-foreground">Category</label>
            <select
              id="job-category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("category")}
            >
              <option value="">Select...</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Priority</label>
          <div className="flex gap-2">
            {JOB_PRIORITIES.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm">
                <input type="radio" value={p} {...register("priority")} className="accent-primary" />
                <span className="capitalize">{p}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Customer & Location</h3>
        <div>
          <label htmlFor="job-customer" className="sr-only">Customer</label>
          <select
            id="job-customer"
            aria-label="Customer"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...register("customerId")}
          >
            <option value="">Select customer *</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-xs text-red-400">{errors.customerId.message}</p>}
        </div>
        {selectedCustomer && selectedCustomer.properties.length > 0 && (
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...register("propertyId")}
          >
            <option value="">Select property (optional)</option>
            {selectedCustomer.properties.map((p) => (
              <option key={p.id} value={p.id}>{p.address}</option>
            ))}
          </select>
        )}
        <Input placeholder="Job site address" {...register("address")} />
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Schedule & Crew</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
            <Input type="date" {...register("scheduledDate")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Est. End Date</label>
            <Input type="date" {...register("estimatedEnd")} />
          </div>
        </div>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          {...register("crewId")}
        >
          <option value="">Assign crew (optional)</option>
          {crews.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Est. Cost ($)</label>
            <Input type="number" step="0.01" placeholder="0.00" {...register("estimatedCost")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Est. Hours</label>
            <Input type="number" step="0.5" placeholder="0" {...register("estimatedHours")} />
          </div>
        </div>
      </Card>
      </fieldset>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
