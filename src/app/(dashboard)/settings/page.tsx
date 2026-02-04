import { UserSettings } from "@/components/features/settings/user-settings";

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Account Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your security preferences and API keys.
        </p>
      </div>
      <UserSettings />
    </div>
  );
}
