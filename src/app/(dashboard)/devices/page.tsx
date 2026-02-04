"use client";

import { useState } from "react";
// PENTING: Pastikan path ini benar dan tidak melalui index.ts yang circular
import { DeviceList } from "@/components/features/devices/device-list";
import { AddDeviceModal } from "@/components/features/devices/add-device-modal";
import { Plus } from "lucide-react";

export default function DevicesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDeviceAdded = () => {
    setIsAddModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Device Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Connect and manage your WhatsApp instances
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all font-medium">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <DeviceList refreshTrigger={refreshTrigger} />

      {isAddModalOpen && (
        <AddDeviceModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleDeviceAdded}
        />
      )}
    </div>
  );
}
