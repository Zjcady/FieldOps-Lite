"use client";
import { Component, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="m-4 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
          <h2 className="mb-1 text-sm font-semibold">Something went wrong</h2>
          <p className="text-xs text-muted-foreground">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-3 text-xs text-primary hover:underline">Try again</button>
        </Card>
      );
    }
    return this.props.children;
  }
}
