"use client";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  category: string;
  createdAt: string;
}

interface BeforeAfterProps {
  photos: Photo[];
}

export function BeforeAfter({ photos }: BeforeAfterProps) {
  const beforePhotos = photos.filter((p) => p.category === "before");
  const afterPhotos = photos.filter((p) => p.category === "after");

  if (beforePhotos.length === 0 && afterPhotos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Before */}
      <div>
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-red-400">
          Before
        </div>
        {beforePhotos.length > 0 ? (
          <div className="space-y-2">
            {beforePhotos.slice(0, 3).map((photo) => (
              <div key={photo.id} className="relative overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || "Before photo"}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            No before photos yet
          </div>
        )}
      </div>

      {/* After */}
      <div>
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-green-400">
          After
        </div>
        {afterPhotos.length > 0 ? (
          <div className="space-y-2">
            {afterPhotos.slice(0, 3).map((photo) => (
              <div key={photo.id} className="relative overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || "After photo"}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            No after photos yet
          </div>
        )}
      </div>
    </div>
  );
}
