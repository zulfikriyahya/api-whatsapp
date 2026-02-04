"use client";

import { useState, useEffect } from "react";
import { DeviceViewModel, DeviceStatus } from "@/types/database.types";
import { Trash2, RefreshCcw, QrCode, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
// PENTING: Import langsung ke file, bukan folder
import { DeviceQRModal } from "./device-qr-modal";

interface DeviceListProps {
  refreshTrigger?: number;
}

// Pastikan menggunakan 'export function'
export function DeviceList({ refreshTrigger = 0 }: DeviceListProps) {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeviceForQR, setSelectedDeviceForQR] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      const json = await res.json();
      if (json.success) setDevices(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [refreshTrigger]);

  const handleReconnect = async (id: string) => {
    await fetch(`/api/devices/${id}/reconnect`, { method: "POST" });
    fetchDevices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Disconnect and delete this device?")) return;
    await fetch(`/api/devices?ids=${id}`, { method: "DELETE" });
    fetchDevices();
  };

  const handleQRSuccess = () => {
    setSelectedDeviceForQR(null);
    fetchDevices();
  };

  if (loading && devices.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading devices...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl text-center border-dashed border-2 border-muted">
        <Smartphone className="w-8 h-8 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Devices Found</h3>
        <p className="text-muted-foreground">Add a device to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device.id}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between border hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
                    device.status === DeviceStatus.AUTHENTICATED
                      ? "bg-green-500/10 text-green-600"
                      : "bg-orange-500/10 text-orange-600",
                  )}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{device.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {device.phone_number}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  device.status === DeviceStatus.AUTHENTICATED
                    ? "bg-green-500"
                    : "bg-orange-500",
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                {device.status}
              </div>
              <div className="flex gap-2">
                {device.status !== DeviceStatus.AUTHENTICATED ? (
                  <button
                    onClick={() =>
                      setSelectedDeviceForQR({
                        id: device.id,
                        name: device.name,
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    <QrCode size={16} /> Scan QR
                  </button>
                ) : (
                  <button
                    onClick={() => handleReconnect(device.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg">
                    <RefreshCcw size={16} /> Re-Sync
                  </button>
                )}
                <button
                  onClick={() => handleDelete(device.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedDeviceForQR && (
        <DeviceQRModal
          deviceId={selectedDeviceForQR.id}
          deviceName={selectedDeviceForQR.name}
          onClose={() => setSelectedDeviceForQR(null)}
          onConnected={handleQRSuccess}
        />
      )}
    </>
  );
}
