"use client";

import { useState } from "react";
import { MessageList } from "@/components/features/messages/message-list";
import { NewMessageModal } from "@/components/features/messages/new-message-modal";
import { Send } from "lucide-react";

export default function MessagesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMessageSent = () => {
    setIsModalOpen(false);
    // Trigger refresh pada list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Messages
          </h2>
          <p className="text-muted-foreground mt-1">
            View history and send new messages
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium">
          <Send size={18} />
          New Message
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <MessageList refreshTrigger={refreshTrigger} />
      </div>

      {isModalOpen && (
        <NewMessageModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleMessageSent}
        />
      )}
    </div>
  );
}
