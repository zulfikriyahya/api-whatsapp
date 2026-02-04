import { Code, Lock } from "lucide-react";

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/messages/send",
      desc: "Send a message via specific device.",
      auth: "API Key Header (x-api-key)",
      body: {
        deviceId: "uuid",
        toNumber: "string (phone)",
        message: "string",
      },
    },
    {
      method: "POST",
      path: "/api/tools/validate-number",
      desc: "Check if a number is registered.",
      auth: "Session / API Key",
      body: {
        deviceId: "uuid",
        phoneNumber: "string",
      },
    },
    {
      method: "GET",
      path: "/api/devices",
      desc: "List all connected devices.",
      auth: "API Key",
      body: null,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          API Documentation
        </h2>
        <p className="text-muted-foreground mt-1">
          Integration guide for Chatbots and External Apps.
        </p>
      </div>

      <div className="grid gap-6">
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="glass-card p-6 rounded-2xl border-l-4 border-l-primary relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-mono font-bold text-sm">
                {ep.method}
              </span>
              <span className="font-mono text-lg font-medium">{ep.path}</span>
            </div>

            <p className="text-muted-foreground mb-4">{ep.desc}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <Lock size={12} /> Authentication
                </h4>
                <code className="text-sm font-mono text-foreground">
                  {ep.auth}
                </code>
              </div>

              {ep.body && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-50">
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                    <Code size={12} /> Payload (JSON)
                  </h4>
                  <pre className="text-xs font-mono">
                    {JSON.stringify(ep.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
