"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CameraFab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file reference globally for the jobs page to pick up
    (window as unknown as Record<string, File>).__fieldops_pending_photo = file;

    toast.info("Select a job to attach this photo to");
    router.push("/jobs");

    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <button
        onClick={handleClick}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Take photo"
      >
        <Camera className="h-6 w-6" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
