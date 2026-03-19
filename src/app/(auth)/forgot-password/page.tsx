"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Triangle, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "Request failed");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm p-6">
      <div className="mb-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-md shadow-primary/25">
            <Triangle className="h-4.5 w-4.5 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-lg font-semibold">{APP_CONFIG.name}</h1>
        <p className="text-sm text-muted-foreground">Reset your password</p>
      </div>

      {sent ? (
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />
          <p className="text-sm text-muted-foreground">
            Check your email for a reset link.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </form>
      )}
    </Card>
  );
}
