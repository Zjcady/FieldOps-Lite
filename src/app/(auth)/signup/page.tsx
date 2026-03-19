"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { APP_CONFIG } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Triangle, Loader2, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, company_name: companyName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account");
        setLoading(false);
        return;
      }

      // 2. Create company + user in our database via API
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authId: authData.user.id,
          email,
          name,
          companyName,
        }),
      });

      if (!res.ok) {
        toast.error("Account created but setup failed. Please contact support.");
        setLoading(false);
        return;
      }

      // #18: Show email verification screen instead of redirecting
      if (authData.user.identities?.length === 0 || authData.session === null) {
        // Email confirmation required
        setSuccess(true);
        setLoading(false);
        return;
      }

      // If auto-confirmed (e.g. dev mode), go to dashboard
      toast.success("Account created! Redirecting...");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // #18: Email verification success screen
  if (success) {
    return (
      <Card className="w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
          <Mail className="h-6 w-6 text-green-400" />
        </div>
        <h1 className="mb-2 text-lg font-semibold">Check your email</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
          Click the link to verify your account and get started.
        </p>
        <p className="text-xs text-muted-foreground">
          The link expires in 24 hours. Didn&apos;t receive it? Check your spam folder.
        </p>
        <div className="mt-6">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <div className="mb-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-md shadow-primary/25">
            <Triangle className="h-4.5 w-4.5 text-white" fill="white" />
          </div>
        </div>
        <h1 className="text-lg font-semibold">{APP_CONFIG.name}</h1>
        <p className="text-sm text-muted-foreground">Create your account</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          type="text"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {/* #27: Password strength indicator */}
          {password.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= level
                        ? level <= 1 ? "bg-red-400" : level <= 2 ? "bg-amber-400" : "bg-green-400"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {passwordStrength <= 1 ? "Weak" : passwordStrength <= 2 ? "Fair" : passwordStrength <= 3 ? "Good" : "Strong"}
              </span>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading || passwordStrength < 2}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </Card>
  );
}

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score);
}
