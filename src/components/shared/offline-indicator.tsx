"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      role="status"
      className={`fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium transition-colors ${
        isOffline
          ? "bg-amber-500 text-amber-950"
          : "bg-green-500 text-green-950"
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          You&apos;re offline. Changes will sync when reconnected.
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          Back online!
        </>
      )}
    </div>
  );
}
