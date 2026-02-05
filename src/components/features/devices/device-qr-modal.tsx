"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { DeviceStatus } from "@/types/database.types";
import Image from "next/image";

interface Props {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
  onConnected: () => void;
}

export function DeviceQRModal({
  deviceId,
  deviceName,
  onClose,
  onConnected,
}: Props) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState<DeviceStatus>(DeviceStatus.CONNECTING);
  const [error, setError] = useState("");

  const fetchQR = useCallback(async () => {
    try {
      // Panggil API dengan format=image agar dapat base64 langsung
      const res = await fetch(`/api/devices/${deviceId}/qr?format=image`);
      const json = await res.json();

      if (json.success) {
        setStatus(json.data.status);

        // Jika status authenticated, trigger success
        if (
          json.data.status === DeviceStatus.AUTHENTICATED ||
          json.data.status === DeviceStatus.CONNECTED
        ) {
          onConnected();
          return true; // Stop polling
        }

        // Update QR Image jika ada
        if (json.data.qrCode) {
          setQrImage(json.data.qrCode);
        }
      } else {
        setError(json.error?.message || "Gagal mengambil QR");
      }
    } catch (e) {
      console.error(e);
      setError("Koneksi terputus");
    }
    return false;
  }, [deviceId, onConnected]);

  // Polling QR setiap 3 detik
  useEffect(() => {
    fetchQR();
    const interval = setInterval(async () => {
      const stop = await fetchQR();
      if (stop) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchQR]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full z-10">
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <h3 className="font-bold text-xl mb-1">Link Device</h3>
          <p className="text-sm text-muted-foreground mb-6">{deviceName}</p>

          <div className="min-h-[250px] flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-muted mb-4 relative">
            {status === DeviceStatus.AUTHENTICATED ? (
              <div className="text-green-500 flex flex-col items-center animate-in zoom-in">
                <CheckCircle size={64} className="mb-2" />
                <span className="font-bold">Connected!</span>
              </div>
            ) : qrImage ? (
              <div className="p-4 bg-white rounded-xl shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImage}
                  alt="Scan QR"
                  className="w-56 h-56 object-contain"
                />
              </div>
            ) : error ? (
              <div className="text-red-500 flex flex-col items-center px-4">
                <AlertTriangle size={48} className="mb-2 opacity-50" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Loader2 size={40} className="animate-spin mb-2 text-primary" />
                <span className="text-xs">
                  Menunggu QR Code dari WhatsApp...
                </span>
              </div>
            )}
          </div>

          <div className="text-left text-sm space-y-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="font-semibold text-blue-700 dark:text-blue-300">
              Cara Scan:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground text-xs">
              <li>Buka WhatsApp di HP Anda</li>
              <li>Menu &gt; Perangkat Tertaut &gt; Tautkan Perangkat</li>
              <li>Arahkan kamera ke QR Code di atas</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
