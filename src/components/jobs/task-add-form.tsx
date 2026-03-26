"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface TaskAddFormProps {
  jobId: string;
  onTaskAdded: (task: { id: string; title: string; status: string; completedAt: string | null }) => void;
}

export function TaskAddForm({ jobId, onTaskAdded }: TaskAddFormProps) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);

    const res = await fetch(`/api/jobs/${jobId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (res.ok) {
      const task = await res.json();
      onTaskAdded(task);
      setTitle("");
    } else {
      toast.error("Failed to add task");
    }
    setAdding(false);
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Add a task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <Button size="sm" onClick={handleAdd} disabled={adding || !title.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
