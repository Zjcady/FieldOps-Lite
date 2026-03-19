"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Star, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface ReviewCandidate {
  id: string;
  title: string;
  jobNumber: string;
  completedAt: string | null;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
  };
}

export default function ReviewRequestsPage() {
  const { data: jobs, loading, error } = useFetch<ReviewCandidate[]>("/api/jobs?status=completed&include=customer");
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const candidates = (jobs ?? []).filter((j) => j.customer?.email);

  const handleSendReview = async (job: ReviewCandidate) => {
    setSending(job.id);
    try {
      // Open mailto as a simple review request mechanism
      const email = job.customer.email;
      const subject = encodeURIComponent(`How was your experience? - ${job.title}`);
      const body = encodeURIComponent(
        `Hi ${job.customer.name},\n\nWe recently completed "${job.title}" (${job.jobNumber}) for you. We'd love to hear about your experience!\n\nWould you take a moment to leave us a review? Your feedback helps us improve our services.\n\nThank you!\n- The FieldOps Team`
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
      setSent((prev) => new Set(prev).add(job.id));
      toast.success(`Review request prepared for ${job.customer.name}`);
    } catch {
      toast.error("Failed to prepare review request");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Review Requests</h1>
        <p className="text-sm text-muted-foreground">
          Send review request emails to customers with completed jobs
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="flex items-center gap-3 border-destructive/50 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </Card>
      ) : candidates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Star className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-sm">No completed jobs with customer emails found.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            {candidates.length} customer{candidates.length !== 1 ? "s" : ""} with completed jobs
          </p>
          {candidates.map((job) => (
            <Card key={job.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{job.customer.name}</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {job.customer.email}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {job.title} ({job.jobNumber}) — Completed {formatDate(job.completedAt || job.updatedAt)}
                  </div>
                </div>
                <div>
                  {sent.has(job.id) ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="h-3.5 w-3.5" /> Sent
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReview(job)}
                      disabled={sending === job.id}
                      aria-label={`Send review request to ${job.customer.name}`}
                    >
                      <Star className="mr-1 h-3.5 w-3.5" />
                      {sending === job.id ? "Preparing..." : "Send Review Request"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
