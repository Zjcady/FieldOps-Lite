"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["before", "progress", "after", "issue", "material"];

interface PhotoUploadProps {
  jobId: string;
  onUploaded: (photo: { id: string; url: string; caption: string | null; category: string; createdAt: string; lat: number | null; lng: number | null }) => void;
}

export function PhotoUpload({ jobId, onUploaded }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("progress");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    // Get GPS if available
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch { /* GPS not available, that's ok */ }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caption", caption);
    formData.append("category", category);
    if (lat !== null) formData.append("lat", String(lat));
    if (lng !== null) formData.append("lng", String(lng));

    const res = await fetch(`/api/jobs/${jobId}/photos`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const photo = await res.json();
      onUploaded(photo);
      setPreview(null);
      setFile(null);
      setCaption("");
      toast.success("Photo uploaded!");
    } else {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setCaption("");
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take or select a photo"
        className="sr-only"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!preview ? (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Camera className="mr-1 h-3.5 w-3.5" />
            Take Photo
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFile(f);
            };
            input.click();
          }}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      ) : (
        <Card className="p-3 space-y-3">
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-48 w-full rounded-md object-cover" />
            <button onClick={reset} className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors ${
                  category === cat ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleUpload} disabled={uploading}>
            {uploading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Upload Photo
          </Button>
        </Card>
      )}
    </div>
  );
}
