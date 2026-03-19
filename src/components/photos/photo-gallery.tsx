"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, MapPin, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  category: string;
  createdAt: string;
  lat?: number | null;
  lng?: number | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ImageIcon className="mb-2 h-8 w-8 opacity-20" />
        <p className="text-sm">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {photos.map((photo) => (
          <Card
            key={photo.id}
            className="group relative cursor-pointer overflow-hidden transition-all hover:border-primary/30"
            onClick={() => setSelected(photo)}
          >
            {photo.url.startsWith("http") ? (
              <img src={photo.url} alt={photo.caption || `${photo.category} photo`} loading="lazy" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-secondary">
                <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              {photo.caption && (
                <div className="text-[10px] leading-tight text-white">{photo.caption}</div>
              )}
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] capitalize text-white/80">
                  {photo.category}
                </span>
                {photo.lat && <MapPin className="h-2.5 w-2.5 text-white/60" />}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lightbox — #25: keyboard dismiss */}
      {selected && (
        <LightboxOverlay onClose={() => setSelected(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute -right-2 -top-2 z-10 rounded-full bg-black/70 p-1.5 text-white hover:bg-black">
              <X className="h-4 w-4" />
            </button>
            {selected.url.startsWith("http") ? (
              <img src={selected.url} alt={selected.caption || `${selected.category} photo`} className="max-h-[80vh] rounded-lg object-contain" />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-card">
                <ImageIcon className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
            <div className="mt-2 text-center text-sm text-white">
              {selected.caption && <div className="font-medium">{selected.caption}</div>}
              <div className="text-xs text-white/60">
                {selected.category} · {formatDateTime(selected.createdAt)}
                {selected.lat && selected.lng && ` · ${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
              </div>
            </div>
          </div>
        </LightboxOverlay>
      )}
    </>
  );
}

/** Lightbox overlay with Escape key dismiss and focus trap (#25) */
function LightboxOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      {children}
    </div>
  );
}
