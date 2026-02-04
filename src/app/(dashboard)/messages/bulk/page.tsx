import { BulkSender } from "@/components/features/messages/bulk-sender";

export default function BulkMessagesPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          Bulk Sender
        </h2>
        <p className="text-muted-foreground mt-1">
          Broadcast messages to multiple contacts efficiently.
        </p>
      </div>
      <BulkSender />
    </div>
  );
}
