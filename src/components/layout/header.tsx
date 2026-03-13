"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Triangle } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Triangle className="h-3.5 w-3.5 text-white" fill="white" />
          </div>
          <span className="text-base font-semibold tracking-tight">FieldOps Lite</span>
        </Link>
      </div>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-xs font-semibold text-white">
          SC
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
