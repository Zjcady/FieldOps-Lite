"use client";

import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface VendorEntry {
  vendorName: string;
  unitCost: number;
  quantity: number;
}

interface CompareItem {
  name: string;
  vendors: VendorEntry[];
}

interface CompareResponse {
  items: CompareItem[];
}

export default function MaterialComparePage() {
  const { data, loading, error } = useFetch<CompareResponse>(
    "/api/materials/compare"
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/materials">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Vendor Price Comparison
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare material prices across vendors to find the best deal
          </p>
        </div>
      </div>

      {error && (
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {loading && !data && (
        <div className="flex justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {data && data.items.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No materials to compare. Add materials from multiple vendors first.
          </p>
        </Card>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((item) => {
            const bestPrice =
              item.vendors.length > 0 ? item.vendors[0].unitCost : null;
            return (
              <Card key={item.name} className="overflow-hidden">
                <div className="border-b bg-muted/50 px-4 py-2">
                  <h3 className="text-sm font-semibold">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.vendors.length} vendor
                    {item.vendors.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left font-medium">
                          Vendor
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Unit Cost
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.vendors.map((v, i) => {
                        const isBest =
                          item.vendors.length > 1 &&
                          v.unitCost === bestPrice;
                        return (
                          <tr
                            key={`${v.vendorName}-${i}`}
                            className={`border-b last:border-0 ${
                              isBest ? "bg-green-500/10" : ""
                            }`}
                          >
                            <td className="px-4 py-2">
                              {v.vendorName}
                              {isBest && (
                                <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-500">
                                  Best Price
                                </span>
                              )}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-medium ${
                                isBest ? "text-green-500" : ""
                              }`}
                            >
                              ${v.unitCost.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {v.quantity}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
