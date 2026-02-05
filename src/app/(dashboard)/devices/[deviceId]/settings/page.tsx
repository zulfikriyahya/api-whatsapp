import { AutoResponseList } from "@/components/features/auto-response/auto-response-list";
import { DeviceService } from "@/lib/services/device.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { notFound, redirect } from "next/navigation";
import { Smartphone, ChevronLeft } from "lucide-react";
import Link from "next/link";

type Params = {
  params: Promise<{
    deviceId: string;
  }>;
};

export default async function DeviceSettingsPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { deviceId } = await params;
  const device = await DeviceService.getDevice(deviceId);

  if (!device) notFound();
  if (device.user_id !== session.user.id) redirect("/devices");

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <Link
          href="/devices"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit mb-2 group">
          <ChevronLeft
            size={16}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Devices
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg text-white">
              <Smartphone size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {device.name}
              </h2>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                {device.phone_number}
              </p>
            </div>
          </div>

          <div
            className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border shadow-sm ${
              device.status === "AUTHENTICATED"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
            }`}>
            {device.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl p-6 shadow-sm border border-border/50">
            <AutoResponseList deviceId={deviceId} />
          </div>
        </div>
      </div>
    </div>
  );
}
