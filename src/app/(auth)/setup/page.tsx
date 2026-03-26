"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Triangle, Loader2, Building2, User, Wrench, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { icon: Building2, title: "Your Company" },
  { icon: User, title: "Your Info" },
  { icon: Wrench, title: "Services" },
];

const SERVICE_OPTIONS = [
  "Hardscape", "Landscaping", "Fencing", "Lanai",
  "Maintenance", "Lighting", "Irrigation", "Pools",
  "Concrete", "Demolition", "Grading", "Drainage",
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Get the current Supabase user
      const isSupabaseConfigured = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      let authId: string;
      let email: string;

      if (isSupabaseConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Session expired. Please sign in again.");
          router.push("/login");
          return;
        }
        authId = user.id;
        email = user.email ?? "";
      } else {
        toast.error("Please use the signup page to create an account.");
        router.push("/signup");
        return;
      }

      // Create company + user via the setup API
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authId,
          email,
          name: name || email.split("@")[0],
          companyName: companyName || "My Company",
          companyPhone,
          companyAddress,
          services: selectedServices,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Setup failed" }));
        toast.error(err.error || "Failed to complete setup");
        setLoading(false);
        return;
      }

      toast.success("You're all set! Welcome to FieldOps.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const canProceed =
    step === 0 ? companyName.trim().length > 0 :
    step === 1 ? name.trim().length > 0 :
    true;

  return (
    <Card className="w-full max-w-md p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-md shadow-primary/25">
            <Triangle className="h-4.5 w-4.5 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-lg font-semibold">Welcome to FieldOps</h1>
        <p className="text-sm text-muted-foreground">Let&apos;s get your account set up</p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.title} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`} />}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                  isDone ? "bg-primary text-primary-foreground" :
                  isActive ? "bg-primary/15 text-primary ring-2 ring-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 0: Company */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Tell us about your company</h2>
          <Input
            placeholder="Company name *"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Phone number (optional)"
            type="tel"
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
          />
          <Input
            placeholder="Business address (optional)"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
          />
        </div>
      )}

      {/* Step 1: User info */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Your information</h2>
          <Input
            placeholder="Your full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Phone number (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">What services do you offer?</h2>
          <p className="text-xs text-muted-foreground">
            Select all that apply. You can always change these later in Settings.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                  selectedServices.includes(s)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep(step - 1)}
            disabled={loading}
          >
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button
            className="flex-1"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
          >
            Continue
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleComplete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Started
          </Button>
        )}
      </div>
    </Card>
  );
}
