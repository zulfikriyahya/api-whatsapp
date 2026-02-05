"use client";

import { useState, useEffect, useCallback } from "react";
import { DeviceViewModel, DeviceStatus } from "@/types/database.types";
import { Trash2, RefreshCcw, QrCode, Smartphone, Loader2 } from "lucide-react";
import { DeviceQRModal } from "./device-qr-modal";
import { cn } from "@/lib/utils/cn";

export function DeviceList() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalDevice, setQrModalDevice] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const json = await res.json();
      if (json.success) setDevices(json.data);
    } catch (e) {
      console.error("Failed to fetch devices", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling status setiap 5 detik agar realtime
  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus device ini? Sesi WhatsApp akan terputus.")) return;
    try {
      await fetch(`/api/devices/${id}`, { method: "DELETE" });
      fetchDevices(); // Refresh list immediate
    } catch (e) {
      alert("Gagal menghapus device");
    }
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.AUTHENTICATED:
        return "bg-green-500";
      case DeviceStatus.CONNECTED:
        return "bg-emerald-400";
      case DeviceStatus.QR_READY:
        return "bg-yellow-400";
      case DeviceStatus.DISCONNECTED:
        return "bg-gray-400";
      case DeviceStatus.ERROR:
        return "bg-red-500";
      default:
        return "bg-blue-400";
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="animate-spin mx-auto mb-2" />
        Loading devices...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center p-10 glass-card rounded-2xl border-dashed border-2">
        <Smartphone className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Belum ada device</h3>
        <p className="text-muted-foreground">
          Tambahkan device baru untuk mulai mengirim pesan.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
                    device.status === DeviceStatus.AUTHENTICATED
                      ? "bg-green-500"
                      : "bg-slate-400",
                  )}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-base truncate max-w-[150px]">
                    {device.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {device.phone_number}
                  </p>
                </div>
              </div>
              <div
                title={device.status}
                className={cn(
                  "w-3 h-3 rounded-full shadow-sm animate-pulse",
                  getStatusColor(device.status),
                )}
              />
            </div>

            <div className="space-y-4 mt-2">
              <div className="flex justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <span>
                  Status: <b>{device.status}</b>
                </span>
                {device.message_count !== undefined && (
                  <span>{device.message_count} Pesan</span>
                )}
              </div>

              <div className="flex gap-2">
                {device.status !== DeviceStatus.AUTHENTICATED && (
                  <button
                    onClick={() =>
                      setQrModalDevice({ id: device.id, name: device.name })
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                    <QrCode size={14} /> Scan QR
                  </button>
                )}

                {device.status === DeviceStatus.AUTHENTICATED && (
                  <button
                    onClick={() =>
                      fetch(`/api/devices/${device.id}/reconnect`, {
                        method: "POST",
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80">
                    <RefreshCcw size={14} /> Re-Sync
                  </button>
                )}

                <button
                  onClick={() => handleDelete(device.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Hapus Device">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {qrModalDevice && (
        <DeviceQRModal
          deviceId={qrModalDevice.id}
          deviceName={qrModalDevice.name}
          onClose={() => setQrModalDevice(null)}
          onConnected={() => {
            setQrModalDevice(null);
            fetchDevices();
          }}
        />
      )}
    </>
  );
}
