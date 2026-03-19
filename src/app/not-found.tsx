import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="mx-auto max-w-md p-8 text-center">
        <div className="mb-4 text-6xl font-bold text-muted-foreground/20">404</div>
        <h1 className="mb-2 text-lg font-semibold">Page not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex h-8 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Back to Dashboard
        </Link>
      </Card>
    </div>
  );
}
