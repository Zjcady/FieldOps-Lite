"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  _count: { jobs: number };
}

export default function CustomersPage() {
  const { data: customers, loading, error, refetch } = useFetch<Customer[]>("/api/customers");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail || null, phone: newPhone || null, address: newAddress || null }),
      });
      if (res.ok) {
        setNewName("");
        setNewEmail("");
        setNewPhone("");
        setNewAddress("");
        setShowAdd(false);
        toast.success("Customer added!");
        refetch();
      } else {
        toast.error("Failed to add customer");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">{(customers ?? []).length} customers</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-4 p-4 space-y-3">
          <Input placeholder="Customer name *" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <Input placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>
          <Input placeholder="Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding || !newName.trim()}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Card key={i} className="h-20 animate-pulse p-4" />)}
        </div>
      ) : error ? (
        <Card className="flex items-center gap-3 border-destructive/50 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(customers ?? []).map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="cursor-pointer p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{c.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      )}
                      {c.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" /> {c._count.jobs} jobs
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
