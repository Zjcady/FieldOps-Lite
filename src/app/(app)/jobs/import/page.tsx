"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ParsedRow {
  title: string;
  customerName: string;
  category: string;
  address: string;
  estimatedCost: string;
}

export default function JobImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      // Skip header
      const parsed: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 5) continue;
        parsed.push({
          title: cols[0],
          customerName: cols[1],
          category: cols[2],
          address: cols[3],
          estimatedCost: cols[4],
        });
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setResults(null);

    try {
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setProgress(100);
      setResults(data);
      if (data.imported > 0) toast.success(`Imported ${data.imported} job(s)`);
      if (data.failed > 0) toast.error(`${data.failed} row(s) failed`);
    } catch {
      toast.error("Import request failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <h1 className="mb-1 text-lg font-semibold tracking-tight">Import Jobs from CSV</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Expected columns: title, customerName, category, address, estimatedCost
      </p>

      <Card className="mb-4 p-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          aria-label="Select CSV file to import"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
        />
      </Card>

      {rows.length > 0 && (
        <>
          <Card className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Address</th>
                  <th className="px-3 py-2">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">{r.customerName}</td>
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2">{r.address}</td>
                    <td className="px-3 py-2">{r.estimatedCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="mb-4">
            <Button size="sm" onClick={handleImport} disabled={importing}>
              <Upload className="mr-1 h-4 w-4" />
              {importing ? "Importing..." : `Import ${rows.length} Row(s)`}
            </Button>
          </div>

          {(importing || results) && (
            <Card className="p-4">
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {results && (
                <div className="text-sm">
                  <p className="text-green-400">{results.imported} imported</p>
                  {results.failed > 0 && <p className="text-red-400">{results.failed} failed</p>}
                  {results.errors.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-xs text-red-400">
                      {results.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
