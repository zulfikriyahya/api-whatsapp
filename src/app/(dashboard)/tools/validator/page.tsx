"use client";

import { useState, useEffect } from "react";
import { DeviceViewModel } from "@/types/database.types";
import {
  Search,
  CheckCircle,
  XCircle,
  Smartphone,
  Loader2,
} from "lucide-react";

export default function ValidatorPage() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    registered: boolean;
    formattedNumber?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => {
        if (data.success)
          setDevices(
            data.data.filter((d: any) => d.status === "AUTHENTICATED"),
          );
      });
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !phone) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tools/validate-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: selectedDevice, phoneNumber: phone }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Number Validator
        </h2>
        <p className="text-muted-foreground mt-1">
          Check if a phone number is registered on WhatsApp.
        </p>
      </div>

      <div className="glass-card p-8 rounded-2xl shadow-sm">
        <form onSubmit={handleCheck} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Active Device (Checker)
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <select
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                required>
                <option value="">-- Select Device --</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone_number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Phone Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="e.g. 62812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedDevice}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Check Number"}
          </button>
        </form>

        {result !== null && (
          <div
            className={`mt-8 p-6 rounded-xl border flex items-center gap-4 ${result.registered ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            {result.registered ? (
              <div className="p-3 bg-green-500 rounded-full text-white shadow-lg shadow-green-500/30">
                <CheckCircle size={32} />
              </div>
            ) : (
              <div className="p-3 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/30">
                <XCircle size={32} />
              </div>
            )}
            <div>
              <h4 className="text-xl font-bold">
                {result.registered
                  ? "Registered on WhatsApp"
                  : "Not Registered"}
              </h4>
              <p className="text-muted-foreground font-mono mt-1">
                Formatted: {result.formattedNumber || phone}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
