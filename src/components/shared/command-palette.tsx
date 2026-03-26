"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const COMMANDS = [
  { label: "New Job", href: "/jobs/new", keywords: ["create", "add"] },
  { label: "Jobs", href: "/jobs", keywords: ["list", "all"] },
  { label: "Customers", href: "/customers", keywords: ["clients"] },
  { label: "Crew", href: "/crew", keywords: ["team", "members"] },
  { label: "Calendar", href: "/calendar", keywords: ["schedule", "dates"] },
  { label: "Settings", href: "/settings", keywords: ["preferences", "config"] },
  { label: "Reports", href: "/reports", keywords: ["analytics", "stats"] },
  { label: "Import CSV", href: "/jobs/import", keywords: ["upload", "bulk"] },
  { label: "Templates", href: "/jobs/templates", keywords: ["presets"] },
  { label: "Permits", href: "/permits", keywords: ["license", "inspection"] },
  { label: "Vendors", href: "/vendors", keywords: ["suppliers", "materials"] },
  { label: "Materials", href: "/materials", keywords: ["supplies", "inventory"] },
  { label: "Invoices", href: "/invoices", keywords: ["billing", "payments"] },
  { label: "Finance", href: "/finance", keywords: ["revenue", "money", "profit"] },
  { label: "Team", href: "/team", keywords: ["users", "members", "invite"] },
  { label: "Map", href: "/map", keywords: ["location", "area", "geography"] },
  { label: "Outreach", href: "/outreach", keywords: ["email", "campaigns", "marketing"] },
  { label: "Activity", href: "/activity", keywords: ["log", "history", "feed"] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.includes(q))
    );
  });

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          handleClose();
        } else {
          handleOpen();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleOpen, handleClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Reset selected index when filter changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].href);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command... (↑↓ to navigate, Enter to select)"
          className="w-full rounded-t-xl border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.href}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                  i === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
                onClick={() => handleSelect(cmd.href)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {cmd.label}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
          <span className="mx-2">&middot;</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate
          <span className="mx-2">&middot;</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> select
        </div>
      </div>
    </div>
  );
}
