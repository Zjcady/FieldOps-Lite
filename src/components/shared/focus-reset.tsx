"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function FocusReset() {
  const pathname = usePathname();
  useEffect(() => { document.getElementById("main-content")?.focus({ preventScroll: true }); }, [pathname]);
  return null;
}
