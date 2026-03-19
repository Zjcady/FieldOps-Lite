"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", variant = "default", onConfirm, onCancel }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  if (!open) return null;
  const handleConfirm = async () => { setLoading(true); await onConfirm(); setLoading(false); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <Card className="w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button size="sm" variant={variant} onClick={handleConfirm} disabled={loading}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
