"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { DeviceStatus } from "@/types/database.types";

interface DeviceQRModalProps {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
  onConnected: () => void;
}

type ModalState = "LOADING" | "WAITING" | "READY" | "CONNECTED" | "ERROR";

// Pastikan menggunakan 'export function'
export function DeviceQRModal({
  deviceId,
  deviceName,
  onClose,
  onConnected,
}: DeviceQRModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [state, setState] = useState<ModalState>("LOADING");
  const [retryCount, setRetryCount] = useState(0);

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/qr?format=image`);
      if (!res.ok) throw new Error("Failed to fetch QR");

      const json = await res.json();
      const { status, qrCode: qrData } = json.data;

      if (
        status === DeviceStatus.AUTHENTICATED ||
        status === DeviceStatus.CONNECTED
      ) {
        setState("CONNECTED");
        setTimeout(() => {
          onConnected();
        }, 1500);
        return true;
      }

      if (qrData) {
        setQrCode(qrData);
        setState("READY");
      } else {
        setState("WAITING");
      }

      return false;
    } catch (error) {
      console.error(error);
      if (state === "LOADING") setState("ERROR");
      return false;
    }
  }, [deviceId, onConnected, state]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const startPolling = async () => {
      const shouldStop = await fetchQR();
      if (shouldStop || !isMounted) return;

      intervalId = setInterval(async () => {
        if (!isMounted) return;
        const stop = await fetchQR();
        if (stop) clearInterval(intervalId);
      }, 3000);
    };

    startPolling();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchQR, retryCount]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-bold text-lg">Link Device</h3>
            <p className="text-xs text-muted-foreground">{deviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[320px]">
          {(state === "LOADING" || state === "WAITING") && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <div>
                <h4 className="font-semibold text-lg">Initializing...</h4>
                <p className="text-sm text-muted-foreground">
                  Preparing WhatsApp client...
                </p>
              </div>
            </div>
          )}

          {state === "READY" && qrCode && (
            <div className="text-center space-y-6 w-full">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mx-auto w-fit">
                <img
                  src={qrCode}
                  alt="Scan QR"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <p className="text-sm font-medium">Scan with WhatsApp</p>
            </div>
          )}

          {state === "CONNECTED" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h4 className="font-bold text-xl text-green-600">Connected!</h4>
            </div>
          )}

          {state === "ERROR" && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-sm">Connection Failed</p>
              <button
                onClick={() => {
                  setState("LOADING");
                  setRetryCount((c) => c + 1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
